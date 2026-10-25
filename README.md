# Vox Gym 🎙️💪
### *Log your workout without putting your weights down.*

Stop fiddling with your phone between heavy sets. No tiny keyboards with chalky hands, no hunting through 500-exercise dropdown menus, and no losing your pump. 

**Vox Gym** is a voice-first workout companion that lets you talk your sets into existence while your music keeps playing.

---

## 🚀 Why Lifters Love Vox Gym

### 🗣️ Just Speak Your Set
Say it naturally like you’d tell your gym buddy:
- *"Bench press 225 pounds for 8 reps"*
- *"Add 5 pounds for 10 reps"*
- *"Same as last set"*
- *"Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure"*
- *"Dips 15 reps with 25 pounds"*
- *"Plank for 60 seconds"*

### ⚡ True Zero-Friction (The 4-Second Rule)
Don't want to touch your screen? You don't have to.
After you speak, a visual 4-second timer crawls across the screen. If it looks right, do nothing—it auto-locks into your workout log, sends a subtle vibration pulse, and dismisses itself so you can rest. Want to tweak a rep? Just tap `+` or `-` to adjust.

### 🧠 It Knows Gym Slang
You don't need to say *"Barbell Incline Bench Press"*. Vox Gym knows what you mean:
- *"Incline DB 70 for 10"* $\rightarrow$ **Incline Dumbbell Press**
- *"RDL 225 for 8"* $\rightarrow$ **Romanian Deadlift**
- *"OHP 135 for 5"* $\rightarrow$ **Overhead Press**
- *"Squats 315 for 5"* $\rightarrow$ **Barbell Back Squat**

### 🎧 Built-in Spotify Control + Auto-Ducking
Never fumble between your music app and your workout log again:
- See what’s playing, skip tracks, and pause directly inside the app.
- When you tap to speak, Vox Gym automatically ducks your music so your phone hears you clearly over loud gym speakers.

### 📈 Instant Progress Comparison
Right after you log a set, Vox Gym tells you exactly how you performed compared to last week:
- *“+10 lbs vs last session ↗️”*
- *“Equal to last session ➡️”*
- *“Target: beat 215 lbs 🎯”*

---

## 📲 Install on Your Phone in 10 Seconds

Vox Gym is an ultra-fast Progressive Web App (PWA). No App Store download needed, zero ads, zero subscriptions, and works offline in basement gyms.

### 🍏 iPhone (Safari)
1. Open [`https://totalaardvark.github.io/vox-gym/`](https://totalaardvark.github.io/vox-gym/) in **Safari**.
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right. Vox Gym is now an app on your home screen!

### 🤖 Android (Chrome)
1. Open [`https://totalaardvark.github.io/vox-gym/`](https://totalaardvark.github.io/vox-gym/) in **Chrome**.
2. Tap the **three dots** (top right).
3. Tap **Install app** (or **Add to Home Screen**).

---

## 🎵 Connecting Your Spotify (One-Time Setup)

To enable live music playback and track controls:
1. In the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), open your app settings.
2. Add your redirect URI: `https://totalaardvark.github.io/vox-gym/`
3. Hit save.
4. Open Vox Gym, start playing a song in Spotify on your phone, and tap the Spotify pill in the app to connect!

---

<details>
<summary>🛠️ <b>Under the Hood (Nerd & Developer Details)</b></summary>

<br>

- **Architecture:** Zero-build, pure vanilla ES6+ web modules. Runs seamlessly via standard static file hosting.
- **Speech Engine:** Web Speech API (`webkitSpeechRecognition`) with continuous push-to-talk stream processing.
- **NLP & Parsing:** Custom lexical tokenizer with regex patterns supporting relative progression, drop sets, multi-unit conversions (`kg` $\leftrightarrow$ `lbs`), and bodyweight modifier detection.
- **Fuzzy Matching:** Levenshtein distance combined with token similarity matching against pre-indexed exercise alias dictionaries.
- **Spotify Connect:** Client-side OAuth 2.0 with PKCE (Proof Key for Code Exchange) flow via Web Crypto API. No server secrets or backend required.
- **Storage & Offline:** 100% client-side `localStorage` data persistence with Service Worker cache (`sw.js`) and dynamic `100dvh` viewport handling.
- **Testing:** Comprehensive test suite in `/tests` for intent parsing, fuzzy matching, and storage migrations.
  ```bash
  node tests/test-engine.mjs
  node tests/test-storage.mjs
  ```

</details>

---

## 📄 License
MIT © TotalAardvark
