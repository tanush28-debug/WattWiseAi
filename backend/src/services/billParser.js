/**
 * Deterministic parsing and validation for Indian electricity bills.
 * Values are only taken from printed labels; nothing is fabricated.
 */

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const NUMBER_RE = /-?\d{1,3}(?:,\d{2,3})+(?:\.\d{1,4})?|-?\d+(?:\.\d{1,4})?/g;

const DATE_TOKEN_RE = /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{1,2}[-\s](?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[-\s]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[-\s]\d{1,2},?[-\s]\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\b/gi;

const MAIN_FIELDS = [
  'consumerName', 'accountNumber', 'discom', 'tariffCategory',
  'billingMonth', 'billingPeriodStart', 'billingPeriodEnd',
  'billIssueDate', 'dueDate', 'previousReading', 'currentReading', 'unitsConsumed',
  'energyCharges', 'fixedCharges', 'otherCharges', 'taxes',
  'arrears', 'currentDemandPayable', 'netPayable',
];

const CHARGE_COMPONENT_FIELDS = [
  'fppcaCharges', 'pAndGSurcharge', 'pfPenalty', 'loadPenalty', 'interest', 'otherChargesExplicit',
];

export class BillExtractionError extends Error {
  constructor(message, { statusCode = 500, code = 'BILL_EXTRACTION_FAILED' } = {}) {
    super(message);
    this.name = 'BillExtractionError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function cleanText(text = '') {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00B9|\u00B2|\u00B3/g, (m) => ({ '\u00B9': '1', '\u00B2': '2', '\u00B3': '3' }[m]))
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
    .join('\n')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseIndianNumber(token) {
  if (token === null || token === undefined) return null;
  if (typeof token === 'number') return Number.isFinite(token) ? token : null;
  let s = String(token).trim();
  if (!s) return null;
  s = s.replace(/[₹$]/g, '').replace(/\b(?:rs|inr)\b\.?/gi, '').replace(/,/g, '').replace(/\s+/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(s)) return null;
  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}

function numbersInLine(line) {
  const out = [];
  for (const match of String(line || '').matchAll(NUMBER_RE)) {
    const value = parseIndianNumber(match[0]);
    if (value !== null) out.push({ value, raw: match[0] });
  }
  return out;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function parseDateToken(token) {
  if (!token) return null;
  const raw = String(token).trim();
  if (!raw) return null;

  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));

  m = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return isoDate(year, Number(m[2]), Number(m[1]));
  }

  m = raw.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    let year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    if (month) return isoDate(year, month, Number(m[1]));
  }

  m = raw.match(/^([A-Za-z]{3,9})[-\s](\d{1,2}),?[-\s](\d{2,4})$/);
  if (m) {
    const month = MONTHS[m[1].toLowerCase()];
    let year = Number(m[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    if (month) return isoDate(year, month, Number(m[2]));
  }

  return null;
}

function isoDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatMonthYear(iso) {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${MONTH_NAMES[Number(m[2]) - 1]} ${m[1]}`;
}

function linesOf(text) {
  return cleanText(text).split('\n');
}

/**
 * Find the first line matching one of the label patterns and take a numeric value
 * from the line remainder, or from the following line when the bill prints
 * charge rows as "label line" + "unit rate amount" line.
 */
function findLineValue(lines, patterns, options = {}) {
  const {
    mode = 'last',
    nextLines = 1,
    occurrence = 'first',
    rejectLine = null,
    stopNextLine = null,
    fallbackIndex = null,
  } = options;

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (rejectLine && rejectLine.test(line)) continue;

    let matched = null;
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (m) {
        matched = m;
        break;
      }
    }
    if (!matched) continue;

    const sourceLines = [line.slice(matched.index + matched[0].length)];
    let nums = numbersInLine(sourceLines[0]);
    let fromNextLine = false;

    if (nums.length === 0 && nextLines > 0) {
      for (let j = i + 1; j < Math.min(lines.length, i + 1 + nextLines); j++) {
        const nextLine = lines[j];
        if (!nextLine) continue;
        if (stopNextLine && stopNextLine.test(nextLine)) break;
        sourceLines.push(nextLine);
        nums = numbersInLine(nextLine);
        if (nums.length > 0) {
          fromNextLine = true;
          break;
        }
      }
    }

    if (nums.length === 0) continue;
    let chosen;
    if (fromNextLine && fallbackIndex !== null) {
      chosen = nums[Math.min(fallbackIndex, nums.length - 1)];
    } else {
      chosen = mode === 'first' ? nums[0] : nums[nums.length - 1];
    }
    candidates.push({
      value: chosen.value,
      raw: chosen.raw,
      evidence: sourceLines.join(' | ').trim().slice(0, 220),
      lineNumber: i + 1,
    });
  }

  if (candidates.length === 0) return null;
  return occurrence === 'last' ? candidates[candidates.length - 1] : candidates[0];
}

function findAllLineValues(lines, patterns, options = {}) {
  const values = [];
  const { rejectLine = null, mode = 'last' } = options;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (rejectLine && rejectLine.test(line)) continue;
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (!m) continue;
      const nums = numbersInLine(line.slice(m.index + m[0].length));
      if (nums.length > 0) {
        values.push({
          value: mode === 'first' ? nums[0].value : nums[nums.length - 1].value,
          evidence: line.slice(0, 220),
          lineNumber: i + 1,
        });
      } else if (i + 1 < lines.length) {
        const nextNums = numbersInLine(lines[i + 1]);
        if (nextNums.length > 0) {
          values.push({
            value: mode === 'first' ? nextNums[0].value : nextNums[nextNums.length - 1].value,
            evidence: `${line.slice(0, 100)} | ${lines[i + 1].slice(0, 120)}`,
            lineNumber: i + 1,
          });
        }
      }
      break;
    }
  }
  return values;
}

function findLineToken(lines, patterns, tokenRegex, options = {}) {
  const { occurrence = 'first', rejectLine = null } = options;
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (rejectLine && rejectLine.test(line)) continue;
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (!m) continue;
      const remainder = line.slice(m.index + m[0].length).trim();
      const token = remainder.match(tokenRegex);
      if (token) {
        candidates.push({
          value: token[0].trim(),
          evidence: line.slice(0, 220),
          lineNumber: i + 1,
        });
      }
      break;
    }
  }
  if (candidates.length === 0) return null;
  return occurrence === 'last' ? candidates[candidates.length - 1] : candidates[0];
}

function findDateLine(lines, patterns, options = {}) {
  const { nextLines = 2, stopNextLine = null, occurrence = 'first' } = options;
  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let matched = null;
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (m && (m.index + m[0].length) <= line.length) {
        matched = m;
        break;
      }
    }
    if (!matched) continue;

    const sourceLines = [line.slice(matched.index + matched[0].length)];
    let dates = extractDateTokens(sourceLines[0]);
    for (let j = i + 1; j < Math.min(lines.length, i + 1 + nextLines); j++) {
      if (!lines[j]) continue;
      if (stopNextLine && stopNextLine.test(lines[j])) break;
      sourceLines.push(lines[j]);
      dates = extractDateTokens(sourceLines.join(' '));
      if (dates.length > 0) break;
    }

    if (dates.length === 0) continue;
    candidates.push({
      values: dates.map((d) => d.iso),
      rawValues: dates.map((d) => d.raw),
      evidence: sourceLines.join(' | ').trim().slice(0, 220),
      lineNumber: i + 1,
    });
  }
  if (candidates.length === 0) return null;
  return occurrence === 'last' ? candidates[candidates.length - 1] : candidates[0];
}

export function extractDateTokens(text) {
  const out = [];
  const seen = new Set();
  for (const match of String(text || '').matchAll(DATE_TOKEN_RE)) {
    const iso = parseDateToken(match[0]);
    if (iso && !seen.has(iso)) {
      seen.add(iso);
      out.push({ raw: match[0], iso });
    }
  }
  return out;
}

function normalizeDiscom(raw, text) {
  const haystack = `${raw || ''} ${text || ''}`;
  if (/BESCOM|Bangalore\s+Electricity|ಬೆಂಗಳೂರು\s*ವಿದ್ಯುತ್/i.test(haystack)) {
    return 'BESCOM (Bangalore Electricity Supply Company)';
  }
  if (/MESCOM|Mangalore\s+Electricity/i.test(haystack)) return 'MESCOM (Mangalore Electricity Supply Company)';
  if (/HESCOM|Hubli\s+Electricity/i.test(haystack)) return 'HESCOM (Hubli Electricity Supply Company)';
  if (/GESCOM|Gulbarga\s+Electricity/i.test(haystack)) return 'GESCOM (Gulbarga Electricity Supply Company)';
  if (/CESC/i.test(haystack)) return 'CESC';
  if (/TATA\s*POWER/i.test(haystack)) return 'Tata Power';
  if (/ADANI\s*ELECTRICITY/i.test(haystack)) return 'Adani Electricity';
  if (/MAHADISCOM|MSEDCL|Mahavitaran/i.test(haystack)) return 'MSEDCL (Mahavitaran)';
  if (/BSES/i.test(haystack)) return 'BSES Delhi';
  if (/TORRENT/i.test(haystack)) return 'Torrent Power';
  if (/KSEB/i.test(haystack)) return 'KSEB (Kerala State Electricity Board)';
  if (/TNEB|TANGEDCO/i.test(haystack)) return 'TANGEDCO (Tamil Nadu Generation and Distribution Corporation)';
  if (/APSPDCL|APEPDCL|APTRANSCO/i.test(haystack)) return 'Andhra Pradesh DISCOM';
  if (/TGSPDCL|TSSPDCL|TSTRANSCO/i.test(haystack)) return 'Telangana DISCOM';
  const cleaned = String(raw || '').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function normalizeTariff(raw) {
  if (!raw) return null;
  const value = String(raw).trim().toUpperCase();
  if (/^LT-?1\b/.test(value)) return 'Domestic LT-1 Standard';
  if (/^LT-?2\b/.test(value)) return 'Commercial LT-2';
  if (/^LT-?3\b/.test(value)) return 'Industrial LT-3';
  if (/^HT-?1\b/.test(value)) return 'Industrial HT-1';
  if (/^HT-?2\b/.test(value)) return 'Industrial HT-2a';
  if (/KUSUM|AGRICULT/i.test(value)) return 'Agricultural PM-KUSUM';
  return String(raw).trim();
}

function normalizeAccountNumber(raw) {
  if (!raw) return null;
  const value = String(raw).replace(/[^A-Za-z0-9\/-]/g, '').trim();
  if (value.length < 5 || value.length > 24) return null;
  return value;
}

function extractConsumerName(lines) {
  const labelPatterns = [
    /Name\s+and\s+Address/i,
    /Consumer\s*Name/i,
    /Customer\s*Name/i,
    /Name\s*of\s*Consumer/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let remainder = '';
    for (const pattern of labelPatterns) {
      const m = line.match(pattern);
      if (m) {
        remainder = line.slice(m.index + m[0].length).replace(/^[\s:.-]+/, '').trim();
        break;
      }
    }
    if (!remainder && !labelPatterns.some((p) => p.test(line))) continue;
    if (!remainder && i + 1 < lines.length) {
      remainder = lines[i + 1].trim();
    }
    if (!remainder) continue;

    let name = remainder
      .split(/\s*[,;]\s*/)[0]
      .split(/-NO\b|\bNO\.?\s*\d|\b#\s*\d|\b\d{1,4}[,\s]+\w+/i)[0]
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (name.length > 90) {
      name = name.slice(0, 90).replace(/\s+\S*$/, '');
    }
    if (name.length >= 3 && /[A-Za-z\u0900-\u097F\u0C80-\u0CFF]/.test(name)) {
      return { value: name, evidence: remainder.slice(0, 220) };
    }
  }
  return null;
}

function computeOtherCharges(values) {
  const present = [];
  for (const key of CHARGE_COMPONENT_FIELDS) {
    if (values[key] !== null && values[key] !== undefined) {
      present.push({ key, value: values[key] });
    }
  }
  if (present.length === 0) return { value: null, evidence: null, derived: false };
  const sum = present.reduce((acc, item) => acc + item.value, 0);
  return {
    value: Number(sum.toFixed(2)),
    evidence: present.map((p) => `${p.key}=${p.value}`).join(', '),
    derived: true,
  };
}

export function parseBillText(rawText, fileName = '') {
  const text = cleanText(rawText);
  if (!text) {
    return { values: emptyValues(), evidence: {}, confidence: {}, parser: 'EMPTY_TEXT', fileName };
  }
  const lines = linesOf(text);
  const values = emptyValues();
  const evidence = {};
  const confidence = {};

  const setValue = (key, result, conf = 0.9) => {
    if (!result) return;
    values[key] = result.value;
    evidence[key] = result.evidence || null;
    confidence[key] = conf;
  };

  // Account identifiers: prefer A/c Id, then Account/Consumer number, then RR number.
  const accountResult =
    findLineToken(lines, [/(?:A\/c\s*Id|Account\s*(?:No|Number|#)|Consumer\s*(?:No|Number|ID)|Service\s*(?:No|Number)|CA\s*No)/i], /[A-Z0-9][A-Z0-9\/-]{4,23}/i) ||
    findLineToken(lines, [/RR\s*No/i], /[A-Z0-9][A-Z0-9\/-]{4,23}/i);
  if (accountResult) {
    const normalized = normalizeAccountNumber(accountResult.value);
    if (normalized) {
      values.accountNumber = normalized;
      evidence.accountNumber = accountResult.evidence;
      confidence.accountNumber = 0.92;
    }
  }

  const rrResult = findLineToken(lines, [/RR\s*No/i], /[A-Z0-9][A-Z0-9\/-]{4,23}/i);
  if (rrResult) values.rrNumber = rrResult.value;

  const nameResult = extractConsumerName(lines);
  if (nameResult) {
    values.consumerName = nameResult.value;
    evidence.consumerName = nameResult.evidence;
    confidence.consumerName = 0.82;
  }

  const tariffResult = findLineToken(lines, [/\bTariff(?:\s*Category)?\b/i, /\bCategory\b/i], /\b(?:LT|HT)[-\s]?\d{1,2}[A-Za-z]?\b/i);
  if (tariffResult) {
    values.tariffCategory = normalizeTariff(tariffResult.value);
    evidence.tariffCategory = tariffResult.evidence;
    confidence.tariffCategory = 0.9;
  }

  values.discom = normalizeDiscom(null, text);
  if (values.discom) {
    confidence.discom = 0.9;
    const discomLine = lines.find((l) => /BESCOM|Electricity|ವಿದ್ಯುತ್/i.test(l));
    if (discomLine) evidence.discom = discomLine.slice(0, 220);
  }

  // Billing period and dates.
  const periodResult = findDateLine(lines, [/\b(?:Bill|Billing)\s*Period\b/i, /\bBill\s*Cycle\b/i], {
    nextLines: 2,
    stopNextLine: /\b(?:Reading|Bill|Issue|Due)\s*(?:Date|Dt)\b/i,
  });
  if (periodResult) {
    values.billingPeriodStart = periodResult.values[0] || null;
    values.billingPeriodEnd = periodResult.values[1] || null;
    evidence.billingPeriod = periodResult.evidence;
    if (values.billingPeriodStart) confidence.billingPeriodStart = 0.9;
    if (values.billingPeriodEnd) confidence.billingPeriodEnd = 0.9;
  }

  const issueResult = findDateLine(lines, [/\b(?:Reading|Bill|Issue|Bill\s+Generation)\s*Date\b/i, /\bBill\s*Dt\b/i], { nextLines: 0 });
  if (issueResult) {
    values.billIssueDate = issueResult.values[0] || null;
    evidence.billIssueDate = issueResult.evidence;
    if (values.billIssueDate) confidence.billIssueDate = 0.85;
  }

  const dueResult = findDateLine(lines, [/\bDue\s*Date\b/i, /\bPayment\s*Due\b/i, /\bPay\s*(?:By|Before)\b/i, /\bLast\s*Date\s*(?:for|of)\s*Payment\b/i], {
    nextLines: 1,
    stopNextLine: /\bLast\s*Paid\b/i,
  });
  if (dueResult) {
    values.dueDate = dueResult.values[0] || null;
    evidence.dueDate = dueResult.evidence;
    if (values.dueDate) confidence.dueDate = 0.9;
  }

  if (!values.billingMonth && values.billingPeriodEnd) {
    values.billingMonth = formatMonthYear(values.billingPeriodEnd);
    if (values.billingMonth) {
      confidence.billingMonth = 0.5;
      values.billingMonthDerived = true;
      evidence.billingMonth = `Derived from billing period end ${values.billingPeriodEnd}`;
    }
  }

  // Meter readings and consumption.
  setValue('previousReading', findLineValue(lines, [/Prev\.?\s*(?:Rdg|Reading)\.?/i, /Previous\s*Reading/i], {
    mode: 'first',
    fallbackIndex: 0,
  }), 0.9);
  setValue('currentReading', findLineValue(lines, [/Pres\.?\s*(?:Rdg|Reading)\.?/i, /Present\s*Reading/i, /Current\s*Reading/i], {
    mode: 'first',
    fallbackIndex: 1,
  }), 0.9);
  setValue('unitsConsumed', findLineValue(lines, [
    /Consumption\s*\(Units\)/i,
    /Consumption\s*\(kWh\)/i,
    /Units\s*Consumed/i,
    /Units\s*Billed/i,
    /Total\s*Units/i,
    /Net\s*Units/i,
    /\bkWh\s*Consumed\b/i,
  ], { rejectLine: /chargeable|entitlement|average|slab/i, fallbackIndex: 2 }), 0.92);

  // Current-cycle charges (first occurrence is the gross section).
  setValue('fixedCharges', findLineValue(lines, [/Fixed\s*Charges?/i, /Standing\s*Charges?/i], {
    rejectLine: /unit\s*,\s*rate\s*,\s*amount/i,
    nextLines: 1,
  }), 0.88);
  // The row immediately after "Fixed Charges (Unit, Rate, Amount)" carries the amount.
  if (values.fixedCharges === null) {
    const fixedRow = findFixedChargeRow(lines);
    if (fixedRow) setValue('fixedCharges', fixedRow, 0.88);
  }

  setValue('energyCharges', findLineValue(lines, [/Energy\s*Charges?/i], { nextLines: 1 }), 0.9);
  setValue('taxes', findLineValue(lines, [/Tax\s*@\s*\d+(?:\.\d+)?%/i, /Electricity\s*Duty/i, /\bED\s*@/i], { nextLines: 1 }), 0.9);

  setValue('fppcaCharges', findLineValue(lines, [/FPPCA/i, /Fuel\s*(?:Surcharge|Adjustment)/i, /\bFAC\b/i], { nextLines: 1 }), 0.88);
  setValue('pAndGSurcharge', findLineValue(lines, [/P\s*&\s*G\s*Surcharge/i, /\bGOK\s*Portion\b/i], { nextLines: 1 }), 0.85);
  setValue('pfPenalty', findLineValue(lines, [/PF\s*Penalty/i, /Power\s*Factor\s*Penalty/i], { nextLines: 1 }), 0.85);
  setValue('loadPenalty', findLineValue(lines, [/Ex\s*Load/i, /\bMD\s*Penalty\b/i, /Load\s*Penalty/i, /Excess\s*Load/i], { nextLines: 1 }), 0.85);
  setValue('interest', findLineValue(lines, [/\bInterest\b/i, /Delayed\s*Payment/i], {
    rejectLine: /deposit|\bIOD\b/i,
    nextLines: 1,
  }), 0.82);
  setValue('otherChargesExplicit', findLineValue(lines, [/Others?\s*\(ASD/i, /Other\s*Charges?/i, /\bOthers\b/i], { nextLines: 1 }), 0.85);

  const trueUpValues = findAllLineValues(lines, [/True\s*Up\s*Charges?/i]);
  if (trueUpValues.length > 0) {
    values.trueUpCharges = Number(trueUpValues.reduce((sum, item) => sum + item.value, 0).toFixed(2));
    evidence.trueUpCharges = trueUpValues.map((v) => v.evidence).join(' | ').slice(0, 240);
    confidence.trueUpCharges = 0.85;
  }

  setValue('depositAdjustment', findLineValue(lines, [/Int\.?\s*on\s*Deposit/i, /\bIOD\b/i], { nextLines: 1 }), 0.85);

  const subsidyResult = findLineValue(lines, [/Sub-?Total-?2/i], { nextLines: 1 }) ||
    findLineValue(lines, [/Subsidy\s*(?:Amount|Adjustment)?/i, /Gruha\s*Jyothi/i], { nextLines: 1 });
  if (subsidyResult) {
    values.subsidyAmount = subsidyResult.value;
    evidence.subsidyAmount = subsidyResult.evidence;
    confidence.subsidyAmount = 0.85;
  }

  setValue('currentDemandPayable', findLineValue(lines, [
    /Cur\.?\s*Demand\s*Payable/i,
    /Current\s*Demand\s*Payable/i,
    /Current\s*Demand/i,
    /Current\s*Bill\s*Amount/i,
  ]), 0.92);

  const netResult = findLineValue(lines, [
    /\bNet\s*(?:Amount\s*)?Payable\b/i,
    /\bNet\s*Amount\s*(?:Due|Payable)\b/i,
    /\bTotal\s*(?:Amount\s*)?(?:Payable|Due)\b/i,
    /\bFinal\s*(?:Amount\s*)?Payable\b/i,
    /\bAmount\s*Payable\b/i,
    /\bPayable\s*Amount\b/i,
  ], {
    occurrence: 'last',
    nextLines: 1,
    rejectLine: /after\s+due|before\s+due|late\s+payment|penalty|current|cur\.?\s*demand/i,
  });
  if (netResult) {
    values.netPayable = netResult.value;
    evidence.netPayable = netResult.evidence;
    confidence.netPayable = 0.94;
  }

  setValue('arrears', findLineValue(lines, [/Arrears?/i, /Outstanding/i, /Previous\s*Dues?/i], { nextLines: 1 }), 0.9);

  const other = computeOtherCharges(values);
  if (other.value !== null) {
    values.otherCharges = other.value;
    values.otherChargesDerived = true;
    evidence.otherCharges = other.evidence;
    confidence.otherCharges = 0.72;
  }

  return {
    values,
    evidence,
    confidence,
    parser: 'LOCAL_PDF_TEXT',
    fileName,
  };
}

function findFixedChargeRow(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!/Fixed\s*Charges?.*(?:Unit\s*,\s*Rate\s*,\s*Amount|Rate)/i.test(lines[i])) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
      if (!lines[j]) continue;
      const nums = numbersInLine(lines[j]);
      if (nums.length >= 2) {
        return {
          value: nums[nums.length - 1].value,
          evidence: `${lines[i].slice(0, 120)} | ${lines[j].slice(0, 120)}`,
        };
      }
    }
  }
  return null;
}

function emptyValues() {
  return {
    consumerName: null,
    accountNumber: null,
    rrNumber: null,
    discom: null,
    tariffCategory: null,
    billingMonth: null,
    billingPeriodStart: null,
    billingPeriodEnd: null,
    billIssueDate: null,
    dueDate: null,
    previousReading: null,
    currentReading: null,
    unitsConsumed: null,
    energyCharges: null,
    fixedCharges: null,
    otherCharges: null,
    otherChargesExplicit: null,
    taxes: null,
    fppcaCharges: null,
    pAndGSurcharge: null,
    pfPenalty: null,
    loadPenalty: null,
    interest: null,
    trueUpCharges: null,
    depositAdjustment: null,
    subsidyAmount: null,
    arrears: null,
    currentDemandPayable: null,
    netPayable: null,
  };
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  return parseIndianNumber(value);
}

function asString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || /^(null|n\/a|na|nil|unknown|-)$/i.test(s)) return null;
  return s;
}

function asDate(value) {
  const s = asString(value);
  if (!s) return null;
  return parseDateToken(s) || (extractDateTokens(s)[0]?.iso ?? null);
}

export function hasUsableBillText(rawText) {
  const text = cleanText(rawText);
  if (text.length < 80) return false;
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  if (letters < 40 || digits < 10) return false;
  const keywordHits = [
    /bill/i, /units?/i, /consumption/i, /amount/i, /payable/i, /due/i,
    /charges?/i, /energy/i, /account/i, /tariff/i, /reading/i, /kwh/i,
  ].filter((re) => re.test(text)).length;
  return keywordHits >= 2;
}

export function isTextExtractionSufficient(extraction) {
  if (!extraction) return false;
  const v = extraction.values || extraction;
  const core = v.netPayable !== null && v.unitsConsumed !== null;
  if (!core) return false;
  let score = 4; // net payable + units
  if (v.accountNumber) score += 1;
  if (v.consumerName) score += 1;
  if (v.billingPeriodStart && v.billingPeriodEnd) score += 1;
  if (v.energyCharges !== null) score += 1;
  if (v.fixedCharges !== null) score += 1;
  if (v.taxes !== null) score += 1;
  if (v.previousReading !== null && v.currentReading !== null) score += 1;
  if (v.dueDate) score += 1;
  return score >= 8;
}

/**
 * Normalises a Gemini JSON response into the same shape as parseBillText.
 * Accepts either { fields: {...} } or a flat object with optional confidence/evidence maps.
 */
export function normalizeAiExtraction(payload) {
  const values = emptyValues();
  const evidence = {};
  const confidence = {};

  const fields = payload && typeof payload.fields === 'object' && payload.fields !== null
    ? payload.fields
    : payload || {};

  const pick = (key) => {
    const entry = fields[key];
    if (entry && typeof entry === 'object' && !Array.isArray(entry) && 'value' in entry) {
      return { value: entry.value, evidence: entry.evidence, confidence: entry.confidence };
    }
    return { value: entry, evidence: payload?.evidence?.[key], confidence: payload?.confidence?.[key] };
  };

  for (const key of MAIN_FIELDS) {
    const picked = pick(key);
    if (picked.confidence !== undefined && picked.confidence !== null) {
      const c = Number(picked.confidence);
      if (Number.isFinite(c)) confidence[key] = Math.max(0, Math.min(1, c));
    }
    if (picked.evidence) evidence[key] = String(picked.evidence).slice(0, 240);
  }

  const numeric = (key) => asNumber(pick(key).value);
  for (const key of [
    'previousReading', 'currentReading', 'unitsConsumed', 'energyCharges', 'fixedCharges',
    'otherCharges', 'taxes', 'fppcaCharges', 'pAndGSurcharge', 'pfPenalty', 'loadPenalty',
    'interest', 'trueUpCharges', 'depositAdjustment', 'subsidyAmount', 'arrears',
    'currentDemandPayable', 'netPayable',
  ]) {
    values[key] = numeric(key);
  }

  values.consumerName = asString(pick('consumerName').value);
  values.accountNumber = normalizeAccountNumber(asString(pick('accountNumber').value));
  const rrNumber = asString(pick('rrNumber').value);
  if (rrNumber) values.rrNumber = rrNumber;
  values.tariffCategory = normalizeTariff(asString(pick('tariffCategory').value));
  values.billingMonth = asString(pick('billingMonth').value);
  values.billingPeriodStart = asDate(pick('billingPeriodStart').value);
  values.billingPeriodEnd = asDate(pick('billingPeriodEnd').value);
  values.billIssueDate = asDate(pick('billIssueDate').value);
  values.dueDate = asDate(pick('dueDate').value);

  const rawDiscom = asString(pick('discom').value);
  values.discom = normalizeDiscom(rawDiscom, rawDiscom || '');

  if (!values.billingMonth && values.billingPeriodEnd) {
    values.billingMonth = formatMonthYear(values.billingPeriodEnd);
    values.billingMonthDerived = Boolean(values.billingMonth);
  }

  const explicitOther = asNumber(pick('otherChargesExplicit').value);
  values.otherChargesExplicit = explicitOther;

  // If the model returned a composite otherCharges but no components, keep it as explicit
  // only when there are no component values to recompute from.
  const componentKeys = ['fppcaCharges', 'pAndGSurcharge', 'pfPenalty', 'loadPenalty', 'interest'];
  const hasComponents = componentKeys.some((key) => values[key] !== null) || values.otherChargesExplicit !== null;
  if (!hasComponents && values.otherCharges !== null) {
    values.otherChargesExplicit = values.otherCharges;
  }

  return {
    values,
    evidence,
    confidence,
    warnings: Array.isArray(payload?.warnings) ? payload.warnings.map(String).slice(0, 20) : [],
    missingFields: Array.isArray(payload?.missingFields) ? payload.missingFields.map(String).slice(0, 40) : [],
    parser: 'GEMINI',
  };
}

export function emptyExtraction(source = 'NONE') {
  return { values: emptyValues(), evidence: {}, confidence: {}, parser: source, warnings: [], missingFields: [] };
}

export function mergeExtractions(primary, secondary) {
  if (!primary) return secondary;
  if (!secondary) return primary;

  const values = { ...primary.values };
  const evidence = { ...(secondary.evidence || {}), ...(primary.evidence || {}) };
  const confidence = { ...(secondary.confidence || {}), ...(primary.confidence || {}) };
  const warnings = [...(primary.warnings || [])];
  const conflicts = [];

  const conflictFields = [
    'netPayable', 'currentDemandPayable', 'arrears', 'unitsConsumed',
    'previousReading', 'currentReading', 'accountNumber', 'energyCharges', 'fixedCharges', 'taxes',
  ];

  for (const key of [...MAIN_FIELDS, ...CHARGE_COMPONENT_FIELDS, 'trueUpCharges', 'depositAdjustment', 'subsidyAmount']) {
    const pv = primary.values?.[key];
    const sv = secondary.values?.[key];
    if ((pv === null || pv === undefined) && sv !== null && sv !== undefined) {
      values[key] = sv;
      if (!evidence[key] && secondary.evidence?.[key]) evidence[key] = secondary.evidence[key];
      if (confidence[key] === undefined && secondary.confidence?.[key] !== undefined) {
        confidence[key] = secondary.confidence[key];
      }
    } else if (pv !== null && pv !== undefined && sv !== null && sv !== undefined &&
      conflictFields.includes(key) && Number.isFinite(Number(pv)) && Number.isFinite(Number(sv)) &&
      Math.abs(Number(pv) - Number(sv)) > 0.009) {
      conflicts.push(`${key}: AI=${pv}, local text=${sv}`);
      if (confidence[key] !== undefined) confidence[key] = Math.min(confidence[key], 0.55);
    }
  }

  if (conflicts.length > 0) {
    warnings.push(`AI and embedded-text extraction disagreed on: ${conflicts.join('; ')}. Please verify these fields.`);
  }

  return {
    ...primary,
    values,
    evidence,
    confidence,
    warnings,
    missingFields: primary.missingFields || [],
    mergedWith: secondary.parser,
  };
}

function withinTolerance(a, b, tolerance) {
  return Math.abs(a - b) <= tolerance;
}

export function finalizeExtraction({ extraction, sourceEngine, aiModelUsed = null, rawTextLength = 0, fileName = '' }) {
  const values = { ...emptyValues(), ...(extraction?.values || {}) };
  const evidence = { ...(extraction?.evidence || {}) };
  const confidence = { ...(extraction?.confidence || {}) };
  const warnings = [...(extraction?.warnings || [])];
  const uncertainFields = [];
  const derivedFields = [];

  // Normalise and reject non-finite numeric values.
  for (const key of [
    'previousReading', 'currentReading', 'unitsConsumed', 'energyCharges', 'fixedCharges',
    'otherCharges', 'otherChargesExplicit', 'taxes', 'fppcaCharges', 'pAndGSurcharge', 'pfPenalty',
    'loadPenalty', 'interest', 'trueUpCharges', 'depositAdjustment', 'subsidyAmount', 'arrears',
    'currentDemandPayable', 'netPayable',
  ]) {
    if (values[key] !== null && values[key] !== undefined) {
      const n = asNumber(values[key]);
      values[key] = n;
    }
  }

  values.billingPeriodStart = asDate(values.billingPeriodStart);
  values.billingPeriodEnd = asDate(values.billingPeriodEnd);
  values.billIssueDate = asDate(values.billIssueDate);
  values.dueDate = asDate(values.dueDate);

  if (!values.billingMonth && values.billingPeriodEnd) {
    values.billingMonth = formatMonthYear(values.billingPeriodEnd);
    if (values.billingMonth) {
      values.billingMonthDerived = true;
      evidence.billingMonth = `Derived from billing period end ${values.billingPeriodEnd}`;
      confidence.billingMonth = 0.5;
    }
  }
  if (values.billingMonthDerived) derivedFields.push('billingMonth');

  // Recompute the composite other-charges total from printed components.
  const computedOther = computeOtherCharges(values);
  if (computedOther.value !== null) {
    values.otherCharges = computedOther.value;
    values.otherChargesDerived = true;
    if (!evidence.otherCharges) evidence.otherCharges = computedOther.evidence;
    if (confidence.otherCharges === undefined) confidence.otherCharges = 0.72;
    if (!derivedFields.includes('otherCharges')) derivedFields.push('otherCharges');
  }

  const adjustmentsPresent = values.trueUpCharges !== null || values.depositAdjustment !== null;
  const adjustments = adjustmentsPresent
    ? Number((((values.trueUpCharges || 0) + (values.depositAdjustment || 0))).toFixed(2))
    : null;

  // Missing fields: required/extracted bill fields only.
  const missingFields = MAIN_FIELDS.filter((key) => values[key] === null || values[key] === undefined);

  for (const key of MAIN_FIELDS) {
    if (values[key] === null || values[key] === undefined) continue;
    const c = confidence[key];
    if (c === undefined || c === null) {
      confidence[key] = 0.6;
      uncertainFields.push(key);
    } else if (c < 0.7 && !derivedFields.includes(key)) {
      uncertainFields.push(key);
    }
  }

  // Meter reading vs consumption cross-check.
  let readingsConsistent = null;
  let readingsDifference = null;
  if (values.previousReading !== null && values.currentReading !== null) {
    readingsDifference = Number((values.currentReading - values.previousReading).toFixed(3));
    if (values.unitsConsumed !== null) {
      const tolerance = Math.max(2, Math.abs(values.unitsConsumed) * 0.01);
      readingsConsistent = withinTolerance(readingsDifference, values.unitsConsumed, tolerance);
      if (!readingsConsistent) {
        warnings.push(
          `Meter readings differ from billed units: current - previous = ${readingsDifference}, billed units = ${values.unitsConsumed}.`
        );
      }
    }
  }

  // Billing period and due-date checks.
  let billingPeriodValid = null;
  if (values.billingPeriodStart && values.billingPeriodEnd) {
    billingPeriodValid = values.billingPeriodStart < values.billingPeriodEnd;
    if (!billingPeriodValid) warnings.push('Billing period start is not before billing period end.');
  }
  let dueDateValid = null;
  if (values.dueDate && values.billingPeriodEnd) {
    dueDateValid = values.dueDate >= values.billingPeriodEnd;
    if (!dueDateValid) warnings.push('Due date is earlier than the billing period end.');
  }
  let billIssueDateValid = null;
  if (values.billIssueDate) {
    if (values.billingPeriodStart && values.billIssueDate < values.billingPeriodStart) {
      billIssueDateValid = false;
      warnings.push('Bill/reading date is earlier than the billing period start.');
    } else if (values.dueDate && values.billIssueDate > values.dueDate) {
      billIssueDateValid = false;
      warnings.push('Bill/reading date is later than the due date.');
    } else {
      billIssueDateValid = true;
    }
  }

  // Current demand arithmetic: energy + fixed + tax + other components - subsidy.
  let currentDemandConsistent = null;
  let componentSum = null;
  let currentDemandDifference = null;
  if (values.currentDemandPayable !== null) {
    const hasEnergyOrFixed = values.energyCharges !== null || values.fixedCharges !== null;
    if (hasEnergyOrFixed) {
      componentSum = Number((
        (values.energyCharges || 0) +
        (values.fixedCharges || 0) +
        (values.taxes || 0) +
        (values.otherCharges || 0) -
        (values.subsidyAmount || 0)
      ).toFixed(2));
      currentDemandDifference = Number((componentSum - values.currentDemandPayable).toFixed(2));
      const tolerance = Math.max(2, Math.abs(values.currentDemandPayable) * 0.005);
      currentDemandConsistent = withinTolerance(componentSum, values.currentDemandPayable, tolerance);
      if (!currentDemandConsistent) {
        warnings.push(
          `Charge components total ${componentSum} but the printed current demand payable is ${values.currentDemandPayable} ` +
          `(difference ${currentDemandDifference}). Some adjustments may be missing or misread; verify the bill.`
        );
      }
    }
  }

  // Net payable arithmetic: current demand + arrears + adjustments.
  let netPayableConsistent = null;
  let expectedNetPayable = null;
  let netPayableDifference = null;
  if (values.netPayable !== null) {
    if (values.currentDemandPayable !== null) {
      expectedNetPayable = Number((
        (values.currentDemandPayable || 0) +
        (values.arrears || 0) +
        (adjustments || 0)
      ).toFixed(2));
      netPayableDifference = Number((expectedNetPayable - values.netPayable).toFixed(2));
      // BESCOM rounds the final net payable to whole rupees; allow ₹1.
      netPayableConsistent = Math.abs(netPayableDifference) <= 1.0;
      if (!netPayableConsistent) {
        warnings.push(
          `Current demand, arrears and printed adjustments total ${expectedNetPayable}, but the printed net payable is ` +
          `${values.netPayable} (difference ${netPayableDifference}). An unexplained adjustment may exist; verify the final amount.`
        );
      }
    }
    if (values.netPayable < 0) {
      warnings.push('Net payable is negative because arrears/credits exceed the current demand. Confirm the sign and amount.');
    }
  }

  const hasCoreDetails = values.unitsConsumed !== null && values.netPayable !== null;

  let status;
  if (!hasCoreDetails) {
    status = 'MANUAL_ENTRY_REQUIRED';
  } else if (warnings.length > 0 || uncertainFields.length > 0 || missingFields.length > 0) {
    status = 'NEEDS_REVIEW';
  } else {
    status = 'HIGH_CONFIDENCE';
  }

  if (!hasCoreDetails) {
    warnings.unshift('The final net payable amount and/or billed units could not be reliably extracted. Enter them manually from the bill.');
  }

  const totalAmount = values.netPayable;

  return {
    ...values,
    totalAmount,
    billingPeriod: values.billingPeriodStart && values.billingPeriodEnd
      ? `${values.billingPeriodStart} - ${values.billingPeriodEnd}`
      : null,
    fieldConfidence: confidence,
    evidence,
    missingFields,
    uncertainFields: Array.from(new Set(uncertainFields)),
    derivedFields: Array.from(new Set(derivedFields)),
    warnings: Array.from(new Set(warnings)),
    confidenceScore: computeOverallConfidence(values, confidence, missingFields, status),
    sourceEngine,
    aiModelUsed,
    rawTextLength,
    fileName,
    extractedAt: new Date().toISOString(),
    confidenceNote: 'Confidence values are heuristic indicators, not calibrated probabilities.',
    validation: {
      status,
      hasCoreDetails,
      readingsConsistent,
      readingsDifference,
      billingPeriodValid,
      dueDateValid,
      billIssueDateValid,
      arithmetic: {
        componentSum,
        currentDemandPayable: values.currentDemandPayable,
        currentDemandDifference,
        currentDemandConsistent,
        arrears: values.arrears,
        adjustments,
        expectedNetPayable,
        netPayable: values.netPayable,
        netPayableDifference,
        netPayableConsistent,
        toleranceINR: 1.0,
      },
      missingFields,
      uncertainFields: Array.from(new Set(uncertainFields)),
    },
  };
}

function computeOverallConfidence(values, confidence, missingFields, status) {
  if (status === 'MANUAL_ENTRY_REQUIRED') return 0;
  const keyFields = ['netPayable', 'unitsConsumed', 'accountNumber', 'currentDemandPayable', 'arrears'];
  const valuesPresent = keyFields.filter((key) => values[key] !== null && values[key] !== undefined);
  if (valuesPresent.length === 0) return 0;
  const sum = valuesPresent.reduce((acc, key) => acc + (confidence[key] ?? 0.6), 0);
  const base = sum / valuesPresent.length;
  const penalty = Math.min(0.25, missingFields.length * 0.02) + Math.min(0.2, (status === 'NEEDS_REVIEW' ? 0.08 : 0));
  return Number(Math.max(0, Math.min(0.98, base - penalty)).toFixed(2));
}
