/**
 * Vox Gym - Fuzzy Matching & Alias Resolver
 * Implements Levenshtein Distance and token similarity for exercise normalization.
 */

import { EXERCISE_DATABASE } from './exercises.js';

/**
 * Compute the Levenshtein distance between two strings
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = [];
  for (let j = 0; j <= b.length; j++) {
    row[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Normalized string similarity score between 0.0 (no match) and 1.0 (exact match)
 */
export function stringSimilarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Exact whole-word phrase match boundary check
  // e.g. "pull ups" in "pull ups 10 reps", or "lateral raise" in "machine lateral raise 20 for 12"
  const escaped2 = s2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex2 = new RegExp("(?:^|\\s)" + escaped2 + "(?:\\s|$)", "i");
  if (regex2.test(s1)) {
    const coverage = s2.length / s1.length;
    return Math.min(0.99, 0.94 + 0.05 * coverage);
  }

  const escaped1 = s1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex1 = new RegExp("(?:^|\\s)" + escaped1 + "(?:\\s|$)", "i");
  if (regex1.test(s2)) {
    const coverage = s1.length / s2.length;
    return Math.min(0.99, 0.94 + 0.05 * coverage);
  }

  // Token matching (e.g. "db fly" vs "dumbbell fly")
  const tokens1 = s1.split(/\s+/);
  const tokens2 = s2.split(/\s+/);
  let tokenMatches = 0;
  for (const t1 of tokens1) {
    if (tokens2.some(t2 => {
      if (t1 === t2) return true;
      if (t1 === "db" && (t2 === "dumbbell" || t2 === "dumbbells")) return true;
      if (t2 === "db" && (t1 === "dumbbell" || t1 === "dumbbells")) return true;
      if (t1 === "bb" && (t2 === "barbell" || t2 === "barbells")) return true;
      if (t2 === "bb" && (t1 === "barbell" || t1 === "barbells")) return true;
      return false;
    })) {
      tokenMatches++;
    }
  }

  const minTokens = Math.min(tokens1.length, tokens2.length);
  const tokenScore = (2.0 * tokenMatches) / (tokens1.length + tokens2.length);
  const coverage = minTokens > 0 ? (tokenMatches / minTokens) : 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const levScore = 1.0 - (distance / maxLen);

  let baseScore = Math.max(levScore, tokenScore * 0.85);
  if (coverage >= 1.0 && minTokens >= 2) {
    baseScore = Math.max(baseScore, 0.82);
  }
  return baseScore;
}

/**
 * Standardize text: lower case, remove punctuation, collapse whitespace
 */
export function normalize(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match spoken input against the exercise database and custom exercises
 * Evaluates both the official exercise names and registered aliases.
 *
 * @param {string} input - Spoken exercise string (e.g., "db fly", "incline db", "bench press")
 * @param {Array} [additionalExercises=[]] - Optional custom user exercises
 * @returns {Object} result - { bestMatch, matches, isAmbiguous, confidence }
 */
export function matchExercise(input, additionalExercises = []) {
  const cleanInput = normalize(input);
  if (!cleanInput) {
    return {
      bestMatch: null,
      matches: [],
      isAmbiguous: true,
      confidence: 0
    };
  }

  const scoredExercises = [];
  const exerciseList = additionalExercises.length > 0 
    ? [...EXERCISE_DATABASE, ...additionalExercises]
    : EXERCISE_DATABASE;

  for (const exercise of exerciseList) {
    let highestScoreForExercise = 0;
    let matchedTerm = exercise.name;

    // Check main name
    const mainScore = stringSimilarity(cleanInput, exercise.name);
    if (mainScore > highestScoreForExercise) {
      highestScoreForExercise = mainScore;
      matchedTerm = exercise.name;
    }

    // Check all known aliases
    for (const alias of exercise.aliases) {
      const aliasScore = stringSimilarity(cleanInput, alias);
      if (aliasScore > highestScoreForExercise) {
        highestScoreForExercise = aliasScore;
        matchedTerm = alias;
      }

      // Exact alias match gives 1.0 confidence
      if (cleanInput === normalize(alias)) {
        highestScoreForExercise = 1.0;
        matchedTerm = alias;
        break;
      }
    }

    scoredExercises.push({
      exercise,
      score: highestScoreForExercise,
      matchedTerm
    });
  }

  // Sort by highest score descending
  scoredExercises.sort((a, b) => b.score - a.score);

  const topMatches = scoredExercises.slice(0, 3);
  const best = topMatches[0];

  // Ambiguity criteria per PRD 3.2:
  // - Confidence is < 75% (< 0.75)
  // - Or multiple close matches exist (top 2 within 0.08 of each other, topMatch2 >= 0.70, and best match < 0.95)
  let isAmbiguous = false;
  if (!best || best.score < 0.75) {
    isAmbiguous = true;
  } else if (
    topMatches.length > 1 &&
    best.score < 0.95 &&
    topMatches[1].score >= 0.70 &&
    (best.score - topMatches[1].score) < 0.08
  ) {
    isAmbiguous = true;
  }

  return {
    bestMatch: best ? best.exercise : null,
    confidence: best ? Math.round(best.score * 100) : 0,
    matches: topMatches,
    isAmbiguous
  };
}
