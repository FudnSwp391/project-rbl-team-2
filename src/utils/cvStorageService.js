import { supabase } from './supabaseClient'

const BUCKET_NAME = 'cv-bucket'

/**
 * Upload a CV file to Supabase Storage
 * Files are stored under the user's folder: {userId}/{timestamp}_{fileName}
 * @param {File} file - The file object from input
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{data: object, error: object}>}
 */
export async function uploadCV(file, userId) {
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowedTypes.includes(file.type)) {
    return { data: null, error: { message: 'Chỉ chấp nhận file PDF hoặc DOCX' } }
  }

  // Max file size: 10MB
  const MAX_SIZE = 10 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { data: null, error: { message: 'File không được vượt quá 10MB' } }
  }

  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${userId}/${timestamp}_${sanitizedName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) return { data: null, error }

  // Get the public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  return {
    data: {
      path: filePath,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    },
    error: null,
  }
}

/**
 * List all CV files for a user from Supabase Storage
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{data: Array, error: object}>}
 */
export async function listUserCVs(userId) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      limit: 50,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) return { data: null, error }

  // Enrich each file with its public URL
  const enrichedFiles = data
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((file) => {
      const filePath = `${userId}/${file.name}`
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      return {
        ...file,
        path: filePath,
        url: urlData.publicUrl,
        displayName: file.name.replace(/^\d+_/, ''), // Remove timestamp prefix
      }
    })

  return { data: enrichedFiles, error: null }
}

/**
 * Delete a CV file from Supabase Storage
 * @param {string} filePath - The full path of the file in the bucket
 * @returns {Promise<{data: object, error: object}>}
 */
export async function deleteCV(filePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  return { data, error }
}

/**
 * Get signed URL for private bucket (if bucket is not public)
 * @param {string} filePath - The full path of the file in the bucket
 * @param {number} expiresIn - Seconds until URL expires (default: 1 hour)
 * @returns {Promise<{data: object, error: object}>}
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn)

  return { data, error }
}

/**
 * Save CV metadata to the cvs table in the database
 * @param {object} cvData - CV metadata
 * @returns {Promise<{data: object, error: object}>}
 */
export async function saveCVMetadata(cvData) {
  const { data, error } = await supabase
    .from('cvs')
    .insert([{
      user_id: cvData.userId,
      file_name: cvData.fileName,
      file_url: cvData.fileUrl,
      is_default: false,
    }])
    .select()

  return { data, error }
}

/**
 * Get all CV records from the database for a user
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<{data: Array, error: object}>}
 */
export async function getUserCVRecords(userId) {
  const { data, error } = await supabase
    .from('cvs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Update CV analysis results in the database
 * @param {string} cvId - The CV record ID
 * @param {object} analysisResult - The AI analysis result
 * @param {number} score - The AI score
 * @returns {Promise<{data: object, error: object}>}
 */
export async function updateCVAnalysis(cvId, analysisResult, score) {
  const { data, error } = await supabase
    .from('cvs')
    .update({
      ai_analysis_result: analysisResult,
      ai_score: score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cvId)
    .select()

  return { data, error }
}
