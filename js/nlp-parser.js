/**
 * Vox Gym - Natural Language Processing & Intent Parser
 * Converts spoken voice strings into structured workout set payloads.
 */

import { matchExercise } from './fuzzy.js';
import { findExerciseByName } from './exercises.js';

// Number words mapping
const SMALL_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Pluralized tens commonly spoken for weights (e.g., "with twenties", "grabbed fifties")
  twenties: 20, thirties: 30, forties: 40, fifties: 50,
  sixties: 60, seventies: 70, eighties: 80, nineties: 90
};

const MAGNITUDES = {
  hundred: 100,
  thousand: 1000
};

/**
 * Convert spoken word numbers into digit strings
 * e.g. "two hundred twenty five" -> "225", "two twenty five" -> "225"
 */
export function convertWordsToNumbers(text) {
  if (!text) return "";
  let clean = text.toLowerCase()
    .replace(/-/g, " ")
    .replace(/\band\b/g, " ");

  // Handle common gym shorthand e.g. "two twenty five" -> "225", "three fifteen" -> "315", "four oh five" -> "405"
  const shorthandPattern = /\b(one|two|three|four|five)\s+(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+(one|two|three|four|five|six|seven|eight|nine))?\b/g;
  clean = clean.replace(shorthandPattern, (match, h, t, u) => {
    const hundreds = SMALL_NUMBERS[h] * 100;
    const tens = SMALL_NUMBERS[t];
    const units = u ? SMALL_NUMBERS[u] : 0;
    return (hundreds + tens + units).toString();
  });

  // Handle hundreds + teens (e.g. "three fifteen" -> 315, "two ten" -> 210)
  const teenShorthandPattern = /\b(one|two|three|four|five)\s+(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/g;
  clean = clean.replace(teenShorthandPattern, (match, h, teen) => {
    const hundreds = SMALL_NUMBERS[h] * 100;
    const teenVal = SMALL_NUMBERS[teen];
    return (hundreds + teenVal).toString();
  });

  // Handle standard number words (e.g. "two hundred twenty five")
  const tokens = clean.split(/\s+/);
  const result = [];
  let currentGroup = 0;
  let inNumber = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (SMALL_NUMBERS[token] !== undefined) {
      inNumber = true;
      currentGroup += SMALL_NUMBERS[token];
    } else if (MAGNITUDES[token] !== undefined) {
      inNumber = true;
      if (currentGroup === 0) currentGroup = 1;
      currentGroup *= MAGNITUDES[token];
    } else {
      if (inNumber) {
        result.push(currentGroup.toString());
        currentGroup = 0;
        inNumber = false;
      }
      result.push(token);
    }
  }

  if (inNumber) {
    result.push(currentGroup.toString());
  }

  return result.join(" ");
}

/**
 * Converts weight value between lbs and kg
 */
export function convertWeight(val, fromUnit, toUnit) {
  if (fromUnit === toUnit) return Math.round(val * 10) / 10;
  if (fromUnit === "kg" && toUnit === "lbs") {
    // 1 kg = 2.20462 lbs
    return Math.round(val * 2.20462 * 10) / 10;
  }
  if (fromUnit === "lbs" && toUnit === "kg") {
    // 1 lb = 0.453592 kg
    return Math.round(val * 0.453592 * 10) / 10;
  }
  return val;
}

/**
 * Main Intent Parsing function
 *
 * @param {string} rawTranscript - Spoken voice transcript
 * @param {Object} context - App state context { lastSet, userUnitPreference: "lbs"|"kg" }
 * @returns {Object} Parsed intent payload
 */
export function parseVoiceIntent(rawTranscript, context = {}) {
  const { lastSet = null, userUnit = "lbs", customExercises = [] } = context;
  if (!rawTranscript || !rawTranscript.trim()) {
    return { error: "No voice input detected." };
  }

  let text = convertWordsToNumbers(rawTranscript.trim());
  const lower = text.toLowerCase();

  // 1. RELATIVE SET ("Same as last set", "Same", "Add 5 pounds for 10 reps", "Minus 10 lbs 8 reps")
  if (isRelativeCommand(lower)) {
    return parseRelativeSet(lower, lastSet, userUnit);
  }

  // 2. DROP SET ("Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure")
  if (isDropSetCommand(lower)) {
    return parseDropSet(lower, userUnit, lastSet, customExercises);
  }

  // 3. TIME / DISTANCE EXERCISES ("Plank for 60 seconds", "Treadmill 1 mile in 8 mins")
  if (isTimeOrDistanceCommand(lower)) {
    return parseTimeOrDistance(lower, customExercises);
  }

  // 4. BODYWEIGHT SET ("Dips 15 reps with 25 pounds", "Pull ups 10 reps bodyweight", "15 dips")
  if (isBodyweightCommand(lower)) {
    return parseBodyweight(lower, userUnit, customExercises);
  }

  // 5. STANDARD SET ("Bench press 225 pounds for 8 reps", "Squat 315 for 5")
  return parseStandardSet(lower, userUnit, lastSet, customExercises);
}

