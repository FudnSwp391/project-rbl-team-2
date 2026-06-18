const ITERA_API_KEY = import.meta.env.VITE_ITERA_API_KEY || '';
const ITERA_BASE_URL = '/api/itera';

// Available premium ElevenLabs voices optimized for Vietnamese
export const VOICE_PRESETS = {
  MAI: 'd5HVupAWCwe4e6GvMCAL', // Nữ - Giọng Hà Nội tự nhiên, trong sáng (Khuyên dùng)
  BELLA: 'EXAVITQu4vr4xnSDxMaL', // Nữ - Giọng diễn cảm, tự nhiên
  NICOLE: 'piYmCTxgzlaK17yOCD3g', // Nữ - Giọng ấm áp, truyền cảm
  GLINDA: 'z9fAnlkFJD3rIV1v6vcl', // Nữ - Giọng rõ ràng, chuyên nghiệp
  ADAM: 'pNInz6obpgfr9F96QCwq', // Nam - Giọng trầm ấm, chuyên nghiệp
  ANTONI: 'ErXwobaYiN019PkySvjV', // Nam - Giọng thân thiện, dễ nghe
};

const DEFAULT_VOICE_ID = VOICE_PRESETS.MAI; 

/**
 * Call Itera Text-to-Speech API to convert text into speech audio
 * @param {string} text - The text to read
 * @param {string} lang - Language code ('vi', 'en', etc.)
 * @param {string} voiceId - The ElevenLabs voice ID
 * @returns {Promise<string>} - A promise resolving to the object URL of the audio blob
 */
export async function getTtsAudioUrl(text, lang = 'vi', voiceId = DEFAULT_VOICE_ID) {
  if (!text) throw new Error('Text is required for Text-to-Speech');

  const createUrl = `${ITERA_BASE_URL}/v1/text-to-speech/${voiceId}`;
  
  try {
    console.log('[IteraTtsService] Creating TTS task for text:', text.substring(0, 40) + '...');
    
    // 1. Create TTS task on Itera
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': ITERA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        // Itera API requires language_code but doesn't support 'vi'.
        // Using 'en' as accepted value — the multilingual model auto-detects
        // Vietnamese from the text content + voice (Mai) handles it natively.
        language_code: 'en',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.0,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Itera Task Creation Error: ${createResponse.status} - ${errorText || createResponse.statusText}`);
    }

    const taskData = await createResponse.json();
    const taskId = taskData.id;
    
    if (!taskId) {
      throw new Error('Itera API did not return a valid task ID');
    }

    console.log('[IteraTtsService] Task created successfully. ID:', taskId);

    // 2. Poll task status until complete (faster polling for reduced latency)
    const statusUrl = `${ITERA_BASE_URL}/v1/history/${taskId}`;
    let attempts = 0;
    const maxAttempts = 60; // 60 attempts * 200ms = 12 seconds timeout
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': ITERA_API_KEY,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(`Itera Status Polling Error: ${statusResponse.status} - ${errorText || statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      console.log(`[IteraTtsService] Polling status (Attempt ${attempts + 1}/${maxAttempts}):`, statusData.status);

      if (statusData.status === 'completed') {
        const rawAudioUrl = statusData.result?.audio_url;
        if (!rawAudioUrl) {
          throw new Error('Task completed but result.audio_url is missing');
        }

        // 3. Bypass CORS by routing audio download through Vite local proxy
        const proxiedAudioUrl = rawAudioUrl.replace('https://api.itera102.space', ITERA_BASE_URL);
        console.log('[IteraTtsService] Downloading completed audio from:', proxiedAudioUrl);

        const audioFileResponse = await fetch(proxiedAudioUrl, {
          headers: {
            'xi-api-key': ITERA_API_KEY,
          },
        });

        if (!audioFileResponse.ok) {
          throw new Error(`Failed to download audio file: ${audioFileResponse.status}`);
        }

        const audioBlob = await audioFileResponse.blob();
        console.log('[IteraTtsService] Audio blob successfully downloaded. Size:', audioBlob.size);
        return URL.createObjectURL(audioBlob);
      }

      if (statusData.status === 'failed') {
        throw new Error(`Itera TTS task failed: ${statusData.detail_error || statusData.error || 'Unknown error'}`);
      }

      // Wait 200ms before polling again (faster than 500ms for reduced latency)
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    throw new Error('Itera TTS task polling timed out after 12 seconds');
  } catch (error) {
    console.error('[IteraTtsService] Error in getTtsAudioUrl:', error);
    throw error;
  }
}
