# Vox Gym 🎙️💪 • Voice-First Workout Tracker

A mobile web application designed to simplify gym workout logging through hands-free, real-time voice input. Built for mobile browser viewports (iOS Safari & Android Chrome) and ready for zero-build deployment on **GitHub Pages**.

---

## 📱 Live Highlights & Core Specifications

### 1. Viewport & Touch Ergonomics
- **Dynamic Viewport Height (`100dvh`):** Enforces strict `100dvh` layout rules with safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`) to eliminate screen jumping when mobile browser address bars collapse or expand.
- **Touch Target Accessibility:** All interactive elements (Push-to-Talk button, media controls, steppers, toggle pills) strictly adhere to $\ge 48 \times 48\text{px}$ touch targets.

### 2. Speech Recognition & Intent Parser (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Push-to-Talk (PTT):** Supports both **Tap-to-Listen** and **Hold-to-Speak** gestures with soundwave ripple animations.
- **Natural Language Command Engine:**
  - **Standard Sets:** *"Bench press 225 pounds for 8 reps"* $\rightarrow$ `{ exercise: "Barbell Bench Press", weight: 225, reps: 8 }`
  - **Relative Sets:** *"Same as last set"* (duplicates previous weight & reps), *"Add 5 pounds for 10 reps"*, *"Minus 10 lbs 8 reps"*.
  - **Drop Sets:** *"Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure"* $\rightarrow$ creates linked sub-set drops.
  - **Bodyweight Sets:** *"Dips 15 reps with 25 pounds"*, *"Pull ups 10 reps bodyweight"*.
  - **Timed/Distance:** *"Plank for 60 seconds"*, *"Treadmill 1 mile in 8 mins"*.
  - **Automatic Unit Conversion:** Auto-converts spoken units (e.g. speaking *"100 kg"* when preference is `lbs` auto-converts to `220.5 lbs`).
  - **Missing Parameter Fallback Drawer:** If a command lacks required parameters (e.g., *"Squats 225 pounds"* missing reps), a bottom drawer slides up asking *"How many reps for Squats at 225 lbs?"* with quick-select pills.

### 3. Fuzzy Matching & Alias Normalization (Levenshtein + Token Similarity)
- Normalizes gym shorthand to official exercises:
  - `DB Fly` $\rightarrow$ `Dumbbell Fly`
  - `Incline DB` $\rightarrow$ `Incline Dumbbell Press`
  - `RDL` $\rightarrow$ `Romanian Deadlift`
  - `OHP` $\rightarrow$ `Overhead Press`
  - `Squats` $\rightarrow$ `Barbell Back Squat`
  - `Bench` $\rightarrow$ `Barbell Bench Press`
  - `Curls` $\rightarrow$ `Bicep Curls`
- **Ambiguity Drawer:** If confidence is $< 80\%$ or top matches are close, slides up a bottom drawer card showing the top 3 best matching exercises for single-tap disambiguation.

### 4. 4-Second "Color Crawl" Confirmation Modal
- **Visual Progress Crawl:** Animated horizontal bar smoothly fills across the bottom of the modal over 4.0 seconds using `requestAnimationFrame`.
- **No Manual Touch:** At 4.0s (100%), displays **"CONFIRMED"** status state, triggers `navigator.vibrate([50])` haptic burst, plays audio confirmation chime, closes modal, and commits set.
- **Touch Interruption:** Touching any `[ - ]` / `[ + ]` stepper instantly pauses the timer indefinitely and presents explicit **"Confirm Set"** and **"Discard"** buttons.

### 5. Immediate Comparative Feedback Card
- Real-time stats for the active exercise:
  - **This Session:** Set count and cumulative volume (e.g., *"Set 3 • Volume: 5,400 lbs"*).
  - **Last Session Summary:** Comparison against previous workout (e.g., *"Last Workout (Oct 19): 215 lbs × 8, 8, 7"*).
  - **Micro-Trend Indicator:** Directional status badge (e.g., `+10 lbs vs last session ↗️`, `Equal to last session ➡️`, `Target: beat 215 lbs 🎯`).

### 6. HTML5 Media Session API Integration
- Fully wired to `navigator.mediaSession` with lock screen / notification center audio controls.
- Controls: **Play**, **Pause**, **Previous Track**, **Next Track**, and **Mute**.
- Synthesizes dynamic ambient workout beats using Web Audio API so native media sessions activate on mobile browsers.

### 7. Data Persistence & Offline PWA
- Persists all workout history, preferences, and daily logs in `localStorage`.
- Includes `manifest.json` and `sw.js` (Service Worker) for standalone PWA installation and offline capabilities.
- Pre-seeded with realistic workout history for immediate comparative testing.

---

## 🚀 Quick Start & Local Testing

### Run Locally:
```bash
# Start a simple HTTP server
python3 -m http.server 8080

# Or with Node
npx serve .
```
Open `http://localhost:8080` in your browser.

### Run Automated Unit Test Suite:
```bash
node tests/test-engine.mjs
node tests/test-storage.mjs
```

---

## 🌐 Deploy to GitHub Pages (Zero-Build)

Because Vox Gym uses native ES modules and standard web standards, no build step (`npm run build`) is required:

1. Push this repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial Vox Gym Stage 1 prototype"
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. On GitHub, navigate to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Source**, select **Deploy from a branch**.
4. Choose `main` branch and `/ (root)` directory, then click **Save**.
5. Your live PWA URL will be available at `https://<your-username>.github.io/<your-repo>/`.

---

## 🏋️ Preset Voice Commands for Testing
On the main screen, use the horizontal scrollable chips to test voice commands without speaking:
- `Bench press 225 pounds for 8 reps`
- `Add 5 pounds for 10 reps` *(Relative progression)*
- `Same as last set` *(Duplicate)*
- `Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure` *(Multi-drop)*
- `Dips 15 reps with 25 pounds` *(Bodyweight + added weight)*
- `Plank for 60 seconds` *(Timed)*
- `Squats 225 pounds` *(Triggers missing reps drawer)*
- `Incline DB 70 for 10` *(Fuzzy normalization)*
- `Bench press 100 kg for 8 reps` *(Unit auto-conversion)*
