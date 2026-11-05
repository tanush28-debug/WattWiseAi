import { supabase } from '../config/supabase.js';

const BUCKET_NAME = 'electricity-bills';

export const storageService = {
  /**
   * Upload an electricity bill document to the private Supabase Storage bucket.
   * Path convention: consumer/{userId}/{timestamp}_{filename}
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.fileName
   * @param {Buffer} params.fileBuffer
   * @param {string} params.mimeType
   * @param {string} [params.orgId]
   */
  async uploadBillDocument({ userId, fileName, fileBuffer, mimeType, orgId = null, scopedClient = null }) {
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Determine path based on role / organization
    const storagePath = orgId
      ? `industrial/${orgId}/${timestamp}_${cleanFileName}`
      : `consumer/${userId}/${timestamp}_${cleanFileName}`;

    const client = scopedClient || supabase;
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.warn('Supabase storage upload error:', error.message);
      // If the bucket doesn't exist yet in Supabase, return a structured path
      return {
        storagePath,
        bucket: BUCKET_NAME,
        isSimulated: true,
        error: error.message,
      };
    }

    return {
      storagePath: data.path,
      bucket: BUCKET_NAME,
      isSimulated: false,
    };
  },

  /**
   * Generate a temporary signed download URL for private bill documents.
   * (Expires in 60 minutes)
   * @param {string} storagePath 
   */
  async getSignedBillUrl(storagePath) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 3600);

    if (error) {
      return null;
    }
    return data.signedUrl;
  },

  /**
   * Delete a bill document from private storage
   * @param {string} storagePath 
   */
  async deleteBillDocument(storagePath) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn('Error deleting document from storage:', error.message);
      return false;
    }
    return true;
  }
};

