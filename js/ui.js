/**
 * Vox Gym - UI Controller & DOM Orchestrator
 * Implements the 4-second horizontal color-crawl confirmation modal,
 * comparative exercise feedback card, activity ticker, and bottom drawers.
 */

import { storage, formatTime, getTodayKey, formatHumanDate } from './storage.js';
import { audioFeedback } from './audio-feedback.js';
import { EXERCISE_DATABASE } from './exercises.js';

export class UIController {
  constructor() {
    this.activeConfirmPayload = null;
    this.colorCrawlTimer = null;
    this.colorCrawlStartTime = null;
    this.colorCrawlDuration = 4000; // 4 seconds
    this.isCrawlPaused = false;
    this.onConfirmCallback = null;

    // Rest timer state
    this.restTimerInterval = null;
    this.restTimeRemaining = 0;
    this.restTotalDuration = 90;

    // Cache DOM elements
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.setupRestTimer();
    this.renderHeader();
    this.renderTodaySession();
    this.renderInitialFeedbackCard();
  }

  cacheElements() {
    this.elements = {
      appContainer: document.getElementById("app-container"),
      headerDate: document.getElementById("header-date"),
      unitToggleBtn: document.getElementById("unit-toggle-btn"),
      unitBadge: document.getElementById("unit-badge"),
      restToggleBtn: document.getElementById("rest-toggle-btn"),
      restTimerPill: document.getElementById("rest-timer-pill"),
      restTimerText: document.getElementById("rest-timer-text"),
      restTimerSkip: document.getElementById("rest-timer-skip"),

      // Feedback Card
      feedbackCard: document.getElementById("feedback-card"),
      feedbackExName: document.getElementById("feedback-ex-name"),
      feedbackMuscle: document.getElementById("feedback-muscle"),
      feedbackThisSession: document.getElementById("feedback-this-session"),
      feedbackLastSession: document.getElementById("feedback-last-session"),
      feedbackTrendBadge: document.getElementById("feedback-trend-badge"),

      // Push to Talk Zone
      pttButton: document.getElementById("ptt-button"),
      pttStatusText: document.getElementById("ptt-status-text"),
      pttSoundwaves: document.getElementById("ptt-soundwaves"),
      liveTranscriptBox: document.getElementById("live-transcript-box"),
      liveTranscriptText: document.getElementById("live-transcript-text"),

      // Activity Feed
      activityList: document.getElementById("activity-list"),
      activityEmptyState: document.getElementById("activity-empty-state"),
      totalSetsBadge: document.getElementById("total-sets-badge"),
      totalVolumeBadge: document.getElementById("total-volume-badge"),

      // Confirmation Modal
      confirmModal: document.getElementById("confirm-modal"),
      modalBackdrop: document.getElementById("modal-backdrop"),
      confirmExerciseTitle: document.getElementById("confirm-exercise-title"),
      confirmTypeBadge: document.getElementById("confirm-type-badge"),
      confirmWeightValue: document.getElementById("confirm-weight-value"),
      confirmWeightUnit: document.getElementById("confirm-weight-unit"),
      confirmRepsValue: document.getElementById("confirm-reps-value"),
      confirmDropList: document.getElementById("confirm-drop-list"),
      confirmStandardFields: document.getElementById("confirm-standard-fields"),
      colorCrawlBar: document.getElementById("color-crawl-progress"),
      colorCrawlStatusText: document.getElementById("color-crawl-status-text"),
      manualConfirmActions: document.getElementById("manual-confirm-actions"),
      manualConfirmBtn: document.getElementById("manual-confirm-btn"),
      discardConfirmBtn: document.getElementById("discard-confirm-btn"),

      // Steppers
      btnWeightMinus: document.getElementById("btn-weight-minus"),
      btnWeightPlus: document.getElementById("btn-weight-plus"),
      btnRepsMinus: document.getElementById("btn-reps-minus"),
      btnRepsPlus: document.getElementById("btn-reps-plus"),

      // Ambiguity Drawer
      ambiguityDrawer: document.getElementById("ambiguity-drawer"),
      ambiguitySpokenTerm: document.getElementById("ambiguity-spoken-term"),
      ambiguityOptionsList: document.getElementById("ambiguity-options-list"),

      // Incomplete Drawer
      incompleteDrawer: document.getElementById("incomplete-drawer"),
      incompleteTitle: document.getElementById("incomplete-title"),
      incompletePrompt: document.getElementById("incomplete-prompt"),
      incompletePillsContainer: document.getElementById("incomplete-pills-container"),
      incompleteManualInput: document.getElementById("incomplete-manual-input"),
      incompleteSubmitBtn: document.getElementById("incomplete-submit-btn"),

      // Settings Modal
      settingsModal: document.getElementById("settings-modal"),
      settingsBtn: document.getElementById("settings-btn"),
      closeSettingsBtn: document.getElementById("close-settings-btn"),
      restDurationInput: document.getElementById("rest-duration-input"),
      restDurationValue: document.getElementById("rest-duration-value"),
      soundToggleCheckbox: document.getElementById("sound-toggle-checkbox"),
      hapticToggleCheckbox: document.getElementById("haptic-toggle-checkbox"),
      resetDataBtn: document.getElementById("reset-data-btn"),

      // Manual Voice Input Box
      manualVoiceToggleBtn: document.getElementById("manual-voice-toggle-btn"),
      manualVoiceContainer: document.getElementById("manual-voice-container"),
      manualVoiceInput: document.getElementById("manual-voice-input"),
      manualVoiceSubmitBtn: document.getElementById("manual-voice-submit-btn")
    };
  }

