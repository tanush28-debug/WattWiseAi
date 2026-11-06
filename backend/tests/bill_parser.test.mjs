/**
 * Deterministic parser tests using synthetic bill text (no real consumer data).
 */
import assert from 'node:assert/strict';
import {
  parseBillText,
  finalizeExtraction,
  normalizeAiExtraction,
  mergeExtractions,
  hasUsableBillText,
  parseIndianNumber,
  parseDateToken,
} from '../src/services/billParser.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}

const BILL_A = `
BESCOM - Bangalore Electricity Supply Company Limited
Electricity Bill
Name and Address : SAMPLE CONSUMER, NO 12, TEST LAYOUT, BENGALURU
RR No : AA1AB1234
A/c Id : 1234567890
Tariff : LT1
Bill Period : 13/05/2026 - 13/06/2026
Reading Date : 13/06/2026
Due Date : 29/06/2026
Prev. Rdg 7029 Pres. Rdg 7297 Consumption(Units) 268
Fixed Charges (Unit, Rate, Amount)
1 337.50 337.50
Energy Charges (Unit, Rate, Amount)
268 5.80 1554.40
FPPCA 101.84
P & G Surcharge 93.80
Tax @ 9% 139.90
Ex Load Penalty 112.50
Interest 5.07
Current Demand Payable 2345.01
True Up Charges 132.53
True Up Charges 11.93
IOD -234.00
Arrears 0.00
Net Payable 2255.00
`;

const BILL_B = `
BESCOM - Bangalore Electricity Supply Company Limited
Name and Address : SECOND SAMPLE, 44 TEST STREET, BENGALURU
RR No : BB2CD5678
A/c Id : 9876543210
Tariff : LT1
Bill Period : 13/09/2026 - 13/10/2026
Reading Date : 13/10/2026
Due Date : 27/10/2026
Prev. Rdg 3053.6 Pres. Rdg 3237.700 Consumption(Units) 179.1
Fixed Charges (Unit, Rate, Amount)
1 300.00 300.00
Energy Charges (Unit, Rate, Amount)
179.1 5.80 1038.78
FPPCA -60.89
P & G Surcharge 62.68
Tax @ 9% 93.49
Ex Load Penalty 112.50
Interest 0.00
Others(ASD INT) 10.20
Sub-Total-1 1434.06
Gruha Jyothi Subsidy
Sub-Total-2 667.26
Bill Amount(1-2) 766.80
Current Demand Payable 889.50
Arrears -7256.00
Net Payable -6366.00
`;

const BILL_C = `
MESCOM Electricity Bill
Consumer Name : THIRD SAMPLE
Account No : MES-445566
Tariff Category : LT-2
Billing Period 01-04-2026 to 30-04-2026
Bill Date : 02-05-2026
Pay By : 20-05-2026
Previous Reading 1000 Current Reading 1250 Units Consumed 250
Energy Charges 1625.00
Standing Charges 150.00
Electricity Duty 146.25
FPPCA 22.50
Arrears 100.00
Total Amount Payable 2043.75
`;

console.log('billParser tests');

test('parseIndianNumber handles Indian grouping and currency', () => {
  assert.equal(parseIndianNumber('1,23,456.78'), 123456.78);
  assert.equal(parseIndianNumber('₹ 2,255.00'), 2255);
  assert.equal(parseIndianNumber('-6,366.00'), -6366);
  assert.equal(parseIndianNumber('Rs. 1,554.40'), 1554.4);
  assert.equal(parseIndianNumber('abc'), null);
});

test('parseDateToken handles common Indian formats', () => {
  assert.equal(parseDateToken('13/05/2026'), '2026-05-13');
  assert.equal(parseDateToken('13-05-2026'), '2026-05-13');
  assert.equal(parseDateToken('13-May-2026'), '2026-05-13');
  assert.equal(parseDateToken('May 13, 2026'), '2026-05-13');
  assert.equal(parseDateToken('2026-05-13'), '2026-05-13');
  assert.equal(parseDateToken('31/02/2026'), null);
});

test('local text is recognised as usable', () => {
  assert.equal(hasUsableBillText(BILL_A), true);
  assert.equal(hasUsableBillText('-- 1 of 1 --'), false);
});

test('BILL_A extracts identity, dates, readings and amounts', () => {
  const raw = parseBillText(BILL_A, 'bill_a.pdf');
  const v = raw.values;
  assert.equal(v.consumerName, 'SAMPLE CONSUMER');
  assert.equal(v.accountNumber, '1234567890');
  assert.equal(v.rrNumber, 'AA1AB1234');
  assert.match(v.discom, /BESCOM/);
  assert.match(v.tariffCategory, /LT-1/);
  assert.equal(v.billingPeriodStart, '2026-05-13');
  assert.equal(v.billingPeriodEnd, '2026-06-13');
  assert.equal(v.billIssueDate, '2026-06-13');
  assert.equal(v.dueDate, '2026-06-29');
  assert.equal(v.previousReading, 7029);
  assert.equal(v.currentReading, 7297);
  assert.equal(v.unitsConsumed, 268);
  assert.equal(v.fixedCharges, 337.5);
  assert.equal(v.energyCharges, 1554.4);
  assert.equal(v.taxes, 139.9);
  assert.equal(v.fppcaCharges, 101.84);
  assert.equal(v.pAndGSurcharge, 93.8);
  assert.equal(v.loadPenalty, 112.5);
  assert.equal(v.interest, 5.07);
  assert.equal(v.arrears, 0);
  assert.equal(v.currentDemandPayable, 2345.01);
  assert.equal(v.netPayable, 2255);
  assert.equal(v.trueUpCharges, 144.46);
  assert.equal(v.depositAdjustment, -234);
  assert.equal(v.otherCharges, 313.21);
});

