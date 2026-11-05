import apiClient from './api';

export const billService = {
  /**
   * Fetch all real uploaded bills for the authenticated user from the backend
   */
  async getBills() {
    try {
      const response = await apiClient.get('/bills');
      const bills = Array.isArray(response) ? response : (response.data || []);
      return { data: bills, isDemo: false };
    } catch (err) {
      console.warn('Could not retrieve uploaded bills from backend:', err.message);
      return { data: [], isDemo: false };
    }
  },

  /**
   * Upload an electricity bill (PDF or image).
   * Details are extracted strictly from the file itself by backend OCR / Gemini Vision.
   * No dummy or simulated details are ever generated.
   */
  async uploadBill(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/bills/upload', formData, {
      timeout: 120000, // 2-minute timeout for Gemini OCR processing
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });

    // The response interceptor already unwraps response.data, so `response`
    // here is the parsed body: { success, data, message }
    return {
      success: response.success ?? true,
      data: response.data || response,
      isDemo: false
    };
  },

  /**
   * Confirm or edit extracted bill fields to verify and persist to consumption records
   */
  async confirmBill(billId, confirmedData) {
    const response = await apiClient.patch(`/bills/${billId}/confirm`, confirmedData);
    return {
      success: true,
      data: response.data || response,
      isDemo: false
    };
  },

  /**
   * Delete an uploaded bill
   */
  async deleteBill(billId) {
    await apiClient.delete(`/bills/${billId}`);
    return { success: true };
  }
};

export default billService;
