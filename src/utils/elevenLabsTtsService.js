const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE_URL = '/api/elevenlabs';

// Default voice "Bella" - Giọng nữ hỗ trợ gói miễn phí (Free Plan)
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

/**
 * Call ElevenLabs Text-to-Speech streaming API
 * Returns audio as a blob URL — no polling needed (direct streaming response)
 * @param {string} text - Text to synthesize
 * @param {string} lang - Language code (unused, model is multilingual)
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<string>} - Object URL of the audio blob
 */
export async function getElevenLabsTtsUrl(text, lang = 'vi', voiceId = DEFAULT_VOICE_ID) {
  if (!text) throw new Error('Text is required for Text-to-Speech');
  if (!ELEVENLABS_API_KEY) throw new Error('ElevenLabs API key is not configured');

  const url = `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}/stream`;

  console.log('[ElevenLabsTTS] Requesting streaming audio for:', text.substring(0, 50) + '...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error: ${response.status} - ${errorText}`);
  }

  const audioBlob = await response.blob();
  console.log('[ElevenLabsTTS] Audio received. Size:', audioBlob.size, 'bytes');
  return URL.createObjectURL(audioBlob);
}
