/**
 * Centralized AI API Key Manager with Auto-Rotation
 * Manages pools of API keys for Groq and Gemini to bypass Rate Limits (429).
 */

// 1. Define pools of API Keys
const GROQ_KEYS_POOL = [
  import.meta.env.VITE_GROQ_API_KEY_1,
  import.meta.env.VITE_GROQ_API_KEY_2,
  import.meta.env.VITE_GROQ_API_KEY_3,
  import.meta.env.VITE_GROQ_API_KEY_4,
  import.meta.env.VITE_GROQ_API_KEY_5,
  import.meta.env.VITE_GROQ_API_KEY, // Default fallback
].map(k => (k || '').trim()).filter((key) => key.length > 10);

const GEMINI_KEYS_POOL = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
  import.meta.env.VITE_GEMINI_API_KEY, // Default fallback
].map(k => (k || '').trim()).filter((key) => key.length > 10);

const OPENROUTER_KEYS_POOL = [
  import.meta.env.VITE_OPENROUTER_API_KEY,
].map(k => (k || '').trim()).filter((key) => key.length > 10);

// Remove duplicate keys to keep pools clean
const GROQ_KEYS = [...new Set(GROQ_KEYS_POOL)];
const GEMINI_KEYS = [...new Set(GEMINI_KEYS_POOL)];
const OPENROUTER_KEYS = [...new Set(OPENROUTER_KEYS_POOL)];

// Indexes to track current active key
let currentGroqIndex = 0;
let currentGeminiIndex = 0;
let currentOpenRouterIndex = 0;

console.log("[AI Key Manager] Initialized with:", {
  groqKeysCount: GROQ_KEYS.length,
  geminiKeysCount: GEMINI_KEYS.length,
  openRouterKeysCount: OPENROUTER_KEYS.length
});

/**
 * Get currently active Groq API Key
 * @returns {string} API Key
 */
export function getGroqApiKey() {
  if (GROQ_KEYS.length === 0) return '';
  return GROQ_KEYS[currentGroqIndex];
}

/**
 * Rotate to the next Groq API Key in the pool
 * @returns {string} The new API Key
 */
export function rotateGroqKey() {
  if (GROQ_KEYS.length <= 1) {
    console.warn("[AI Key Manager] Only 1 Groq key available. Rotation skipped.");
    return getGroqApiKey();
  }
  const oldIndex = currentGroqIndex;
  currentGroqIndex = (currentGroqIndex + 1) % GROQ_KEYS.length;
  console.log(`[AI Key Manager] 🔄 Rotated Groq Key from index ${oldIndex} to ${currentGroqIndex} due to error/rate limit.`);
  return getGroqApiKey();
}

/**
 * Get currently active Gemini API Key
 * @returns {string} API Key
 */
export function getGeminiApiKey() {
  if (GEMINI_KEYS.length === 0) return '';
  return GEMINI_KEYS[currentGeminiIndex];
}

/**
 * Rotate to the next Gemini API Key in the pool
 * @returns {string} The new API Key
 */
export function rotateGeminiKey() {
  if (GEMINI_KEYS.length <= 1) {
    console.warn("[AI Key Manager] Only 1 Gemini key available. Rotation skipped.");
    return getGeminiApiKey();
  }
  const oldIndex = currentGeminiIndex;
  currentGeminiIndex = (currentGeminiIndex + 1) % GEMINI_KEYS.length;
  console.log(`[AI Key Manager] 🔄 Rotated Gemini Key from index ${oldIndex} to ${currentGeminiIndex} due to error/rate limit.`);
  return getGeminiApiKey();
}

/**
 * Get currently active OpenRouter API Key
 * @returns {string} API Key
 */
export function getOpenRouterApiKey() {
  if (OPENROUTER_KEYS.length === 0) return '';
  return OPENROUTER_KEYS[currentOpenRouterIndex];
}

/**
 * Rotate to the next OpenRouter API Key in the pool
 * @returns {string} The new API Key
 */
export function rotateOpenRouterKey() {
  if (OPENROUTER_KEYS.length <= 1) {
    console.warn("[AI Key Manager] Only 1 OpenRouter key available. Rotation skipped.");
    return getOpenRouterApiKey();
  }
  const oldIndex = currentOpenRouterIndex;
  currentOpenRouterIndex = (currentOpenRouterIndex + 1) % OPENROUTER_KEYS.length;
  console.log(`[AI Key Manager] 🔄 Rotated OpenRouter Key from index ${oldIndex} to ${currentOpenRouterIndex} due to error/rate limit.`);
  return getOpenRouterApiKey();
}

/**
 * Get state details for debugging
 */
export function getKeyManagerState() {
  return {
    groq: {
      total: GROQ_KEYS.length,
      currentIndex: currentGroqIndex,
      activeKeyMasked: maskKey(getGroqApiKey())
    },
    gemini: {
      total: GEMINI_KEYS.length,
      currentIndex: currentGeminiIndex,
      activeKeyMasked: maskKey(getGeminiApiKey())
    },
    openRouter: {
      total: OPENROUTER_KEYS.length,
      currentIndex: currentOpenRouterIndex,
      activeKeyMasked: maskKey(getOpenRouterApiKey())
    }
  };
}

function maskKey(key) {
  if (!key) return 'none';
  if (key.length <= 12) return '***';
  return `${key.substring(0, 6)}...${key.substring(key.length - 6)}`;
}
