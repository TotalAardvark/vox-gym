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
  theme: "light", // "light" (default) or "dark"
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
   * Get overall Progress and History Analytics for 30-day or Lifetime view
   * @param {"30d" | "lifetime"} timeframe
   */
  getProgressAnalytics(timeframe = "30d") {
    const history = this.getWorkoutHistory();
    const sortedDates = Object.keys(history).sort((a, b) => a.localeCompare(b)); // oldest to newest
    const now = new Date();
    const todayStr = getTodayKey();

    // Filter dates based on timeframe
    let activeDates = sortedDates;
    if (timeframe === "30d") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const cutoffStr = thirtyDaysAgo.toISOString().split("T")[0];
      activeDates = sortedDates.filter(d => d >= cutoffStr);
    }

    // 1. Consistency & Streaks
    const workoutDaysCount = activeDates.length;
    let currentStreakWeeks = 0;
    // Calculate weekly streak going backward from current week
    let checkDate = new Date(now);
    let streakBroken = false;
    while (!streakBroken) {
      // Find start of week (Sunday)
      const day = checkDate.getDay();
      const startOfWeek = new Date(checkDate);
      startOfWeek.setDate(checkDate.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const hasWorkoutInWeek = sortedDates.some(dStr => {
        const dObj = new Date(dStr + "T12:00:00");
        return dObj >= startOfWeek && dObj <= endOfWeek;
      });

      if (hasWorkoutInWeek) {
        currentStreakWeeks++;
        checkDate.setDate(checkDate.getDate() - 7);
      } else {
        // If current week has no workout yet, don't break immediately if week just started
        if (currentStreakWeeks === 0 && day <= 2) {
          checkDate.setDate(checkDate.getDate() - 7);
          continue;
        }
        streakBroken = true;
      }

      if (currentStreakWeeks > 52) break; // safety cap
    }

    // 2. Personal Records & Strength Progress
    // Find all exercises and track their first known max vs latest max
    const exerciseMaxMap = {};
    const allPRs = [];

    for (const d of sortedDates) {
      const session = history[d];
      if (!session || !session.sets) continue;

      for (const s of session.sets) {
        const exName = s.exercise || "Unknown";
        const w = s.weight || s.addedWeight || 0;
        const reps = s.reps || 0;
        const isBw = s.type === "bodyweight";

        if (!exerciseMaxMap[exName]) {
          exerciseMaxMap[exName] = {
            exercise: exName,
            isBw,
            firstWeight: w,
            firstDate: d,
            bestWeight: w,
            bestReps: reps,
            bestDate: d
          };
        } else {
          if (w > exerciseMaxMap[exName].bestWeight || (w === exerciseMaxMap[exName].bestWeight && reps > exerciseMaxMap[exName].bestReps)) {
            exerciseMaxMap[exName].bestWeight = w;
            exerciseMaxMap[exName].bestReps = reps;
            exerciseMaxMap[exName].bestDate = d;
          }
        }
      }
    }

    // Identify PRs achieved in the active timeframe
    let prsInTimeframe = 0;
    const prHighlights = [];
    Object.values(exerciseMaxMap).forEach(rec => {
      const inRange = activeDates.includes(rec.bestDate);
      if (inRange && (rec.bestWeight > rec.firstWeight || rec.bestWeight > 0)) {
        prsInTimeframe++;
        const gain = rec.bestWeight - rec.firstWeight;
        prHighlights.push({
          exercise: rec.exercise,
          bestWeight: rec.bestWeight,
          bestReps: rec.bestReps,
          gain: gain > 0 ? gain : null,
          date: rec.bestDate,
          formattedDate: formatHumanDate(rec.bestDate)
        });
      }
    });

    // Sort PRs by gain or weight
    prHighlights.sort((a, b) => (b.gain || 0) - (a.gain || 0));

    // 3. Volume and Milestones
    let totalVolumeLbs = 0;
    let totalSetsCount = 0;
    const weeklyBuckets = {}; // "YYYY-WXX" -> volume

    for (const d of activeDates) {
      const session = history[d];
      if (!session || !session.sets) continue;
      let dayVol = 0;

      for (const s of session.sets) {
        const w = s.weight || s.addedWeight || 0;
        const r = typeof s.reps === "number" ? s.reps : 0;
        const v = w * r;
        totalVolumeLbs += v;
        dayVol += v;
        totalSetsCount++;
      }

      // Group by week for volume chart
      const dObj = new Date(d + "T12:00:00");
      const oneJan = new Date(dObj.getFullYear(), 0, 1);
      const weekNum = Math.ceil((((dObj - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
      const weekKey = `Wk ${weekNum}`;
      weeklyBuckets[weekKey] = (weeklyBuckets[weekKey] || 0) + dayVol;
    }

    // Fun milestone comparison for volume
    let milestoneEquivalent = "";
    if (totalVolumeLbs > 1000000) {
      const whales = (totalVolumeLbs / 300000).toFixed(1);
      milestoneEquivalent = `🐋 Roughly ${whales} Blue Whales lifted!`;
    } else if (totalVolumeLbs > 200000) {
      const shuttles = (totalVolumeLbs / 165000).toFixed(1);
      milestoneEquivalent = `🚀 Equivalent to ${shuttles} Space Shuttle Orbiters lifted!`;
    } else if (totalVolumeLbs > 50000) {
      const elephants = Math.max(1, Math.round(totalVolumeLbs / 12000));
      milestoneEquivalent = `🐘 Roughly ${elephants} African Elephants moved!`;
    } else if (totalVolumeLbs > 10000) {
      const cars = Math.max(1, Math.round(totalVolumeLbs / 3500));
      milestoneEquivalent = `🚗 Equivalent to lifting ${cars} sedans!`;
    } else {
      milestoneEquivalent = `💪 Building unstoppable momentum!`;
    }

    // 4. Dynamic Spotlight Selection (RPG Level / Next Win / Unsung Hero)
    const totalLifetimeSessions = sortedDates.length;
    const currentLevel = Math.max(1, Math.floor(totalLifetimeSessions / 3) + 1);
    const sessionsInLevel = totalLifetimeSessions % 3;
    const sessionsNeeded = 3 - sessionsInLevel;

    const spotlight = {
      type: "level",
      title: `Level ${currentLevel} Iron Pioneer`,
      sub: `${sessionsNeeded} more workout${sessionsNeeded === 1 ? "" : "s"} to reach Level ${currentLevel + 1}!`,
      progressPercent: Math.round((sessionsInLevel / 3) * 100)
    };

    // If there's an impressive PR or close milestone, spotlight that instead
    if (prHighlights.length > 0 && prHighlights[0].gain > 0) {
      spotlight.type = "unsung_hero";
      spotlight.title = `Breakthrough: ${prHighlights[0].exercise}`;
      spotlight.sub = `Climbed +${prHighlights[0].gain} lbs up to ${prHighlights[0].bestWeight} lbs!`;
      spotlight.progressPercent = 100;
    }

    // 5. Build reverse-chronological session list with summary
    const pastSessionsList = activeDates.slice().reverse().map(d => {
      const sess = history[d];
      const sets = sess?.sets || [];
      const distinctExercises = [...new Set(sets.map(s => s.exercise))];
      let sessVol = 0;
      sets.forEach(s => {
        sessVol += (s.weight || s.addedWeight || 0) * (s.reps || 0);
      });

      return {
        date: d,
        formattedDate: formatHumanDate(d),
        setCount: sets.length,
        volume: sessVol,
        exerciseNames: distinctExercises,
        sets
      };
    });

    return {
      timeframe,
      workoutDaysCount,
      totalDaysInRange: timeframe === "30d" ? 30 : sortedDates.length > 0 ? Math.max(30, Math.round((now - new Date(sortedDates[0] + "T12:00:00")) / 86400000)) : 30,
      currentStreakWeeks,
      totalVolumeLbs,
      totalSetsCount,
      milestoneEquivalent,
      prsInTimeframe,
      prHighlights,
      allPRs: Object.values(exerciseMaxMap),
      weeklyBuckets,
      spotlight,
      activeDates,
      pastSessionsList
    };
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

  /**
   * Clear all workout history data
   */
  clearAllWorkoutData() {
    this.saveWorkoutHistory({});
  }

  /**
   * Generate realistic long-term sample workout history data:
   * 15 exercises (5 Push, 5 Pull, 5 Legs) rotated 3x/week across 12-13 weeks (~3 months)
   * with progressive overload, realistic rep ranges, and timestamps up to today.
   */
  generateSampleWorkoutData() {
    const pushRoutine = [
      { exercise: "Barbell Bench Press", type: "standard", baseWeight: 185, inc: 35, reps: 8, sets: 3 },
      { exercise: "Incline Dumbbell Press", type: "standard", baseWeight: 55, inc: 20, reps: 10, sets: 3 },
      { exercise: "Overhead Press", type: "standard", baseWeight: 95, inc: 25, reps: 8, sets: 3 },
      { exercise: "Dips", type: "bodyweight", baseWeight: 0, inc: 25, reps: 12, sets: 3, isBw: true },
      { exercise: "Cable Fly", type: "standard", baseWeight: 35, inc: 15, reps: 12, sets: 3 }
    ];

    const pullRoutine = [
      { exercise: "Barbell Deadlift", type: "standard", baseWeight: 245, inc: 55, reps: 5, sets: 3 },
      { exercise: "Barbell Row", type: "standard", baseWeight: 135, inc: 35, reps: 8, sets: 3 },
      { exercise: "Lat Pulldown", type: "standard", baseWeight: 120, inc: 30, reps: 10, sets: 3 },
      { exercise: "Face Pull", type: "standard", baseWeight: 40, inc: 15, reps: 15, sets: 3 },
      { exercise: "Bicep Curls", type: "standard", baseWeight: 30, inc: 10, reps: 10, sets: 3 }
    ];

    const legsRoutine = [
      { exercise: "Barbell Back Squat", type: "standard", baseWeight: 225, inc: 50, reps: 6, sets: 3 },
      { exercise: "Romanian Deadlift", type: "standard", baseWeight: 175, inc: 40, reps: 8, sets: 3 },
      { exercise: "Leg Press", type: "standard", baseWeight: 315, inc: 90, reps: 10, sets: 3 },
      { exercise: "Leg Curl", type: "standard", baseWeight: 90, inc: 25, reps: 12, sets: 3 },
      { exercise: "Standing Calf Raise", type: "standard", baseWeight: 110, inc: 30, reps: 15, sets: 3 }
    ];

    const routines = [
      { name: "Push", exercises: pushRoutine },
      { name: "Pull", exercises: pullRoutine },
      { name: "Legs", exercises: legsRoutine }
    ];

    const totalDays = 90; // ~3 months
    const now = new Date();
    const history = {};

    let sessionCounter = 0;
    // Iterate from 90 days ago up to 0 (today)
    for (let dayOffset = totalDays; dayOffset >= 0; dayOffset--) {
      const d = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      const dayOfWeek = d.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat

      // Mon (1), Wed (3), Fri (5) schedule (3x per week)
      if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5 || (dayOffset === 0 && (dayOfWeek !== 0 && dayOfWeek !== 6))) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const dayStr = String(d.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${dayStr}`;

        // Select routine rotation
        const routine = routines[sessionCounter % routines.length];
        sessionCounter++;

        // Progress factor from 0.0 (oldest) to 1.0 (today)
        const progress = (totalDays - dayOffset) / totalDays;

        const sessionSets = [];
        let baseHour = 9;
        let baseMin = 15;

        routine.exercises.forEach((cfg, exIdx) => {
          // Weight with progressive overload and realistic slight variance (+/- 2.5 lbs)
          const weightProg = Math.round((cfg.baseWeight + cfg.inc * progress) / 2.5) * 2.5;

          for (let s = 1; s <= cfg.sets; s++) {
            const setTime = new Date(d);
            setTime.setHours(baseHour, baseMin + (exIdx * 8) + (s * 2), 0, 0);

            let setObj;
            if (cfg.isBw) {
              const addedW = Math.max(0, Math.round((cfg.inc * progress) / 5) * 5);
              setObj = {
                id: `seed_${dateKey}_${exIdx}_${s}`,
                timestamp: setTime.toISOString(),
                type: "bodyweight",
                exercise: cfg.exercise,
                addedWeight: addedW,
                reps: cfg.reps,
                unit: "lbs"
              };
            } else {
              setObj = {
                id: `seed_${dateKey}_${exIdx}_${s}`,
                timestamp: setTime.toISOString(),
                type: "standard",
                exercise: cfg.exercise,
                weight: weightProg,
                reps: cfg.reps,
                unit: "lbs"
              };
            }
            sessionSets.push(setObj);
          }
        });

        history[dateKey] = {
          date: dateKey,
          sets: sessionSets
        };
      }
    }

    this.saveWorkoutHistory(history);
    return history;
  }

  /**
   * Export all workout data and custom exercises to JSON string
   */
  exportWorkoutData() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workoutHistory: this.getWorkoutHistory(),
      customExercises: this.getCustomExercises(),
      preferences: this.getPreferences()
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Import workout data from parsed JSON object or string
   */
  importWorkoutData(data) {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid workout data format");
    }

    // Support both direct history object or full backup export structure
    const history = parsed.workoutHistory || (parsed.date || Object.values(parsed).some(v => v && v.sets) ? parsed : null);
    if (!history || typeof history !== "object") {
      throw new Error("No valid workout history found in data");
    }

    this.saveWorkoutHistory(history);

    if (parsed.customExercises && Array.isArray(parsed.customExercises)) {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(parsed.customExercises));
      } catch (e) {
        console.error("Failed to restore custom exercises", e);
      }
    }

    return history;
  }
}

export const storage = new StorageManager();
