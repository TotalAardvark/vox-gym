/**
 * Vox Gym - Main Application Orchestrator
 * Connects Speech, NLP Parser, Fuzzy Resolver, UI, Storage, and Media APIs.
 */

import { storage } from './storage.js';
import { ui } from './ui.js';
import { speechEngine } from './speech.js';
import { parseVoiceIntent, extractCustomExerciseCandidate } from './nlp-parser.js';
import { audioFeedback } from './audio-feedback.js';
import { SpotifyService } from './spotify.js';

class VoxGymApp {
  constructor() {
    this.currentPendingPayload = null;
    this.spotify = new SpotifyService({
      onStateChange: (state) => this.handleSpotifyStateChange(state)
    });
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

    // 7. Setup Spotify Integration
    this.setupSpotifyIntegration();

    // 8. Register Service Worker for PWA
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
    const customExercises = storage.getCustomExercises();

    const parseResult = parseVoiceIntent(rawTranscript, {
      lastSet,
      userUnit: prefs.unit,
      customExercises
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

    // Case B: Ambiguous exercise name (< 75% confidence or close matches)
    if (parseResult.status === "ambiguous" && parseResult.fuzzyResult) {
      ui.setPTTState("idle");
      const spoken = rawTranscript;
      const customCandidate = extractCustomExerciseCandidate(rawTranscript);

      ui.showAmbiguityDrawer(
        spoken,
        parseResult.fuzzyResult.matches,
        (selectedExerciseName) => {
          parseResult.exercise = selectedExerciseName;
          parseResult.status = "ready";
          this.openConfirmationStep(parseResult);
        },
        () => {
          // 1-Tap "Register as Custom Exercise"
          // Save to user profile and custom exercises list so TTS/audio engine checks it first going forward
          storage.saveCustomExercise({
            name: customCandidate,
            muscle: "Custom Exercise",
            category: "custom",
            aliases: [customCandidate.toLowerCase()]
          });

          parseResult.exercise = customCandidate;
          parseResult.status = "ready";
          // Pull up standard confirmation countdown box allowing 3 seconds to check or edit name, weight, reps
          this.openConfirmationStep(parseResult);
        },
        customCandidate
      );
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

    // Backdrop click dismisses drawers and modals
    if (ui.elements.modalBackdrop) {
      ui.elements.modalBackdrop.addEventListener("click", () => {
        ui.closeAmbiguityDrawer();
        ui.closeIncompleteDrawer();
        ui.closeExerciseLogModal();
        ui.closeEditSetModal();
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
    // Theme selection (Light / Dark)
    const updateThemePreference = (newTheme) => {
      storage.savePreferences({ theme: newTheme });
      ui.applyTheme(newTheme);
    };

    if (ui.elements.themeBtnLight) {
      ui.elements.themeBtnLight.addEventListener("click", () => updateThemePreference("light"));
    }
    if (ui.elements.themeBtnDark) {
      ui.elements.themeBtnDark.addEventListener("click", () => updateThemePreference("dark"));
    }

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

    this.updateSpotifySettingsUI();

    if (ui.elements.settingsModal) ui.elements.settingsModal.classList.add("visible");
    if (ui.elements.modalBackdrop) ui.elements.modalBackdrop.classList.add("visible");
  }

  // =========================================================================
  // Spotify Integration Controller
  // =========================================================================
  async setupSpotifyIntegration() {
    // 1. Handle OAuth redirect return if ?code= in URL
    await this.spotify.handleCallbackIfPresent();

    // 2. Setup button event listeners
    if (ui.elements.spotifyConnectBtn) {
      ui.elements.spotifyConnectBtn.addEventListener("click", () => {
        this.spotify.initiateAuth();
      });
    }

    if (ui.elements.spotifyDismissBtn) {
      ui.elements.spotifyDismissBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.spotify.setWidgetDismissed(true);
        this.updateSpotifyWidgetVisibility();
      });
    }

    if (ui.elements.settingsSpotifyBtn) {
      ui.elements.settingsSpotifyBtn.addEventListener("click", () => {
        if (this.spotify.isAuthenticated()) {
          this.spotify.disconnect();
          this.updateSpotifySettingsUI();
          this.updateSpotifyWidgetVisibility();
        } else {
          this.spotify.initiateAuth();
        }
      });
    }

    if (ui.elements.spotifyPlayBtn) {
      ui.elements.spotifyPlayBtn.addEventListener("click", () => {
        this.spotify.togglePlayPause();
      });
    }

    if (ui.elements.spotifyNextBtn) {
      ui.elements.spotifyNextBtn.addEventListener("click", () => {
        this.spotify.nextTrack();
      });
    }

    if (ui.elements.spotifyPrevBtn) {
      ui.elements.spotifyPrevBtn.addEventListener("click", () => {
        this.spotify.previousTrack();
      });
    }

    // 3. Start polling if authenticated, otherwise render initial prompt state
    if (this.spotify.isAuthenticated()) {
      this.spotify.startPolling(3500);
    } else {
      this.updateSpotifyWidgetVisibility();
    }
  }

  handleSpotifyStateChange(state) {
    this.updateSpotifyWidgetVisibility();
    this.updateSpotifySettingsUI();

    if (!state || !state.isConnected) {
      return;
    }

    // Update Player UI elements
    if (ui.elements.spotifyTrackName) {
      ui.elements.spotifyTrackName.textContent = state.trackName || "Not Playing";
    }

    if (ui.elements.spotifyTrackSub) {
      if (state.trackName) {
        ui.elements.spotifyTrackSub.textContent = state.artistName || state.deviceName || "Spotify";
      } else {
        ui.elements.spotifyTrackSub.textContent = state.deviceName ? `Device: ${state.deviceName}` : "Open Spotify & hit Play";
      }
    }

    if (ui.elements.spotifyAlbumArt && ui.elements.spotifyArtPlaceholder) {
      if (state.albumArt) {
        ui.elements.spotifyAlbumArt.src = state.albumArt;
        ui.elements.spotifyAlbumArt.style.display = "block";
        ui.elements.spotifyArtPlaceholder.style.display = "none";
      } else {
        ui.elements.spotifyAlbumArt.style.display = "none";
        ui.elements.spotifyArtPlaceholder.style.display = "flex";
      }
    }

    // Toggle Play / Pause Icons
    if (ui.elements.spotifyPlayIcon && ui.elements.spotifyPauseIcon) {
      if (state.isPlaying) {
        ui.elements.spotifyPlayIcon.style.display = "none";
        ui.elements.spotifyPauseIcon.style.display = "block";
      } else {
        ui.elements.spotifyPlayIcon.style.display = "block";
        ui.elements.spotifyPauseIcon.style.display = "none";
      }
    }
  }

  updateSpotifyWidgetVisibility() {
    const isAuthed = this.spotify.isAuthenticated();
    const isDismissed = this.spotify.isWidgetDismissed();

    if (!ui.elements.spotifyWidgetContainer) return;

    if (isAuthed) {
      // User is logged in: always show active playback pill
      ui.elements.spotifyWidgetContainer.style.display = "flex";
      if (ui.elements.spotifyConnectPill) ui.elements.spotifyConnectPill.style.display = "none";
      if (ui.elements.spotifyPlayerPill) ui.elements.spotifyPlayerPill.style.display = "flex";
    } else {
      // User is not logged in
      if (ui.elements.spotifyPlayerPill) ui.elements.spotifyPlayerPill.style.display = "none";

      if (isDismissed) {
        // User tapped the 'X' button to hide it
        ui.elements.spotifyWidgetContainer.style.display = "none";
      } else {
        // Show "Connect Spotify" prompt pill
        ui.elements.spotifyWidgetContainer.style.display = "flex";
        if (ui.elements.spotifyConnectPill) ui.elements.spotifyConnectPill.style.display = "inline-flex";
      }
    }
  }

  updateSpotifySettingsUI() {
    if (!ui.elements.settingsSpotifyBtn || !ui.elements.settingsSpotifyStatus) return;

    if (this.spotify.isAuthenticated()) {
      ui.elements.settingsSpotifyStatus.textContent = "Connected to Spotify account";
      ui.elements.settingsSpotifyBtn.textContent = "Disconnect";
      ui.elements.settingsSpotifyBtn.style.background = "rgba(255, 71, 87, 0.15)";
      ui.elements.settingsSpotifyBtn.style.color = "var(--accent-red)";
      ui.elements.settingsSpotifyBtn.style.borderColor = "var(--accent-red-glow)";
    } else {
      ui.elements.settingsSpotifyStatus.textContent = "Control gym music from inside the app";
      ui.elements.settingsSpotifyBtn.textContent = "Connect";
      ui.elements.settingsSpotifyBtn.style.background = "";
      ui.elements.settingsSpotifyBtn.style.color = "";
      ui.elements.settingsSpotifyBtn.style.borderColor = "";
    }
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
    if ("serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js")
        .then(reg => {
          console.log("ServiceWorker registered successfully:", reg.scope);
          if (reg) reg.update();
        })
        .catch(err => console.warn("ServiceWorker registration failed:", err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }
}

// Instantiate and start app on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const app = new VoxGymApp();
  app.init();
});
