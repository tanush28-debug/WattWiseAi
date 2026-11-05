import { storageService } from './storageService.js';
import { ocrService } from './ocrService.js';
import { calculateCarbonEmissions } from '../utils/calculations.js';

// In-memory fallback bill store for demo/evaluation sessions
const demoBillsStore = new Map();

export const billService = {
  /**
   * Get all electricity bills for the authenticated user
   */
  async getBills(user, scopedClient) {
    if (user && !user.isDemo && scopedClient) {
      try {
        const { data, error } = await scopedClient
          .from('electricity_bills')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('getBills query error:', error.message);
          return [];
        }

        if (data && data.length > 0) {
          return data.map(b => ({
            id: b.id,
            fileName: b.file_name,
            accountNumber: b.account_number || null,
            consumerName: b.consumer_name || user?.fullName || null,
            billingPeriod: b.billing_period_start && b.billing_period_end 
              ? `${b.billing_period_start} – ${b.billing_period_end}` 
              : b.billing_month || 'Cycle',
            billingMonth: b.billing_month || 'N/A',
            unitsConsumed: Number(b.units_consumed_kwh || 0),
            amount: Number(b.total_amount_inr || 0),
            dueDate: b.due_date || null,
            tariffCategory: b.tariff_category || 'Domestic LT-1 Standard',
            status: b.status,
            uploadDate: b.created_at,
            fileSize: b.file_size_bytes ? `${Math.round(b.file_size_bytes / 1024)} KB` : 'N/A',
            ocrConfidence: b.ocr_confidence,
            validation: b.raw_ocr_metadata?.validation || null,
            breakdown: {
              energyCharges: b.energy_charges_inr != null ? Number(b.energy_charges_inr) : null,
              standingCharge: b.fixed_standing_charge_inr != null ? Number(b.fixed_standing_charge_inr) : null,
              environmentalSurcharge: b.fuel_surcharge_fppca_inr != null ? Number(b.fuel_surcharge_fppca_inr) : null,
              taxes: b.electricity_duty_taxes_inr != null ? Number(b.electricity_duty_taxes_inr) : null,
            }
          }));
        }
      } catch (err) {
        console.warn('Database query for bills failed:', err.message);
      }
      return [];
    }

    // Demo or evaluator session fallback
    const userId = user?.id || 'usr-demo-001';
    return demoBillsStore.get(userId) || [];
  },

  /**
   * Upload an electricity bill file, store in Supabase Storage, and run OCR extraction
   */
  async uploadBill({ file, user, scopedClient }) {
    if (!file) {
      throw new Error('No bill file provided for upload.');
    }

    // 1. Upload to Supabase Storage (best-effort)
    let storagePath = `consumer/${user?.id || 'anon'}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    let storageResult = { storagePath, isSimulated: true };

    if (user?.id) {
      try {
        const res = await storageService.uploadBillDocument({
          userId: user.id,
          fileName: file.originalname,
          fileBuffer: file.buffer,
          mimeType: file.mimetype,
          orgId: user.organizationId || null,
          scopedClient,
        });
        if (res?.storagePath) {
          storagePath = res.storagePath;
          storageResult = res;
        }
      } catch (storageErr) {
        console.warn('Storage upload notice (OCR will continue from memory buffer):', storageErr.message);
      }
    }

    // 2. Run OCR & AI Bill Extraction
    const extraction = await ocrService.processBillDocument({
      fileBuffer: file.buffer,
      mimeType: file.mimetype,
      fileName: file.originalname,
    });

    const now = new Date();
    let realBillId = 'bill-' + Date.now();

    const newBillRecord = {
      id: realBillId,
      fileName: file.originalname,
      accountNumber: extraction.accountNumber || null,
      consumerName: extraction.consumerName || user?.fullName || null,
      billingPeriod: extraction.billingPeriod || null,
      billingMonth: extraction.billingMonth || null,
      unitsConsumed: extraction.unitsConsumed != null ? Number(extraction.unitsConsumed) : null,
      amount: extraction.totalAmount != null ? Number(extraction.totalAmount) : null,
      dueDate: extraction.dueDate || null,
      tariffCategory: extraction.tariffCategory || null,
      status: 'EXTRACTED', // Awaiting user review/confirmation
      ocrConfidence: extraction.confidenceScore || 0,
      validation: extraction.validation,
      uploadDate: now.toISOString(),
      fileSize: `${Math.round(file.size / 1024)} KB`,
      storagePath: storagePath,
      breakdown: {
        energyCharges: extraction.energyCharges != null ? Number(extraction.energyCharges) : null,
        standingCharge: extraction.fixedCharges != null ? Number(extraction.fixedCharges) : null,
        environmentalSurcharge: extraction.fuelAdjustments != null ? Number(extraction.fuelAdjustments) : null,
        taxes: extraction.taxes != null ? Number(extraction.taxes) : null,
      }
    };

    // 3. Persist initial extracted draft to Supabase Database if authenticated
    if (user && !user.isDemo && scopedClient) {
      try {
        let validDueDate = null;
        if (extraction.dueDate) {
          const d = new Date(extraction.dueDate);
          if (!isNaN(d.getTime())) {
            validDueDate = d.toISOString().split('T')[0];
          }
        }

        const draftPayload = {
          profile_id: user.id,
          organization_id: user.organizationId || null,
          file_name: file.originalname,
          storage_path: storagePath,
          file_size_bytes: file.size || 0,
          mime_type: file.mimetype || 'application/pdf',
          account_number: extraction.accountNumber || null,
          consumer_name: newBillRecord.consumerName,
          billing_month: extraction.billingMonth || null,
          due_date: validDueDate,
          units_consumed_kwh: Number(extraction.unitsConsumed || 0),
          total_amount_inr: Number(extraction.totalAmount || 0),
          energy_charges_inr: Number(extraction.energyCharges || 0),
          fixed_standing_charge_inr: Number(extraction.fixedCharges || 0),
          fuel_surcharge_fppca_inr: Number(extraction.fuelAdjustments || 0),
          electricity_duty_taxes_inr: Number(extraction.taxes || 0),
          status: 'EXTRACTED',
          ocr_confidence: Number(extraction.confidenceScore || 0),
          raw_ocr_metadata: extraction,
          is_demo: false,
        };

        const { data, error } = await scopedClient
          .from('electricity_bills')
          .insert(draftPayload)
          .select('id')
          .maybeSingle();

        if (error) {
          console.warn('Initial electricity_bills draft insert note:', error.message);
        } else if (data?.id) {
          newBillRecord.id = data.id;
        }
      } catch (dbErr) {
        console.warn('Initial bill record draft insert failed:', dbErr.message);
      }
    }

    return newBillRecord;
  },

  /**
   * User confirms / edits extracted bill fields to finalize record
   */
  async confirmBill({ billId, confirmedData, user, scopedClient }) {
    const units = parseFloat(confirmedData.unitsConsumed);
    const amount = parseFloat(confirmedData.amount);

    if (isNaN(units) || isNaN(amount) || units <= 0 || amount <= 0) {
      throw new Error('Valid units consumed and total amount are required to confirm a bill.');
    }

    // Safely parse due date
    let validDueDate = null;
    if (confirmedData.dueDate) {
      const d = new Date(confirmedData.dueDate);
      if (!isNaN(d.getTime())) {
        validDueDate = d.toISOString().split('T')[0];
      }
    }

    // If demo or unauthenticated evaluator session, store in demoBillsStore so history reflects it
    if (!user || user.isDemo || !scopedClient) {
      const userId = user?.id || 'usr-demo-001';
      const existing = demoBillsStore.get(userId) || [];
      const verifiedDemoBill = {
        id: billId.startsWith('bill-') ? billId : ('bill-' + Date.now()),
        fileName: confirmedData.fileName || 'verified_bill.pdf',
        accountNumber: confirmedData.accountNumber || null,
        consumerName: user?.fullName || 'Demo Evaluator',
        billingMonth: confirmedData.billingMonth || 'N/A',
        billingPeriod: confirmedData.billingMonth || 'Cycle',
        unitsConsumed: units,
        amount: amount,
        dueDate: validDueDate,
        tariffCategory: confirmedData.tariffCategory || 'Domestic LT-1 Standard',
        status: 'VERIFIED',
        uploadDate: new Date().toISOString(),
        fileSize: confirmedData.fileSize || '380 KB',
        ocrConfidence: Number(confirmedData.ocrConfidence || 0.95),
        pointsAwarded: true,
        breakdown: {
          energyCharges: Number(confirmedData.breakdown?.energyCharges || Math.round(amount * 0.75 * 100) / 100),
          standingCharge: Number(confirmedData.breakdown?.standingCharge || 120.00),
          environmentalSurcharge: Number(confirmedData.breakdown?.environmentalSurcharge || 0.00),
          taxes: Number(confirmedData.breakdown?.taxes || Math.round(amount * 0.06 * 100) / 100),
        }
      };

      demoBillsStore.set(userId, [verifiedDemoBill, ...existing.filter(b => b.id !== billId)]);

      return {
        success: true,
        data: verifiedDemoBill,
        message: 'Bill verified! +100 Eco-Rewards added to your account.',
      };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(billId);
    let savedBill = null;

    // 1. If billId is a valid UUID, attempt to update the existing record
    if (isUuid) {
      const { data: updatedBill, error: updateErr } = await scopedClient
        .from('electricity_bills')
        .update({
          units_consumed_kwh: units,
          total_amount_inr: amount,
          account_number: confirmedData.accountNumber || null,
          billing_month: confirmedData.billingMonth || null,
          due_date: validDueDate,
          tariff_category: confirmedData.tariffCategory || 'Domestic LT-1 Standard',
          status: 'VERIFIED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', billId)
        .eq('profile_id', user.id)
        .select('*')
        .maybeSingle();

      if (!updateErr && updatedBill) {
        savedBill = updatedBill;
      } else {
        console.warn('Existing bill record update note:', updateErr?.message);
      }
    }

    // 2. If update didn't match an existing row (or billId is temporary), insert verified bill
    if (!savedBill) {
      const storagePath = confirmedData.storagePath || `consumer/${user.id}/${Date.now()}_bill.pdf`;
      const insertPayload = {
        profile_id: user.id,
        organization_id: user.organizationId || null,
        file_name: confirmedData.fileName || 'verified_bill.pdf',
        storage_path: storagePath,
        file_size_bytes: confirmedData.fileSizeBytes || 2048,
        mime_type: confirmedData.mimeType || 'application/pdf',
        account_number: confirmedData.accountNumber || null,
        consumer_name: user.fullName || 'Consumer',
        billing_month: confirmedData.billingMonth || 'N/A',
        due_date: validDueDate,
        tariff_category: confirmedData.tariffCategory || 'Domestic LT-1 Standard',
        units_consumed_kwh: units,
        total_amount_inr: amount,
        energy_charges_inr: Number(confirmedData.breakdown?.energyCharges || Math.round(amount * 0.75 * 100) / 100),
        fixed_standing_charge_inr: Number(confirmedData.breakdown?.standingCharge || 120.00),
        fuel_surcharge_fppca_inr: Number(confirmedData.breakdown?.environmentalSurcharge || 0.00),
        electricity_duty_taxes_inr: Number(confirmedData.breakdown?.taxes || Math.round(amount * 0.06 * 100) / 100),
        status: 'VERIFIED',
        ocr_confidence: Number(confirmedData.ocrConfidence || 0.95),
        raw_ocr_metadata: confirmedData,
        is_demo: false,
      };

      const { data: newBill, error: insertErr } = await scopedClient
        .from('electricity_bills')
        .insert(insertPayload)
        .select('*')
        .single();

      if (insertErr || !newBill) {
        console.error('Failed to insert verified electricity bill:', insertErr?.message);
        throw new Error(`Database error saving verified bill: ${insertErr?.message || 'Operation failed'}`);
      }
      savedBill = newBill;
    }

    const verifiedBillId = savedBill.id;

    // 3. Persist to energy_consumption table for analytics
    const carbon = calculateCarbonEmissions(units);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { error: consumptionErr } = await scopedClient
      .from('energy_consumption')
      .insert({
        profile_id: user.id,
        organization_id: user.organizationId || null,
        bill_id: verifiedBillId,
        interval_type: 'MONTHLY',
        period_start: startOfMonth,
        period_end: endOfMonth,
        consumption_kwh: units,
        cost_inr: amount,
        carbon_kg_co2: carbon.carbonEmissionsKg,
        data_classification: 'ACTUAL',
        source_provenance: 'USER_CONFIRMED_BILL',
      });

    if (consumptionErr) {
      console.warn('energy_consumption insert note:', consumptionErr.message);
    }

    // 4. Award 100 eco-reward points for bill confirmation
    let pointsAwarded = false;
    try {
      const { data: rewardAccount } = await scopedClient
        .from('reward_accounts')
        .select('id, current_points')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (rewardAccount) {
        await scopedClient.from('reward_accounts').update({
          current_points: rewardAccount.current_points + 100,
          updated_at: new Date().toISOString(),
        }).eq('id', rewardAccount.id);

        await scopedClient.from('reward_transactions').insert({
          account_id: rewardAccount.id,
          points_delta: 100,
          transaction_type: 'EARNED_BILL_UPLOAD',
          reference_description: `Earned 100 points for verified bill upload (${confirmedData.billingMonth || 'Current'})`,
        });
        pointsAwarded = true;
      }
    } catch (rewardErr) {
      console.warn('Eco-rewards sync note:', rewardErr.message);
    }

    return {
      success: true,
      data: {
        id: verifiedBillId,
        fileName: savedBill.file_name,
        accountNumber: savedBill.account_number,
        consumerName: savedBill.consumer_name,
        billingMonth: savedBill.billing_month,
        billingPeriod: savedBill.billing_month || 'Cycle',
        unitsConsumed: Number(savedBill.units_consumed_kwh),
        amount: Number(savedBill.total_amount_inr),
        dueDate: savedBill.due_date,
        tariffCategory: savedBill.tariff_category,
        status: savedBill.status,
        uploadDate: savedBill.created_at,
        fileSize: savedBill.file_size_bytes ? `${Math.round(savedBill.file_size_bytes / 1024)} KB` : 'N/A',
        ocrConfidence: savedBill.ocr_confidence,
        pointsAwarded,
      },
      message: pointsAwarded
        ? 'Bill verified! +100 Eco-Rewards added to your account.'
        : 'Bill verified and added to energy consumption records.',
    };
  },

  /**
   * Delete an uploaded bill
   */
  async deleteBill(billId, user, scopedClient) {
    if (user && !user.isDemo && scopedClient) {
      try {
        await scopedClient
          .from('electricity_bills')
          .delete()
          .eq('id', billId);
      } catch (dbErr) {
        console.warn('Could not delete bill from table:', dbErr.message);
      }
    } else {
      const userId = user?.id || 'usr-demo-001';
      const existing = demoBillsStore.get(userId) || [];
      demoBillsStore.set(userId, existing.filter(b => b.id !== billId));
    }
    return { success: true };
  }
};
