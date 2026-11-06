import crypto from 'crypto';
import { storageService } from './storageService.js';
import { ocrService } from './ocrService.js';
import { BillExtractionError } from './billParser.js';
import { calculateCarbonEmissions } from '../utils/calculations.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requirePersistentUser(user, scopedClient) {
  if (!user || user.isDemo || !scopedClient) {
    throw new BillExtractionError(
      'Sign in with a Supabase account to save, verify or delete bills. Demo sessions cannot persist bills.',
      { statusCode: 403, code: 'AUTH_REQUIRED_FOR_BILLS' }
    );
  }
}

function toIsoDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function monthBounds(billingMonth, periodStart, periodEnd) {
  const start = toIsoDate(periodStart);
  const end = toIsoDate(periodEnd);
  if (start && end) {
    return {
      periodStart: `${start}T00:00:00.000Z`,
      periodEnd: `${end}T23:59:59.999Z`,
    };
  }
  if (billingMonth) {
    const parsed = new Date(`${billingMonth} 1`);
    if (!Number.isNaN(parsed.getTime())) {
      const first = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
      const last = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      return { periodStart: first.toISOString(), periodEnd: last.toISOString() };
    }
  }
  const now = new Date();
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString(),
  };
}

function mapBillRow(bill, fallbackName = null) {
  return {
    id: bill.id,
    fileName: bill.file_name,
    accountNumber: bill.account_number || null,
    consumerName: bill.consumer_name || fallbackName || null,
    billingPeriod: bill.billing_period_start && bill.billing_period_end
      ? `${bill.billing_period_start} – ${bill.billing_period_end}`
      : bill.billing_month || 'Cycle',
    billingMonth: bill.billing_month || null,
    billingPeriodStart: bill.billing_period_start || null,
    billingPeriodEnd: bill.billing_period_end || null,
    unitsConsumed: bill.units_consumed_kwh != null ? Number(bill.units_consumed_kwh) : null,
    amount: bill.total_amount_inr != null ? Number(bill.total_amount_inr) : null,
    dueDate: bill.due_date || null,
    tariffCategory: bill.tariff_category || null,
    status: bill.status,
    uploadDate: bill.created_at,
    fileSize: bill.file_size_bytes ? `${Math.round(bill.file_size_bytes / 1024)} KB` : 'N/A',
    ocrConfidence: bill.ocr_confidence != null ? Number(bill.ocr_confidence) : null,
    validation: bill.raw_ocr_metadata?.validation || null,
    warnings: bill.raw_ocr_metadata?.warnings || [],
    missingFields: bill.raw_ocr_metadata?.missingFields || [],
    uncertainFields: bill.raw_ocr_metadata?.uncertainFields || [],
    evidence: bill.raw_ocr_metadata?.evidence || {},
    sourceEngine: bill.raw_ocr_metadata?.sourceEngine || null,
    aiModelUsed: bill.raw_ocr_metadata?.aiModelUsed || null,
    extraction: bill.raw_ocr_metadata || null,
    breakdown: {
      energyCharges: bill.energy_charges_inr != null ? Number(bill.energy_charges_inr) : null,
      standingCharge: bill.fixed_standing_charge_inr != null ? Number(bill.fixed_standing_charge_inr) : null,
      environmentalSurcharge: bill.fuel_surcharge_fppca_inr != null ? Number(bill.fuel_surcharge_fppca_inr) : null,
      taxes: bill.electricity_duty_taxes_inr != null ? Number(bill.electricity_duty_taxes_inr) : null,
    },
  };
}

