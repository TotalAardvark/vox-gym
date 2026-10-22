/**
 * Vox Gym - Native Web Speech API Controller
 * Supports webkitSpeechRecognition / SpeechRecognition with Tap-to-Listen,
 * Hold-to-Speak, interim transcription preview, and comprehensive fallbacks.
 */

import { audioFeedback } from './audio-feedback.js';

export class SpeechEngine {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isListening = false;
    this.isHoldMode = false;
    this.holdTimer = null;
    this.finalTranscript = "";
    this.interimTranscript = "";

    // Event callbacks
    this.onStateChange = null; // (state: "idle"|"listening"|"processing"|"error", meta)
    this.onInterimResult = null; // (text)
    this.onFinalResult = null; // (text)
    this.onError = null; // (errorMsg, isPermissionDenied)

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.isSupported = false;
      console.warn("SpeechRecognition API not available in this browser environment.");
      return;
    }

    this.isSupported = true;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false; // single utterance for gym commands
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";
      this.recognition.maxAlternatives = 3;

      this.setupHandlers();
    } catch (e) {
      console.error("Failed to initialize SpeechRecognition:", e);
      this.isSupported = false;
    }
  }

  setupHandlers() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.finalTranscript = "";
      this.interimTranscript = "";
      audioFeedback.playMicStart();
      if (this.onStateChange) this.onStateChange("listening");
    };

    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      if (interim && this.onInterimResult) {
        this.interimTranscript = interim;
        this.onInterimResult(interim);
      }

      if (final) {
        this.finalTranscript = final;
        if (this.onInterimResult) {
          this.onInterimResult(final);
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      this.isListening = false;

      let msg = "Speech recognition encountered an issue.";
      let isPermissionDenied = false;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        msg = "Microphone access was denied. Please allow microphone permissions or use manual entry.";
        isPermissionDenied = true;
      } else if (event.error === "no-speech") {
        msg = "No speech detected. Please speak closer to your microphone.";
      } else if (event.error === "network") {
        msg = "Network connectivity issue with speech recognition service.";
      }

      if (this.onStateChange) this.onStateChange("error", { error: event.error, message: msg });
      if (this.onError) this.onError(msg, isPermissionDenied);
    };

    this.recognition.onend = () => {
      const wasListening = this.isListening;
      this.isListening = false;

      if (wasListening) {
        audioFeedback.playMicEnd();
      }

      const resultText = (this.finalTranscript || this.interimTranscript).trim();
      if (resultText) {
        if (this.onStateChange) this.onStateChange("processing", { transcript: resultText });
        if (this.onFinalResult) this.onFinalResult(resultText);
      } else {
        if (this.onStateChange) this.onStateChange("idle");
      }
    };
  }

  start() {
    if (!this.isSupported) {
      if (this.onError) {
        this.onError("Speech recognition is not supported in this browser. Please use text input or voice presets.", false);
      }
      return;
    }

    if (this.isListening) return;

    try {
      this.finalTranscript = "";
      this.interimTranscript = "";
      this.recognition.start();
    } catch (e) {
      console.warn("Recognition start failed:", e);
    }
  }

  stop() {
    if (!this.isListening) return;
    try {
      this.recognition.stop();
    } catch (e) {
      console.warn("Recognition stop failed:", e);
    }
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Bind Push-to-Talk button for both tap-to-listen and hold-to-speak
   */
  bindPTTButton(buttonEl) {
    if (!buttonEl) return;

    let isPointerDown = false;
    let holdTriggered = false;

    // Pointer down: initiate hold check
    const handlePointerDown = (e) => {
      // Prevent duplicate mouse/touch triggers
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();

      isPointerDown = true;
      holdTriggered = false;

      this.holdTimer = setTimeout(() => {
        if (isPointerDown) {
          // User is holding down
          holdTriggered = true;
          this.isHoldMode = true;
          this.start();
        }
      }, 300); // 300ms hold threshold
    };

    const handlePointerUp = (e) => {
      if (!isPointerDown) return;
      e.preventDefault();
      isPointerDown = false;

      if (this.holdTimer) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }

      if (holdTriggered) {
        // Was holding down, now released -> stop listening and process
        this.isHoldMode = false;
        this.stop();
      } else {
        // Was a tap -> toggle listening
        this.isHoldMode = false;
        this.toggle();
      }
    };

    const handlePointerCancel = () => {
      isPointerDown = false;
      if (this.holdTimer) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }
      if (this.isHoldMode) {
        this.isHoldMode = false;
        this.stop();
      }
    };

    buttonEl.addEventListener("pointerdown", handlePointerDown);
    buttonEl.addEventListener("pointerup", handlePointerUp);
    buttonEl.addEventListener("pointercancel", handlePointerCancel);
    buttonEl.addEventListener("pointerleave", handlePointerCancel);
  }
}

export const speechEngine = new SpeechEngine();
