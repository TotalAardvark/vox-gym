/**
 * Vox Gym - Storage & Comparative Stats Unit Test
 */

// Mock localStorage for Node environment
const mockStore = {};
global.localStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; },
  clear: () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }
};

const { StorageManager } = await import('../js/storage.js');

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

console.log("=== Testing StorageManager & Comparative Analytics ===");

const sm = new StorageManager();

// 1. Initial history pre-seed
const hist = sm.getWorkoutHistory();
const prevDates = Object.keys(hist);
assert(prevDates.length > 0, `Pre-seeded historical workout created (${prevDates[0]})`);

// 2. Comparative stats BEFORE any sets today
const statsBefore = sm.getExerciseComparativeStats("Barbell Bench Press");
assert(statsBefore.thisSession.setCount === 0, "Today set count is 0");
assert(statsBefore.lastSession !== null, "Found historical session for Barbell Bench Press");
assert(statsBefore.lastSession.bestWeight === 215, "Last session best weight is 215 lbs");
assert(statsBefore.microTrend.direction === "neutral", "Micro-trend direction is neutral target");

// 3. Log a set with 225 lbs (higher than previous 215 lbs)
sm.logSet({
  type: "standard",
  exercise: "Barbell Bench Press",
  weight: 225,
  reps: 8,
  unit: "lbs"
});

const statsAfter = sm.getExerciseComparativeStats("Barbell Bench Press");
assert(statsAfter.thisSession.setCount === 1, "Today set count is 1");
assert(statsAfter.thisSession.volume === 225 * 8, `Today volume is 1800 (got ${statsAfter.thisSession.volume})`);
assert(statsAfter.microTrend.direction === "up", `Micro-trend is "up" (+10 lbs vs last session, got "${statsAfter.microTrend.text}")`);
assert(statsAfter.microTrend.text.includes("+10 lbs"), "Micro-trend text indicates +10 lbs progression");

// 4. Log second set
sm.logSet({
  type: "standard",
  exercise: "Barbell Bench Press",
  weight: 225,
  reps: 8,
  unit: "lbs"
});
const todaySession = sm.getTodaySession();
assert(todaySession.sets.length === 2, "2 sets in today session");

// 5. Delete a set
const firstSetId = todaySession.sets[0].id;
sm.deleteSet(firstSetId);
const todaySessionAfterDel = sm.getTodaySession();
assert(todaySessionAfterDel.sets.length === 1, "1 set remaining after delete");

// 6. Test getExerciseHistory()
const benchHistory = sm.getExerciseHistory("Barbell Bench Press");
assert(benchHistory.length >= 2, `Bench press has at least 2 sessions in history (got ${benchHistory.length})`);
assert(benchHistory[0].date < benchHistory[1].date, "Sessions are sorted chronologically oldest to newest");
assert(benchHistory[0].maxWeight === 215, `Old session max weight is 215 (got ${benchHistory[0].maxWeight})`);
assert(benchHistory[benchHistory.length - 1].maxWeight === 225, `Today session max weight is 225 (got ${benchHistory[benchHistory.length - 1].maxWeight})`);
assert(benchHistory[benchHistory.length - 1].totalVolume === 1800, `Today session volume is 1800 (got ${benchHistory[benchHistory.length - 1].totalVolume})`);

console.log(`\nStorage tests passed: ${passed}, failed: ${failed}`);
if (failed > 0) process.exit(1);
