import { getGroqApiKey, rotateGroqKey } from './aiKeyManager';

/**
 * Gets TTS audio URL from Groq API
 * Includes automatic API key rotation on 429 Rate Limit errors.
 * 
 * @param {string} text Text to synthesize
 * @param {string} lang Language code (e.g., 'vi', 'en')
 * @param {number} retryCount Internal counter for retries
 * @returns {Promise<string>} Blob URL for the audio stream
 */
export async function getGroqTtsAudioUrl(text, lang = 'vi', retryCount = 0) {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error('No Groq API key available in Key Manager');
  }

  // Groq's OpenAI-compatible speech endpoint
  const url = 'https://api.groq.com/openai/v1/audio/speech';
  
  // You can adjust the model and voice parameters based on Groq's latest documentation
  const payload = {
    model: 'canopylabs/orpheus-v1-english', // Updated from decommissioned playai-tts
    input: text,
    voice: 'diana', // Valid voices: autumn, diana, hannah, austin, daniel, troy
    response_format: 'mp3',
  };

  let response;
  try {
    console.log(`[Groq TTS] Requesting audio... (Attempt ${retryCount + 1})`);
    
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error('[Groq TTS] Network error:', networkError);
    if (retryCount < 2) {
      console.warn('[Groq TTS] Retrying due to network error...');
      rotateGroqKey();
      await new Promise(resolve => setTimeout(resolve, 500));
      return getGroqTtsAudioUrl(text, lang, retryCount + 1);
    }
    throw networkError;
  }

  if (response.status === 429) {
    if (retryCount < 3) {
      console.warn('[Groq TTS] Rate limit (429) hit. Rotating key and retrying...');
      rotateGroqKey(); // 🔄 API KEY ROTATION MAGIC HAPPENS HERE
      // Wait a short delay before retry to avoid spamming
      await new Promise(resolve => setTimeout(resolve, 500));
      return getGroqTtsAudioUrl(text, lang, retryCount + 1);
    } else {
      throw new Error('Groq TTS rate limit exceeded even after rotating all keys.');
    }
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Groq TTS] API Error:', errorData);
    
    // If it's an authorization error (401), the current key might be invalid, so we rotate
    if (response.status === 401 && retryCount < 2) {
      console.warn('[Groq TTS] Invalid API Key (401). Rotating key...');
      rotateGroqKey();
      return getGroqTtsAudioUrl(text, lang, retryCount + 1);
    }
    
    // For 400 errors (like model decommissioned or unsupported language), throw immediately without retrying
    throw new Error(`Groq TTS API Error: ${response.status} - ${errorData}`);
  }

  try {
    // Convert the audio stream to a blob URL
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (blobError) {
    throw new Error(`Groq TTS Failed to parse audio blob: ${blobError.message}`);
  }
}