  renderHeader() {
    const prefs = storage.getPreferences();
    const today = getTodayKey();
    if (this.elements.headerDate) {
      this.elements.headerDate.textContent = formatHumanDate(today);
    }
    if (this.elements.unitBadge) {
      this.elements.unitBadge.textContent = prefs.unit.toUpperCase();
    }
    if (this.elements.restToggleBtn) {
      this.elements.restToggleBtn.setAttribute("aria-pressed", prefs.restTimerEnabled ? "true" : "false");
      this.elements.restToggleBtn.classList.toggle("active", prefs.restTimerEnabled);
    }
  }

  // =========================================================================
  // 1. Immediate Exercise Feedback Card (PRD 3.4)
  // =========================================================================
  renderInitialFeedbackCard() {
    const lastSet = storage.getLastLoggedSet();
    const exName = lastSet ? lastSet.exercise : "Barbell Bench Press";
    this.updateFeedbackCard(exName);
  }

  updateFeedbackCard(exerciseName) {
    if (!exerciseName) return;

    const stats = storage.getExerciseComparativeStats(exerciseName);
    const prefs = storage.getPreferences();
    const unit = prefs.unit;

    if (!stats) return;

    const dbEntry = EXERCISE_DATABASE.find(e => e.name === exerciseName);
    const muscle = dbEntry ? dbEntry.muscle : "Strength";

    if (this.elements.feedbackExName) {
      this.elements.feedbackExName.textContent = exerciseName;
    }
    if (this.elements.feedbackMuscle) {
      this.elements.feedbackMuscle.textContent = muscle;
    }

    // This Session
    if (this.elements.feedbackThisSession) {
      if (stats.thisSession.setCount > 0) {
        const formattedVol = stats.thisSession.volume.toLocaleString();
        this.elements.feedbackThisSession.innerHTML = `
          <span class="stat-highlight">Set ${stats.thisSession.setCount}</span>
          <span class="stat-bullet">•</span>
          <span>Volume: ${formattedVol} ${unit}</span>
        `;
      } else {
        this.elements.feedbackThisSession.innerHTML = `<span class="stat-muted">No sets logged yet today</span>`;
      }
    }

    // Last Session Summary
    if (this.elements.feedbackLastSession) {
      if (stats.lastSession) {
        this.elements.feedbackLastSession.innerHTML = `
          <div class="last-session-label">Last Workout (${stats.lastSession.formattedDate}):</div>
          <div class="last-session-val">${stats.lastSession.setsSummary}</div>
        `;
      } else {
        this.elements.feedbackLastSession.innerHTML = `
          <div class="last-session-label">Previous Workout:</div>
          <div class="last-session-val stat-muted">No prior recorded sessions</div>
        `;
      }
    }

    // Micro-Trend Indicator
    if (this.elements.feedbackTrendBadge) {
      const trend = stats.microTrend;
      this.elements.feedbackTrendBadge.className = `trend-badge trend-${trend.direction}`;
      this.elements.feedbackTrendBadge.innerHTML = `
        <span class="trend-arrow">${trend.arrow || "•"}</span>
        <span class="trend-text">${trend.text}</span>
      `;
    }
  }

