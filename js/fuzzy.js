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

  // Exact inclusion bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    const inclusionScore = minLen / maxLen;
    // Boost inclusion
    return Math.max(0.85, inclusionScore);
  }

  // Token matching (e.g. "db fly" vs "dumbbell fly")
  const tokens1 = s1.split(/\s+/);
  const tokens2 = s2.split(/\s+/);
  let tokenMatches = 0;
  for (const t1 of tokens1) {
    if (tokens2.some(t2 => {
      if (t1 === t2) return true;
      if (t1 === "db" && t2 === "dumbbell") return true;
      if (t1 === "bb" && t2 === "barbell") return true;
      if (t1.length > 2 && t2.startsWith(t1)) return true;
      if (t2.length > 2 && t1.startsWith(t2)) return true;
      return false;
    })) {
      tokenMatches++;
    }
  }
  const tokenScore = (2.0 * tokenMatches) / (tokens1.length + tokens2.length);

  const minTokens = Math.min(tokens1.length, tokens2.length);
  const coverage = minTokens > 0 ? (tokenMatches / minTokens) : 0;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  const levScore = 1.0 - (distance / maxLen);

  return Math.max(levScore, tokenScore * 0.9, coverage >= 1.0 ? 0.85 : 0);
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
 * Match spoken input against the exercise database
 * Evaluates both the official exercise names and registered aliases.
 *
 * @param {string} input - Spoken exercise string (e.g., "db fly", "incline db", "bench press")
 * @returns {Object} result - { bestMatch, matches, isAmbiguous, confidence }
 */
export function matchExercise(input) {
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

  for (const exercise of EXERCISE_DATABASE) {
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
  // - Confidence is < 80% (< 0.80)
  // - Or multiple close matches exist (e.g. top 2 within 0.08 of each other and both > 0.65)
  let isAmbiguous = false;
  if (!best || best.score < 0.80) {
    isAmbiguous = true;
  } else if (
    topMatches.length > 1 &&
    topMatches[1].score >= 0.70 &&
    (best.score - topMatches[1].score) < 0.08 &&
    best.score < 0.98
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