/**
 * Check if input matches relative patterns
 */
function isRelativeCommand(text) {
  return /^(same|same as last|repeat|another set|add \d+|plus \d+|minus \d+|drop \d+|up \d+|down \d+|same weight)/i.test(text.trim());
}

/**
 * Parse relative set command
 */
function parseRelativeSet(text, lastSet, userUnit) {
  if (!lastSet) {
    return {
      status: "error",
      message: "No previous set found to duplicate or modify. Please state the exercise name."
    };
  }

  // "Same as last set" / "same" / "repeat"
  if (/^(same|same as last( set)?|repeat|another( one| set)?)$/i.test(text.trim())) {
    return {
      status: "ready",
      type: "standard",
      isRelative: true,
      exercise: lastSet.exercise,
      weight: lastSet.weight,
      reps: lastSet.reps,
      unit: lastSet.unit || userUnit,
      note: "Inherited from previous set"
    };
  }

  // "Add 5 pounds for 10 reps" / "Plus 10 lbs 8 reps"
  const addMatch = text.match(/(?:add|plus|up)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?(?:\s+(?:for|at)\s+|\s+)?(\d+)?\s*(?:reps?)?/i);
  if (addMatch) {
    const delta = parseFloat(addMatch[1]);
    const newWeight = (lastSet.weight || 0) + delta;
    const newReps = addMatch[2] ? parseInt(addMatch[2], 10) : lastSet.reps;
    return {
      status: "ready",
      type: "standard",
      isRelative: true,
      exercise: lastSet.exercise,
      weight: newWeight,
      reps: newReps,
      unit: lastSet.unit || userUnit,
      note: `+${delta} ${lastSet.unit || userUnit} vs last set`
    };
  }

  // "Minus 10 pounds for 8 reps" / "Drop 5 lbs 8 reps"
  const minusMatch = text.match(/(?:minus|drop|down|reduce)\s+(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?(?:\s+(?:for|at)\s+|\s+)?(\d+)?\s*(?:reps?)?/i);
  if (minusMatch) {
    const delta = parseFloat(minusMatch[1]);
    const newWeight = Math.max(0, (lastSet.weight || 0) - delta);
    const newReps = minusMatch[2] ? parseInt(minusMatch[2], 10) : lastSet.reps;
    return {
      status: "ready",
      type: "standard",
      isRelative: true,
      exercise: lastSet.exercise,
      weight: newWeight,
      reps: newReps,
      unit: lastSet.unit || userUnit,
      note: `-${delta} ${lastSet.unit || userUnit} vs last set`
    };
  }

  // "Same weight for 10 reps"
  const sameWeightMatch = text.match(/same weight(?:\s+(?:for|at)\s+|\s+)?(\d+)\s*(?:reps?)?/i);
  if (sameWeightMatch) {
    return {
      status: "ready",
      type: "standard",
      isRelative: true,
      exercise: lastSet.exercise,
      weight: lastSet.weight,
      reps: parseInt(sameWeightMatch[1], 10),
      unit: lastSet.unit || userUnit,
      note: "Same weight, new reps"
    };
  }

  return {
    status: "ready",
    type: "standard",
    exercise: lastSet.exercise,
    weight: lastSet.weight,
    reps: lastSet.reps,
    unit: lastSet.unit || userUnit
  };
}

/**
 * Check if command is a Drop Set
 */
function isDropSetCommand(text) {
  return /drop\s*set/i.test(text) || (text.includes(",") && /\d+\s*(?:for|reps?|at)\s*\d+/i.test(text));
}

/**
 * Parse drop set sequence
 * e.g., "Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure"
 */
function parseDropSet(text, userUnit, lastSet, customExercises = []) {
  // Extract exercise name before the colon or numbers
  let exerciseNameStr = "";
  let segmentsStr = text;

  // Clean out drop set prefix
  const dropSetMatch = text.match(/drop\s*set(?:\s+on|\s+for)?\s+([^:,\d]+)(?:[:,\s]+)(.*)/i);
  if (dropSetMatch) {
    exerciseNameStr = dropSetMatch[1].trim();
    segmentsStr = dropSetMatch[2].trim();
  } else {
    // Try matching exercise before first digit
    const firstDigitIdx = text.search(/\d/);
    if (firstDigitIdx > 0) {
      exerciseNameStr = text.substring(0, firstDigitIdx).replace(/drop\s*set/i, "").trim();
      segmentsStr = text.substring(firstDigitIdx).trim();
    }
  }

  let fuzzyRes = null;
  let targetExercise = null;

  if (exerciseNameStr) {
    fuzzyRes = matchExercise(exerciseNameStr, customExercises);
    targetExercise = fuzzyRes.bestMatch;
  } else if (lastSet) {
    targetExercise = findExerciseByName(lastSet.exercise);
  }

  // Split sequence: e.g. "60 pounds for 8, 40 for 10, 20 to failure"
  // or "60 for 8 then 40 for 10 then 20 to failure"
  const rawSegments = segmentsStr
    .replace(/\bthen\b/g, ",")
    .replace(/\band\b/g, ",")
    .split(/[,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const drops = [];

  for (const seg of rawSegments) {
    // Check "20 to failure" or "20 for 10" or "60 pounds for 8"
    const failureMatch = seg.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?\s*(?:to|till|until)?\s*failure/i);
    if (failureMatch) {
      drops.push({
        weight: parseFloat(failureMatch[1]),
        reps: "Failure",
        toFailure: true
      });
      continue;
    }

    const standardDropMatch = seg.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?(?:\s+(?:for|at|x|\*)\s+|\s+)?(\d+)\s*(?:reps?)?/i);
    if (standardDropMatch) {
      drops.push({
        weight: parseFloat(standardDropMatch[1]),
        reps: parseInt(standardDropMatch[2], 10),
        toFailure: false
      });
      continue;
    }

    // Single number with failure
    if (/failure/i.test(seg)) {
      const numMatch = seg.match(/(\d+(?:\.\d+)?)/);
      drops.push({
        weight: numMatch ? parseFloat(numMatch[1]) : 0,
        reps: "Failure",
        toFailure: true
      });
    }
  }

  if (drops.length === 0) {
    return {
      status: "incomplete",
      missing: "drops",
      promptMessage: "Please specify the weights and reps for the drop set (e.g. '60 for 8, 40 for 10')."
    };
  }

  const exName = targetExercise ? targetExercise.name : (exerciseNameStr || "Cable Fly");

  return {
    status: (fuzzyRes && fuzzyRes.isAmbiguous) ? "ambiguous" : "ready",
    type: "drop_set",
    exercise: exName,
    drops,
    weight: drops[0].weight,
    reps: drops[0].reps,
    unit: userUnit,
    fuzzyResult: fuzzyRes
  };
}

/**
 * Check if command is Time or Distance based
 */
function isTimeOrDistanceCommand(text) {
  // If text contains "reps", it's a resistance/weight set, not a timed exercise (e.g. "50s for 10 reps")
  if (/\b(?:reps?|times)\b/i.test(text)) return false;
  return /\b(plank|treadmill|rower|rowing machine|running|jogging|cycling|bike)\b/i.test(text) ||
         /\b(\d+\s*(?:sec|seconds?|mins?|minutes?|miles?|meters?|km|kilometers?))\b/i.test(text);
}

/**
 * Parse time or distance exercises
 * e.g., "Plank for 60 seconds", "Treadmill 1 mile in 8 mins"
 */
function parseTimeOrDistance(text, customExercises = []) {
  const fuzzyRes = matchExercise(text, customExercises);
  const exercise = fuzzyRes.bestMatch || { name: "Plank", type: "time" };

  // Check distance + time e.g. "Treadmill 1 mile in 8 mins"
  const distTimeMatch = text.match(/(\d+(?:\.\d+)?)\s*(miles?|meters?|km|kilometers?)\s*(?:in|for)?\s*(\d+(?:\.\d+)?)\s*(mins?|minutes?|sec|seconds?)/i);
  if (distTimeMatch) {
    const distVal = parseFloat(distTimeMatch[1]);
    const distUnit = distTimeMatch[2].toLowerCase();
    const timeVal = parseFloat(distTimeMatch[3]);
    const timeUnit = distTimeMatch[4].toLowerCase().startsWith("min") ? "mins" : "seconds";

    return {
      status: fuzzyRes.isAmbiguous ? "ambiguous" : "ready",
      type: "distance_time",
      exercise: exercise.name,
      distance: distVal,
      distUnit,
      duration: timeVal,
      durationUnit: timeUnit,
      fuzzyResult: fuzzyRes
    };
  }

  // Time duration only e.g. "Plank for 60 seconds" / "Plank 2 minutes"
  const timeMatch = text.match(/(\d+(?:\.\d+)?)\s*(seconds?|secs?|minutes?|mins?)/i);
  if (timeMatch) {
    let duration = parseFloat(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith("min")) {
      duration = duration * 60; // normalize to seconds
    }

    return {
      status: fuzzyRes.isAmbiguous ? "ambiguous" : "ready",
      type: "time",
      exercise: exercise.name,
      duration,
      unit: "seconds",
      fuzzyResult: fuzzyRes
    };
  }

  // Missing time
  return {
    status: "incomplete",
    missing: "duration",
    exercise: exercise.name,
    promptMessage: `How long did you do ${exercise.name} for? (e.g. 60 seconds)`
  };
}

/**
 * Check if command is bodyweight
 */
function isBodyweightCommand(text) {
  return /\b(dips?|pull\s*ups?|chin\s*ups?|push\s*ups?|leg\s*raises?|bodyweight)\b/i.test(text);
}

/**
 * Parse Bodyweight set
 * e.g., "Dips 15 reps with 25 pounds" / "Pull ups 10 reps bodyweight"
 */
function parseBodyweight(text, userUnit, customExercises = []) {
  const fuzzyRes = matchExercise(text, customExercises);
  const exercise = fuzzyRes.bestMatch || { name: "Dips", type: "bodyweight" };

  // Added weight match: "with 25 pounds" / "plus 25 lbs" / "added 25"
  const addedWeightMatch = text.match(/(?:with|plus|\+|added)\s+(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilos?)?/i);
  let addedWeight = 0;
  let detectedUnit = userUnit;

  if (addedWeightMatch) {
    addedWeight = parseFloat(addedWeightMatch[1]);
    if (addedWeightMatch[2]) {
      const u = addedWeightMatch[2].toLowerCase();
      detectedUnit = u.startsWith("k") ? "kg" : "lbs";
      if (detectedUnit !== userUnit) {
        addedWeight = convertWeight(addedWeight, detectedUnit, userUnit);
      }
    }
  }

  // Reps match: "15 reps" or "for 15" or number before/after exercise
  const repsMatch = text.match(/(\d+)\s*(?:reps?|times)/i) || text.match(/(?:for|at)\s*(\d+)/i);
  let reps = null;

  if (repsMatch) {
    reps = parseInt(repsMatch[1], 10);
  } else {
    // Try extracting any standalone number that isn't the added weight
    const numbers = (text.match(/\b\d+\b/g) || []).map(Number);
    if (numbers.length > 0) {
      if (addedWeight > 0) {
        const remaining = numbers.filter(n => n !== addedWeight);
        if (remaining.length > 0) reps = remaining[0];
      } else {
        reps = numbers[0];
      }
    }
  }

  if (reps === null || reps === 0) {
    return {
      status: "incomplete",
      missing: "reps",
      exercise: exercise.name,
      partialPayload: { exercise: exercise.name, addedWeight, isBodyweight: true, unit: userUnit },
      promptMessage: `How many reps did you complete for ${exercise.name}?`
    };
  }

  return {
    status: fuzzyRes.isAmbiguous ? "ambiguous" : "ready",
    type: "bodyweight",
    isBodyweight: true,
    exercise: exercise.name,
    addedWeight,
    reps,
    unit: userUnit,
    fuzzyResult: fuzzyRes
  };
}

/**
 * Parse Standard Set
 * e.g., "Bench press 225 pounds for 8 reps", "Squats 315 for 5"
 */
function parseStandardSet(text, userUnit, lastSet, customExercises = []) {
  // Check explicit unit in speech
  let spokenUnit = null;
  if (/\b(kg|kilos?|kilograms?)\b/i.test(text)) {
    spokenUnit = "kg";
  } else if (/\b(lbs?|pounds?)\b/i.test(text)) {
    spokenUnit = "lbs";
  }

  // Extract exercise name by matching against database
  const fuzzyRes = matchExercise(text, customExercises);
  const exercise = fuzzyRes.bestMatch;

  // Patterns for Weight & Reps
  // Pattern A: "225 pounds for 8 reps" / "225 lbs for 8" / "225 for 8"
  // Pattern B: "8 reps with 225 pounds" / "8 reps at 225"
  // Pattern C: "225 x 8" / "225 8"

  let weight = null;
  let reps = null;

  // Check Pattern B: reps first
  const repsFirstMatch = text.match(/(\d+)\s*reps?\s*(?:at|with|for|@)?\s*(\d+(?:\.\d+)?)\s*s?\s*(?:lbs?|pounds?|kg|kilos?)?/i);
  if (repsFirstMatch) {
    reps = parseInt(repsFirstMatch[1], 10);
    weight = parseFloat(repsFirstMatch[2]);
  }

  // Check Pattern A: weight first (also supports pluralized weights e.g. "50s for 10 reps", "the 35s for 8")
  if (weight === null) {
    const weightFirstMatch = text.match(/(?:with\s+(?:the\s+)?)?(\d+(?:\.\d+)?)\s*s?\s*(?:lbs?|pounds?|kg|kilos?)?\s*(?:for|at|x|\*)\s*(\d+)\s*(?:reps?)?/i);
    if (weightFirstMatch) {
      weight = parseFloat(weightFirstMatch[1]);
      reps = parseInt(weightFirstMatch[2], 10);
    }
  }

  // Fallback: search all numbers in text
  if (weight === null || reps === null) {
    const numbers = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (numbers.length >= 2) {
      // Heuristic: typical weights > typical reps
      if (numbers[0] > numbers[1] && numbers[1] <= 50) {
        weight = numbers[0];
        reps = Math.round(numbers[1]);
      } else if (numbers[1] > numbers[0] && numbers[0] <= 50) {
        reps = Math.round(numbers[0]);
        weight = numbers[1];
      } else {
        weight = numbers[0];
        reps = Math.round(numbers[1]);
      }
    } else if (numbers.length === 1) {
      // Missing either weight or reps!
      const val = numbers[0];
      if (/reps?|times/i.test(text)) {
        reps = Math.round(val);
      } else {
        weight = val;
      }
    }
  }

  // Check if we need auto-conversion of units
  if (weight !== null && spokenUnit && spokenUnit !== userUnit) {
    weight = convertWeight(weight, spokenUnit, userUnit);
  }

  const exerciseName = exercise ? exercise.name : (lastSet ? lastSet.exercise : "Barbell Bench Press");

  // Incomplete Parameter Fallbacks (PRD 3.1)
  if (weight !== null && (reps === null || reps <= 0)) {
    return {
      status: "incomplete",
      missing: "reps",
      exercise: exerciseName,
      partialPayload: { exercise: exerciseName, weight, unit: userUnit },
      promptMessage: `How many reps did you complete with ${weight} ${userUnit}?`
    };
  }

  if ((weight === null || weight <= 0) && reps !== null && reps > 0) {
    return {
      status: "incomplete",
      missing: "weight",
      exercise: exerciseName,
      partialPayload: { exercise: exerciseName, reps, unit: userUnit },
      promptMessage: `What weight did you use for ${exerciseName} (${reps} reps)?`
    };
  }

  if (weight === null && reps === null) {
    return {
      status: "incomplete",
      missing: "both",
      exercise: exerciseName,
      promptMessage: `Please specify the weight and reps for ${exerciseName}.`
    };
  }

  return {
    status: (fuzzyRes && fuzzyRes.isAmbiguous) ? "ambiguous" : "ready",
    type: "standard",
    exercise: exerciseName,
    weight,
    reps,
    unit: userUnit,
    fuzzyResult: fuzzyRes
  };
}

/**
 * Extract candidate exercise name from spoken utterance when not recognized
 * Strips out numbers, units, reps, and workout keywords to isolate the movement name.
 */
export function extractCustomExerciseCandidate(rawTranscript) {
  if (!rawTranscript) return "Custom Exercise";
  let s = rawTranscript.trim();
  // Strip drop set prefix
  s = s.replace(/^(drop set on|drop set)\s*/i, "");
  // Pattern: weight + reps
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?\s*(?:for|at|x|\*)\s*(\d+)\s*(?:reps?)?/i, "");
  // Pattern: reps + weight
  s = s.replace(/(\d+)\s*(?:sets?\s*(?:of\s*)?)?reps?\s*(?:at|with|for|@)?\s*(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?|kg|kilos?)?/i, "");
  // Strip sets / reps phrases like "3 sets of 8", "10 reps", "100 lbs"
  s = s.replace(/\b\d+\s*sets?\s*(?:of\s*)?\d*\b/gi, "");
  s = s.replace(/\b\d+(?:\.\d+)?\s*(?:lbs?|pounds?|kg|kilos?|reps?)\b/gi, "");
  s = s.replace(/\b\d+\b/g, "");
  s = s.replace(/\b(for|at|with|reps?|lbs?|pounds?|kg|kilos?|to failure|seconds?|mins?|minutes?|bodyweight)\b/gi, "");
  s = s.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
  if (!s) return rawTranscript.trim();
  return s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