  // =========================================================================
  // 2. Recent Activity Ticker (Today's Workout Feed)
  // =========================================================================
  renderTodaySession() {
    const session = storage.getTodaySession();
    const prefs = storage.getPreferences();
    const unit = prefs.unit;

    const sets = session.sets || [];

    if (this.elements.totalSetsBadge) {
      this.elements.totalSetsBadge.textContent = `${sets.length} ${sets.length === 1 ? "Set" : "Sets"}`;
    }

    let totalVolume = 0;
    for (const s of sets) {
      const w = s.weight || s.addedWeight || 0;
      const r = typeof s.reps === "number" ? s.reps : 0;
      totalVolume += w * r;
    }

    if (this.elements.totalVolumeBadge) {
      this.elements.totalVolumeBadge.textContent = `${totalVolume.toLocaleString()} ${unit}`;
    }

    if (!this.elements.activityList) return;

    if (sets.length === 0) {
      if (this.elements.activityEmptyState) {
        this.elements.activityEmptyState.style.display = "flex";
      }
      this.elements.activityList.innerHTML = "";
      return;
    }

    if (this.elements.activityEmptyState) {
      this.elements.activityEmptyState.style.display = "none";
    }

    // Render sets in reverse chronological order (newest on top)
    const reversed = [...sets].reverse();
    this.elements.activityList.innerHTML = reversed.map((set, idx) => {
      const originalSetNum = sets.length - idx;
      let detailsHtml = "";

      if (set.type === "drop_set" && Array.isArray(set.drops)) {
        const dropSeq = set.drops.map(d => `${d.weight}${set.unit || unit} × ${d.reps}`).join(" → ");
        detailsHtml = `<span class="badge-tag drop-tag">DROP SET</span> <span class="set-details-seq">${dropSeq}</span>`;
      } else if (set.type === "bodyweight" || set.isBodyweight) {
        const added = set.addedWeight > 0 ? `+${set.addedWeight} ${set.unit || unit}` : "BW";
        detailsHtml = `<span class="badge-tag bw-tag">BODYWEIGHT</span> <strong>${added}</strong> × <strong>${set.reps} reps</strong>`;
      } else if (set.type === "time") {
        detailsHtml = `<strong>${set.duration}s</strong> duration`;
      } else if (set.type === "distance_time") {
        detailsHtml = `<strong>${set.distance} ${set.distUnit}</strong> in <strong>${set.duration} ${set.durationUnit}</strong>`;
      } else {
        detailsHtml = `<strong>${set.weight} ${set.unit || unit}</strong> × <strong>${set.reps} reps</strong>`;
      }

      return `
        <div class="activity-row" data-set-id="${set.id}">
          <div class="activity-col-info">
            <div class="activity-set-meta">
              <span class="set-num-badge">#${originalSetNum}</span>
              <span class="activity-ex-title">${set.exercise}</span>
              <span class="activity-time">${formatTime(set.timestamp)}</span>
            </div>
            <div class="activity-set-metrics">
              ${detailsHtml}
            </div>
          </div>
          <button class="btn-delete-set" data-delete-id="${set.id}" aria-label="Delete set" title="Delete set">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }).join("");

    // Wire delete buttons
    const deleteBtns = this.elements.activityList.querySelectorAll(".btn-delete-set");
    deleteBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-delete-id");
        if (id) {
          storage.deleteSet(id);
          this.renderTodaySession();
          const last = storage.getLastLoggedSet();
          if (last) {
            this.updateFeedbackCard(last.exercise);
          }
        }
      });
    });
  }

  // =========================================================================
  // 3. Confirmation Modal & 4-Second "Color Crawl" Animation (PRD 3.3)
  // =========================================================================
  showConfirmationModal(payload, onConfirm) {
    this.activeConfirmPayload = { ...payload };
    this.onConfirmCallback = onConfirm;
    this.isCrawlPaused = false;

    const prefs = storage.getPreferences();
    const unit = this.activeConfirmPayload.unit || prefs.unit;

    // Populate Fields
    this.elements.confirmExerciseTitle.textContent = this.activeConfirmPayload.exercise;

    // Badges & Stepper Visibility
    if (this.activeConfirmPayload.type === "drop_set") {
      this.elements.confirmTypeBadge.textContent = "DROP SET";
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-drop";
      this.elements.confirmStandardFields.style.display = "none";
      this.elements.confirmDropList.style.display = "flex";
      this.renderDropSetFields();
    } else if (this.activeConfirmPayload.type === "bodyweight") {
      this.elements.confirmTypeBadge.textContent = "BODYWEIGHT";
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-bw";
      this.elements.confirmStandardFields.style.display = "grid";
      this.elements.confirmDropList.style.display = "none";
      this.updateStandardFields(this.activeConfirmPayload.addedWeight || 0, this.activeConfirmPayload.reps, `+${unit}`);
    } else if (this.activeConfirmPayload.type === "time") {
      this.elements.confirmTypeBadge.textContent = "TIMED";
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-timed";
      this.elements.confirmStandardFields.style.display = "grid";
      this.elements.confirmDropList.style.display = "none";
      this.updateStandardFields(this.activeConfirmPayload.duration, 1, "sec");
    } else {
      this.elements.confirmTypeBadge.textContent = "STANDARD";
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-standard";
      this.elements.confirmStandardFields.style.display = "grid";
      this.elements.confirmDropList.style.display = "none";
      this.updateStandardFields(this.activeConfirmPayload.weight, this.activeConfirmPayload.reps, unit);
    }

    // Reset Color Crawl State
    this.resetColorCrawlUI();

    // Show Modal
    this.elements.confirmModal.classList.add("visible");
    this.elements.modalBackdrop.classList.add("visible");

    // Start 4-second horizontal color crawl
    this.startColorCrawl();
  }

  updateStandardFields(weight, reps, unitStr) {
    if (this.elements.confirmWeightValue) {
      this.elements.confirmWeightValue.textContent = weight;
    }
    if (this.elements.confirmWeightUnit) {
      this.elements.confirmWeightUnit.textContent = unitStr;
    }
    if (this.elements.confirmRepsValue) {
      this.elements.confirmRepsValue.textContent = reps;
    }
  }

  renderDropSetFields() {
    const drops = this.activeConfirmPayload.drops || [];
    const unit = this.activeConfirmPayload.unit || "lbs";

    this.elements.confirmDropList.innerHTML = drops.map((drop, idx) => `
      <div class="drop-row-item">
        <span class="drop-idx-badge">Drop ${idx + 1}</span>
        <div class="drop-steppers">
          <button class="step-btn mini-step" data-drop-step="w-minus" data-idx="${idx}">-</button>
          <span class="drop-val">${drop.weight} ${unit}</span>
          <button class="step-btn mini-step" data-drop-step="w-plus" data-idx="${idx}">+</button>
          <span class="drop-sep">×</span>
          <button class="step-btn mini-step" data-drop-step="r-minus" data-idx="${idx}">-</button>
          <span class="drop-val">${drop.reps}</span>
          <button class="step-btn mini-step" data-drop-step="r-plus" data-idx="${idx}">+</button>
        </div>
      </div>
    `).join("");

    // Wire drop steppers
    this.elements.confirmDropList.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", (e) => {
        this.pauseColorCrawl("Editing values");
        const action = b.getAttribute("data-drop-step");
        const idx = parseInt(b.getAttribute("data-idx"), 10);
        const drop = this.activeConfirmPayload.drops[idx];
        if (!drop) return;

        if (action === "w-minus") drop.weight = Math.max(0, drop.weight - 5);
        if (action === "w-plus") drop.weight += 5;
        if (action === "r-minus" && typeof drop.reps === "number") drop.reps = Math.max(1, drop.reps - 1);
        if (action === "r-plus") {
          if (drop.reps === "Failure") drop.reps = 10;
          else drop.reps += 1;
        }
        this.renderDropSetFields();
      });
    });
  }

  startColorCrawl() {
    this.cancelColorCrawl();
    this.isCrawlPaused = false;
    this.colorCrawlStartTime = performance.now();

    const frame = (now) => {
      if (this.isCrawlPaused) return;

      const elapsed = now - this.colorCrawlStartTime;
      const progress = Math.min(1.0, elapsed / this.colorCrawlDuration);
      const percent = (progress * 100).toFixed(1);

      if (this.elements.colorCrawlBar) {
        this.elements.colorCrawlBar.style.width = `${percent}%`;
      }

      const remainingSec = Math.max(0, (4.0 - (elapsed / 1000))).toFixed(1);
      if (this.elements.colorCrawlStatusText) {
        this.elements.colorCrawlStatusText.textContent = `Auto-confirming in ${remainingSec}s... (Touch to edit)`;
      }

      if (progress >= 1.0) {
        // Auto-commit reached! (PRD 3.3 Execution Logic)
        this.executeAutoCommit();
      } else {
        this.colorCrawlTimer = requestAnimationFrame(frame);
      }
    };

    this.colorCrawlTimer = requestAnimationFrame(frame);
  }

  pauseColorCrawl(reason = "Manual edit paused timer") {
    if (this.isCrawlPaused) return;
    this.isCrawlPaused = true;
    if (this.colorCrawlTimer) {
      cancelAnimationFrame(this.colorCrawlTimer);
      this.colorCrawlTimer = null;
    }

    if (this.elements.colorCrawlBar) {
      this.elements.colorCrawlBar.classList.add("paused");
    }

    if (this.elements.colorCrawlStatusText) {
      this.elements.colorCrawlStatusText.textContent = "Timer paused. Review & tap Confirm Set:";
    }

    // Show explicit confirm actions
    if (this.elements.manualConfirmActions) {
      this.elements.manualConfirmActions.style.display = "flex";
    }
  }

  cancelColorCrawl() {
    if (this.colorCrawlTimer) {
      cancelAnimationFrame(this.colorCrawlTimer);
      this.colorCrawlTimer = null;
    }
  }

  resetColorCrawlUI() {
    this.cancelColorCrawl();
    if (this.elements.colorCrawlBar) {
      this.elements.colorCrawlBar.style.width = "0%";
      this.elements.colorCrawlBar.classList.remove("paused", "confirmed");
    }
    if (this.elements.manualConfirmActions) {
      this.elements.manualConfirmActions.style.display = "none";
    }
    if (this.elements.colorCrawlStatusText) {
      this.elements.colorCrawlStatusText.textContent = "Auto-confirming in 4.0s...";
    }
  }

  executeAutoCommit() {
    this.cancelColorCrawl();

    // Trigger visual confirmed status state
    if (this.elements.colorCrawlBar) {
      this.elements.colorCrawlBar.classList.add("confirmed");
    }
    if (this.elements.colorCrawlStatusText) {
      this.elements.colorCrawlStatusText.innerHTML = `
        <span class="confirmed-badge">✓ CONFIRMED</span>
      `;
    }

    // Haptic burst & chime
    audioFeedback.triggerCommitFeedback();

    const payloadToCommit = this.activeConfirmPayload ? { ...this.activeConfirmPayload } : null;
    const confirmCb = this.onConfirmCallback;

    setTimeout(() => {
      this.closeConfirmationModal();
      if (confirmCb && payloadToCommit) {
        confirmCb(payloadToCommit);
      }
    }, 400);
  }

  closeConfirmationModal() {
    this.cancelColorCrawl();
    this.elements.confirmModal.classList.remove("visible");
    this.elements.modalBackdrop.classList.remove("visible");
    this.activeConfirmPayload = null;
  }

  // =========================================================================
  // 4. Ambiguity Bottom Drawer (PRD 3.2)
  // =========================================================================
  showAmbiguityDrawer(spokenTerm, topMatches, onSelect) {
    if (this.elements.ambiguitySpokenTerm) {
      this.elements.ambiguitySpokenTerm.textContent = `"${spokenTerm}"`;
    }

    if (this.elements.ambiguityOptionsList) {
      this.elements.ambiguityOptionsList.innerHTML = topMatches.map((m, idx) => `
        <button class="ambiguity-option-btn" data-ex-name="${m.exercise.name}">
          <div class="ambiguity-option-left">
            <span class="ambiguity-rank">${idx + 1}</span>
            <div class="ambiguity-text-group">
              <span class="ambiguity-name">${m.exercise.name}</span>
              <span class="ambiguity-sub">${m.exercise.muscle} • Score: ${Math.round(m.score * 100)}%</span>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      `).join("");

      this.elements.ambiguityOptionsList.querySelectorAll(".ambiguity-option-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const exName = btn.getAttribute("data-ex-name");
          this.closeAmbiguityDrawer();
          if (onSelect) onSelect(exName);
        });
      });
    }

    this.elements.ambiguityDrawer.classList.add("visible");
    this.elements.modalBackdrop.classList.add("visible");
  }

  closeAmbiguityDrawer() {
    this.elements.ambiguityDrawer.classList.remove("visible");
    this.elements.modalBackdrop.classList.remove("visible");
  }

  // =========================================================================
  // 5. Incomplete Parameter Fallback Drawer (PRD 3.1)
  // =========================================================================
  showIncompleteParameterDrawer(parseResult, onSubmit) {
    const { missing, exercise, partialPayload, promptMessage } = parseResult;

    if (this.elements.incompleteTitle) {
      this.elements.incompleteTitle.textContent = exercise || "Set Details Required";
    }
    if (this.elements.incompletePrompt) {
      this.elements.incompletePrompt.textContent = promptMessage || `Please provide the missing ${missing}.`;
    }

    // Generate quick selection pills based on what is missing
    let pills = [];
    if (missing === "reps") {
      pills = [5, 6, 8, 10, 12, 15, 20];
    } else if (missing === "weight") {
      const prefs = storage.getPreferences();
      pills = prefs.unit === "lbs" ? [45, 95, 135, 185, 225, 275, 315] : [20, 40, 60, 80, 100, 120, 140];
    } else if (missing === "duration") {
      pills = [30, 45, 60, 90, 120];
    }

    if (this.elements.incompletePillsContainer) {
      this.elements.incompletePillsContainer.innerHTML = pills.map(p => `
        <button class="pill-btn" data-val="${p}">${p} ${missing === "reps" ? "reps" : (missing === "weight" ? storage.getPreferences().unit : "s")}</button>
      `).join("");

      this.elements.incompletePillsContainer.querySelectorAll(".pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const val = parseFloat(btn.getAttribute("data-val"));
          this.closeIncompleteDrawer();
          onSubmit(val, missing);
        });
      });
    }

    // Manual input fallback
    if (this.elements.incompleteManualInput) {
      this.elements.incompleteManualInput.value = "";
      this.elements.incompleteManualInput.placeholder = `Enter ${missing}...`;
    }

    if (this.elements.incompleteSubmitBtn) {
      this.elements.incompleteSubmitBtn.onclick = () => {
        const val = parseFloat(this.elements.incompleteManualInput.value);
        if (!isNaN(val) && val > 0) {
          this.closeIncompleteDrawer();
          onSubmit(val, missing);
        }
      };
    }

    this.elements.incompleteDrawer.classList.add("visible");
    this.elements.modalBackdrop.classList.add("visible");
  }

  closeIncompleteDrawer() {
    this.elements.incompleteDrawer.classList.remove("visible");
    this.elements.modalBackdrop.classList.remove("visible");
  }

  // =========================================================================
  // 6. Rest Timer Engine (PRD 2.2)
  // =========================================================================
  setupRestTimer() {
    if (this.elements.restTimerSkip) {
      this.elements.restTimerSkip.addEventListener("click", () => {
        this.stopRestTimer();
      });
    }

    if (this.elements.restToggleBtn) {
      this.elements.restToggleBtn.addEventListener("click", () => {
        const prefs = storage.getPreferences();
        const newState = !prefs.restTimerEnabled;
        storage.savePreferences({ restTimerEnabled: newState });
        this.renderHeader();
        if (!newState) {
          this.stopRestTimer();
        }
      });
    }
  }

  startRestTimer(seconds = null) {
    const prefs = storage.getPreferences();
    if (!prefs.restTimerEnabled) return;

    this.stopRestTimer();
    this.restTotalDuration = seconds || prefs.restDurationSeconds || 90;
    this.restTimeRemaining = this.restTotalDuration;

    if (this.elements.restTimerPill) {
      this.elements.restTimerPill.classList.add("active");
    }
    this.updateRestTimerDisplay();

    this.restTimerInterval = setInterval(() => {
      this.restTimeRemaining--;
      this.updateRestTimerDisplay();

      if (this.restTimeRemaining <= 0) {
        this.stopRestTimer();
        audioFeedback.playRestDone();
        audioFeedback.vibrate([100, 50, 100]);
      }
    }, 1000);
  }

  updateRestTimerDisplay() {
    if (!this.elements.restTimerText) return;
    const mins = Math.floor(this.restTimeRemaining / 60);
    const secs = this.restTimeRemaining % 60;
    this.elements.restTimerText.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  stopRestTimer() {
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
      this.restTimerInterval = null;
    }
    if (this.elements.restTimerPill) {
      this.elements.restTimerPill.classList.remove("active");
    }
  }

  // =========================================================================
  // 7. PTT Visual States
  // =========================================================================
  setPTTState(state, meta = {}) {
    if (!this.elements.pttButton) return;

    this.elements.pttButton.classList.remove("idle", "listening", "processing", "error");
    this.elements.pttButton.classList.add(state);

    if (this.elements.pttSoundwaves) {
      this.elements.pttSoundwaves.classList.toggle("active", state === "listening");
    }

    if (this.elements.pttStatusText) {
      if (state === "idle") {
        this.elements.pttStatusText.textContent = "Tap or Hold to Speak";
      } else if (state === "listening") {
        this.elements.pttStatusText.textContent = "Listening... Speak your set";
      } else if (state === "processing") {
        this.elements.pttStatusText.textContent = "Analyzing command...";
      } else if (state === "error") {
        this.elements.pttStatusText.textContent = meta.message || "Microphone error";
      }
    }
  }

  showLiveTranscript(text, isFinal = false) {
    if (!this.elements.liveTranscriptBox || !this.elements.liveTranscriptText) return;

    if (text) {
      this.elements.liveTranscriptBox.classList.add("visible");
      this.elements.liveTranscriptText.textContent = `"${text}"`;
    } else {
      this.elements.liveTranscriptBox.classList.remove("visible");
    }
  }
}

export const ui = new UIController();
