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
    this.colorCrawlDuration = 3000; // 3 seconds
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
    this.setupExerciseLogModal();
    this.setupDevToolsModal();
    this.setupHistoryModal();
    this.renderHeader();
    this.renderHeaderStreakPill();
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
      confirmDbHint: document.getElementById("confirm-db-hint"),
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
      themeBtnLight: document.getElementById("theme-btn-light"),
      themeBtnDark: document.getElementById("theme-btn-dark"),
      settingsUnitLbs: document.getElementById("settings-unit-lbs"),
      settingsUnitKg: document.getElementById("settings-unit-kg"),
      restDurationInput: document.getElementById("rest-duration-input"),
      restDurationValue: document.getElementById("rest-duration-value"),
      soundToggleCheckbox: document.getElementById("sound-toggle-checkbox"),
      hapticToggleCheckbox: document.getElementById("haptic-toggle-checkbox"),
      resetDataBtn: document.getElementById("reset-data-btn"),
      settingsSpotifyStatus: document.getElementById("settings-spotify-status"),
      settingsSpotifyBtn: document.getElementById("settings-spotify-btn"),
      devToolsSelect: document.getElementById("dev-tools-select"),
      devToolsFileInput: document.getElementById("dev-tools-file-input"),
      devToolsConfirmModal: document.getElementById("dev-tools-confirm-modal"),
      devConfirmTitle: document.getElementById("dev-confirm-title"),
      devConfirmCloseBtn: document.getElementById("dev-confirm-close-btn"),
      devConfirmIconBox: document.getElementById("dev-confirm-icon-box"),
      devConfirmDesc: document.getElementById("dev-confirm-desc"),
      devConfirmCancelBtn: document.getElementById("dev-confirm-cancel-btn"),
      devConfirmActionBtn: document.getElementById("dev-confirm-action-btn"),

      // Spotify Widget Elements
      spotifyWidgetContainer: document.getElementById("spotify-widget-container"),
      spotifyConnectPill: document.getElementById("spotify-connect-pill"),
      spotifyConnectBtn: document.getElementById("spotify-connect-btn"),
      spotifyDismissBtn: document.getElementById("spotify-dismiss-btn"),
      spotifyPlayerPill: document.getElementById("spotify-player-pill"),
      spotifyAlbumArtWrap: document.getElementById("spotify-album-art-wrap"),
      spotifyAlbumArt: document.getElementById("spotify-album-art"),
      spotifyArtPlaceholder: document.getElementById("spotify-art-placeholder"),
      spotifyTrackName: document.getElementById("spotify-track-name"),
      spotifyTrackSub: document.getElementById("spotify-track-sub"),
      spotifyPrevBtn: document.getElementById("spotify-prev-btn"),
      spotifyPlayBtn: document.getElementById("spotify-play-btn"),
      spotifyPlayIcon: document.getElementById("spotify-play-icon"),
      spotifyPauseIcon: document.getElementById("spotify-pause-icon"),
      spotifyNextBtn: document.getElementById("spotify-next-btn"),

      // Unit Choice Modal
      unitModal: document.getElementById("unit-modal"),
      choiceUnitLbs: document.getElementById("choice-unit-lbs"),
      choiceUnitKg: document.getElementById("choice-unit-kg"),

      // Edit Set Modal
      editSetModal: document.getElementById("edit-set-modal"),
      editSetTitle: document.getElementById("edit-set-title"),
      editSetCloseBtn: document.getElementById("edit-set-close-btn"),
      editDbHint: document.getElementById("edit-db-hint"),
      btnEditWeightMinus: document.getElementById("btn-edit-weight-minus"),
      btnEditWeightPlus: document.getElementById("btn-edit-weight-plus"),
      editWeightValue: document.getElementById("edit-weight-value"),
      editWeightUnit: document.getElementById("edit-weight-unit"),
      btnEditRepsMinus: document.getElementById("btn-edit-reps-minus"),
      btnEditRepsPlus: document.getElementById("btn-edit-reps-plus"),
      editRepsValue: document.getElementById("edit-reps-value"),
      editSetCancelBtn: document.getElementById("edit-set-cancel-btn"),
      editSetSaveBtn: document.getElementById("edit-set-save-btn"),
      editSetDupBtn: document.getElementById("edit-set-dup-btn"),
      editSetDeleteBtn: document.getElementById("edit-set-delete-btn"),

      // Rename / Custom Exercise Modal
      renameExerciseModal: document.getElementById("rename-exercise-modal"),
      customExerciseInput: document.getElementById("custom-exercise-input"),
      customExerciseSaveBtn: document.getElementById("custom-exercise-save-btn"),
      renameSuggestionsList: document.getElementById("rename-suggestions-list"),

      // History & Progress Modal & Controls
      headerStreakPill: document.getElementById("header-streak-pill"),
      headerStreakText: document.getElementById("header-streak-text"),
      drawerHistoryBtn: document.getElementById("drawer-history-btn"),
      drawerViewHistoryBtn: document.getElementById("drawer-view-history-btn"),
      historyModal: document.getElementById("history-modal"),
      historyModalCloseBtn: document.getElementById("history-modal-close-btn"),
      historyTab30d: document.getElementById("history-tab-30d"),
      historyTabLifetime: document.getElementById("history-tab-lifetime"),
      historyOverviewView: document.getElementById("history-overview-view"),
      historyCalendarView: document.getElementById("history-calendar-view"),
      historyPrsView: document.getElementById("history-prs-view"),
      historyVolumeView: document.getElementById("history-volume-view"),
      hpCardConsistency: document.getElementById("hp-card-consistency"),
      hpCardStrength: document.getElementById("hp-card-strength"),
      hpCardVolume: document.getElementById("hp-card-volume"),
      hpConsistencyHeadline: document.getElementById("hp-consistency-headline"),
      hpConsistencySub: document.getElementById("hp-consistency-sub"),
      hpMiniCalendar: document.getElementById("hp-mini-calendar"),
      hpStrengthHeadline: document.getElementById("hp-strength-headline"),
      hpStrengthSub: document.getElementById("hp-strength-sub"),
      hpStrengthPillRow: document.getElementById("hp-strength-pill-row"),
      hpVolumeNum: document.getElementById("hp-volume-num"),
      hpSetsNum: document.getElementById("hp-sets-num"),
      hpVolumeMilestone: document.getElementById("hp-volume-milestone"),
      hpSpotlightTitle: document.getElementById("hp-spotlight-title"),
      hpSpotlightSub: document.getElementById("hp-spotlight-sub"),
      hpSpotlightFill: document.getElementById("hp-spotlight-fill"),
      historyBackFromCalendar: document.getElementById("history-back-from-calendar"),
      historyBackFromPrs: document.getElementById("history-back-from-prs"),
      historyBackFromVolume: document.getElementById("history-back-from-volume"),
      calendarActiveDaysPill: document.getElementById("calendar-active-days-pill"),
      calendarStreakPill: document.getElementById("calendar-streak-pill"),
      historyCalendarGrid: document.getElementById("history-calendar-grid"),
      historySessionsFeed: document.getElementById("history-sessions-feed"),
      historyPrsList: document.getElementById("history-prs-list"),
      volumeHeroIcon: document.getElementById("volume-hero-icon"),
      volumeHeroNum: document.getElementById("volume-hero-num"),
      volumeHeroDesc: document.getElementById("volume-hero-desc"),
      historyVolumeBars: document.getElementById("history-volume-bars"),

      // Individual Exercise Log Modal
      exerciseLogModal: document.getElementById("exercise-log-modal"),
      exerciseLogTitle: document.getElementById("exercise-log-title"),
      exerciseLogMuscle: document.getElementById("exercise-log-muscle"),
      exerciseLogCloseBtn: document.getElementById("exercise-log-close-btn"),
      exerciseLogSessionsList: document.getElementById("exercise-log-sessions-list"),
      exerciseLogCountPill: document.getElementById("exercise-log-count-pill"),
      exerciseGraphContainer: document.getElementById("exercise-graph-container"),
      exerciseGraphSvg: document.getElementById("exercise-graph-svg"),
      graphInteractionLayer: document.getElementById("graph-interaction-layer"),
      graphTooltip: document.getElementById("graph-tooltip"),
      graphTooltipDate: document.getElementById("graph-tooltip-date"),
      graphTooltipMax: document.getElementById("graph-tooltip-max"),
      graphTooltipVol: document.getElementById("graph-tooltip-vol"),
      graphYMaxTop: document.getElementById("graph-y-max-top"),
      graphYMaxBottom: document.getElementById("graph-y-max-bottom"),
      graphYVolTop: document.getElementById("graph-y-vol-top"),
      graphYVolBottom: document.getElementById("graph-y-vol-bottom"),
      graphXFirstDate: document.getElementById("graph-x-first-date"),
      graphXLastDate: document.getElementById("graph-x-last-date")
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
    this.applyTheme(prefs.theme || "light");
  }

  applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    if (this.elements.themeBtnLight && this.elements.themeBtnDark) {
      this.elements.themeBtnLight.classList.toggle("active", theme !== "dark");
      this.elements.themeBtnDark.classList.toggle("active", theme === "dark");
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

    const formatSetText = (s) => {
      const r = s.reps || 0;
      if (s.type === "bodyweight" || s.isBodyweight) {
        const added = s.addedWeight > 0 ? `+${s.addedWeight} ${s.unit || unit}` : (s.weight > 0 ? `${s.weight} ${s.unit || unit}` : "BW");
        return `${added} × ${r}`;
      }
      const w = s.weight || s.addedWeight || 0;
      return `${w} ${s.unit || unit} × ${r}`;
    };

    if (this.elements.feedbackTodaySets) {
      const rawSets = stats.thisSession?.rawSets || stats.thisSession?.sets || [];
      if (!rawSets || rawSets.length === 0) {
        this.elements.feedbackTodaySets.innerHTML = `<span class="stat-muted">No sets logged yet today</span>`;
      } else {
        const lastIdx = rawSets.length - 1;
        this.elements.feedbackTodaySets.innerHTML = rawSets.map((s, idx) => {
          const isLatest = idx === lastIdx;
          const str = formatSetText(s);
          const itemHtml = `<button class="flow-set-item flow-set-btn ${isLatest ? 'highlight-latest' : ''}" data-set-id="${s.id || ''}" title="Tap to edit set" aria-label="Edit set ${str}">${str}</button>`;
          return idx > 0 ? `<span class="flow-divider">|</span>${itemHtml}` : itemHtml;
        }).join(" ");

        this.elements.feedbackTodaySets.querySelectorAll(".flow-set-btn").forEach(btn => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sid = btn.getAttribute("data-set-id");
            if (sid) this.openEditSetModal(sid);
          });
        });
      }
    }

    // Last Workout Row: Date, Badge & Sets Flow
    if (this.elements.feedbackLastDateLabel) {
      const dateStr = stats.lastSession ? `Last Workout (${stats.lastSession.formattedDate}):` : "Last Workout:";
      this.elements.feedbackLastDateLabel.textContent = dateStr;
    }

    if (this.elements.feedbackLastBadge) {
      if (stats.lastSession) {
        const count = stats.lastSession.setCount ?? (stats.lastSession.sets ? stats.lastSession.sets.length : 0);
        const countStr = `${count} ${count === 1 ? 'set' : 'sets'}`;
        const volStr = `${(stats.lastSession.volume || 0).toLocaleString()} ${unit}`;
        this.elements.feedbackLastBadge.textContent = `${countStr} • ${volStr}`;
      } else {
        this.elements.feedbackLastBadge.textContent = `0 sets • 0 ${unit}`;
      }
    }

    if (this.elements.feedbackLastSets) {
      const pastSets = stats.lastSession?.rawSets || stats.lastSession?.sets || [];
      if (stats.lastSession && Array.isArray(pastSets) && pastSets.length > 0) {
        this.elements.feedbackLastSets.innerHTML = pastSets.map((s, idx) => {
          const str = formatSetText(s);
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

    this.renderHeaderStreakPill();

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

    const allExercises = [...EXERCISE_DATABASE, ...storage.getCustomExercises()];

    const formatSetText = (s) => {
      const r = s.reps || 0;
      if (s.type === "bodyweight" || s.isBodyweight) {
        const added = s.addedWeight > 0 ? `+${s.addedWeight} ${s.unit || unit}` : (s.weight > 0 ? `${s.weight} ${s.unit || unit}` : "BW");
        return `${added} × ${r}`;
      }
      const w = s.weight || s.addedWeight || 0;
      return `${w} ${s.unit || unit} × ${r}`;
    };

    this.elements.activityList.innerHTML = sortedGroups.map(group => {
      const dbEntry = allExercises.find(e => (e.name || "").trim().toLowerCase() === group.exercise.trim().toLowerCase());
      const muscle = dbEntry ? dbEntry.muscle : "Strength";
      const stats = storage.getExerciseComparativeStats(group.exercise);

      // Micro-Trend Indicator
      const trend = stats?.microTrend || { text: "Logged today", direction: "neutral", arrow: "🎯" };

      // Today's Row data
      const todayCount = stats?.thisSession?.setCount || group.sets.length;
      const todayCountStr = `${todayCount} ${todayCount === 1 ? 'set' : 'sets'}`;
      const todayVol = stats?.thisSession?.volume ?? group.sets.reduce((sum, s) => sum + ((s.weight || s.addedWeight || 0) * (s.reps || 0)), 0);
      const todayVolStr = `${todayVol.toLocaleString()} ${unit}`;

      const rawTodaySets = stats?.thisSession?.rawSets || group.sets;
      let todaySetsHtml = "";
      if (!rawTodaySets || rawTodaySets.length === 0) {
        todaySetsHtml = `<span class="stat-muted">No sets logged yet today</span>`;
      } else {
        const lastIdx = rawTodaySets.length - 1;
        todaySetsHtml = rawTodaySets.map((s, idx) => {
          const isLatest = idx === lastIdx;
          const str = formatSetText(s);
          const itemHtml = `<button class="flow-set-item flow-set-btn ${isLatest ? 'highlight-latest' : ''}" data-set-id="${s.id || ''}" title="Tap to edit set" aria-label="Edit set ${str}">${str}</button>`;
          return idx > 0 ? `<span class="flow-divider">|</span>${itemHtml}` : itemHtml;
        }).join(" ");
      }

      // Last Workout Row data
      let lastDateLabel = "Last Workout:";
      let lastCountStr = `0 sets • 0 ${unit}`;
      let lastSetsHtml = `<span class="stat-muted">No previous history</span>`;

      if (stats?.lastSession) {
        lastDateLabel = `Last Workout (${stats.lastSession.formattedDate}):`;
        const lastCount = stats.lastSession.setCount ?? (stats.lastSession.sets ? stats.lastSession.sets.length : 0);
        const lCountStr = `${lastCount} ${lastCount === 1 ? 'set' : 'sets'}`;
        const lVolStr = `${(stats.lastSession.volume || 0).toLocaleString()} ${unit}`;
        lastCountStr = `${lCountStr} • ${lVolStr}`;

        const pastSets = stats.lastSession.rawSets || stats.lastSession.sets || [];
        if (Array.isArray(pastSets) && pastSets.length > 0) {
          lastSetsHtml = pastSets.map((s, idx) => {
            const str = formatSetText(s);
            const itemHtml = `<span class="flow-set-item">${str}</span>`;
            return idx > 0 ? `<span class="flow-divider">|</span>${itemHtml}` : itemHtml;
          }).join(" ");
        }
      }

      return `
        <div class="feedback-card drawer-exercise-card" data-exercise="${group.exercise}">
          <div class="feedback-header-row">
            <div class="feedback-title-group">
              <h2 class="feedback-ex-title">${group.exercise}</h2>
              <span class="feedback-muscle-badge">${muscle}</span>
            </div>
            <div class="trend-badge trend-${trend.direction}">
              <span class="trend-arrow">${trend.arrow || '🎯'}</span>
              <span class="trend-text">${trend.text}</span>
            </div>
          </div>

          <div class="feedback-stats-grid">
            <!-- Today Row: Left "Today:", Right Sets Badge, Bottom Sets Flow -->
            <div class="feedback-session-block">
              <div class="session-block-header">
                <span class="session-block-title">Today:</span>
                <span class="session-badge-green">${todayCountStr} • ${todayVolStr}</span>
              </div>
              <div class="session-sets-flow">
                ${todaySetsHtml}
              </div>
            </div>

            <div class="feedback-divider"></div>

            <!-- Last Workout Row: Left "Last Workout (Date):", Right Sets Badge, Bottom Sets Flow -->
            <div class="feedback-session-block">
              <div class="session-block-header">
                <span class="session-block-title">${lastDateLabel}</span>
                <span class="session-badge-neutral">${lastCountStr}</span>
              </div>
              <div class="session-sets-flow">
                ${lastSetsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Wire set pills in the drawer to open edit set modal
    this.elements.activityList.querySelectorAll(".flow-set-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const setId = btn.getAttribute("data-set-id");
        if (setId) {
          this.openEditSetModal(setId);
        }
      });
    });

    // Wire clicking on exercise card to open individual Exercise Log (and update top card)
    this.elements.activityList.querySelectorAll(".drawer-exercise-card").forEach(card => {
      card.addEventListener("click", () => {
        const exName = card.getAttribute("data-exercise");
        if (exName) {
          this.updateFeedbackCard(exName);
          this.openExerciseLogModal(exName);
        }
      });
    });
  }

  // =========================================================================
  // 3. Confirmation Modal & 4-Second "Color Crawl" Animation (PRD 3.3)
  // =========================================================================
  isDumbbellExercise(exerciseName) {
    if (!exerciseName) return false;
    const lower = exerciseName.toLowerCase();
    if (lower.includes("dumbbell") || lower.includes("db ") || lower.startsWith("db")) return true;
    const allExercises = [...EXERCISE_DATABASE, ...storage.getCustomExercises()];
    const found = allExercises.find(e => (e.name || "").toLowerCase() === lower);
    if (!found) return false;
    return (found.aliases || []).some(a => a.startsWith("db ") || a.includes("dumbbell"));
  }

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

    // Show/hide per-hand DB hint
    const isDbExercise = this.isDumbbellExercise(this.activeConfirmPayload.exercise);
    if (this.elements.confirmDbHint) {
      this.elements.confirmDbHint.style.display = isDbExercise ? "inline-block" : "none";
    }

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

      const remainingSec = Math.max(0, (3.0 - (elapsed / 1000))).toFixed(1);
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
      this.elements.colorCrawlStatusText.textContent = "Auto-confirming in 3.0s...";
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
  // 4. Ambiguity Bottom Drawer (PRD 3.2 & BUG-002)
  // =========================================================================
  showAmbiguityDrawer(spokenTerm, topMatches, onSelect, onRegisterCustom = null, customCandidateName = "") {
    if (this.elements.ambiguitySpokenTerm) {
      this.elements.ambiguitySpokenTerm.textContent = `"${spokenTerm}"`;
    }

    if (this.elements.ambiguityOptionsList) {
      let optionsHtml = topMatches.map((m, idx) => `
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

      // Add 1-tap "Register as Custom Exercise" option
      if (onRegisterCustom) {
        const displayName = customCandidateName || spokenTerm;
        optionsHtml += `
          <button id="ambiguity-register-custom-btn" class="ambiguity-option-btn ambiguity-register-custom-btn">
            <div class="ambiguity-option-left">
              <span class="ambiguity-register-icon">+</span>
              <div class="ambiguity-text-group">
                <span class="ambiguity-name" style="color: var(--accent-green);">Register as Custom Exercise</span>
                <span class="ambiguity-sub">Save "${displayName}" as a custom exercise</span>
              </div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `;
      }

      this.elements.ambiguityOptionsList.innerHTML = optionsHtml;

      this.elements.ambiguityOptionsList.querySelectorAll(".ambiguity-option-btn:not(#ambiguity-register-custom-btn)").forEach(btn => {
        btn.addEventListener("click", () => {
          const exName = btn.getAttribute("data-ex-name");
          this.closeAmbiguityDrawer();
          if (onSelect) onSelect(exName);
        });
      });

      const registerBtn = this.elements.ambiguityOptionsList.querySelector("#ambiguity-register-custom-btn");
      if (registerBtn) {
        registerBtn.addEventListener("click", () => {
          this.closeAmbiguityDrawer();
          if (onRegisterCustom) onRegisterCustom();
        });
      }
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

    if (this.elements.editSetDupBtn) {
      this.elements.editSetDupBtn.addEventListener("click", () => {
        if (!this.activeEditingSetId) return;
        const allSets = storage.getTodaySession().sets || [];
        const targetSet = allSets.find(s => s.id === this.activeEditingSetId);
        if (targetSet) {
          const duplicated = {
            ...targetSet,
            id: "set_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6),
            timestamp: new Date().toISOString()
          };
          storage.logSet(duplicated);
          this.closeEditSetModal();
          this.renderTodaySession();
          this.updateFeedbackCard(duplicated.exercise);
          audioFeedback.triggerCommitFeedback();
        }
      });
    }

    if (this.elements.editSetDeleteBtn) {
      this.elements.editSetDeleteBtn.addEventListener("click", () => {
        if (!this.activeEditingSetId) return;
        const idToDelete = this.activeEditingSetId;
        storage.deleteSet(idToDelete);
        this.closeEditSetModal();
        this.renderTodaySession();
        const last = storage.getLastLoggedSet();
        if (last) {
          this.updateFeedbackCard(last.exercise);
        } else {
          this.renderInitialFeedbackCard();
        }
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

    const isDbExercise = this.isDumbbellExercise(target.exercise);
    if (this.elements.editDbHint) {
      this.elements.editDbHint.style.display = isDbExercise ? "inline-block" : "none";
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

  // =========================================================================
  // 11. Individual Exercise Log & Dual-Axis Progress Graph
  // =========================================================================
  setupExerciseLogModal() {
    // Top feedback card click opens Exercise Log for that exercise
    if (this.elements.feedbackCard) {
      this.elements.feedbackCard.addEventListener("click", () => {
        const titleEl = this.elements.feedbackExName;
        const exName = titleEl ? titleEl.textContent.trim() : null;
        if (exName) {
          this.openExerciseLogModal(exName);
        }
      });
    }

    if (this.elements.exerciseLogCloseBtn) {
      this.elements.exerciseLogCloseBtn.addEventListener("click", () => {
        this.closeExerciseLogModal();
      });
    }

    this.setupGraphInteractions();
  }

  openExerciseLogModal(exerciseName) {
    if (!exerciseName) return;

    const prefs = storage.getPreferences();
    const unit = prefs.unit || "lbs";

    const allExercises = [...EXERCISE_DATABASE, ...storage.getCustomExercises()];
    const dbEntry = allExercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
    const muscle = dbEntry ? dbEntry.muscle : "Strength";

    if (this.elements.exerciseLogTitle) {
      this.elements.exerciseLogTitle.textContent = exerciseName;
    }
    if (this.elements.exerciseLogMuscle) {
      this.elements.exerciseLogMuscle.textContent = muscle;
    }

    const historySessions = storage.getExerciseHistory(exerciseName);

    if (this.elements.exerciseLogCountPill) {
      const count = historySessions.length;
      this.elements.exerciseLogCountPill.textContent = `${count} ${count === 1 ? 'Session' : 'Sessions'}`;
    }

    // Render Progress Graph
    this.renderExerciseGraph(historySessions, unit);

    // Render Sessions List (sorted newest first for chronological log list)
    this.renderExerciseSessionsList(historySessions, unit);

    if (this.elements.exerciseLogModal) {
      this.elements.exerciseLogModal.classList.add("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.add("visible");
    }
  }

  closeExerciseLogModal() {
    if (this.elements.exerciseLogModal) {
      this.elements.exerciseLogModal.classList.remove("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.remove("visible");
    }
    if (this.elements.graphTooltip) {
      this.elements.graphTooltip.classList.remove("visible");
    }
  }

  renderExerciseSessionsList(historySessions, unit) {
    if (!this.elements.exerciseLogSessionsList) return;

    if (!historySessions || historySessions.length === 0) {
      this.elements.exerciseLogSessionsList.innerHTML = `
        <div class="activity-empty-state" style="padding: 24px 0;">
          <span class="activity-empty-text">No recorded sessions</span>
          <span class="activity-empty-sub">Log this exercise to track progress over time</span>
        </div>
      `;
      return;
    }

    // Display list with newest date at the top
    const displayList = [...historySessions].reverse();

    const formatSetRow = (s, idx) => {
      const r = s.reps || 0;
      let wStr = "";
      if (s.type === "bodyweight" || s.isBodyweight) {
        wStr = s.addedWeight > 0 ? `+${s.addedWeight} ${s.unit || unit}` : (s.weight > 0 ? `${s.weight} ${s.unit || unit}` : "BW");
      } else {
        const w = s.weight || s.addedWeight || 0;
        wStr = `${w} ${s.unit || unit}`;
      }
      const vol = (s.weight || s.addedWeight || 0) * r;
      return `
        <div class="log-set-row">
          <span class="log-set-num">Set ${idx + 1}</span>
          <span class="log-set-data">${wStr} × ${r}</span>
          <span class="log-set-vol">${vol > 0 ? `${vol.toLocaleString()} ${unit}` : ''}</span>
        </div>
      `;
    };

    this.elements.exerciseLogSessionsList.innerHTML = displayList.map(session => {
      const setsHtml = session.sets.map((s, idx) => formatSetRow(s, idx)).join("");
      return `
        <div class="log-session-card" data-date="${session.date}">
          <div class="log-session-header">
            <div class="log-session-left">
              <svg class="log-session-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
              <span class="log-session-date">${session.formattedDate}</span>
            </div>
            <div class="log-session-tags">
              <span class="log-tag-sets">${session.totalSets} ${session.totalSets === 1 ? 'set' : 'sets'}</span>
              <span class="log-tag-vol">${session.totalVolume.toLocaleString()} ${unit}</span>
            </div>
          </div>
          <div class="log-session-details">
            <div class="log-sets-table">
              ${setsHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Wire tap date to toggle expand/collapse sets
    this.elements.exerciseLogSessionsList.querySelectorAll(".log-session-header").forEach(header => {
      header.addEventListener("click", () => {
        const card = header.closest(".log-session-card");
        if (card) {
          card.classList.toggle("expanded");
        }
      });
    });
  }

  renderExerciseGraph(historySessions, unit) {
    this.activeGraphSessions = historySessions || [];

    const svg = this.elements.exerciseGraphSvg;
    if (!svg) return;

    if (!historySessions || historySessions.length === 0) {
      if (this.elements.graphYMaxTop) this.elements.graphYMaxTop.textContent = "--";
      if (this.elements.graphYMaxBottom) this.elements.graphYMaxBottom.textContent = "--";
      if (this.elements.graphYVolTop) this.elements.graphYVolTop.textContent = "--";
      if (this.elements.graphYVolBottom) this.elements.graphYVolBottom.textContent = "--";
      if (this.elements.graphXFirstDate) this.elements.graphXFirstDate.textContent = "--";
      if (this.elements.graphXLastDate) this.elements.graphXLastDate.textContent = "--";
      svg.innerHTML = `
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-size="11" font-family="-apple-system, sans-serif">
          No workout data yet
        </text>
      `;
      return;
    }

    // Date range labels (First & Last only)
    const firstDateStr = historySessions[0].formattedDate;
    const lastDateStr = historySessions[historySessions.length - 1].formattedDate;
    if (this.elements.graphXFirstDate) this.elements.graphXFirstDate.textContent = firstDateStr;
    if (this.elements.graphXLastDate) this.elements.graphXLastDate.textContent = lastDateStr;

    // Calculate Y-axis bounds
    const maxWeights = historySessions.map(s => s.maxWeight);
    const volumes = historySessions.map(s => s.totalVolume);

    let rawMaxW = Math.max(...maxWeights, 0);
    let rawMinW = Math.min(...maxWeights);
    if (rawMinW === rawMaxW) rawMinW = Math.max(0, rawMaxW - 10);
    let topMaxW = Math.ceil(rawMaxW > 0 ? rawMaxW * 1.05 : 100);
    let bottomMaxW = Math.floor(Math.max(0, rawMinW * 0.9));

    let rawMaxV = Math.max(...volumes, 0);
    let rawMinV = Math.min(...volumes);
    if (rawMinV === rawMaxV) rawMinV = Math.max(0, rawMaxV - 100);
    let topVol = Math.ceil(rawMaxV > 0 ? rawMaxV * 1.1 : 1000);
    let bottomVol = Math.floor(Math.max(0, rawMinV * 0.85));

    // Update Y-Axis number labels
    if (this.elements.graphYMaxTop) this.elements.graphYMaxTop.textContent = topMaxW.toLocaleString();
    if (this.elements.graphYMaxBottom) this.elements.graphYMaxBottom.textContent = bottomMaxW.toLocaleString();
    if (this.elements.graphYVolTop) this.elements.graphYVolTop.textContent = topVol.toLocaleString();
    if (this.elements.graphYVolBottom) this.elements.graphYVolBottom.textContent = bottomVol.toLocaleString();

    // SVG coordinates
    const W = 320;
    const H = 150;
    const padTop = 15;
    const padBottom = 15;
    const padLeft = 10;
    const padRight = 10;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;

    const n = historySessions.length;

    // Calculate points for Max Weight and Volume
    const pointsMax = [];
    const pointsVol = [];
    this.graphPointsData = [];

    for (let i = 0; i < n; i++) {
      const s = historySessions[i];
      const x = n === 1 ? W / 2 : padLeft + (i / (n - 1)) * chartW;

      // Y for Max Weight
      const maxWNorm = topMaxW === bottomMaxW ? 0.5 : (s.maxWeight - bottomMaxW) / (topMaxW - bottomMaxW);
      const yMax = padTop + (1 - Math.max(0, Math.min(1, maxWNorm))) * chartH;

      // Y for Volume
      const volNorm = topVol === bottomVol ? 0.5 : (s.totalVolume - bottomVol) / (topVol - bottomVol);
      const yVol = padTop + (1 - Math.max(0, Math.min(1, volNorm))) * chartH;

      pointsMax.push({ x, y: yMax });
      pointsVol.push({ x, y: yVol });
      this.graphPointsData.push({
        x,
        yMax,
        yVol,
        session: s
      });
    }

    // Build SVG paths
    const makePath = (pts) => {
      if (pts.length === 0) return "";
      if (pts.length === 1) return `M ${pts[0].x - 6} ${pts[0].y} L ${pts[0].x + 6} ${pts[0].y}`;
      return pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    };

    const pathMaxStr = makePath(pointsMax);
    const pathVolStr = makePath(pointsVol);

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const gridLineColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)";
    const baseLineColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
    const dotStrokeColor = isDark ? "#0a0c0f" : "#ffffff";

    // SVG elements
    let svgContent = `
      <defs>
        <linearGradient id="grid-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${gridLineColor}"/>
          <stop offset="100%" stop-color="transparent"/>
        </linearGradient>
      </defs>

      <!-- Horizontal reference lines -->
      <line x1="${padLeft}" y1="${padTop}" x2="${W - padRight}" y2="${padTop}" stroke="${gridLineColor}" stroke-dasharray="3 3"/>
      <line x1="${padLeft}" y1="${padTop + chartH / 2}" x2="${W - padRight}" y2="${padTop + chartH / 2}" stroke="${gridLineColor}" stroke-dasharray="3 3"/>
      <line x1="${padLeft}" y1="${H - padBottom}" x2="${W - padRight}" y2="${H - padBottom}" stroke="${baseLineColor}"/>

      <!-- Volume line (Cyan) -->
      <path d="${pathVolStr}" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

      <!-- Max Weight line (Neon Green) -->
      <path d="${pathMaxStr}" fill="none" stroke="#00f59b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    // Add dots for each session point
    for (const p of this.graphPointsData) {
      svgContent += `
        <!-- Vol Dot -->
        <circle cx="${p.x.toFixed(1)}" cy="${p.yVol.toFixed(1)}" r="3.5" fill="#00e5ff" stroke="${dotStrokeColor}" stroke-width="1.5"/>
        <!-- Max Dot -->
        <circle cx="${p.x.toFixed(1)}" cy="${p.yMax.toFixed(1)}" r="3.5" fill="#00f59b" stroke="${dotStrokeColor}" stroke-width="1.5"/>
      `;
    }

    // Dynamic hover indicator element
    svgContent += `<line id="graph-cursor-line" x1="0" y1="0" x2="0" y2="${H}" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="2 2" style="opacity:0; transition:opacity 0.15s ease;"/>`;

    svg.innerHTML = svgContent;
  }

  setupGraphInteractions() {
    const layer = this.elements.graphInteractionLayer;
    if (!layer) return;

    let isHolding = false;

    const handlePointerMove = (clientX) => {
      if (!this.graphPointsData || this.graphPointsData.length === 0) return;

      const rect = layer.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const normalizedRatio = Math.max(0, Math.min(1, relativeX / rect.width));
      const targetSvgX = normalizedRatio * 320;

      // Find nearest data point
      let nearest = this.graphPointsData[0];
      let minDiff = Math.abs(this.graphPointsData[0].x - targetSvgX);

      for (let i = 1; i < this.graphPointsData.length; i++) {
        const diff = Math.abs(this.graphPointsData[i].x - targetSvgX);
        if (diff < minDiff) {
          minDiff = diff;
          nearest = this.graphPointsData[i];
        }
      }

      if (!nearest) return;

      const prefs = storage.getPreferences();
      const unit = prefs.unit || "lbs";

      // Position Tooltip
      if (this.elements.graphTooltip) {
        const tooltipX = (nearest.x / 320) * rect.width;
        this.elements.graphTooltip.style.left = `${tooltipX}px`;
        this.elements.graphTooltip.classList.add("visible");
      }

      if (this.elements.graphTooltipDate) {
        this.elements.graphTooltipDate.textContent = nearest.session.formattedDate;
      }
      if (this.elements.graphTooltipMax) {
        this.elements.graphTooltipMax.textContent = `Max: ${nearest.session.maxWeight} ${unit}`;
      }
      if (this.elements.graphTooltipVol) {
        this.elements.graphTooltipVol.textContent = `Vol: ${nearest.session.totalVolume.toLocaleString()} ${unit}`;
      }

      // Cursor line in SVG
      const cursorLine = document.getElementById("graph-cursor-line");
      if (cursorLine) {
        cursorLine.setAttribute("x1", nearest.x.toFixed(1));
        cursorLine.setAttribute("x2", nearest.x.toFixed(1));
        cursorLine.style.opacity = "1";
      }
    };

    const handlePointerEnd = () => {
      isHolding = false;
      if (this.elements.graphTooltip) {
        this.elements.graphTooltip.classList.remove("visible");
      }
      const cursorLine = document.getElementById("graph-cursor-line");
      if (cursorLine) {
        cursorLine.style.opacity = "0";
      }
    };

    // Pointer events (works for mouse and touch seamlessly)
    layer.addEventListener("pointerdown", (e) => {
      isHolding = true;
      layer.setPointerCapture(e.pointerId);
      handlePointerMove(e.clientX);
    });

    layer.addEventListener("pointermove", (e) => {
      if (isHolding) {
        handlePointerMove(e.clientX);
      }
    });

    layer.addEventListener("pointerup", (e) => {
      try { layer.releasePointerCapture(e.pointerId); } catch (_) {}
      handlePointerEnd();
    });

    layer.addEventListener("pointercancel", (e) => {
      try { layer.releasePointerCapture(e.pointerId); } catch (_) {}
      handlePointerEnd();
    });
  }

  // =========================================================================
  // 11. Dev Tools Modal & Action Execution
  // =========================================================================
  setupDevToolsModal() {
    this.pendingDevAction = null;

    if (this.elements.devConfirmCloseBtn) {
      this.elements.devConfirmCloseBtn.addEventListener("click", () => this.closeDevToolsConfirmModal());
    }
    if (this.elements.devConfirmCancelBtn) {
      this.elements.devConfirmCancelBtn.addEventListener("click", () => this.closeDevToolsConfirmModal());
    }

    if (this.elements.devConfirmActionBtn) {
      this.elements.devConfirmActionBtn.addEventListener("click", () => {
        const action = this.pendingDevAction;
        this.closeDevToolsConfirmModal();
        if (action) {
          this.executeDevToolAction(action);
        }
      });
    }

    if (this.elements.devToolsSelect) {
      this.elements.devToolsSelect.addEventListener("change", (e) => {
        const action = e.target.value;
        if (!action) return;
        this.showDevToolsConfirmModal(action);
      });
    }

    if (this.elements.devToolsFileInput) {
      this.elements.devToolsFileInput.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const raw = event.target.result;
            storage.importWorkoutData(raw);
            this.renderTodaySession();
            this.renderHeader();
            const last = storage.getLastLoggedSet();
            if (last) {
              this.updateFeedbackCard(last.exercise);
            } else {
              this.renderInitialFeedbackCard();
            }
            alert("Workout data imported successfully!");
          } catch (err) {
            console.error("Failed to import data", err);
            alert("Import failed: " + (err.message || "Invalid file format"));
          } finally {
            e.target.value = "";
          }
        };
        reader.readAsText(file);
      });
    }
  }

  showDevToolsConfirmModal(action) {
    this.pendingDevAction = action;

    const actionConfig = {
      export: {
        title: "Export Workout Data",
        desc: "Download a full JSON backup of all recorded workout history, custom exercises, and user preferences.",
        btnText: "Export JSON",
        isDanger: false,
        iconTheme: "icon-cyan",
        iconSvg: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>`
      },
      import: {
        title: "Import Workout Data",
        desc: "Restore workout history from a JSON file. This will replace or update existing workout logs.",
        btnText: "Choose File",
        isDanger: false,
        iconTheme: "icon-green",
        iconSvg: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>`
      },
      clear: {
        title: "Clear All Workout Data",
        desc: "Permanently erase all logged workout sets and session history. This action cannot be undone.",
        btnText: "Clear All Data",
        isDanger: true,
        iconTheme: "icon-red",
        iconSvg: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>`
      },
      generate: {
        title: "Generate Sample Data",
        desc: "Populate a realistic 3-month profile: 15 exercises (Push, Pull, Legs) logged 3x/week with progressive overload to test volume curves and long-term charts.",
        btnText: "Generate Data",
        isDanger: false,
        iconTheme: "icon-amber",
        iconSvg: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>`
      }
    };

    const cfg = actionConfig[action] || {
      title: "Confirm Action",
      desc: "Proceed with selected developer tool action?",
      btnText: "Proceed",
      isDanger: false,
      iconTheme: "icon-green",
      iconSvg: ""
    };

    if (this.elements.devConfirmTitle) this.elements.devConfirmTitle.textContent = cfg.title;
    if (this.elements.devConfirmDesc) this.elements.devConfirmDesc.textContent = cfg.desc;
    if (this.elements.devConfirmIconBox) {
      this.elements.devConfirmIconBox.className = `dev-confirm-icon-box ${cfg.iconTheme}`;
      this.elements.devConfirmIconBox.innerHTML = cfg.iconSvg;
    }
    if (this.elements.devConfirmActionBtn) {
      this.elements.devConfirmActionBtn.textContent = cfg.btnText;
      this.elements.devConfirmActionBtn.className = `btn-confirm-action dev-confirm-execute-btn ${cfg.isDanger ? "btn-danger" : ""}`;
    }

    if (this.elements.devToolsConfirmModal) {
      this.elements.devToolsConfirmModal.classList.add("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.add("visible");
    }
  }

  closeDevToolsConfirmModal() {
    this.pendingDevAction = null;
    if (this.elements.devToolsSelect) {
      this.elements.devToolsSelect.value = "";
    }
    if (this.elements.devToolsConfirmModal) {
      this.elements.devToolsConfirmModal.classList.remove("visible");
    }
    // If settings modal is still open, keep backdrop
    const settingsOpen = this.elements.settingsModal && this.elements.settingsModal.classList.contains("visible");
    if (!settingsOpen && this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.remove("visible");
    }
  }

  executeDevToolAction(action) {
    switch (action) {
      case "export": {
        const jsonStr = storage.exportWorkoutData();
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const today = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `vox-gym-backup-${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
      }
      case "import": {
        if (this.elements.devToolsFileInput) {
          this.elements.devToolsFileInput.click();
        }
        break;
      }
      case "clear": {
        storage.clearAllWorkoutData();
        this.renderTodaySession();
        this.renderInitialFeedbackCard();
        this.renderHeader();
        this.renderHeaderStreakPill();
        break;
      }
      case "generate": {
        storage.generateSampleWorkoutData();
        this.renderTodaySession();
        this.renderHeader();
        this.renderHeaderStreakPill();
        const last = storage.getLastLoggedSet();
        if (last) {
          this.updateFeedbackCard(last.exercise);
        } else {
          this.renderInitialFeedbackCard();
        }
        break;
      }
    }
  }

  // =========================================================================
  // 12. History & Progress Modal Controller
  // =========================================================================
  setupHistoryModal() {
    this.currentHistoryTimeframe = "30d";

    // Header Streak Pill
    if (this.elements.headerStreakPill) {
      this.elements.headerStreakPill.addEventListener("click", () => {
        this.openHistoryModal();
      });
    }

    // Drawer entry points
    if (this.elements.drawerHistoryBtn) {
      this.elements.drawerHistoryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.openHistoryModal();
      });
    }

    if (this.elements.drawerViewHistoryBtn) {
      this.elements.drawerViewHistoryBtn.addEventListener("click", () => {
        this.openHistoryModal();
      });
    }

    // Modal Close Button
    if (this.elements.historyModalCloseBtn) {
      this.elements.historyModalCloseBtn.addEventListener("click", () => {
        this.closeHistoryModal();
      });
    }

    // Segmented Tabs: 30 Days vs Lifetime
    if (this.elements.historyTab30d) {
      this.elements.historyTab30d.addEventListener("click", () => {
        this.switchHistoryTab("30d");
      });
    }

    if (this.elements.historyTabLifetime) {
      this.elements.historyTabLifetime.addEventListener("click", () => {
        this.switchHistoryTab("lifetime");
      });
    }

    // Top Hero Cards Navigation to Sub-views
    if (this.elements.hpCardConsistency) {
      this.elements.hpCardConsistency.addEventListener("click", () => {
        this.showHistorySubView("calendar");
      });
      this.elements.hpCardConsistency.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.showHistorySubView("calendar");
        }
      });
    }

    if (this.elements.hpCardStrength) {
      this.elements.hpCardStrength.addEventListener("click", () => {
        this.showHistorySubView("prs");
      });
      this.elements.hpCardStrength.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.showHistorySubView("prs");
        }
      });
    }

    if (this.elements.hpCardVolume) {
      this.elements.hpCardVolume.addEventListener("click", () => {
        this.showHistorySubView("volume");
      });
      this.elements.hpCardVolume.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.showHistorySubView("volume");
        }
      });
    }

    // Back Buttons inside Sub-views
    if (this.elements.historyBackFromCalendar) {
      this.elements.historyBackFromCalendar.addEventListener("click", () => {
        this.showHistorySubView("overview");
      });
    }

    if (this.elements.historyBackFromPrs) {
      this.elements.historyBackFromPrs.addEventListener("click", () => {
        this.showHistorySubView("overview");
      });
    }

    if (this.elements.historyBackFromVolume) {
      this.elements.historyBackFromVolume.addEventListener("click", () => {
        this.showHistorySubView("overview");
      });
    }
  }

  renderHeaderStreakPill() {
    if (!this.elements.headerStreakText) return;
    const analytics = storage.getProgressAnalytics("30d");
    const active = analytics.workoutDaysCount || 0;
    this.elements.headerStreakText.textContent = `${active} / 30d`;

    if (this.elements.headerStreakPill) {
      this.elements.headerStreakPill.title = `${active} workout days in the last 30 days. Tap for History & Progress.`;
    }
  }

  openHistoryModal(timeframe = "30d") {
    this.currentHistoryTimeframe = timeframe;
    this.showHistorySubView("overview");
    this.updateHistoryContent();

    if (this.elements.historyModal) {
      this.elements.historyModal.classList.add("visible");
    }
    if (this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.add("visible");
    }
  }

  closeHistoryModal() {
    if (this.elements.historyModal) {
      this.elements.historyModal.classList.remove("visible");
    }
    const settingsOpen = this.elements.settingsModal && this.elements.settingsModal.classList.contains("visible");
    if (!settingsOpen && this.elements.modalBackdrop) {
      this.elements.modalBackdrop.classList.remove("visible");
    }
  }

  switchHistoryTab(timeframe) {
    if (this.currentHistoryTimeframe === timeframe) return;
    this.currentHistoryTimeframe = timeframe;

    if (this.elements.historyTab30d) {
      const is30 = timeframe === "30d";
      this.elements.historyTab30d.classList.toggle("active", is30);
      this.elements.historyTab30d.setAttribute("aria-selected", is30 ? "true" : "false");
    }

    if (this.elements.historyTabLifetime) {
      const isLt = timeframe === "lifetime";
      this.elements.historyTabLifetime.classList.toggle("active", isLt);
      this.elements.historyTabLifetime.setAttribute("aria-selected", isLt ? "true" : "false");
    }

    this.updateHistoryContent();
  }

  showHistorySubView(viewName) {
    const views = {
      overview: this.elements.historyOverviewView,
      calendar: this.elements.historyCalendarView,
      prs: this.elements.historyPrsView,
      volume: this.elements.historyVolumeView
    };

    Object.entries(views).forEach(([k, el]) => {
      if (!el) return;
      if (k === viewName) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    // Scroll to top on view transition
    const scrollBody = document.querySelector(".history-scroll-body");
    if (scrollBody) {
      scrollBody.scrollTop = 0;
    }
  }

  updateHistoryContent() {
    const analytics = storage.getProgressAnalytics(this.currentHistoryTimeframe);
    this.renderHistoryOverview(analytics);
    this.renderHistoryCalendarView(analytics);
    this.renderHistoryPRsView(analytics);
    this.renderHistoryVolumeView(analytics);
  }

  renderHistoryOverview(analytics) {
    const is30d = this.currentHistoryTimeframe === "30d";
    const rangeLabel = is30d ? "the last 30 days" : "your lifetime journey";

    // Card 1: Consistency
    if (this.elements.hpConsistencyHeadline) {
      if (analytics.workoutDaysCount > 0) {
        this.elements.hpConsistencyHeadline.textContent = `You showed up ${analytics.workoutDaysCount} of ${is30d ? 'the last 30' : analytics.totalDaysInRange} days!`;
      } else {
        this.elements.hpConsistencyHeadline.textContent = "Start your training streak today!";
      }
    }
    if (this.elements.hpConsistencySub) {
      if (analytics.currentStreakWeeks > 0) {
        this.elements.hpConsistencySub.textContent = `🔥 ${analytics.currentStreakWeeks} week streak! Showing up is winning. Tap to view calendar.`;
      } else {
        this.elements.hpConsistencySub.textContent = `Showing up = Winning · Tap to view workout calendar & past sessions.`;
      }
    }

    // Mini Calendar Dots (30 little dots)
    if (this.elements.hpMiniCalendar) {
      const now = new Date();
      const dotsCount = 30;
      let dotsHtml = "";
      for (let i = dotsCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        const isActive = analytics.activeDates && analytics.activeDates.includes(key);
        const isToday = i === 0;
        dotsHtml += `<div class="hp-mini-dot ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}" title="${key}${isActive ? ' (Workout logged)' : ''}"></div>`;
      }
      this.elements.hpMiniCalendar.innerHTML = dotsHtml;
    }

    // Card 2: Strength & PRs
    if (this.elements.hpStrengthHeadline) {
      const count = analytics.prsInTimeframe;
      if (count > 0) {
        this.elements.hpStrengthHeadline.textContent = `${count} Personal Record${count === 1 ? '' : 's'} ${is30d ? 'this period' : 'recorded'}!`;
      } else {
        this.elements.hpStrengthHeadline.textContent = "Log sets to unlock personal records!";
      }
    }

    if (this.elements.hpStrengthSub) {
      if (analytics.prHighlights && analytics.prHighlights.length > 0) {
        const names = analytics.prHighlights.slice(0, 3).map(p => p.exercise).join(", ");
        this.elements.hpStrengthSub.textContent = `${names} leading the progressive overload curve.`;
      } else {
        this.elements.hpStrengthSub.textContent = "Tap to explore exercise trophy case and progression charts.";
      }
    }

    if (this.elements.hpStrengthPillRow) {
      if (analytics.prHighlights && analytics.prHighlights.length > 0) {
        this.elements.hpStrengthPillRow.innerHTML = analytics.prHighlights.slice(0, 3).map(p => `
          <div class="hp-pr-chip">
            <span class="hp-pr-chip-name">${p.exercise}</span>
            <span class="hp-pr-chip-val">${p.bestWeight} lbs</span>
            ${p.gain > 0 ? `<span class="hp-pr-chip-gain">+${p.gain}</span>` : ''}
          </div>
        `).join("");
      } else {
        this.elements.hpStrengthPillRow.innerHTML = `
          <div class="hp-pr-chip">
            <span class="hp-pr-chip-name">Trophy Case</span>
            <span class="hp-pr-chip-val">Ready</span>
          </div>
        `;
      }
    }

    // Card 3: Volume & Milestones
    const prefs = storage.getPreferences();
    const unit = prefs.unit || "lbs";
    if (this.elements.hpVolumeNum) {
      this.elements.hpVolumeNum.textContent = `${analytics.totalVolumeLbs.toLocaleString()} ${unit.toUpperCase()}`;
    }
    if (this.elements.hpSetsNum) {
      this.elements.hpSetsNum.textContent = `across ${analytics.totalSetsCount.toLocaleString()} sets`;
    }
    if (this.elements.hpVolumeMilestone) {
      this.elements.hpVolumeMilestone.textContent = analytics.milestoneEquivalent || "Keep moving iron!";
    }

    // Card 4: Spotlight
    if (analytics.spotlight) {
      if (this.elements.hpSpotlightTitle) {
        this.elements.hpSpotlightTitle.textContent = analytics.spotlight.title;
      }
      if (this.elements.hpSpotlightSub) {
        this.elements.hpSpotlightSub.textContent = analytics.spotlight.sub;
      }
      if (this.elements.hpSpotlightFill) {
        this.elements.hpSpotlightFill.style.width = `${analytics.spotlight.progressPercent}%`;
      }
    }
  }

  renderHistoryCalendarView(analytics) {
    if (this.elements.calendarActiveDaysPill) {
      this.elements.calendarActiveDaysPill.textContent = `⚡ ${analytics.workoutDaysCount} Days Active`;
    }
    if (this.elements.calendarStreakPill) {
      this.elements.calendarStreakPill.textContent = `🔥 ${analytics.currentStreakWeeks} Wk Streak`;
    }

    // Render Month Calendar Grid
    if (this.elements.historyCalendarGrid) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed

      // Month name
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const todayDate = now.getDate();

      let gridHtml = `
        <div class="calendar-grid-header">
          <span class="calendar-month-title">${monthNames[month]} ${year}</span>
        </div>
        <div class="calendar-day-names">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div class="calendar-cells-matrix">
      `;

      // Empty padding cells before 1st of month
      for (let i = 0; i < firstDayOfMonth; i++) {
        gridHtml += `<div class="calendar-cell empty"></div>`;
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        const dateKey = `${year}-${mm}-${dd}`;
        const hasWorkout = analytics.activeDates && analytics.activeDates.includes(dateKey);
        const isToday = d === todayDate;

        gridHtml += `
          <div class="calendar-cell ${hasWorkout ? 'active' : ''} ${isToday ? 'today' : ''}" data-date="${dateKey}" title="${dateKey}${hasWorkout ? ' (Trained)' : ''}">
            <span class="calendar-cell-num">${d}</span>
            ${hasWorkout ? `<span class="calendar-cell-dot"></span>` : ''}
          </div>
        `;
      }

      gridHtml += `</div>`;
      this.elements.historyCalendarGrid.innerHTML = gridHtml;

      // Wire calendar cell click to jump/scroll to that date in past sessions feed
      this.elements.historyCalendarGrid.querySelectorAll(".calendar-cell[data-date]").forEach(cell => {
        cell.addEventListener("click", () => {
          const targetDate = cell.getAttribute("data-date");
          const targetCard = this.elements.historySessionsFeed?.querySelector(`[data-feed-date="${targetDate}"]`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
            targetCard.classList.add("session-highlight");
            setTimeout(() => targetCard.classList.remove("session-highlight"), 1800);
          }
        });
      });
    }

    // Render Past Sessions Feed
    if (this.elements.historySessionsFeed) {
      const sessions = analytics.pastSessionsList || [];
      if (sessions.length === 0) {
        this.elements.historySessionsFeed.innerHTML = `
          <div class="activity-empty-state" style="padding: 24px 0;">
            <span class="activity-empty-text">No workouts in this period</span>
            <span class="activity-empty-sub">Tap the microphone to start logging your gym sets</span>
          </div>
        `;
        return;
      }

      const prefs = storage.getPreferences();
      const unit = prefs.unit || "lbs";

      this.elements.historySessionsFeed.innerHTML = sessions.map(sess => {
        const exListStr = sess.exerciseNames.slice(0, 4).join(" · ") + (sess.exerciseNames.length > 4 ? "..." : "");
        const setsHtml = sess.sets.map((s, idx) => {
          const r = s.reps || 0;
          let wStr = "";
          if (s.type === "bodyweight" || s.isBodyweight) {
            wStr = s.addedWeight > 0 ? `+${s.addedWeight} ${s.unit || unit}` : (s.weight > 0 ? `${s.weight} ${s.unit || unit}` : "BW");
          } else {
            const w = s.weight || s.addedWeight || 0;
            wStr = `${w} ${s.unit || unit}`;
          }
          return `
            <div class="feed-set-row">
              <span class="feed-set-ex">${s.exercise}</span>
              <span class="feed-set-data">${wStr} × ${r}</span>
            </div>
          `;
        }).join("");

        return `
          <div class="feed-session-card" data-feed-date="${sess.date}">
            <div class="feed-session-header">
              <div class="feed-session-info">
                <span class="feed-session-date">${sess.formattedDate}</span>
                <span class="feed-session-exercises">${exListStr}</span>
              </div>
              <div class="feed-session-tags">
                <span class="feed-tag-sets">${sess.setCount} sets</span>
                <span class="feed-tag-vol">${sess.volume.toLocaleString()} ${unit}</span>
                <svg class="feed-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
            <div class="feed-session-details">
              <div class="feed-sets-list">
                ${setsHtml}
              </div>
            </div>
          </div>
        `;
      }).join("");

      // Accordion toggle for feed items
      this.elements.historySessionsFeed.querySelectorAll(".feed-session-header").forEach(header => {
        header.addEventListener("click", () => {
          const card = header.closest(".feed-session-card");
          if (card) {
            card.classList.toggle("expanded");
          }
        });
      });
    }
  }

  renderHistoryPRsView(analytics) {
    if (!this.elements.historyPrsList) return;

    const prs = analytics.allPRs || [];
    if (prs.length === 0) {
      this.elements.historyPrsList.innerHTML = `
        <div class="activity-empty-state" style="padding: 24px 0;">
          <span class="activity-empty-text">No PR records yet</span>
          <span class="activity-empty-sub">As you log sets, your highest weights will be cataloged here</span>
        </div>
      `;
      return;
    }

    const prefs = storage.getPreferences();
    const unit = prefs.unit || "lbs";

    // Sort PRs alphabetically or by best weight
    prs.sort((a, b) => (b.bestWeight || 0) - (a.bestWeight || 0));

    this.elements.historyPrsList.innerHTML = prs.map(pr => {
      return `
        <div class="pr-card-item" data-exercise-name="${pr.exercise}">
          <div class="pr-card-left">
            <span class="pr-card-trophy">🏆</span>
            <div class="pr-card-text">
              <span class="pr-card-name">${pr.exercise}</span>
              <span class="pr-card-date">${formatHumanDate(pr.bestDate)}</span>
            </div>
          </div>
          <div class="pr-card-right">
            <span class="pr-card-weight">${pr.bestWeight} ${unit}</span>
            <span class="pr-card-cta">Graph →</span>
          </div>
        </div>
      `;
    }).join("");

    // Wire tap to open existing exercise log modal & dual-axis SVG progress graph
    this.elements.historyPrsList.querySelectorAll(".pr-card-item").forEach(item => {
      item.addEventListener("click", () => {
        const exName = item.getAttribute("data-exercise-name");
        if (exName) {
          this.openExerciseLogModal(exName);
        }
      });
    });
  }

  renderHistoryVolumeView(analytics) {
    const prefs = storage.getPreferences();
    const unit = prefs.unit || "lbs";

    if (this.elements.volumeHeroNum) {
      this.elements.volumeHeroNum.textContent = `${analytics.totalVolumeLbs.toLocaleString()} ${unit.toUpperCase()}`;
    }

    if (this.elements.volumeHeroDesc) {
      this.elements.volumeHeroDesc.textContent = analytics.milestoneEquivalent || "Keep lifting!";
    }

    if (this.elements.volumeHeroIcon) {
      if (analytics.totalVolumeLbs > 1000000) {
        this.elements.volumeHeroIcon.textContent = "🐋";
      } else if (analytics.totalVolumeLbs > 200000) {
        this.elements.volumeHeroIcon.textContent = "🚀";
      } else if (analytics.totalVolumeLbs > 50000) {
        this.elements.volumeHeroIcon.textContent = "🐘";
      } else if (analytics.totalVolumeLbs > 10000) {
        this.elements.volumeHeroIcon.textContent = "🚗";
      } else {
        this.elements.volumeHeroIcon.textContent = "⚡";
      }
    }

    // Weekly Volume Bars Chart
    if (this.elements.historyVolumeBars) {
      const buckets = analytics.weeklyBuckets || {};
      const weekKeys = Object.keys(buckets);

      if (weekKeys.length === 0) {
        this.elements.historyVolumeBars.innerHTML = `
          <div class="activity-empty-state" style="padding: 24px 0;">
            <span class="activity-empty-text">No volume data in this timeframe</span>
          </div>
        `;
        return;
      }

      // Find max volume to scale bars
      const maxVol = Math.max(...Object.values(buckets), 1);

      this.elements.historyVolumeBars.innerHTML = weekKeys.map(k => {
        const vol = buckets[k];
        const pct = Math.min(100, Math.max(12, Math.round((vol / maxVol) * 100)));
        return `
          <div class="volume-bar-col" title="${k}: ${vol.toLocaleString()} ${unit}">
            <span class="volume-bar-val">${vol > 999 ? (vol / 1000).toFixed(1) + 'k' : vol}</span>
            <div class="volume-bar-track">
              <div class="volume-bar-fill" style="height: ${pct}%;"></div>
            </div>
            <span class="volume-bar-label">${k}</span>
          </div>
        `;
      }).join("");
    }
  }
}

export const ui = new UIController();
