/**
 * Vox Gym - Comprehensive Automated Test Suite
 * Tests Fuzzy Matching, Intent Parsing, Relative Sets, Drop Sets,
 * Bodyweight Sets, Unit Conversion, and Incomplete Fallbacks.
 */

import { matchExercise, levenshteinDistance, stringSimilarity } from '../js/fuzzy.js';
import { parseVoiceIntent, convertWordsToNumbers, convertWeight } from '../js/nlp-parser.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log("=== 1. Testing String Similarity & Levenshtein ===");
assert(levenshteinDistance("kitten", "sitting") === 3, "Levenshtein distance calculation");
assert(stringSimilarity("db fly", "dumbbell fly") >= 0.80, "Fuzzy match db fly -> dumbbell fly");
assert(stringSimilarity("incline db", "incline dumbbell press") >= 0.80, "Fuzzy match incline db -> incline dumbbell press");

console.log("\n=== 2. Testing Fuzzy Exercise Alias Resolution ===");
const testCases = [
  { input: "DB Fly", expected: "Dumbbell Fly" },
  { input: "Incline DB", expected: "Incline Dumbbell Press" },
  { input: "bench press", expected: "Barbell Bench Press" },
  { input: "flat bench", expected: "Barbell Bench Press" },
  { input: "squats", expected: "Barbell Back Squat" },
  { input: "bb squat", expected: "Barbell Back Squat" },
  { input: "deadlift", expected: "Barbell Deadlift" },
  { input: "rdl", expected: "Romanian Deadlift" },
  { input: "ohp", expected: "Overhead Press" },
  { input: "cable flyes", expected: "Cable Fly" },
  { input: "lat pulldown", expected: "Lat Pulldown" },
  { input: "bicep curls", expected: "Bicep Curls" },
  { input: "curls", expected: "Bicep Curls" }
];

for (const tc of testCases) {
  const res = matchExercise(tc.input);
  assert(res.bestMatch && res.bestMatch.name === tc.expected, `"${tc.input}" normalized to "${tc.expected}" (got "${res.bestMatch?.name}", confidence ${res.confidence}%)`);
}

console.log("\n=== 3. Testing Number Words Converter ===");
assert(convertWordsToNumbers("two hundred twenty five") === "225", "'two hundred twenty five' -> '225'");
assert(convertWordsToNumbers("two twenty five") === "225", "'two twenty five' -> '225'");
assert(convertWordsToNumbers("three fifteen") === "315", "'three fifteen' -> '315'");
assert(convertWordsToNumbers("eight reps") === "8 reps", "'eight reps' -> '8 reps'");

console.log("\n=== 4. Testing NLP Intent Parser: Standard Sets ===");
const std1 = parseVoiceIntent("Bench press 225 pounds for 8 reps", { userUnit: "lbs" });
assert(std1.status === "ready", "Status ready");
assert(std1.exercise === "Barbell Bench Press", "Exercise name matched");
assert(std1.weight === 225, `Weight is 225 (got ${std1.weight})`);
assert(std1.reps === 8, `Reps is 8 (got ${std1.reps})`);

const std2 = parseVoiceIntent("Squat 315 for 5", { userUnit: "lbs" });
assert(std2.weight === 315 && std2.reps === 5, `Squat 315 for 5 -> weight 315, reps 5 (got ${std2.weight}, ${std2.reps})`);

console.log("\n=== 5. Testing Relative Sets ===");
const lastSetMock = { exercise: "Barbell Bench Press", weight: 225, reps: 8, unit: "lbs" };

const relSame = parseVoiceIntent("Same as last set", { lastSet: lastSetMock, userUnit: "lbs" });
assert(relSame.weight === 225 && relSame.reps === 8, "Same as last set inherits 225 lbs x 8");

const relAdd = parseVoiceIntent("Add 5 pounds for 10 reps", { lastSet: lastSetMock, userUnit: "lbs" });
assert(relAdd.weight === 230 && relAdd.reps === 10, "Add 5 pounds for 10 reps -> 230 lbs x 10");

const relMinus = parseVoiceIntent("Minus 10 pounds for 8 reps", { lastSet: lastSetMock, userUnit: "lbs" });
assert(relMinus.weight === 215 && relMinus.reps === 8, "Minus 10 pounds for 8 reps -> 215 lbs x 8");

console.log("\n=== 6. Testing Drop Sets ===");
const drop = parseVoiceIntent("Drop set on Cable Flyes: 60 pounds for 8, 40 for 10, 20 to failure", { userUnit: "lbs" });
assert(drop.type === "drop_set", "Parsed as drop_set type");
assert(drop.drops && drop.drops.length === 3, "Parsed 3 drop segments");
assert(drop.drops[0].weight === 60 && drop.drops[0].reps === 8, "Drop 1: 60 for 8");
assert(drop.drops[1].weight === 40 && drop.drops[1].reps === 10, "Drop 2: 40 for 10");
assert(drop.drops[2].weight === 20 && drop.drops[2].toFailure === true, "Drop 3: 20 to failure");

console.log("\n=== 7. Testing Bodyweight Sets ===");
const bw = parseVoiceIntent("Dips 15 reps with 25 pounds", { userUnit: "lbs" });
assert(bw.type === "bodyweight", "Type is bodyweight");
assert(bw.exercise === "Dips", "Exercise is Dips");
assert(bw.reps === 15, "Reps is 15");
assert(bw.addedWeight === 25, "Added weight is 25");

console.log("\n=== 8. Testing Time & Distance Exercises ===");
const time = parseVoiceIntent("Plank for 60 seconds", { userUnit: "lbs" });
assert(time.exercise === "Plank", "Exercise is Plank");
assert(time.duration === 60, "Duration is 60s");

const dist = parseVoiceIntent("Treadmill 1 mile in 8 mins", { userUnit: "lbs" });
assert(dist.exercise === "Treadmill", "Exercise is Treadmill");
assert(dist.distance === 1, "Distance is 1 mile");
assert(dist.duration === 8, "Duration is 8 mins");

console.log("\n=== 9. Testing Unit Auto-Conversion (PRD 3.5) ===");
// When user preference is lbs, but speaks 100 kg -> 220.5 lbs
const convKg = parseVoiceIntent("Bench press 100 kg for 8 reps", { userUnit: "lbs" });
assert(convKg.weight === 220.5, `100 kg auto-converted to 220.5 lbs (got ${convKg.weight})`);

// When user preference is kg, but speaks 225 lbs -> 102.1 kg
const convLbs = parseVoiceIntent("Squat 225 lbs for 5 reps", { userUnit: "kg" });
assert(convLbs.weight === 102.1, `225 lbs auto-converted to 102.1 kg (got ${convLbs.weight})`);

console.log("\n=== 10. Testing Incomplete Parameter Fallbacks (PRD 3.1) ===");
const incReps = parseVoiceIntent("Squats 225 pounds", { userUnit: "lbs" });
assert(incReps.status === "incomplete" && incReps.missing === "reps", "Squats 225 pounds triggers incomplete reps");

const incWeight = parseVoiceIntent("Bicep curls 12 reps", { userUnit: "lbs" });
assert(incWeight.status === "incomplete" && incWeight.missing === "weight", "Bicep curls 12 reps triggers incomplete weight");

console.log("\n=== Test Results Summary ===");
console.log(`Total tests passed: ${passed}`);
console.log(`Total tests failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL TESTS PASSED SUCCESSFULLY! 🚀");
}