export const billService = {
  /**
   * Get all electricity bills for the authenticated user
   */
  async getBills(user, scopedClient) {
    if (!user || user.isDemo || !scopedClient) return [];

    const { data, error } = await scopedClient
      .from('electricity_bills')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getBills query error:', error.message);
      throw new BillExtractionError(`Could not load bills: ${error.message}`, {
        statusCode: 500,
        code: 'BILL_LIST_FAILED',
      });
    }

    return (data || []).map((bill) => mapBillRow(bill, user.fullName));
  },

  /**
   * Upload a bill, store the original, extract fields, and persist a draft.
   * Fails loudly if storage or database persistence fails.
   */
  async uploadBill({ file, user, scopedClient }) {
    requirePersistentUser(user, scopedClient);

    if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      throw new BillExtractionError('No bill file provided for upload.', {
        statusCode: 400,
        code: 'EMPTY_FILE',
      });
    }

    const fileSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const extraction = await ocrService.processBillDocument({
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
    });

    // Prevent obvious duplicate uploads when identity fields were extracted.
    if (extraction.accountNumber && extraction.billingMonth) {
      const { data: duplicates, error: duplicateError } = await scopedClient
        .from('electricity_bills')
        .select('id, status, file_name')
        .eq('profile_id', user.id)
        .eq('account_number', extraction.accountNumber)
        .eq('billing_month', extraction.billingMonth)
        .limit(1);

      if (duplicateError) {
        throw new BillExtractionError(`Could not check for duplicate bills: ${duplicateError.message}`, {
          statusCode: 500,
          code: 'DUPLICATE_CHECK_FAILED',
        });
      }
      if (duplicates && duplicates.length > 0) {
        throw new BillExtractionError(
          `A bill for account ${extraction.accountNumber} and ${extraction.billingMonth} already exists. Delete the existing entry before re-uploading.`,
          { statusCode: 409, code: 'DUPLICATE_BILL' }
        );
      }
    }

    // The original document must be safely stored before the database row is created.
    const storage = await storageService.uploadBillDocument({
      userId: user.id,
      fileName: file.originalname,
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      orgId: user.organizationId || null,
      scopedClient,
    });

    const draftPayload = {
      profile_id: user.id,
      organization_id: user.organizationId || null,
      file_name: file.originalname,
      storage_path: storage.storagePath,
      file_size_bytes: file.size || file.buffer.length,
      mime_type: file.mimetype,
      utility_provider: extraction.discom || 'Unknown',
      account_number: extraction.accountNumber || null,
      consumer_name: extraction.consumerName || user.fullName || null,
      billing_month: extraction.billingMonth || null,
      billing_period_start: toIsoDate(extraction.billingPeriodStart),
      billing_period_end: toIsoDate(extraction.billingPeriodEnd),
      due_date: toIsoDate(extraction.dueDate),
      tariff_category: extraction.tariffCategory || null,
      units_consumed_kwh: Number(extraction.unitsConsumed ?? 0),
      energy_charges_inr: Number(extraction.energyCharges ?? 0),
      fixed_standing_charge_inr: Number(extraction.fixedCharges ?? 0),
      fuel_surcharge_fppca_inr: Number(extraction.otherCharges ?? 0),
      electricity_duty_taxes_inr: Number(extraction.taxes ?? 0),
      total_amount_inr: Number(extraction.netPayable ?? 0),
      status: 'EXTRACTED',
      ocr_confidence: Number(extraction.confidenceScore ?? 0),
      raw_ocr_metadata: {
        ...extraction,
        fileSha256,
        storageBucket: storage.bucket,
        aiModelUsed: extraction.aiModelUsed || null,
        sourceEngine: extraction.sourceEngine || null,
      },
      is_demo: false,
    };

    const { data: inserted, error: insertError } = await scopedClient
      .from('electricity_bills')
      .insert(draftPayload)
      .select('*')
      .single();

    if (insertError || !inserted) {
      // Roll back the stored file so a failed save never looks successful.
      try {
        await storageService.deleteBillDocument(storage.storagePath, scopedClient);
      } catch (cleanupError) {
        console.warn('Could not remove stored bill after failed database insert:', cleanupError.message);
      }
      throw new BillExtractionError(`Database error saving bill: ${insertError?.message || 'Insert failed'}`, {
        statusCode: 500,
        code: 'BILL_SAVE_FAILED',
      });
    }

    return {
      ...mapBillRow(inserted, user.fullName),
      extraction,
    };
  },

  /**
   * User confirms or edits extracted bill fields to finalize the record.
   * Writes consumption first, then marks the bill VERIFIED, then awards rewards.
   */
  async confirmBill({ billId, confirmedData = {}, user, scopedClient }) {
    requirePersistentUser(user, scopedClient);

    if (!UUID_RE.test(String(billId))) {
      throw new BillExtractionError('A valid saved bill id is required before confirmation.', {
        statusCode: 400,
        code: 'INVALID_BILL_ID',
      });
    }

    const units = Number(confirmedData.unitsConsumed);
    const amount = Number(confirmedData.amount);
    if (!Number.isFinite(units) || units < 0) {
      throw new BillExtractionError('A valid non-negative units consumed value is required.', {
        statusCode: 422,
        code: 'INVALID_UNITS',
      });
    }
    if (!Number.isFinite(amount)) {
      throw new BillExtractionError('A valid net payable amount is required (negative values are allowed).', {
        statusCode: 422,
        code: 'INVALID_AMOUNT',
      });
    }

    const { data: existingBill, error: fetchError } = await scopedClient
      .from('electricity_bills')
      .select('*')
      .eq('id', billId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (fetchError) {
      throw new BillExtractionError(`Could not read the saved bill: ${fetchError.message}`, {
        statusCode: 500,
        code: 'BILL_READ_FAILED',
      });
    }
    if (!existingBill) {
      throw new BillExtractionError('Bill not found for this account.', {
        statusCode: 404,
        code: 'BILL_NOT_FOUND',
      });
    }

    const wasVerified = existingBill.status === 'VERIFIED';
    const dueDate = toIsoDate(confirmedData.dueDate) || existingBill.due_date || null;
    const billingPeriodStart = toIsoDate(confirmedData.billingPeriodStart) || existingBill.billing_period_start || null;
    const billingPeriodEnd = toIsoDate(confirmedData.billingPeriodEnd) || existingBill.billing_period_end || null;
    const billingMonth = confirmedData.billingMonth || existingBill.billing_month || null;
    const breakdown = confirmedData.breakdown || {};

    const fieldUpdates = {
      units_consumed_kwh: units,
      total_amount_inr: amount,
      account_number: confirmedData.accountNumber ?? existingBill.account_number ?? null,
      consumer_name: confirmedData.consumerName || existingBill.consumer_name || user.fullName || null,
      billing_month: billingMonth,
      billing_period_start: billingPeriodStart,
      billing_period_end: billingPeriodEnd,
      due_date: dueDate,
      tariff_category: confirmedData.tariffCategory ?? existingBill.tariff_category ?? null,
      energy_charges_inr: breakdown.energyCharges != null ? Number(breakdown.energyCharges) : existingBill.energy_charges_inr,
      fixed_standing_charge_inr: breakdown.standingCharge != null ? Number(breakdown.standingCharge) : existingBill.fixed_standing_charge_inr,
      fuel_surcharge_fppca_inr: breakdown.environmentalSurcharge != null ? Number(breakdown.environmentalSurcharge) : existingBill.fuel_surcharge_fppca_inr,
      electricity_duty_taxes_inr: breakdown.taxes != null ? Number(breakdown.taxes) : existingBill.electricity_duty_taxes_inr,
      raw_ocr_metadata: {
        ...(existingBill.raw_ocr_metadata || {}),
        userConfirmed: {
          at: new Date().toISOString(),
          fields: {
            accountNumber: confirmedData.accountNumber ?? null,
            consumerName: confirmedData.consumerName ?? null,
            billingMonth,
            billingPeriodStart,
            billingPeriodEnd,
            dueDate,
            tariffCategory: confirmedData.tariffCategory ?? null,
            previousReading: confirmedData.previousReading != null ? Number(confirmedData.previousReading) : null,
            currentReading: confirmedData.currentReading != null ? Number(confirmedData.currentReading) : null,
            unitsConsumed: units,
            energyCharges: breakdown.energyCharges != null ? Number(breakdown.energyCharges) : null,
            fixedCharges: breakdown.standingCharge != null ? Number(breakdown.standingCharge) : null,
            taxes: breakdown.taxes != null ? Number(breakdown.taxes) : null,
            otherCharges: breakdown.environmentalSurcharge != null ? Number(breakdown.environmentalSurcharge) : null,
            currentDemandPayable: confirmedData.currentDemandPayable != null ? Number(confirmedData.currentDemandPayable) : null,
            arrears: confirmedData.arrears != null ? Number(confirmedData.arrears) : null,
            netPayable: amount,
          },
        },
      },
      updated_at: new Date().toISOString(),
    };

    const { data: updatedBill, error: updateError } = await scopedClient
      .from('electricity_bills')
      .update(fieldUpdates)
      .eq('id', billId)
      .eq('profile_id', user.id)
      .select('*')
      .maybeSingle();

    if (updateError || !updatedBill) {
      throw new BillExtractionError(`Database error updating bill: ${updateError?.message || 'No row updated'}`, {
        statusCode: 500,
        code: 'BILL_UPDATE_FAILED',
      });
    }

    // Persist consumption before marking the bill VERIFIED.
    const periods = monthBounds(billingMonth, billingPeriodStart, billingPeriodEnd);
    const carbon = calculateCarbonEmissions(units);

    const { data: existingConsumption, error: consumptionLookupError } = await scopedClient
      .from('energy_consumption')
      .select('id')
      .eq('bill_id', billId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (consumptionLookupError) {
      throw new BillExtractionError(`Could not check consumption records: ${consumptionLookupError.message}`, {
        statusCode: 500,
        code: 'CONSUMPTION_LOOKUP_FAILED',
      });
    }

    const consumptionPayload = {
      profile_id: user.id,
      organization_id: existingBill.organization_id || user.organizationId || null,
      bill_id: billId,
      interval_type: 'MONTHLY',
      period_start: periods.periodStart,
      period_end: periods.periodEnd,
      consumption_kwh: units,
      cost_inr: amount,
      carbon_kg_co2: carbon.carbonEmissionsKg,
      data_classification: 'ACTUAL',
      source_provenance: 'USER_CONFIRMED_BILL',
    };

    const consumptionResult = existingConsumption?.id
      ? await scopedClient.from('energy_consumption').update(consumptionPayload).eq('id', existingConsumption.id)
      : await scopedClient.from('energy_consumption').insert(consumptionPayload);

    if (consumptionResult.error) {
      throw new BillExtractionError(
        `Database error saving consumption for this bill: ${consumptionResult.error.message}`,
        { statusCode: 500, code: 'CONSUMPTION_SAVE_FAILED' }
      );
    }

    const { error: verifyError } = await scopedClient
      .from('electricity_bills')
      .update({ status: 'VERIFIED', updated_at: new Date().toISOString() })
      .eq('id', billId)
      .eq('profile_id', user.id);

    if (verifyError) {
      throw new BillExtractionError(`Database error verifying bill: ${verifyError.message}`, {
        statusCode: 500,
        code: 'BILL_VERIFY_FAILED',
      });
    }

    let pointsAwarded = false;
    let rewardWarning = null;
    if (!wasVerified) {
      try {
        const { data: rewardAccount, error: rewardAccountError } = await scopedClient
          .from('reward_accounts')
          .select('id, current_points')
          .eq('profile_id', user.id)
          .maybeSingle();

        if (rewardAccountError) throw rewardAccountError;

        if (rewardAccount) {
          const { data: existingReward } = await scopedClient
            .from('reward_transactions')
            .select('id')
            .eq('account_id', rewardAccount.id)
            .like('reference_description', `%${billId}%`)
            .maybeSingle();

          if (!existingReward) {
            const { error: pointsError } = await scopedClient
              .from('reward_accounts')
              .update({
                current_points: Number(rewardAccount.current_points || 0) + 100,
                updated_at: new Date().toISOString(),
              })
              .eq('id', rewardAccount.id);
            if (pointsError) throw pointsError;

            const { error: transactionError } = await scopedClient
              .from('reward_transactions')
              .insert({
                account_id: rewardAccount.id,
                points_delta: 100,
                transaction_type: 'EARNED_BILL_UPLOAD',
                reference_description: `Bill verified ${billId}`,
              });
            if (transactionError) throw transactionError;
            pointsAwarded = true;
          }
        }
      } catch (rewardError) {
        rewardWarning = `Bill verified, but Eco-Rewards could not be updated: ${rewardError.message}`;
        console.warn('Eco-rewards sync notice:', rewardError.message);
      }
    }

    return {
      success: true,
      data: {
        ...mapBillRow({ ...updatedBill, status: 'VERIFIED' }, user.fullName),
        pointsAwarded,
      },
      message: pointsAwarded
        ? 'Bill verified and saved. +100 Eco-Rewards added.'
        : rewardWarning || 'Bill verified and saved to your consumption history.',
    };
  },

  /**
   * Delete a bill record and its stored original.
   */
  async deleteBill(billId, user, scopedClient) {
    requirePersistentUser(user, scopedClient);

    if (!UUID_RE.test(String(billId))) {
      throw new BillExtractionError('A valid bill id is required.', {
        statusCode: 400,
        code: 'INVALID_BILL_ID',
      });
    }

    const { data: bill, error: fetchError } = await scopedClient
      .from('electricity_bills')
      .select('id, storage_path')
      .eq('id', billId)
      .eq('profile_id', user.id)
      .maybeSingle();

    if (fetchError) {
      throw new BillExtractionError(`Could not read the bill before deleting: ${fetchError.message}`, {
        statusCode: 500,
        code: 'BILL_READ_FAILED',
      });
    }
    if (!bill) {
      throw new BillExtractionError('Bill not found for this account.', {
        statusCode: 404,
        code: 'BILL_NOT_FOUND',
      });
    }

    const { error: consumptionError } = await scopedClient
      .from('energy_consumption')
      .delete()
      .eq('bill_id', billId)
      .eq('profile_id', user.id);

    if (consumptionError) {
      throw new BillExtractionError(`Could not remove consumption records: ${consumptionError.message}`, {
        statusCode: 500,
        code: 'CONSUMPTION_DELETE_FAILED',
      });
    }

    const { error: deleteError } = await scopedClient
      .from('electricity_bills')
      .delete()
      .eq('id', billId)
      .eq('profile_id', user.id);

    if (deleteError) {
      throw new BillExtractionError(`Could not delete the bill: ${deleteError.message}`, {
        statusCode: 500,
        code: 'BILL_DELETE_FAILED',
      });
    }

    if (bill.storage_path) {
      const removed = await storageService.deleteBillDocument(bill.storage_path, scopedClient);
      if (!removed) {
        console.warn('Bill row deleted but the stored document could not be removed.');
      }
    }

    return { success: true, message: 'Bill record and stored document deleted.' };
  },
};
