# Contributing to Video Translator

First off, thank you for considering contributing to Video Translator! It's people like you that make this project better.

## Getting Started

### Prerequisites

- Google Chrome (v116+)
- Node.js (v14+) — for the backend server
- Git

### Setup

1. Fork the repository
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/video-translator.git
   cd video-translator
   ```
3. Start the backend server:
   ```bash
   cd server/
   npm install
   node server.js
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked**
   - Select the `video-translator` folder

## How to Contribute

### Reporting Bugs

Please open a [GitHub Issue](../../issues/new) with:
- A clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser version and OS
- Screenshots if applicable

### Suggesting Features

Open a [GitHub Issue](../../issues/new) with:
- A clear description of the feature
- Why it would be useful
- Any implementation ideas

### Submitting Changes

1. Create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Test thoroughly on video pages (YouTube, TikTok, etc.)
4. Commit with clear messages:
   ```bash
   git commit -m "feat: add description of your change"
   ```
5. Push and create a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style (formatting, etc.)
- `refactor:` Code refactoring
- `i18n:` Translation / localization changes

## Code Style

- Use English for all code, comments, and commit messages
- Keep functions small and focused
- Add JSDoc comments for public functions
- Test on both LTR (English) and RTL (Arabic) layouts

## Project Structure

```
video-translator/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker
├── content/               # Content scripts (audio capture + overlay)
├── popup/                 # Extension popup UI (bilingual AR/EN)
├── server/                # Backend server (Node.js)
├── icons/                 # Extension icons
└── .github/               # GitHub configuration
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
