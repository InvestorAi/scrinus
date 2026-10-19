/**
 * KERYX Google Gemini AI Cloud Client
 * Connects directly to Google Gemini 2.5 Flash / 1.5 Flash API for live production ministry intelligence:
 * - Real sermon synthesis and theological summary
 * - Live dynamic sermon slide deck generation
 * - Multilingual translation across 50+ languages
 * - Natural-language copilot and tool execution
 *
 * Designed offline-first: seamlessly falls back to local deterministic engine if no API key or network is offline.
 */

import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiClient {
  static getApiKey() {
    return localStorage.getItem('keryx.gemini.apiKey') || appStore.getState().geminiApiKey || '';
  }

  static setApiKey(key) {
    const cleanKey = (key || '').trim();
    localStorage.setItem('keryx.gemini.apiKey', cleanKey);
    appStore.update({ geminiApiKey: cleanKey });
    eventBus.emit('gemini:key_changed', cleanKey);
  }

  static getModel() {
    return localStorage.getItem('keryx.gemini.model') || appStore.getState().aiModel || 'gemini-2.5-flash';
  }

  static setModel(model) {
    localStorage.setItem('keryx.gemini.model', model);
    appStore.update({ aiModel: model });
  }

  static isAvailable() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10 && navigator.onLine);
  }

  /**
   * Send a prompt to Google Gemini API
   * @param {string} prompt
   * @param {object} [options]
   * @returns {Promise<string|null>}
   */
  static async generateText(prompt, options = {}) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const model = options.model || this.getModel();
    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 2048;
    const systemInstruction = options.systemInstruction;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.warn('[KERYX Gemini API Notice]:', message);
        eventBus.emit('toast:notify', {
          type: 'warning',
          title: 'Gemini Cloud Notice',
          message: `Cloud AI error: ${message}. Using local engine.`
        });
        return null;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      return text || null;
    } catch (err) {
      console.warn('[KERYX Gemini Network Error]:', err);
      return null;
    }
  }

  /**
   * Validate an API key by making a lightweight test call
   */
  static async testConnection(keyToTest = null) {
    const key = keyToTest || this.getApiKey();
    if (!key) {
      return { ok: false, message: 'No API key provided.' };
    }

    try {
      const url = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with the single word: READY' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (response.ok) {
        return { ok: true, message: 'Connected successfully to Google Gemini Live Cloud!' };
      }

      const err = await response.json().catch(() => ({}));
      return { ok: false, message: err.error?.message || `HTTP error ${response.status}` };
    } catch (e) {
      return { ok: false, message: e.message || 'Network unreachable' };
    }
  }
}
