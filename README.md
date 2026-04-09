# Video Translator

<p align="center">
  <img src="icons/icon512.png" alt="Video Translator Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Real-time video translation Chrome extension — no microphone needed</strong><br>
  <sub>Captures tab audio directly and translates to 12+ languages</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome&logoColor=white" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-blue?logo=chromewebstore&logoColor=white" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Languages-AR%20%7C%20EN-orange" alt="Bilingual">
  <img src="https://img.shields.io/badge/Version-3.2.0-teal" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License">
</p>

---

## Overview

**Video Translator** is a Chrome extension that captures audio playing in any browser tab and translates it in real-time. It uses `HTMLMediaElement.captureStream()` to capture audio directly from video elements — **no microphone required**.

### Features

- **Direct Audio Capture** — Captures tab audio from any video/audio element (YouTube, TikTok, etc.)
- **12+ Languages** — Chinese, English, Japanese, Korean, French, Spanish, Russian, Turkish, German, Portuguese, Hindi, Arabic
- **Bilingual Interface** — Full Arabic & English UI with RTL/LTR support
- **Draggable Overlay** — Translation overlay can be moved anywhere on the screen
- **Translation History** — Keeps a log of recent translations
- **100% Free APIs** — Uses Google Speech API and MyMemory for free
- **No Microphone** — Captures internal tab audio only
- **Developer: [binnoma](https://github.com/binnoma)**

---

## Demo

### Popup (Arabic)
```
┌──────────────────────────┐
│ 🌐 Video Translator     │
│    مترجم الفيديو    [ع|En]│
├──────────────────────────┤
│ 🟢 متصل بالخادم          │
├──────────────────────────┤
│ 🎤 Source    →  Target   │
│ [🇨🇳 Chinese]  [🇸🇦 Arabic]│
├──────────────────────────┤
│     ▶ بدء الالتقاط        │
├──────────────────────────┤
│ ████████████████████ 🎵   │
│ جاري الالتقاط...         │
├──────────────────────────┤
│ Developed by binnoma ✓    │
└──────────────────────────┘
```

### Draggable Translation Overlay
```
┌─── ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│ ✕  ⋮⋮⋮ (drag handle)  │
│ ● مباشر               │
│ Hello world            │
│ ─────────────         │
│ مرحبا بالعالم          │
└─── ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

---

## Project Structure

```
video-translator/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Service worker: message relay + API calls
├── icons/                     # Extension icons (16, 48, 128, 256, 512)
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── icon256.png
│   └── icon512.png
├── popup/                     # Extension popup UI
│   ├── popup.html             # Popup markup (bilingual)
│   ├── popup.css              # Popup styles (RTL/LTR support)
│   └── popup.js               # Popup logic + i18n engine
├── content/                   # Injected into web pages
│   ├── content.js             # Audio capture + draggable overlay
│   └── content.css            # Overlay styles
├── server/                    # Standalone backend server
│   ├── server.js              # Node.js server (STT + Translation APIs)
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## Installation

### Prerequisites
- **Google Chrome** (v116+)
- **Node.js** (v14+) — for the backend server

### Step 1: Load the Extension

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `video-translator` folder (the one containing `manifest.json`)

### Step 2: Start the Backend Server

```bash
cd server/
npm install
node server.js
```

The server runs on `http://localhost:3000` and provides:
- `POST /api/transcribe` — Audio → Text (Google Speech API)
- `POST /api/translate` — Text translation (MyMemory API)
- `GET /api/health` — Server health check

### Step 3: Use the Extension

1. Open any video page (YouTube, TikTok, etc.)
2. Click the **Video Translator** extension icon
3. Select **Source language** and **Target language**
4. Click **Start Capture**
5. The draggable translation overlay appears on the video
6. Translations appear in real-time!

---

## How It Works

### Architecture

```
┌─────────────┐     captureStream()     ┌──────────────┐
│   Video      │ ─────────────────────► │ Content      │
│   Element    │    (tab audio)          │ Script       │
│   <video>    │                        │ (audio       │
└─────────────┘                        │  capture +   │
                                       │  WAV encode) │
┌─────────────┐     chrome.runtime      │              │
│   Popup      │ ◄────────────────────► │              │
│   (UI +      │     sendMessage()       └──────┬───────┘
│    i18n)     │                                │
└──────┬──────┘                         chrome.runtime
       │                                 sendMessage()
       │                                       │
       │                                 ┌──────▼───────┐
       │     chrome.runtime              │  Background   │
       │     sendMessage()              │  Service      │
       └───────────────────────────────►│  Worker       │
                                        │  (message     │
                                        │   relay +     │
                                        │   API calls)  │
                                        └──────┬───────┘
                                               │
                                        fetch() to server
                                               │
                                        ┌──────▼───────┐
                                        │   Server      │
                                        │   localhost:  │
                                        │   3000        │
                                        │               │
                                        │   Google STT  │
                                        │   MyMemory MT │
                                        └───────────────┘
```

### Audio Capture Flow

1. **Content script** finds the `<video>` element on the page
2. Calls `video.captureStream()` to get the audio MediaStream
3. Connects to Web Audio API (AudioContext + ScriptProcessor)
4. Collects audio samples in 4-second chunks
5. Encodes to WAV format (16kHz, mono, 16-bit PCM)
6. Sends base64 WAV to **Background service worker**
7. Background forwards to **Server** for STT + Translation
8. Translation result sent back to **Content script** overlay + **Popup**

### Key Technologies

| Component | Technology |
|---|---|
| Audio Capture | `HTMLMediaElement.captureStream()` |
| Audio Processing | Web Audio API, ScriptProcessor |
| Audio Encoding | WAV (PCM 16-bit, 16kHz) |
| Speech-to-Text | Google Speech API (free tier) |
| Translation | MyMemory API (free) |
| UI Framework | Vanilla JS + CSS |
| i18n | Custom bilingual engine (AR/EN) |
| Overlay | Draggable DOM element |

---

## Supported Languages

| Code | Language |
|---|---|
| `zh-CN` | Chinese / الصينية |
| `en-US` | English |
| `ja-JP` | Japanese / اليابانية |
| `ko-KR` | Korean / الكورية |
| `fr-FR` | French / الفرنسية |
| `es-ES` | Spanish / الإسبانية |
| `ru-RU` | Russian / الروسية |
| `tr-TR` | Turkish / التركية |
| `de-DE` | German / الألمانية |
| `pt-BR` | Portuguese / البرتغالية |
| `hi-IN` | Hindi / الهندية |
| `ar-SA` | Arabic / العربية |

---

## Permissions

This extension requires minimal permissions:

| Permission | Purpose |
|---|---|
| `activeTab` | Access the current tab for audio capture |
| `scripting` | Inject content script into video pages |
| `storage` | Save user preferences (language, settings) |

**Host permissions:**
| Permission | Purpose |
|---|---|
| `speech.googleapis.com` | Speech-to-Text API |
| `api.mymemory.translated.net` | Translation API |
| `libretranslate.de` | Backup translation API |

---

## Configuration

Settings can be changed via the popup **Settings** panel:

| Setting | Default | Description |
|---|---|---|
| Server URL | `http://localhost:3000` | Backend server address |
| Chunk Interval | `4` seconds | Audio capture interval (2-10s) |
| Source Language | `en-US` | Audio language |
| Target Language | `ar-SA` | Translation language |
| UI Language | `ar` | Interface language (ar/en) |

---

## Development

### Project Setup

```bash
git clone https://github.com/binnoma/video-translator.git
cd video-translator
```

### Development Workflow

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the **reload** icon on the Video Translator card
4. Test on a video page

### Server Development

```bash
cd server/
node server.js

# With custom port
PORT=3001 node server.js
```

---

## Troubleshooting

### "No video element found"
Make sure you have a video playing on the tab before starting capture.

### "Server not connected"
1. Ensure the server is running: `cd server && node server.js`
2. Check that it's on port 3000
3. Click **Settings → Save** to re-check connection

### "No audio tracks found"
The video might be muted or have no audio track. Try a different video.

### Capture not working on some sites
Some sites use DRM-protected content (e.g., Netflix). The extension cannot capture DRM audio.

---

## Browser Compatibility

| Browser | Support |
|---|---|
| Google Chrome | ✅ Full support (v116+) |
| Microsoft Edge | ✅ Full support (Chromium-based) |
| Brave | ⚠️ May require permission changes |
| Firefox | ❌ Not supported (different extension API) |
| Safari | ❌ Not supported |

---

## Changelog

### v3.2.0 — Current
- Bilingual interface (Arabic/English) with toggle
- Draggable translation overlay
- Improved audio capture engine
- Developer branding (binnoma)
- Custom logo

### v3.0.0
- Replaced `chrome.tabCapture` with `captureStream()`
- Removed offscreen document dependency
- English-only interface
- Standalone free API server

---

## License

This project is licensed under the **MIT License**.

---

## Developer

<p align="center">
  <strong style="color: #14b8a6;">binnoma</strong> ✓
</p>
