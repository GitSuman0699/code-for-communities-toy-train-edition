# 🛤️ Gangman's Logbook — DHR Track Inspector (Mobile-First PWA)

An offline-first, mobile-first Progressive Web App built for **Darjeeling Himalayan Railway (DHR) permanent-way track gangs** to inspect, classify, and log railway hazards along the 88 km mountain alignment.

> **Code for Communities — Darjeeling Himalayan Railway Edition · GDG Siliguri**  
> **Track C · Problem Statement C1** (Solo Participant Project)

---

## 📱 Mobile-First UI & Field Ergonomics

Designed specifically for field workers walking the tracks in rugged mountain weather on affordable Android smartphones:

- **Touch Target Ergonomics**: All interactive elements (buttons, inputs, toggles, pills) meet or exceed the **48px × 48px** touch target standard, making them easy to operate with cold hands or gloves.
- **2×2 Severity Grid**: Severity levels (`Low`, `Medium`, `High`, `Critical`) are arranged in a tactile 2×2 grid with high-visibility status indicators.
- **2-Column Hazard Grid**: Large hazard cards (96px min-height, 2rem icons) for easy single-thumb selection.
- **Safe Area Inset Support**: Full compatibility with phone notches, camera cutouts, and gesture bars using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **No-Zoom Form Inputs**: All text inputs and dropdown selects use a base 16px typography to eliminate disruptive auto-zoom on mobile Safari and Android Chrome.
- **☀️ Outdoor Sunlight Mode**: Dedicated high-contrast daylight theme providing instant readability under harsh Himalayan mountain glare and monsoon overcast.
- **🎙️ Voice-to-Text Input**: Quick speech-to-text microphone with regional language recognition (English, Nepali, Hindi, Bengali) for hands-free field reporting.

---

## 🌐 Belonging & Localization (English, नेपाली, हिन्दी, বাংলা)

Track gangs in the Darjeeling hills come from diverse linguistic backgrounds. The app provides instant single-tap switching between 4 languages across all UI labels, hazard classifications, severity warnings, and AI generated notes:

- **English (EN)** — Standard railway engineering terminology
- **Nepali (नेपाली)** — Primary lingua franca of Darjeeling & Kurseong trackmen
- **Hindi (हिन्दी)** — Northeast Frontier Railway administrative standard
- **Bengali (বাংলা)** — Regional North Bengal language

---

## 🚂 DHR Alignment & GPS Auto-Population

The app models the complete **88 km NJP → Darjeeling** narrow-gauge alignment across 13 consecutive sections:

1. **Auto-Populate Track Section**: Acquiring GPS automatically projects current coordinates onto the DHR rail alignment, calculates the nearest section, and auto-selects the dropdown.
2. **Auto-Populate KM Marker**: Calculates the approximate railway kilometer marker (KM 0 to 88).
3. **Quick DHR Presets**: One-tap station presets (`Batasia Loop`, `Ghum`, `Kurseong`, `Pagla Jhora`, `Tindharia`, `Sukna`) for fast inspection logging or indoor field simulations.

---

## 🤖 On-Device AI Architecture

- **Primary**: Chrome Prompt API (`window.ai.languageModel` / Gemini Nano) for on-device natural language classification and multilingual summary note synthesis.
- **Computer Vision Heuristics**: Built-in canvas image analysis inspecting brightness, contrast, and color balance to suggest hazard types (landslides, flooded drains, track obstructions) directly on-device.
- **Multilingual Fallback**: Rule-based keyword matching and grammar templates ensure 100% reliability in Nepali, Hindi, Bengali, and English even without experimental flags or internet connectivity.

---

## 📶 100% Offline PWA (Airplane Mode Ready)

- **Service Worker (`v6`)**: Network-first strategy with instant local cache fallback. Once loaded, the app functions fully in complete airplane mode.
- **IndexedDB**: Persistent local storage for reports, photos, timestamps, coordinates, and sync state.
- **Background Sync**: Automatic queue-and-retry mechanism that syncs pending reports the moment cellular connectivity is restored.

---

## 🚀 Running & Testing on Mobile Locally

### 1. Local Dev Server
```bash
python -m http.server 3000
```

### 2. Instant HTTPS Mobile Tunnel (Camera & Geolocation require HTTPS)
```bash
npx -y localtunnel --port 3000
```
Open the generated HTTPS URL on your mobile phone and enter your public IP when prompted.

---

## 📜 License

Built for **Code for Communities — GDG Siliguri (Darjeeling Himalayan Railway Edition)**.
