/**
 * Background Service Worker - Video Translator v3.0
 * Routes messages between popup ↔ content script
 * Handles API calls to the local server for STT + Translation
 */

let isCapturing = false;
let currentTabId = null;

// ── Message Router ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ success: false, error: err.message }));
  return true; // keep channel open for async responses
});

async function handleMessage(msg, sender) {
  switch (msg.action) {
    // ── From Popup ──

    case 'startCapture': {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) return { success: false, error: 'No active tab found' };
      if (tab.url && tab.url.startsWith('chrome://'))
        return {
          success: false,
          error: 'Cannot capture browser internal pages',
        };

      currentTabId = tab.id;

      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'startCapture',
        });
        if (response && response.success) {
          isCapturing = true;
          chrome.action.setBadgeText({ text: 'LIVE' });
          chrome.action.setBadgeBackgroundColor({ color: '#14b8a6' });
        }
        return response;
      } catch (e) {
        return {
          success: false,
          error: 'Cannot connect to the page. Try refreshing the tab.',
        };
      }
    }

    case 'stopCapture': {
      isCapturing = false;
      if (currentTabId) {
        try {
          await chrome.tabs.sendMessage(currentTabId, { action: 'stopCapture' });
        } catch {}
      }
      chrome.action.setBadgeText({ text: '' });
      return { success: true };
    }

    case 'getStatus': {
      return { isCapturing, tabId: currentTabId };
    }

    case 'checkServer': {
      const settings = await chrome.storage.local.get(['serverUrl']);
      const serverUrl = settings.serverUrl || 'http://localhost:3000';
      try {
        const res = await fetch(`${serverUrl}/api/health`, {
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        return { connected: true, info: data };
      } catch {
        return { connected: false };
      }
    }

    // ── From Content Script ──

    case 'audioChunk': {
      return await processAudioChunk(msg.data);
    }

    case 'captureStarted':
      // Forward to popup
      chrome.runtime.sendMessage({ action: 'captureStarted' }).catch(() => {});
      return { success: true };

    case 'captureStopped':
      isCapturing = false;
      currentTabId = null;
      chrome.action.setBadgeText({ text: '' });
      chrome.runtime.sendMessage({ action: 'captureStopped' }).catch(() => {});
      return { success: true };

    case 'captureError':
      isCapturing = false;
      chrome.runtime.sendMessage({
        action: 'captureError',
        error: msg.error,
      }).catch(() => {});
      return { success: true };

    default:
      return { success: false, error: 'Unknown action: ' + msg.action };
  }
}

// ═══════════════════════════════════════
//  Audio Processing: STT → Translate → Display
// ═══════════════════════════════════════

async function processAudioChunk(wavBase64) {
  try {
    const settings = await chrome.storage.local.get([
      'serverUrl',
      'sourceLang',
      'targetLang',
    ]);
    const serverUrl = settings.serverUrl || 'http://localhost:3000';
    const sourceLang = settings.sourceLang || 'zh-CN';
    const targetLang = settings.targetLang || 'ar-SA';

    // 1. Send to server for Speech-to-Text
    const sttRes = await fetch(`${serverUrl}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64: wavBase64, lang: sourceLang }),
    });

    if (!sttRes.ok) {
      console.error('[VT] STT request failed:', sttRes.status);
      return { success: false };
    }

    const sttData = await sttRes.json();

    if (!sttData.success || !sttData.text || sttData.text.trim().length === 0) {
      return { success: true, empty: true };
    }

    const originalText = sttData.text.trim();

    // 2. Translate the text
    const mtRes = await fetch(`${serverUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: originalText,
        targetLang,
        sourceLang,
      }),
    });

    if (!mtRes.ok) {
      console.error('[VT] Translation request failed:', mtRes.status);
      return { success: false };
    }

    const mtData = await mtRes.json();

    if (!mtData.translatedText) {
      return { success: true, empty: true };
    }

    const translatedText = mtData.translatedText;

    // 3. Send translation to content script (for overlay)
    if (currentTabId) {
      try {
        await chrome.tabs.sendMessage(currentTabId, {
          action: 'showTranslation',
          original: originalText,
          translated: translatedText,
        });
      } catch {
        // Tab might have navigated away
      }
    }

    // 4. Also send to popup (for display + history)
    chrome.runtime
      .sendMessage({
        action: 'translationResult',
        original: originalText,
        translated: translatedText,
      })
      .catch(() => {}); // Popup might be closed

    return { success: true, original: originalText, translated: translatedText };
  } catch (err) {
    console.error('[VT] Error processing audio chunk:', err.message);
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════
//  Cleanup on tab close / extension update
// ═══════════════════════════════════════

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId) {
    isCapturing = false;
    currentTabId = null;
    chrome.action.setBadgeText({ text: '' });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  isCapturing = false;
  currentTabId = null;
  chrome.action.setBadgeText({ text: '' });
});