test('BILL_A finalizes with consistent arithmetic', () => {
  const result = finalizeExtraction({
    extraction: parseBillText(BILL_A),
    sourceEngine: 'LOCAL_PDF_TEXT',
  });
  assert.equal(result.validation.arithmetic.currentDemandConsistent, true);
  assert.equal(result.validation.arithmetic.netPayableConsistent, true);
  assert.equal(result.totalAmount, 2255);
  assert.equal(result.billingMonth, 'June 2026');
  assert.notEqual(result.validation.status, 'MANUAL_ENTRY_REQUIRED');
});

test('BILL_B split/subsidy section and negative net payable are handled', () => {
  const result = finalizeExtraction({
    extraction: parseBillText(BILL_B),
    sourceEngine: 'LOCAL_PDF_TEXT',
  });
  assert.equal(result.fixedCharges, 300);
  assert.equal(result.energyCharges, 1038.78);
  assert.equal(result.taxes, 93.49);
  assert.equal(result.subsidyAmount, 667.26);
  assert.equal(result.currentDemandPayable, 889.5);
  assert.equal(result.arrears, -7256);
  assert.equal(result.netPayable, -6366);
  assert.equal(result.totalAmount, -6366);
  assert.equal(result.validation.arithmetic.currentDemandConsistent, true);
  assert.equal(result.validation.arithmetic.netPayableConsistent, true);
  // "Bill Amount(1-2)" must never be chosen as the payable amount.
  assert.notEqual(result.netPayable, 766.8);
});

test('BILL_C alternate labels parse', () => {
  const result = finalizeExtraction({
    extraction: parseBillText(BILL_C),
    sourceEngine: 'LOCAL_PDF_TEXT',
  });
  assert.equal(result.consumerName, 'THIRD SAMPLE');
  assert.equal(result.accountNumber, 'MES-445566');
  assert.equal(result.tariffCategory, 'Commercial LT-2');
  assert.equal(result.billingPeriodStart, '2026-04-01');
  assert.equal(result.billingPeriodEnd, '2026-04-30');
  assert.equal(result.dueDate, '2026-05-20');
  assert.equal(result.unitsConsumed, 250);
  assert.equal(result.energyCharges, 1625);
  assert.equal(result.fixedCharges, 150);
  assert.equal(result.taxes, 146.25);
  assert.equal(result.arrears, 100);
  assert.equal(result.netPayable, 2043.75);
  assert.equal(result.totalAmount, 2043.75);
  // No current-demand label on this layout, so component arithmetic cannot be asserted.
  assert.equal(result.validation.arithmetic.currentDemandConsistent, null);
});

test('AI payload with field confidence/evidence normalises', () => {
  const ai = normalizeAiExtraction({
    fields: {
      consumerName: { value: 'AI SAMPLE', confidence: 0.91, evidence: 'Name and Address' },
      accountNumber: { value: '1122334455', confidence: 0.9 },
      netPayable: { value: '₹1,234.50', confidence: 0.88 },
      unitsConsumed: { value: '210', confidence: 0.9 },
      currentDemandPayable: { value: '1,234.50', confidence: 0.7 },
      billingPeriodStart: { value: '01/04/2026', confidence: 0.8 },
      billingPeriodEnd: { value: '30/04/2026', confidence: 0.8 },
      arrears: { value: null, confidence: 0.2 },
    },
    warnings: ['Test warning'],
  });
  assert.equal(ai.values.netPayable, 1234.5);
  assert.equal(ai.values.unitsConsumed, 210);
  assert.equal(ai.values.billingPeriodStart, '2026-04-01');
  assert.equal(ai.values.arrears, null);
  assert.equal(ai.confidence.netPayable, 0.88);
  assert.equal(ai.evidence.consumerName, 'Name and Address');
});

test('merge keeps local values and flags conflicts', () => {
  const local = parseBillText(BILL_A);
  const ai = normalizeAiExtraction({
    fields: {
      netPayable: 999.0,
      unitsConsumed: 268,
      consumerName: { value: 'OTHER NAME' },
    },
  });
  const merged = mergeExtractions(local, ai);
  assert.equal(merged.values.netPayable, 2255);
  assert.equal(merged.values.unitsConsumed, 268);
  assert.ok(merged.warnings.some((w) => /disagreed/i.test(w)));
});

test('missing core fields force manual entry, never fabricated', () => {
  const result = finalizeExtraction({
    extraction: parseBillText('Name and Address : NO AMOUNT BILL\nUnits Billed 100\n'),
    sourceEngine: 'LOCAL_PDF_TEXT',
  });
  assert.equal(result.netPayable, null);
  assert.equal(result.totalAmount, null);
  assert.equal(result.validation.status, 'MANUAL_ENTRY_REQUIRED');
  assert.equal(result.confidenceScore, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
