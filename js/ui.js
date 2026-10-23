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
    this.colorCrawlDuration = 2500; // 2.5 seconds
    this.isCrawlPaused = false;
    this.onConfirmCallback = null;

    // Rest timer state
    this.restTimerInterval = null;
    this.restTimeRemaining = 0;
    this.restTotalDuration = 90;

    // Cache DOM elements
    this.elements = {};
    this.activeEditingSetId = null;
  }

  init() {
    this.cacheElements();
    this.setupRestTimer();
    this.setupDrawer();
    this.setupConfirmRename();
    this.setupEditSetModal();
    this.renderHeader();
    this.renderTodaySession();
    this.renderInitialFeedbackCard();
  }

  cacheElements() {
    this.elements = {
      appContainer: document.getElementById("app-container"),
      headerDate: document.getElementById("header-date"),
      restToggleBtn: document.getElementById("rest-toggle-btn"),
      restTimerPill: document.getElementById("rest-timer-pill"),
      restTimerText: document.getElementById("rest-timer-text"),
      restTimerSkip: document.getElementById("rest-timer-skip"),

      // Workout Drawer
      workoutDrawer: document.getElementById("workout-drawer"),
      drawerHeader: document.getElementById("drawer-header"),
      drawerToggleBtn: document.getElementById("drawer-toggle-btn"),
      drawerScrollBody: document.getElementById("drawer-scroll-body"),

      // Feedback Card
      feedbackCard: document.getElementById("feedback-card"),
      feedbackExName: document.getElementById("feedback-ex-name"),
      feedbackMuscle: document.getElementById("feedback-muscle"),
      feedbackTrendBadge: document.getElementById("feedback-trend-badge"),
      feedbackTrendText: document.getElementById("feedback-trend-text"),
      feedbackTodayBadge: document.getElementById("feedback-today-badge"),
      feedbackTodaySets: document.getElementById("feedback-today-sets"),
      feedbackLastDateLabel: document.getElementById("feedback-last-date-label"),
      feedbackLastBadge: document.getElementById("feedback-last-badge"),
      feedbackLastSets: document.getElementById("feedback-last-sets"),

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
      confirmRenameBtn: document.getElementById("confirm-rename-btn"),
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
      settingsUnitLbs: document.getElementById("settings-unit-lbs"),
      settingsUnitKg: document.getElementById("settings-unit-kg"),
      restDurationInput: document.getElementById("rest-duration-input"),
      restDurationValue: document.getElementById("rest-duration-value"),
      soundToggleCheckbox: document.getElementById("sound-toggle-checkbox"),
      hapticToggleCheckbox: document.getElementById("haptic-toggle-checkbox"),
      resetDataBtn: document.getElementById("reset-data-btn"),

      // Unit Choice Modal
      unitModal: document.getElementById("unit-modal"),
      choiceUnitLbs: document.getElementById("choice-unit-lbs"),
      choiceUnitKg: document.getElementById("choice-unit-kg"),

      // Edit Set Modal
      editSetModal: document.getElementById("edit-set-modal"),
      editSetTitle: document.getElementById("edit-set-title"),
      editSetCloseBtn: document.getElementById("edit-set-close-btn"),
      btnEditWeightMinus: document.getElementById("btn-edit-weight-minus"),
      btnEditWeightPlus: document.getElementById("btn-edit-weight-plus"),
      editWeightValue: document.getElementById("edit-weight-value"),
      editWeightUnit: document.getElementById("edit-weight-unit"),
      btnEditRepsMinus: document.getElementById("btn-edit-reps-minus"),
      btnEditRepsPlus: document.getElementById("btn-edit-reps-plus"),
      editRepsValue: document.getElementById("edit-reps-value"),
      editSetCancelBtn: document.getElementById("edit-set-cancel-btn"),
      editSetSaveBtn: document.getElementById("edit-set-save-btn"),

      // Rename / Custom Exercise Modal
      renameExerciseModal: document.getElementById("rename-exercise-modal"),
      customExerciseInput: document.getElementById("custom-exercise-input"),
      customExerciseSaveBtn: document.getElementById("custom-exercise-save-btn"),
      renameSuggestionsList: document.getElementById("rename-suggestions-list")
    };
  }

  renderHeader() {
    const prefs = storage.getPreferences();
    const today = getTodayKey();
    if (this.elements.headerDate) {
      this.elements.headerDate.textContent = formatHumanDate(today);
    }
    if (this.elements.restToggleBtn) {
      this.elements.restToggleBtn.setAttribute("aria-pressed", prefs.restTimerEnabled ? "true" : "false");
      this.elements.restToggleBtn.classList.toggle("active", prefs.restTimerEnabled);
    }
    if (this.elements.settingsUnitLbs && this.elements.settingsUnitKg) {
      this.elements.settingsUnitLbs.classList.toggle("active", prefs.unit === "lbs");
      this.elements.settingsUnitKg.classList.toggle("active", prefs.unit === "kg");
    }
  }

  // =========================================================================
  // Workout Drawer Control
  // =========================================================================
  setupDrawer() {
    if (this.elements.drawerHeader) {
      this.elements.drawerHeader.addEventListener("click", () => {
        this.toggleWorkoutDrawer();
      });
    }
    if (this.elements.drawerToggleBtn) {
      this.elements.drawerToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleWorkoutDrawer();
      });
    }
  }

  toggleWorkoutDrawer() {
    if (!this.elements.workoutDrawer) return;
    const isCollapsed = this.elements.workoutDrawer.classList.contains("collapsed");
    if (isCollapsed) {
      this.expandWorkoutDrawer();
    } else {
      this.collapseWorkoutDrawer();
    }
  }

  expandWorkoutDrawer() {
    if (!this.elements.workoutDrawer) return;
    this.elements.workoutDrawer.classList.remove("collapsed");
    this.elements.workoutDrawer.classList.add("expanded");
  }

  collapseWorkoutDrawer() {
    if (!this.elements.workoutDrawer) return;
    this.elements.workoutDrawer.classList.remove("expanded");
    this.elements.workoutDrawer.classList.add("collapsed");
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

    const allExercises = [...EXERCISE_DATABASE, ...storage.getCustomExercises()];
    const dbEntry = allExercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
    const muscle = dbEntry ? dbEntry.muscle : "Strength";

    if (this.elements.feedbackExName) {
      this.elements.feedbackExName.textContent = exerciseName;
    }
    if (this.elements.feedbackMuscle) {
      this.elements.feedbackMuscle.textContent = muscle;
    }

    // Micro-Trend Indicator
    if (this.elements.feedbackTrendBadge && this.elements.feedbackTrendText) {
      const trend = stats.microTrend;
      this.elements.feedbackTrendBadge.className = `trend-badge trend-${trend.direction}`;
      this.elements.feedbackTrendText.textContent = trend.text;
    }

    // Today's Row: Badge & Sets Flow
    if (this.elements.feedbackTodayBadge) {
      const count = stats.thisSession.setCount;
      const countStr = `${count} ${count === 1 ? 'set' : 'sets'}`;
      const volStr = `${stats.thisSession.volume.toLocaleString()} ${unit}`;
      this.elements.feedbackTodayBadge.textContent = `${countStr} • ${volStr}`;
    }

    if (this.elements.feedbackTodaySets) {
      const rawSets = stats.thisSession.rawSets || [];
      if (rawSets.length === 0) {
        this.elements.feedbackTodaySets.innerHTML = `<span class="stat-muted">No sets logged yet today</span>`;
      } else {
        const lastIdx = rawSets.length - 1;
        this.elements.feedbackTodaySets.innerHTML = rawSets.map((s, idx) => {
          const isLatest = idx === lastIdx;
          const w = s.weight || s.addedWeight || 0;
          const r = s.reps || 0;
          const str = `${w} ${s.unit || unit} × ${r}`;
          const itemHtml = `<span class="flow-set-item ${isLatest ? 'highlight-latest' : ''}">${str}</span>`;
          return idx > 0 ? `<span class="flow-divider">|</span>${itemHtml}` : itemHtml;
        }).join(" ");
      }
    }

    // Last Workout Row: Date, Badge & Sets Flow
    if (this.elements.feedbackLastDateLabel) {
      const dateStr = stats.lastSession ? `Last Workout (${stats.lastSession.formattedDate}):` : "Last Workout:";
      this.elements.feedbackLastDateLabel.textContent = dateStr;
    }

    if (this.elements.feedbackLastBadge) {
      if (stats.lastSession) {
        const count = stats.lastSession.setCount || 0;
        const countStr = `${count} ${count === 1 ? 'set' : 'sets'}`;
        const volStr = `${(stats.lastSession.volume || 0).toLocaleString()} ${unit}`;
        this.elements.feedbackLastBadge.textContent = `${countStr} • ${volStr}`;
      } else {
        this.elements.feedbackLastBadge.textContent = `0 sets • 0 ${unit}`;
      }
    }

    if (this.elements.feedbackLastSets) {
      if (stats.lastSession && Array.isArray(stats.lastSession.rawSets) && stats.lastSession.rawSets.length > 0) {
        this.elements.feedbackLastSets.innerHTML = stats.lastSession.rawSets.map((s, idx) => {
          const w = s.weight || s.addedWeight || 0;
          const r = s.reps || 0;
          const str = `${w} ${s.unit || unit} × ${r}`;
          const itemHtml = `<span class="flow-set-item">${str}</span>`;
          return idx > 0 ? `<span class="flow-divider">|</span>${itemHtml}` : itemHtml;
        }).join(" ");
      } else {
        this.elements.feedbackLastSets.innerHTML = `<span class="stat-muted">No previous history</span>`;
      }
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

    // Group sets by exercise name while preserving chronological sequence
    const exerciseMap = new Map();
    sets.forEach((set) => {
      const exName = set.exercise || "Unknown Exercise";
      if (!exerciseMap.has(exName)) {
        exerciseMap.set(exName, {
          exercise: exName,
          sets: [],
          lastTimestamp: new Date(set.timestamp || 0).getTime()
        });
      }
      const group = exerciseMap.get(exName);
      group.sets.push(set);
      group.lastTimestamp = Math.max(group.lastTimestamp, new Date(set.timestamp || 0).getTime());
    });

    // Sort exercise groups with most recently updated exercise first
    const sortedGroups = Array.from(exerciseMap.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    this.elements.activityList.innerHTML = sortedGroups.map(group => {
      const dbEntry = EXERCISE_DATABASE.find(e => e.name === group.exercise);
      const muscle = dbEntry ? dbEntry.muscle : "Strength";

      let groupVol = 0;
      group.sets.forEach(s => {
        const w = s.weight || s.addedWeight || 0;
        const r = typeof s.reps === "number" ? s.reps : 0;
        groupVol += w * r;
      });

      const setCountText = `${group.sets.length} ${group.sets.length === 1 ? "Set" : "Sets"}`;
      const volText = groupVol > 0 ? ` • ${groupVol.toLocaleString()} ${unit}` : "";

      const setsHtml = group.sets.map((set) => {
        let detailsHtml = "";

        if (set.type === "drop_set" && Array.isArray(set.drops)) {
          const dropSeq = set.drops.map(d => `${d.weight}${set.unit || unit} × ${d.reps}`).join(" → ");
          detailsHtml = `<span class="badge-tag drop-tag">DROP</span> <span>${dropSeq}</span>`;
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
          <div class="group-set-row" data-set-id="${set.id}">
            <div class="group-set-left">
              <div class="group-set-content">
                <div class="group-set-metrics">
                  ${detailsHtml}
                </div>
              </div>
            </div>
            <div class="group-set-actions">
              <!-- Duplicate Set -->
              <button class="btn-set-action btn-dup-action" data-dup-id="${set.id}" aria-label="Duplicate set" title="Duplicate set">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
              <!-- Edit Set -->
              <button class="btn-set-action btn-edit-action" data-edit-id="${set.id}" aria-label="Edit set" title="Edit set">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
              <!-- Delete Set -->
              <button class="btn-set-action btn-delete-action" data-delete-id="${set.id}" aria-label="Delete set" title="Delete set">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join("");

      return `
        <div class="exercise-group-card" data-exercise="${group.exercise}">
          <div class="group-card-header">
            <div class="group-card-title-wrap">
              <span class="group-card-title">${group.exercise}</span>
              <span class="group-card-subtitle">${muscle}</span>
            </div>
            <div class="group-card-meta">
              <span class="group-card-badge">${setCountText}${volText}</span>
            </div>
          </div>
          <div class="group-sets-list">
            ${setsHtml}
          </div>
        </div>
      `;
    }).join("");

    // Wire actions: Duplicate, Edit, Delete
    this.elements.activityList.querySelectorAll(".btn-delete-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-delete-id");
        if (id) {
          storage.deleteSet(id);
          this.renderTodaySession();
          const last = storage.getLastLoggedSet();
          if (last) {
            this.updateFeedbackCard(last.exercise);
          } else {
            this.renderInitialFeedbackCard();
          }
        }
      });
    });

    this.elements.activityList.querySelectorAll(".btn-dup-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-dup-id");
        if (id) {
          const allSets = storage.getTodaySession().sets || [];
          const targetSet = allSets.find(s => s.id === id);
          if (targetSet) {
            const duplicated = {
              ...targetSet,
              id: "set_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
              timestamp: new Date().toISOString()
            };
            storage.saveSet(duplicated);
            this.renderTodaySession();
            this.updateFeedbackCard(duplicated.exercise);
            audioFeedback.triggerCommitFeedback();
          }
        }
      });
    });

    this.elements.activityList.querySelectorAll(".btn-edit-action").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-edit-id");
        if (id) {
          this.openEditSetModal(id);
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

    // Check if exercise was previously logged or exists in history/catalog
    const exists = storage.exerciseExistsInHistory(this.activeConfirmPayload.exercise);
    const historyBadgeText = exists ? "LOGGED BEFORE" : "NEW EXERCISE";

    // Badges & Stepper Visibility
    if (this.activeConfirmPayload.type === "drop_set") {
      this.elements.confirmTypeBadge.textContent = historyBadgeText;
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-drop";
      this.elements.confirmStandardFields.style.display = "none";
      this.elements.confirmDropList.style.display = "flex";
      this.renderDropSetFields();
    } else if (this.activeConfirmPayload.type === "bodyweight") {
      this.elements.confirmTypeBadge.textContent = historyBadgeText;
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-bw";
      this.elements.confirmStandardFields.style.display = "grid";
      this.elements.confirmDropList.style.display = "none";
      this.updateStandardFields(this.activeConfirmPayload.addedWeight || 0, this.activeConfirmPayload.reps, `+${unit}`);
    } else if (this.activeConfirmPayload.type === "time") {
      this.elements.confirmTypeBadge.textContent = historyBadgeText;
      this.elements.confirmTypeBadge.className = "confirm-type-badge type-timed";
      this.elements.confirmStandardFields.style.display = "grid";
      this.elements.confirmDropList.style.display = "none";
      this.updateStandardFields(this.activeConfirmPayload.duration, 1, "sec");
    } else {
      this.elements.confirmTypeBadge.textContent = historyBadgeText;
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

      const remainingSec = Math.max(0, (2.5 - (elapsed / 1000))).toFixed(1);
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
      this.elements.colorCrawlStatusText.textContent = "Auto-confirming in 2.5s...";
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

  // =========================================================================
  // 8. Edit Set Modal Steppers & Actions
  // =========================================================================
  setupEditSetModal() {
    if (this.elements.editSetCloseBtn) {
      this.elements.editSetCloseBtn.addEventListener("click", () => this.closeEditSetModal());
    }
    if (this.elements.editSetCancelBtn) {
      this.elements.editSetCancelBtn.addEventListener("click", () => this.closeEditSetModal());
    }

    if (this.elements.btnEditWeightMinus) {
      this.elements.btnEditWeightMinus.addEventListener("click", () => {
        const cur = parseFloat(this.elements.editWeightValue.textContent) || 0;
        this.elements.editWeightValue.textContent = Math.max(0, cur - 5);
      });
    }

    if (this.elements.btnEditWeightPlus) {
      this.elements.btnEditWeightPlus.addEventListener("click", () => {
        const cur = parseFloat(this.elements.editWeightValue.textContent) || 0;
        this.elements.editWeightValue.textContent = cur + 5;
      });
    }

    if (this.elements.btnEditRepsMinus) {
      this.elements.btnEditRepsMinus.addEventListener("click", () => {
        const cur = parseInt(this.elements.editRepsValue.textContent, 10) || 1;
        this.elements.editRepsValue.textContent = Math.max(1, cur - 1);
      });
    }

    if (this.elements.btnEditRepsPlus) {
      this.elements.btnEditRepsPlus.addEventListener("click", () => {
        const cur = parseInt(this.elements.editRepsValue.textContent, 10) || 1;
        this.elements.editRepsValue.textContent = cur + 1;
      });
    }

    if (this.elements.editSetSaveBtn) {
      this.elements.editSetSaveBtn.addEventListener("click", () => {
        if (!this.activeEditingSetId) return;
        const newWeight = parseFloat(this.elements.editWeightValue.textContent) || 0;
        const newReps = parseInt(this.elements.editRepsValue.textContent, 10) || 1;

        const updated = storage.updateSet(this.activeEditingSetId, {
          weight: newWeight,
          reps: newReps
        });

        this.closeEditSetModal();
        this.renderTodaySession();
        if (updated) {
          this.updateFeedbackCard(updated.exercise);
        }
        audioFeedback.triggerCommitFeedback();
      });
    }
  }

  openEditSetModal(setId) {
    const allSets = storage.getTodaySession().sets || [];
    const target = allSets.find(s => s.id === setId);
    if (!target) return;

    this.activeEditingSetId = setId;
    const prefs = storage.getPreferences();

    if (this.elements.editSetTitle) {
      this.elements.editSetTitle.textContent = `Edit ${target.exercise}`;
    }
    if (this.elements.editWeightValue) {
      this.elements.editWeightValue.textContent = target.weight || target.addedWeight || 0;
    }
    if (this.elements.editWeightUnit) {
      this.elements.editWeightUnit.textContent = target.unit || prefs.unit;
    }
    if (this.elements.editRepsValue) {
      this.elements.editRepsValue.textContent = target.reps || 8;
    }

    if (this.elements.editSetModal) {
      this.elements.editSetModal.classList.add("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.add("visible");
    }
  }

  closeEditSetModal() {
    this.activeEditingSetId = null;
    if (this.elements.editSetModal) {
      this.elements.editSetModal.classList.remove("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.remove("visible");
    }
  }

  // =========================================================================
  // 9. Confirm Modal Rename / Custom Exercise Register
  // =========================================================================
  setupConfirmRename() {
    if (this.elements.confirmRenameBtn) {
      this.elements.confirmRenameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.pauseColorCrawl("Renaming exercise");
        this.openRenameModal();
      });
    }

    if (this.elements.customExerciseSaveBtn) {
      this.elements.customExerciseSaveBtn.addEventListener("click", () => {
        const val = (this.elements.customExerciseInput.value || "").trim();
        if (val) {
          this.applyExerciseRename(val);
        }
      });
    }

    if (this.elements.customExerciseInput) {
      this.elements.customExerciseInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = (this.elements.customExerciseInput.value || "").trim();
          if (val) {
            this.applyExerciseRename(val);
          }
        }
      });
    }
  }

  openRenameModal() {
    if (!this.activeConfirmPayload) return;
    const currentName = this.activeConfirmPayload.exercise || "";
    if (this.elements.customExerciseInput) {
      this.elements.customExerciseInput.value = currentName;
      setTimeout(() => this.elements.customExerciseInput.focus(), 100);
    }

    // List suggestions
    const customList = storage.getCustomExercises();
    const all = [...EXERCISE_DATABASE, ...customList];
    const topSuggestions = all.slice(0, 6);

    if (this.elements.renameSuggestionsList) {
      this.elements.renameSuggestionsList.innerHTML = topSuggestions.map(ex => `
        <button class="ambiguity-option-btn suggestion-pick-btn" data-name="${ex.name}">
          <div class="ambiguity-option-left">
            <span class="ambiguity-name">${ex.name}</span>
            <span class="ambiguity-sub">${ex.muscle || "Machine"}</span>
          </div>
        </button>
      `).join("");

      this.elements.renameSuggestionsList.querySelectorAll(".suggestion-pick-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const pickName = btn.getAttribute("data-name");
          if (pickName) this.applyExerciseRename(pickName);
        });
      });
    }

    if (this.elements.renameExerciseModal) {
      this.elements.renameExerciseModal.classList.add("visible");
    }
  }

  applyExerciseRename(newName) {
    if (!this.activeConfirmPayload) return;

    // Check if newName exists or save as custom
    const all = [...EXERCISE_DATABASE, ...storage.getCustomExercises()];
    const found = all.find(e => e.name.toLowerCase() === newName.toLowerCase());

    const finalName = found ? found.name : newName;
    if (!found) {
      storage.saveCustomExercise({
        name: finalName,
        muscle: "Custom",
        category: "machine",
        aliases: [finalName.toLowerCase()]
      });
    }

    this.activeConfirmPayload.exercise = finalName;
    if (this.elements.confirmExerciseTitle) {
      this.elements.confirmExerciseTitle.textContent = finalName;
    }

    const exists = storage.exerciseExistsInHistory(finalName);
    if (this.elements.confirmTypeBadge) {
      this.elements.confirmTypeBadge.textContent = exists ? "LOGGED BEFORE" : "NEW EXERCISE";
    }

    if (this.elements.renameExerciseModal) {
      this.elements.renameExerciseModal.classList.remove("visible");
    }
  }

  // =========================================================================
  // 10. Initial Unit Modal
  // =========================================================================
  showUnitChoiceModal(onChoice) {
    if (!this.elements.unitModal) return;
    this.elements.unitModal.classList.add("visible");
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.add("visible");
    }

    const select = (unit) => {
      storage.savePreferences({ unit, unitChosen: true });
      this.elements.unitModal.classList.remove("visible");
      if (this.elements.modalBackdrop) {
        this.elements.modalBackdrop.classList.remove("visible");
      }
      this.renderHeader();
      this.renderTodaySession();
      this.renderInitialFeedbackCard();
      if (onChoice) onChoice(unit);
    };

    if (this.elements.choiceUnitLbs) {
      this.elements.choiceUnitLbs.onclick = () => select("lbs");
    }
    if (this.elements.choiceUnitKg) {
      this.elements.choiceUnitKg.onclick = () => select("kg");
    }
  }
}

export const ui = new UIController();
