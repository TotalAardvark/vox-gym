/**
 * Vox Gym - Local Storage & Data Persistence Engine
 * Manages daily sessions, exercise history, comparative stats, and user preferences.
 */

const STORAGE_KEYS = {
  PREFERENCES: "vox_gym_prefs_v1",
  WORKOUT_HISTORY: "vox_gym_history_v1",
  ACTIVE_SESSION: "vox_gym_active_session_v1",
  CUSTOM_EXERCISES: "vox_gym_custom_exercises_v1"
};

const DEFAULT_PREFERENCES = {
  unit: "lbs", // "lbs" or "kg"
  unitChosen: false,
  restTimerEnabled: true,
  restDurationSeconds: 90,
  soundEnabled: true,
  hapticsEnabled: true
};

/**
 * Format date to YYYY-MM-DD local
 */
export function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function formatTime(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    // Check if initial seed is needed
    if (typeof localStorage !== "undefined" && !localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY)) {
      this.seedInitialHistory();
    }
  }

  getPreferences() {
    try {
      if (typeof localStorage === "undefined") return DEFAULT_PREFERENCES;
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch (e) {
      console.error("Failed to read preferences", e);
      return DEFAULT_PREFERENCES;
    }
  }

  savePreferences(prefs) {
    try {
      if (typeof localStorage === "undefined") return prefs;
      const updated = { ...this.getPreferences(), ...prefs };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save preferences", e);
    }
  }

  getWorkoutHistory() {
    try {
      if (typeof localStorage === "undefined") return {};
      const data = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to read workout history", e);
      return {};
    }
  }

  saveWorkoutHistory(history) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save workout history", e);
    }
  }

  /**
   * Get all entries for today's session
   */
  getTodaySession() {
    const today = getTodayKey();
    const history = this.getWorkoutHistory();
    return history[today] || {
      date: today,
      sets: []
    };
  }

  /**
   * Add a confirmed set to today's workout
   */
  logSet(setEntry) {
    const today = getTodayKey();
    const history = this.getWorkoutHistory();

    if (!history[today]) {
      history[today] = {
        date: today,
        sets: []
      };
    }

    const entryWithMeta = {
      id: "set_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      ...setEntry
    };

    history[today].sets.push(entryWithMeta);
    this.saveWorkoutHistory(history);
    return entryWithMeta;
  }

  /**
   * Delete a set by ID from today's workout
   */
  deleteSet(setId) {
    const today = getTodayKey();
    const history = this.getWorkoutHistory();
    if (history[today]) {
      history[today].sets = history[today].sets.filter(s => s.id !== setId);
      this.saveWorkoutHistory(history);
    }
  }

  /**
   * Update an existing set by ID
   */
  updateSet(setId, updates) {
    const today = getTodayKey();
    const history = this.getWorkoutHistory();
    if (history[today]) {
      const idx = history[today].sets.findIndex(s => s.id === setId);
      if (idx !== -1) {
        history[today].sets[idx] = { ...history[today].sets[idx], ...updates };
        this.saveWorkoutHistory(history);
        return history[today].sets[idx];
      }
    }
    return null;
  }

  /**
   * Check if an exercise has ever been recorded before
   */
  exerciseExistsInHistory(exerciseName) {
    if (!exerciseName) return false;
    const clean = exerciseName.toLowerCase().trim();
    const history = this.getWorkoutHistory();
    for (const d of Object.keys(history)) {
      const sets = history[d]?.sets || [];
      if (sets.some(s => s.exercise && s.exercise.toLowerCase().trim() === clean)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get custom registered exercises
   */
  getCustomExercises() {
    try {
      if (typeof localStorage === "undefined") return [];
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read custom exercises", e);
      return [];
    }
  }

  /**
   * Save a newly registered custom exercise
   */
  saveCustomExercise(exerciseObj) {
    try {
      if (typeof localStorage === "undefined") return exerciseObj;
      const list = this.getCustomExercises();
      const cleanName = exerciseObj.name.trim();
      // Avoid duplicate names
      const existing = list.find(e => e.name.toLowerCase() === cleanName.toLowerCase());
      if (existing) return existing;

      const newEntry = {
        id: "custom-" + Date.now(),
        name: cleanName,
        muscle: exerciseObj.muscle || "Custom Exercise",
        type: exerciseObj.type || "weight_reps",
        aliases: [
          cleanName.toLowerCase(),
          cleanName.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim(),
          ...(exerciseObj.aliases || [])
        ],
        defaultIncrement: 5,
        isCustom: true
      };

      list.push(newEntry);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(list));
      return newEntry;
    } catch (e) {
      console.error("Failed to save custom exercise", e);
      return exerciseObj;
    }
  }

  /**
   * Get the last logged set in today's session (or null)
   */
  getLastLoggedSet() {
    const session = this.getTodaySession();
    if (session.sets.length > 0) {
      return session.sets[session.sets.length - 1];
    }
    return null;
  }

  /**
   * Calculate Comparative Stats for an exercise
   * Returns:
   * - thisSession: { count, volume, bestWeight, bestReps }
   * - lastSession: { dateStr, setsSummary, totalVolume, bestWeight }
   * - microTrend: { text, direction: "up"|"down"|"same"|"new" }
   */
  getExerciseComparativeStats(exerciseName) {
    if (!exerciseName) return null;

    const norm = (str) => (str || "").trim().toLowerCase();
    const cleanTargetName = norm(exerciseName);

    const history = this.getWorkoutHistory();
    const todayKey = getTodayKey();
    const todaySession = history[todayKey] || { sets: [] };

    // Sets completed today for this exercise (case-insensitive & trimmed)
    const todaySets = todaySession.sets.filter(s => norm(s.exercise) === cleanTargetName);

    let thisSessionVolume = 0;
    let thisBestWeight = 0;
    let thisBestReps = 0;

    for (const s of todaySets) {
      const w = s.weight || s.addedWeight || 0;
      const r = typeof s.reps === "number" ? s.reps : 0;
      thisSessionVolume += w * r;
      if (w > thisBestWeight) thisBestWeight = w;
      if (r > thisBestReps) thisBestReps = r;
    }

    // Find the most recent previous session that contained this exercise
    const sortedDates = Object.keys(history)
      .filter(d => d < todayKey)
      .sort((a, b) => b.localeCompare(a)); // newest first

    let prevSessionDate = null;
    let prevSets = [];

    for (const d of sortedDates) {
      const setsForEx = (history[d]?.sets || []).filter(s => norm(s.exercise) === cleanTargetName);
      if (setsForEx.length > 0) {
        prevSessionDate = d;
        prevSets = setsForEx;
        break;
      }
    }

    let prevSetsSummary = "";
    let prevBestWeight = 0;
    let prevVolume = 0;

    if (prevSets.length > 0) {
      // e.g. "215 lbs × 8, 8, 7"
      const weights = prevSets.map(s => s.weight || s.addedWeight || 0);
      const repsList = prevSets.map(s => s.reps);
      prevBestWeight = Math.max(...weights);

      for (const s of prevSets) {
        const w = s.weight || s.addedWeight || 0;
        const r = typeof s.reps === "number" ? s.reps : 0;
        prevVolume += w * r;
      }

      // Check if all weights are same
      const allSameWeight = weights.every(w => w === weights[0]);
      if (allSameWeight) {
        prevSetsSummary = `${weights[0]} lbs × ${repsList.join(", ")}`;
      } else {
        prevSetsSummary = prevSets.map(s => `${s.weight || 0}×${s.reps}`).join(", ");
      }
    }

    // Micro-trend calculation
    let microTrend = {
      text: "First time logged",
      direction: "new"
    };

    if (todaySets.length > 0 && prevSets.length > 0) {
      const weightDiff = thisBestWeight - prevBestWeight;
      if (weightDiff > 0) {
        microTrend = {
          text: `+${weightDiff} lbs vs last session`,
          direction: "up",
          arrow: "↗️"
        };
      } else if (weightDiff < 0) {
        microTrend = {
          text: `${weightDiff} lbs vs last session`,
          direction: "down",
          arrow: "↘️"
        };
      } else {
        // Same weight, check reps
        const prevAvgReps = prevSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) / prevSets.length;
        const thisAvgReps = todaySets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) / todaySets.length;
        const repDiff = Math.round((thisAvgReps - prevAvgReps) * 10) / 10;

        if (repDiff > 0) {
          microTrend = {
            text: `+${repDiff} avg reps vs last session`,
            direction: "up",
            arrow: "↗️"
          };
        } else if (repDiff < 0) {
          microTrend = {
            text: `${repDiff} avg reps vs last session`,
            direction: "down",
            arrow: "↘️"
          };
        } else {
          microTrend = {
            text: `Matched previous performance`,
            direction: "same",
            arrow: "➡️"
          };
        }
      }
    } else if (prevSets.length > 0 && todaySets.length === 0) {
      microTrend = {
        text: `Target: beat ${prevBestWeight} lbs`,
        direction: "neutral",
        arrow: "🎯"
      };
    }

    return {
      exerciseName,
      thisSession: {
        setCount: todaySets.length,
        volume: thisSessionVolume,
        bestWeight: thisBestWeight,
        bestReps: thisBestReps,
        sets: todaySets,
        rawSets: todaySets
      },
      lastSession: prevSessionDate ? {
        dateStr: prevSessionDate,
        formattedDate: formatHumanDate(prevSessionDate),
        setsSummary: prevSetsSummary,
        bestWeight: prevBestWeight,
        volume: prevVolume,
        setCount: prevSets.length,
        sets: prevSets,
        rawSets: prevSets
      } : null,
      microTrend
    };
  }

  /**
   * Get all workout history entries for a specific exercise across all dates
   * Sorted chronologically (oldest to newest)
   * Returns array of:
   * {
   *   date: "YYYY-MM-DD",
   *   formattedDate: "Thu, Oct 22",
   *   sets: [...],
   *   totalSets: number,
   *   totalVolume: number,
   *   maxWeight: number
   * }
   */
  getExerciseHistory(exerciseName) {
    if (!exerciseName) return [];
    const norm = (str) => (str || "").trim().toLowerCase();
    const cleanTargetName = norm(exerciseName);
    const history = this.getWorkoutHistory();

    const sortedDates = Object.keys(history).sort((a, b) => a.localeCompare(b)); // oldest first
    const results = [];

    for (const d of sortedDates) {
      const setsForEx = (history[d]?.sets || []).filter(s => norm(s.exercise) === cleanTargetName);
      if (setsForEx.length > 0) {
        let maxWeight = 0;
        let totalVolume = 0;

        for (const s of setsForEx) {
          const w = s.weight || s.addedWeight || 0;
          const r = typeof s.reps === "number" ? s.reps : 0;
          totalVolume += w * r;
          if (w > maxWeight) maxWeight = w;
        }

        results.push({
          date: d,
          formattedDate: formatHumanDate(d),
          sets: setsForEx,
          totalSets: setsForEx.length,
          totalVolume,
          maxWeight
        });
      }
    }

    return results;
  }

  /**
   * Pre-seed realistic historical workout data for immediate comparison
   */
  seedInitialHistory() {
    const d3DaysAgo = new Date();
    d3DaysAgo.setDate(d3DaysAgo.getDate() - 3);
    const pastDateKey = d3DaysAgo.toISOString().split("T")[0];

    const sampleHistory = {
      [pastDateKey]: {
        date: pastDateKey,
        sets: [
          {
            id: "seed_1",
            timestamp: new Date(d3DaysAgo.setHours(9, 15, 0)).toISOString(),
            type: "standard",
            exercise: "Barbell Bench Press",
            weight: 215,
            reps: 8,
            unit: "lbs"
          },
          {
            id: "seed_2",
            timestamp: new Date(d3DaysAgo.setHours(9, 20, 0)).toISOString(),
            type: "standard",
            exercise: "Barbell Bench Press",
            weight: 215,
            reps: 8,
            unit: "lbs"
          },
          {
            id: "seed_3",
            timestamp: new Date(d3DaysAgo.setHours(9, 26, 0)).toISOString(),
            type: "standard",
            exercise: "Barbell Bench Press",
            weight: 215,
            reps: 7,
            unit: "lbs"
          },
          {
            id: "seed_4",
            timestamp: new Date(d3DaysAgo.setHours(9, 35, 0)).toISOString(),
            type: "standard",
            exercise: "Incline Dumbbell Press",
            weight: 70,
            reps: 10,
            unit: "lbs"
          },
          {
            id: "seed_5",
            timestamp: new Date(d3DaysAgo.setHours(9, 41, 0)).toISOString(),
            type: "standard",
            exercise: "Dumbbell Fly",
            weight: 35,
            reps: 12,
            unit: "lbs"
          },
          {
            id: "seed_6",
            timestamp: new Date(d3DaysAgo.setHours(9, 50, 0)).toISOString(),
            type: "bodyweight",
            exercise: "Dips",
            addedWeight: 20,
            reps: 12,
            unit: "lbs"
          }
        ]
      }
    };

    this.saveWorkoutHistory(sampleHistory);
  }

  /**
   * Reset data back to default initial state
   */
  resetData() {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
    this.seedInitialHistory();
  }
}

export const storage = new StorageManager();
