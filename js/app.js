/**
 * Vox Gym - Main Application Orchestrator
 * Connects Speech, NLP Parser, Fuzzy Resolver, UI, Storage, and Media APIs.
 */

import { storage } from './storage.js';
import { ui } from './ui.js';
import { speechEngine } from './speech.js';
import { parseVoiceIntent } from './nlp-parser.js';
import { audioFeedback } from './audio-feedback.js';

class VoxGymApp {
  constructor() {
    this.currentPendingPayload = null;
  }

  init() {
    // 1. Initialize UI & Storage
    ui.init();

    // 2. Check initial unit choice if not yet selected
    this.checkInitialUnitChoice();

    // 3. Setup Speech Recognition
    this.setupSpeechEvents();

    // 4. Setup Stepper and Confirmation Modal Controls
    this.setupModalControls();

    // 5. Setup Header & Settings Controls
    this.setupHeaderAndSettings();

    // 6. Setup Preset Voice Simulator & Manual Input
    this.setupVoicePresets();

    // 7. Register Service Worker for PWA
    this.registerServiceWorker();

    console.log("Vox Gym App initialized successfully.");
  }

  checkInitialUnitChoice() {
    const prefs = storage.getPreferences();
    if (!prefs.unitChosen) {
      ui.showUnitChoiceModal((chosenUnit) => {
        console.log("Initial unit chosen:", chosenUnit);
      });
    }
  }

  // =========================================================================
  // Speech Events
  // =========================================================================
  setupSpeechEvents() {
    // Bind central PTT button
    speechEngine.bindPTTButton(ui.elements.pttButton);

    speechEngine.onStateChange = (state, meta) => {
      ui.setPTTState(state, meta);
      if (state === "idle" || state === "listening") {
        ui.showLiveTranscript("");
      }
    };

    speechEngine.onInterimResult = (text) => {
      ui.showLiveTranscript(text, false);
    };

    speechEngine.onFinalResult = (transcript) => {
      ui.showLiveTranscript(transcript, true);
      this.processVoiceCommand(transcript);
    };

    speechEngine.onError = (msg, isPermissionDenied) => {
      console.warn("Speech error handled:", msg);
      if (isPermissionDenied) {
        // Offer manual input drawer or feedback
        if (ui.elements.manualVoiceContainer) {
          ui.elements.manualVoiceContainer.classList.add("visible");
        }
      }
    };
  }

  // =========================================================================
  // Voice Command Processing Pipeline
  // =========================================================================
  processVoiceCommand(rawTranscript) {
    if (!rawTranscript || !rawTranscript.trim()) return;

    const prefs = storage.getPreferences();
    const lastSet = storage.getLastLoggedSet();

    const parseResult = parseVoiceIntent(rawTranscript, {
      lastSet,
      userUnit: prefs.unit
    });

    console.log("Parsed Voice Intent:", parseResult);

    if (parseResult.status === "error") {
      ui.setPTTState("error", { message: parseResult.message });
      setTimeout(() => ui.setPTTState("idle"), 3000);
      return;
    }

    // Case A: Missing required parameter (reps or weight)
    if (parseResult.status === "incomplete") {
      ui.setPTTState("idle");
      ui.showIncompleteParameterDrawer(parseResult, (enteredValue, missingField) => {
        // Re-assemble complete payload
        const completed = {
          exercise: parseResult.exercise || "Barbell Bench Press",
          type: "standard",
          unit: prefs.unit,
          weight: missingField === "weight" ? enteredValue : (parseResult.partialPayload?.weight || 135),
          reps: missingField === "reps" ? enteredValue : (parseResult.partialPayload?.reps || 10)
        };
        this.openConfirmationStep(completed);
      });
      return;
    }

    // Case B: Ambiguous exercise name (< 80% confidence or close matches)
    if (parseResult.status === "ambiguous" && parseResult.fuzzyResult) {
      ui.setPTTState("idle");
      const spoken = rawTranscript;
      ui.showAmbiguityDrawer(spoken, parseResult.fuzzyResult.matches, (selectedExerciseName) => {
        parseResult.exercise = selectedExerciseName;
        parseResult.status = "ready";
        this.openConfirmationStep(parseResult);
      });
      return;
    }

    // Case C: Clean, ready set
    this.openConfirmationStep(parseResult);
  }

