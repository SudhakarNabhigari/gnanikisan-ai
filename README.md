# GnaniKisan AI — AI-Powered Farming Assistant

GnaniKisan AI is a full-stack multilingual web application built with React, Tailwind CSS, TypeScript, and Express. It supports Telugu, English, and Hindi farming guidance across six core pages: **Dashboard**, **Voice Assistant**, **Crop Doctor AI**, **Profile**, **History**, and **Settings** (plus a dedicated **Logout** action at the bottom of the sidebar).

## Architecture Overview

- **Frontend (`src/`)**: React 19 + TypeScript + Tailwind CSS v4 SPA with persistent forest-green sidebar, light/dark/system theming, Telugu/English/Hindi translations, Web Audio API waveform recording, and echo-safe TTS playback.
- **Backend (`server.ts` & `server/`)**: Express server serving Vite in development and static assets in production, with scrypt password hashing, HMAC-signed HttpOnly session cookies (`gk_session`), per-user isolated persistence (`.data/gnanikisan-db.json`), and secure server-side API proxies.
- **No Frontend Secrets**: All AI, speech, mandi, and OTP API keys stay strictly on the server via environment variables.

## Live vs. Demo Integrations

| Service | Provider / Endpoint | Status Without Extra Keys | Env Variables |
| :--- | :--- | :--- | :--- |
| **Reasoning & Crop Vision** | `@google/genai` (`gemini-4-hydrogen`) | Requires key | `GEMINI_API_KEY` |
| **Speech-to-Text (STT)** | Gnani Vachana Prisma (`POST /stt/v3`) | Falls back to Gemini STT (`gemini-3.5-transcribe`) or typed input | `GNANI_API_KEY`, `GNANI_API_BASE_URL` |
| **Text-to-Speech (TTS)** | Gnani Vachana Timbre (`POST /api/v1/tts/inference`) | Falls back to Gemini TTS (`gemini-3.8-flash-lite-tts`) or browser SpeechSynthesis | `GNANI_API_KEY`, `GNANI_API_BASE_URL` |
| **Live Weather** | Open-Meteo Forecast API | **Live** (no API key needed) | — |
| **Geocoding** | OpenStreetMap Nominatim | **Live** (no API key needed) | — |
| **Mandi Prices** | data.gov.in AGMARKNET | Clearly labelled **Demo Reference** until configured | `DATA_GOV_API_KEY` |
| **Government Schemes** | Curated official `.gov.in` registry | **Live** official links + profile criteria matching | — |
| **Mobile SMS OTP** | Twilio Verify | Shows **"Verification service not configured"** (no fake OTPs) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` |
| **Email OTP** | Resend API | Shows **"Verification service not configured"** (no fake OTPs) | `RESEND_API_KEY`, `OTP_FROM_EMAIL` |
| **Crop Protection Catalog** | Curated ICAR / CIBRC reference list | Safe IPM-first references; zero invented dosages or prices | — |

## Setup & Commands

1. Copy `.env.example` to `.env` (or configure secrets in your hosting environment) and set `GEMINI_API_KEY`, `SESSION_SECRET`, and optional `GNANI_API_KEY`, `DATA_GOV_API_KEY`, Twilio, and Resend credentials.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server (port 3000):
   ```bash
   npm run dev
   ```
4. Type-check and build for production:
   ```bash
   npm run lint
   npm run build
   npm run start
   ```

   🎯 Our Vision
To make AI-powered agricultural assistance more accessible to Indian farmers, especially those who prefer communicating in their regional languages.

🔗 Live Application:
https://lnkd.in/gU9xZ4u8
💻 GitHub Repository:
https://lnkd.in/grcvgP8S
🎥 Project Demo:
https://lnkd.in/gqRcj8GK
