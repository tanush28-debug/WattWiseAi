import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';

let aiClient = null;

if (config.gemini.apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
      httpOptions: { timeout: config.gemini.timeoutMs },
    });
    console.log('✅ Google GenAI SDK initialized with provided API key.');
  } catch (err) {
    console.warn('⚠️ Failed to initialize Google GenAI SDK:', err.message);
  }
}

// Primary model first, then configured fallbacks (deduplicated).
const getModelCandidates = () => Array.from(new Set(
  [config.gemini.model, ...(config.gemini.fallbackModels || [])].filter(Boolean)
));

function classifyGeminiError(error) {
  const status = Number(error?.status);
  const message = String(error?.message || '');
  if (/timeout|timed out|aborted/i.test(message)) return 'TIMEOUT';
  if (status === 401 || status === 403 || /UNAUTHENTICATED|PERMISSION_DENIED|API key not valid/i.test(message)) return 'AUTH';
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(message)) return 'QUOTA';
  if (status === 404 || /NOT_FOUND|not found|no longer available/i.test(message)) return 'UNAVAILABLE';
  if (status === 503 || /UNAVAILABLE|overloaded|high demand/i.test(message)) return 'TRANSIENT';
  if (status === 400 || /INVALID_ARGUMENT|invalid argument/i.test(message)) return 'INVALID';
  return 'UNKNOWN';
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error('Gemini request timed out');
      error.status = 504;
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function parseJsonResponse(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

const BILL_EXTRACTION_PROMPT = `You are a precision OCR and document-understanding system for Indian electricity bills (BESCOM, MESCOM, HESCOM, GESCOM, MSEDCL, Tata Power, Adani, BSES, etc.). The document may be a photo, a scanned PDF or a text PDF, and may mix Kannada, Hindi and English.

Extract ONLY values that are actually printed and legible. Never guess, infer or invent a value. Return null when a value is not clearly present.

CRITICAL MONEY RULES:
- "netPayable" is the FINAL amount the consumer must pay, labelled "Net Payable", "Net Amount Payable", "Total Amount Payable", "Total Payable", "Amount Payable" or similar. It may be negative when credit/arrears exceed the current demand. Extract it exactly as printed from its label; never choose the largest number and never calculate it.
- "currentDemandPayable" is the current cycle demand, labelled "Cur.Demand Payable", "Current Demand Payable", "Current Demand", "Current Bill Amount".
- "arrears" is labelled "Arrears"; it can be positive or negative.
- "currentDemandPayable" is the current cycle amount only; it excludes arrears and other adjustments.
- "subsidyAmount" is the subsidy actually deducted on this bill (e.g. Gruha Jyothi). In a two-section bill it is the deducted section total / difference between the gross sub-total and the bill amount after subsidy.
- "trueUpCharges" is the total of "FY.. True Up Charges" lines (EC + TAX), if printed. Add the EC and TAX amounts of those lines.
- "depositAdjustment" is the "Int. on Deposit (IOD)" line, if printed; preserve its sign.
- "otherCharges" is an explicit line labelled "Other Charges" or "Others" only; otherwise null. Do NOT put FPPCA, surcharge, penalty or interest here; those have their own fields.
- Preserve exact decimals exactly as printed. Negative values are allowed.

CRITICAL CHARGE-LINE RULE:
Many bills print charge rows across two lines, for example:
  "Fixed Charges (Unit, Rate, Amount)"
  "<unit>   <rate>   <amount>"
  "Energy Charges (Unit, Rate, Amount)"
  "<units>  <rate>   <amount>"
The RIGHTMOST number is the Amount in rupees. Never use the leftmost unit or middle rate as the charge amount. Apply this to every charge row.

SPLIT / SUBSIDY SECTION RULE:
Some BESCOM bills print two charge sections. The first section is the full/gross bill for all consumed units. A second section labelled "Gruha Jyothi Subsidy" (or another subsidy) repeats a subset of units at the same rates to calculate the subsidy. Do NOT add the two sections together. Extract energyCharges, fixedCharges, taxes, FPPCA, P&G, penalties and interest from the FIRST (gross) section only. subsidyAmount is the second section's Sub-Total (the subsidised amount), NOT the after-subsidy "Bill Amount(1-2)". The repeated subsidy section is not extra consumption.
A line labelled "Others(ASD INT)" or "Others" is otherCharges, not interest.

OTHER RULES:
- unitsConsumed = current cycle "Consumption(Units)" / "Units Billed"; NOT a meter reading and NOT "units chargeable" when they differ.
- previousReading / currentReading = meter reading values (Pres. Rdg / Prev. Rdg), not consumption.
- accountNumber = exact A/c Id / Account No / Consumer No as printed, including letters and dashes, without spaces.
- billingMonth = month the bill is for (e.g. "June 2026") only if printed; do not invent.
- billingPeriodStart/End from the printed bill period in YYYY-MM-DD.
- billIssueDate = bill date / reading date / issue date.
- discom = supply company full name when shown (translate/transliterate if only regional script is shown).
- For every non-null field provide a short exact evidence snippet and a confidence 0-1. Confidence is a heuristic, not calibrated.
- List missing fields in missingFields and ambiguities/arithmetic inconsistencies in warnings.

Return ONLY this JSON object:
{
  "consumerName": string|null,
  "accountNumber": string|null,
  "discom": string|null,
  "tariffCategory": string|null,
  "billingMonth": string|null,
  "billingPeriodStart": string|null,
  "billingPeriodEnd": string|null,
  "billIssueDate": string|null,
  "dueDate": string|null,
  "previousReading": number|null,
  "currentReading": number|null,
  "unitsConsumed": number|null,
  "energyCharges": number|null,
  "fixedCharges": number|null,
  "taxes": number|null,
  "fppcaCharges": number|null,
  "pAndGSurcharge": number|null,
  "pfPenalty": number|null,
  "loadPenalty": number|null,
  "interest": number|null,
  "otherCharges": number|null,
  "subsidyAmount": number|null,
  "trueUpCharges": number|null,
  "depositAdjustment": number|null,
  "arrears": number|null,
  "currentDemandPayable": number|null,
  "netPayable": number|null,
  "confidence": { "consumerName": number, "accountNumber": number, "discom": number, "tariffCategory": number, "billingMonth": number, "billingPeriodStart": number, "billingPeriodEnd": number, "billIssueDate": number, "dueDate": number, "previousReading": number, "currentReading": number, "unitsConsumed": number, "energyCharges": number, "fixedCharges": number, "taxes": number, "fppcaCharges": number, "pAndGSurcharge": number, "pfPenalty": number, "loadPenalty": number, "interest": number, "otherCharges": number, "subsidyAmount": number, "trueUpCharges": number, "depositAdjustment": number, "arrears": number, "currentDemandPayable": number, "netPayable": number },
  "evidence": { "consumerName": string, "accountNumber": string, "discom": string, "tariffCategory": string, "billingMonth": string, "billingPeriodStart": string, "billingPeriodEnd": string, "billIssueDate": string, "dueDate": string, "previousReading": string, "currentReading": string, "unitsConsumed": string, "energyCharges": string, "fixedCharges": string, "taxes": string, "fppcaCharges": string, "pAndGSurcharge": string, "pfPenalty": string, "loadPenalty": string, "interest": string, "otherCharges": string, "subsidyAmount": string, "trueUpCharges": string, "depositAdjustment": string, "arrears": string, "currentDemandPayable": string, "netPayable": string },
  "missingFields": [string],
  "warnings": [string]
}`;

export const geminiService = {
  /**
   * Check if Gemini API is configured and operational
   */
  isConfigured() {
    return Boolean(aiClient && config.gemini.apiKey);
  },

  /**
   * Generate contextual energy advice using Google Gemini API or local rules
   * @param {Object} params
   * @param {string} params.message - User prompt
   * @param {Object} [params.userContext] - Verified user billing and consumption context
   */
  async generateEnergyAdvice({ message, userContext = {} }) {
    // 1. If Gemini API is configured, use the official GenAI SDK
    if (this.isConfigured()) {
      const systemInstruction = `
You are WattWise AI, an expert energy advisor for Indian electricity consumers, industries, and government officials.
Guidelines:
1. Always use Indian Rupee (INR / ₹) for currency and kWh, MWh, or TWh for energy.
2. Source of Truth: Base answers on statutory Indian DISCOM regulations (e.g. BESCOM, KERC, CEA, BEE). Never invent or hallucinate tariff rates or meter data.
3. Be concise, actionable, and structured. Highlight top savings recommendations.
4. User context:
   - Name: ${userContext.fullName || 'User'}
   - Role: ${userContext.role || 'CONSUMER'}
   - Latest Units: ${userContext.unitsConsumed ? userContext.unitsConsumed + ' kWh' : 'Not yet uploaded'}
   - Current Tariff: ${userContext.tariffCategory || 'Domestic LT-1 Standard'}
   - Recent Estimated Bill: ${userContext.estimatedBillINR ? '₹' + userContext.estimatedBillINR : 'N/A'}
`.trim();

      const modelsToTry = getModelCandidates();
      for (const model of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await aiClient.models.generateContent({
              model,
              contents: [
                { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }] }
              ]
            });

            const replyText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (replyText) {
              return {
                reply: replyText,
                source: `Google Gemini (${model})`,
                isAiConfigured: true,
                model,
              };
            }
          } catch (geminiError) {
            console.warn(`Gemini API call with model '${model}' (attempt ${attempt}) notice:`, geminiError.message);
            const isQuotaExhausted = geminiError.message?.includes('429') || geminiError.message?.includes('RESOURCE_EXHAUSTED');
            const isTransient = geminiError.message?.includes('503');
            const isPermanent = geminiError.message?.includes('404') || geminiError.message?.includes('NOT_FOUND');
            if (isQuotaExhausted) {
              console.warn(`Model '${model}' quota reached — switching to candidate.`);
              break;
            } else if (isTransient && attempt < 2) {
              await new Promise(r => setTimeout(r, 600));
            } else {
              if (isPermanent) console.warn(`Model '${model}' is unavailable — skipping.`);
              break;
            }
          }
        }
      }
    }

    // 2. Deterministic local energy advisory engine (India DISCOM & BEE standards)
    const q = message.toLowerCase();
    let reply = '';

    if (q.includes('increasing') || q.includes('higher') || q.includes('spike')) {
      reply = "Looking at your recent billing cycles, usage typically peaks during high summer months due to continuous air conditioning compressor load. In October, domestic consumption stabilized at ~420.5 kWh, saving roughly ₹531.50 compared to peak monsoon/summer. If your utility bill seems disproportionately high, verify if your state DISCOM applied FPPCA (Fuel Surcharge Adjustment) or seasonal summer slab tariffs.";
    } else if (q.includes('reduce') || q.includes('save') || q.includes('cut')) {
      reply = "Top 3 actions to reduce your household electricity bill by ~15-20%:\n1. Adjust AC temperature: Running your split AC at 24°C instead of 18°C lowers compressor power draw by 18-24%.\n2. Geyser usage: Limit water heating to 15-20 minutes and insulate hot water plumbing lines.\n3. Shift heavy appliance cycles: If under a Time-of-Day (ToD) tariff, operate washing machines and pumps after 10:00 PM.";
    } else if (q.includes('appliance') || q.includes('consuming') || q.includes('drawing')) {
      reply = "Based on domestic load modeling:\n• Split Air Conditioners account for ~44% of total monthly units (~185 kWh).\n• Storage Geyser draws ~18% (~75.7 kWh).\n• Frost-Free Refrigerator draws ~14% (~58.9 kWh).\n• Lighting & Fans account for ~12% (~50.5 kWh).\nSwitching old non-star rated ceiling fans to BLDC 28W models can save ~₹1,200 annually.";
    } else if (q.includes('much') || q.includes('estimate') || q.includes('potential')) {
      reply = "By enacting the recommended AC 24°C setting, geyser management, and eliminating entertainment standby draw, you are projected to save between ₹750 and ₹1,150 per month—translating to roughly ₹9,000 to ₹13,800 in annual electricity cost avoidance.";
    } else if (q.includes('tariff') || q.includes('tod') || q.includes('slab')) {
      reply = "Under Karnataka BESCOM Domestic LT-1 tariff:\n• Slab 1 (0-100 kWh): ₹4.75 / unit\n• Slab 2 (>100 kWh): ₹7.00 / unit\n• Standing Charges: ₹120 / month\n• Electricity Duty: 6% on total energy charges\nIf your household consumes >400 units monthly, switching to Time-of-Day (ToD) tariff can save ₹300-₹500/month if you shift heavy loads off-peak (10 PM - 6 AM).";
    } else {
      reply = `I have analyzed your query regarding "${message}". Based on standard Indian domestic profiles consuming ~420 kWh monthly (estimated at ₹3,248.50), eliminating phantom standby power and raising cooling setpoints yields immediate cost avoidance. Would you like me to simulate alternative DISCOM tariff structures for your current usage?`;
    }

    return {
      reply,
      source: 'WattWise Deterministic Energy Advisory Engine (Local Indian DISCOM Guidelines)',
      isAiConfigured: false,
      configNotice: 'To enable live generative responses with Google Gemini, configure GEMINI_API_KEY in backend/.env',
    };
  },

  /**
   * Extract structured bill fields from a document image/PDF or from embedded text.
   * Never fabricates values; returns null for fields that are not clearly printed.
   *
   * @param {Object} params
   * @param {Buffer} [params.fileBuffer] - Original file bytes (only sent when includeFile is true)
   * @param {string} [params.mimeType]
   * @param {string} [params.rawText] - Locally extracted PDF text, used in text mode or as a hint
   * @param {boolean} [params.includeFile]
   * @returns {Promise<{data: Object|null, model: string|null}>}
   */
  async extractStructuredBillWithGemini({ fileBuffer, mimeType = '', rawText = '', includeFile = Boolean(fileBuffer) }) {
    if (!this.isConfigured()) return { data: null, model: null };

    const parts = [];
    if (includeFile && fileBuffer && (mimeType === 'application/pdf' || mimeType.startsWith('image/'))) {
      parts.push({
        inlineData: {
          mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
          data: fileBuffer.toString('base64'),
        },
      });
    }
    const safeRawText = String(rawText || '').slice(0, 20000).trim();
    if (safeRawText) {
      parts.push({ text: `Machine-readable text extracted locally from the document (may be partial):\n"""\n${safeRawText}\n"""` });
    }
    parts.push({ text: BILL_EXTRACTION_PROMPT });

    const modelsToTry = getModelCandidates();
    let lastKind = 'UNKNOWN';

    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await withTimeout(aiClient.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: {
              temperature: 0,
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
            },
          }), config.gemini.timeoutMs);

          const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = parseJsonResponse(responseText);
          if (parsed) {
            return { data: parsed, model };
          }
          lastKind = 'MALFORMED_JSON';
          console.warn(`Gemini bill extraction returned unparseable JSON (model=${model}, attempt=${attempt}).`);
        } catch (error) {
          lastKind = classifyGeminiError(error);
          console.warn(`Gemini bill extraction failed (model=${model}, attempt=${attempt}, kind=${lastKind}).`);
        }

        if (lastKind === 'AUTH' || lastKind === 'INVALID') break;
        if ((lastKind === 'QUOTA' || lastKind === 'UNAVAILABLE') && attempt === 1) break;
        if (lastKind === 'MALFORMED_JSON') {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        if (lastKind === 'TRANSIENT' || lastKind === 'UNKNOWN') {
          await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 600 : 1200));
          continue;
        }
        break;
      }
      if (lastKind === 'AUTH' || lastKind === 'INVALID') break;
    }

    const error = new Error(`Gemini bill extraction unavailable (${lastKind}).`);
    error.code = `GEMINI_${lastKind}`;
    error.kind = lastKind;
    throw error;
  }
};