  openConfirmationStep(payload) {
    this.currentPendingPayload = payload;
    ui.setPTTState("idle");

    ui.showConfirmationModal(payload, (confirmedSet) => {
      this.commitConfirmedSet(confirmedSet);
    });
  }

  commitConfirmedSet(setPayload) {
    // 1. Save set to local storage
    const saved = storage.logSet(setPayload);

    // 2. Update Today Session UI
    ui.renderTodaySession();

    // 3. Update Live Feedback Card with this exercise
    ui.updateFeedbackCard(saved.exercise);

    // 4. Start automated rest timer if enabled
    const prefs = storage.getPreferences();
    if (prefs.restTimerEnabled) {
      ui.startRestTimer(prefs.restDurationSeconds);
    }
  }

  // =========================================================================
  // Modal Steppers & Action Handlers
  // =========================================================================
  setupModalControls() {
    const pauseAndEdit = (callback) => {
      ui.pauseColorCrawl("User edited values");
      if (ui.activeConfirmPayload) {
        callback(ui.activeConfirmPayload);
        const prefs = storage.getPreferences();
        const unit = ui.activeConfirmPayload.unit || prefs.unit;
        ui.updateStandardFields(
          ui.activeConfirmPayload.weight ?? ui.activeConfirmPayload.addedWeight ?? 0,
          ui.activeConfirmPayload.reps ?? 1,
          ui.activeConfirmPayload.isBodyweight ? `+${unit}` : unit
        );
      }
    };

    // Weight - / +
    if (ui.elements.btnWeightMinus) {
      ui.elements.btnWeightMinus.addEventListener("click", () => {
        pauseAndEdit((p) => {
          const step = 5;
          if (p.isBodyweight) {
            p.addedWeight = Math.max(0, (p.addedWeight || 0) - step);
          } else {
            p.weight = Math.max(0, (p.weight || 0) - step);
          }
        });
      });
    }

    if (ui.elements.btnWeightPlus) {
      ui.elements.btnWeightPlus.addEventListener("click", () => {
        pauseAndEdit((p) => {
          const step = 5;
          if (p.isBodyweight) {
            p.addedWeight = (p.addedWeight || 0) + step;
          } else {
            p.weight = (p.weight || 0) + step;
          }
        });
      });
    }

    // Reps - / +
    if (ui.elements.btnRepsMinus) {
      ui.elements.btnRepsMinus.addEventListener("click", () => {
        pauseAndEdit((p) => {
          p.reps = Math.max(1, (p.reps || 1) - 1);
        });
      });
    }

    if (ui.elements.btnRepsPlus) {
      ui.elements.btnRepsPlus.addEventListener("click", () => {
        pauseAndEdit((p) => {
          p.reps = (p.reps || 0) + 1;
        });
      });
    }

    // Manual Confirm button
    if (ui.elements.manualConfirmBtn) {
      ui.elements.manualConfirmBtn.addEventListener("click", () => {
        ui.executeAutoCommit();
      });
    }

    // Discard button
    if (ui.elements.discardConfirmBtn) {
      ui.elements.discardConfirmBtn.addEventListener("click", () => {
        ui.closeConfirmationModal();
      });
    }

    // Backdrop click dismisses drawers
    if (ui.elements.modalBackdrop) {
      ui.elements.modalBackdrop.addEventListener("click", () => {
        ui.closeAmbiguityDrawer();
        ui.closeIncompleteDrawer();
        if (ui.elements.settingsModal) {
          ui.elements.settingsModal.classList.remove("visible");
        }
      });
    }
  }

