import apiClient from './api';

export const aiService = {
  /**
   * Send question to backend AI Energy Advisor (Spring Boot / Gemini integration)
   */
  async askAdvisor(message, context = {}) {
    try {
      const response = await apiClient.post('/ai/chat', {
        message,
        context
      });
      return {
        reply: response.reply || response.data?.reply || response.message,
        source: response.source || 'WattWise Energy Advisor',
        isDemo: response.isDemo ?? false,
        configNotice: response.configNotice || null,
      };
    } catch (err) {
      // Simulate intelligent conversational energy advisor
      await new Promise(r => setTimeout(r, 900));

      const q = message.toLowerCase();
      let reply = '';

      if (q.includes('increasing') || q.includes('higher') || q.includes('spike')) {
        reply = "Looking at your last 3 billing cycles, your usage increased primarily during July and August (reaching 610 kWh) due to continuous air conditioning draw. In October, your usage dropped by 11.6% to 420.5 kWh, saving approximately ₹531.50. If your bill seems high, check if your state DISCOM added FPPCA (Fuel Surcharge Adjustment) or seasonal summer slab tariffs.";
      } else if (q.includes('reduce') || q.includes('save') || q.includes('cut')) {
        reply = "Top 3 actions to reduce your household electricity bill by ~15-20%:\n1. Adjust AC temperature: Running your split AC at 24°C instead of 18°C lowers compressor power draw by 18-24%.\n2. Geyser usage: Limit water heating to 15-20 minutes and insulate hot water plumbing lines.\n3. Shift heavy appliance cycles: If under a Time-of-Day (ToD) tariff, operate washing machines after 9:00 PM.";
      } else if (q.includes('appliance') || q.includes('consuming') || q.includes('drawing')) {
        reply = "Based on domestic load modeling:\n• Split Air Conditioners account for ~44% of your total monthly units (185 kWh).\n• Storage Geyser draws ~18% (75.7 kWh).\n• Frost-Free Refrigerator draws ~14% (58.9 kWh).\n• Lighting & Fans account for ~12% (50.5 kWh).\nSwitching old non-star rated ceiling fans to BLDC 28W models can save ~₹1,200 annually.";
      } else if (q.includes('much') || q.includes('estimate') || q.includes('potential')) {
        reply = "By enacting the recommended AC 24°C setting, geyser management, and eliminating entertainment standby draw, you are projected to save between ₹750 and ₹1,150 per month—translating to roughly ₹9,000 to ₹13,800 in annual electricity cost avoidance.";
      } else if (q.includes('month') || q.includes('change') || q.includes('action')) {
        reply = "For this upcoming billing period:\n1. Service your AC air filters to improve cooling airflow and motor efficiency by 7-10%.\n2. Check your utility meter reading against your latest electricity bill to prevent provisional estimation anomalies.\n3. Turn off inverter microwave and television wall switches when idle.";
      } else {
        reply = `I've analyzed your energy profile regarding "${message}". Based on your recent consumption of 420.5 kWh (estimated at ₹3,248.50), optimizing continuous base load and shifting heavy cycles offers the highest cost reduction. Would you like me to simulate alternative DISCOM tariff structures for your current usage?`;
      }

      return {
        reply,
        isDemo: true,
        source: 'WattWise Local AI Advisory Simulator (India)'
      };
    }
  }
};
