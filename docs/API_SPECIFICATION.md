# WattWise AI — REST API Specification

**Base URL:** `http://localhost:5000/api/v1`  
**Authentication:** Header `Authorization: Bearer <Supabase_JWT>`  
**Format:** JSON  

---

## 1. System & Health

### `GET /health`
Returns backend health telemetry.
```json
{
  "status": "healthy",
  "uptimeSeconds": 120,
  "service": "WattWise AI Node.js Express 5 Backend",
  "version": "1.0.0",
  "environment": "development",
  "supabaseConfigured": true
}
```

---

## 2. Authentication & Profile

### `GET /auth/me`
Returns the verified authenticated user and their authorized role.
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-or-id",
    "email": "sarah.jenkins@wattwise.ai",
    "fullName": "Sarah Jenkins",
    "role": "CONSUMER",
    "organizationId": null,
    "isDemo": false
  },
  "role": "CONSUMER"
}
```

---

## 3. Analytics (Consumer)

### `GET /analytics/consumer/overview`
Fetches current billing period summary, monthly usage, appliance breakdown, and recommendations.

### `GET /analytics/consumption?timeframe=monthly`
Fetches historical consumption records for charting.

### `GET /analytics/carbon`
Fetches carbon output (kg CO₂e), CEA grid emission factor, and ecological offsets.

---

## 4. Electricity Bills

### `GET /bills`
Lists all uploaded electricity bills for the authenticated user.

### `POST /bills/upload`
Uploads a new bill (PDF, PNG, JPG up to 15 MB) to private Supabase Storage and records metadata.
- **Content-Type:** `multipart/form-data`
- **Body:** `file: <binary>`

### `DELETE /bills/:id`
Deletes a bill record and removes the file from private storage.

---

## 5. Demand Forecasting

### `GET /forecast/demand?horizon=30`
Returns 30-day ahead load curve modeling, confidence bounds, and seasonal influencing factors.

---

## 6. Tariffs & Simulation

### `GET /tariffs/categories`
Returns supported Indian DISCOM tariff categories (Flat, ToD, Commercial, HT Industrial, KUSUM).

### `POST /tariffs/simulate`
Deterministically simulates monthly bill costs under specified or compared tariff slabs.
```json
{
  "consumptionKWh": 420.5,
  "tariffId": "residential-standard",
  "peakUsagePercent": 25,
  "comparisonTariffId": "residential-tou"
}
```

---

## 7. AI Energy Advisor

### `POST /ai/chat`
Conversational advisory endpoint powered by Google Gemini API integration architecture.
```json
{
  "message": "How can I reduce my household electricity bill by 15%?",
  "context": {}
}
```

---

## 8. Industrial Portal

- `GET /industrial/overview`
- `GET /industrial/facilities`
- `POST /industrial/facilities`
- `GET /industrial/machines`
- `POST /industrial/machines`
- `GET /industrial/anomalies`
- `GET /industrial/optimization`
- `POST /industrial/reports/generate`

---

## 9. Government Portal

- `GET /government/overview`
- `GET /government/regional?filter=ALL`
- `GET /government/sectors`
- `GET /government/tariffs`
- `POST /government/tariffs`
- `POST /government/policy-simulator`
- `POST /government/reports`