  // =========================================================================
  // Header, Preferences & Settings
  // =========================================================================
  setupHeaderAndSettings() {
    // Settings Unit Selection Buttons (LBS / KG)
    const updateUnitPreference = (newUnit) => {
      storage.savePreferences({ unit: newUnit, unitChosen: true });
      ui.renderHeader();
      ui.renderTodaySession();
      const last = storage.getLastLoggedSet();
      if (last) {
        ui.updateFeedbackCard(last.exercise);
      }
    };

    if (ui.elements.settingsUnitLbs) {
      ui.elements.settingsUnitLbs.addEventListener("click", () => updateUnitPreference("lbs"));
    }
    if (ui.elements.settingsUnitKg) {
      ui.elements.settingsUnitKg.addEventListener("click", () => updateUnitPreference("kg"));
    }

    // Settings Modal
    if (ui.elements.settingsBtn) {
      ui.elements.settingsBtn.addEventListener("click", () => {
        this.openSettings();
      });
    }

    if (ui.elements.closeSettingsBtn) {
      ui.elements.closeSettingsBtn.addEventListener("click", () => {
        if (ui.elements.settingsModal) ui.elements.settingsModal.classList.remove("visible");
        if (ui.elements.modalBackdrop) ui.elements.modalBackdrop.classList.remove("visible");
      });
    }

    // Rest duration slider
    if (ui.elements.restDurationInput && ui.elements.restDurationValue) {
      ui.elements.restDurationInput.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        ui.elements.restDurationValue.textContent = `${val}s`;
        storage.savePreferences({ restDurationSeconds: val });
      });
    }

    // Sound toggle
    if (ui.elements.soundToggleCheckbox) {
      ui.elements.soundToggleCheckbox.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        storage.savePreferences({ soundEnabled: enabled });
        audioFeedback.soundEnabled = enabled;
      });
    }

    // Haptic toggle
    if (ui.elements.hapticToggleCheckbox) {
      ui.elements.hapticToggleCheckbox.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        storage.savePreferences({ hapticsEnabled: enabled });
        audioFeedback.hapticsEnabled = enabled;
      });
    }

    // Reset Data
    if (ui.elements.resetDataBtn) {
      ui.elements.resetDataBtn.addEventListener("click", () => {
        if (confirm("Reset Vox Gym workout history and preferences to factory demo state?")) {
          storage.resetData();
          ui.renderHeader();
          ui.renderTodaySession();
          ui.renderInitialFeedbackCard();
          if (ui.elements.settingsModal) ui.elements.settingsModal.classList.remove("visible");
          if (ui.elements.modalBackdrop) ui.elements.modalBackdrop.classList.remove("visible");
        }
      });
    }
  }

  openSettings() {
    const prefs = storage.getPreferences();
    if (ui.elements.restDurationInput) ui.elements.restDurationInput.value = prefs.restDurationSeconds;
    if (ui.elements.restDurationValue) ui.elements.restDurationValue.textContent = `${prefs.restDurationSeconds}s`;
    if (ui.elements.soundToggleCheckbox) ui.elements.soundToggleCheckbox.checked = prefs.soundEnabled;
    if (ui.elements.hapticToggleCheckbox) ui.elements.hapticToggleCheckbox.checked = prefs.hapticsEnabled;

    if (ui.elements.settingsModal) ui.elements.settingsModal.classList.add("visible");
    if (ui.elements.modalBackdrop) ui.elements.modalBackdrop.classList.add("visible");
  }

  // =========================================================================
  // Voice Presets & Manual Text Input Fallback
  // =========================================================================
  setupVoicePresets() {
    // Preset chips
    const presetChips = document.querySelectorAll(".preset-chip");
    presetChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const phrase = chip.getAttribute("data-phrase") || chip.textContent.trim();
        ui.showLiveTranscript(phrase, true);
        this.processVoiceCommand(phrase);
      });
    });

    // Manual input toggle
    if (ui.elements.manualVoiceToggleBtn && ui.elements.manualVoiceContainer) {
      ui.elements.manualVoiceToggleBtn.addEventListener("click", () => {
        ui.elements.manualVoiceContainer.classList.toggle("visible");
        if (ui.elements.manualVoiceContainer.classList.contains("visible")) {
          ui.elements.manualVoiceInput?.focus();
        }
      });
    }

    if (ui.elements.manualVoiceSubmitBtn && ui.elements.manualVoiceInput) {
      ui.elements.manualVoiceSubmitBtn.addEventListener("click", () => {
        const text = ui.elements.manualVoiceInput.value.trim();
        if (text) {
          ui.showLiveTranscript(text, true);
          this.processVoiceCommand(text);
          ui.elements.manualVoiceInput.value = "";
        }
      });

      ui.elements.manualVoiceInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          ui.elements.manualVoiceSubmitBtn.click();
        }
      });
    }
  }

  // =========================================================================
  // Service Worker Registration for PWA / GitHub Pages
  // =========================================================================
  registerServiceWorker() {
    if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
      navigator.serviceWorker.register("sw.js")
        .then(reg => console.log("ServiceWorker registered successfully:", reg.scope))
        .catch(err => console.warn("ServiceWorker registration failed:", err));
    }
  }
}

// Instantiate and start app on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new VoxGymApp();
  app.init();
});
