/**
 * Vox Gym - Exercise Database & Normalization Registry
 */

export const EXERCISE_DATABASE = [
  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "bench press", "bench", "flat bench", "flat barbell bench", "bb bench", "flat bench press", "chest press"
    ],
    defaultIncrement: 5
  },
  {
    id: "dumbbell-fly",
    name: "Dumbbell Fly",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "db fly", "db flyes", "dumbbell flyes", "db chest fly", "dumbbell chest fly", "flat db fly", "chest flyes"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "incline db", "incline db press", "incline dumbbell", "incline db bench", "incline press"
    ],
    defaultIncrement: 5
  },
  {
    id: "incline-bench-press",
    name: "Incline Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "incline bench", "incline barbell bench", "incline bb bench", "incline barbell press"
    ],
    defaultIncrement: 5
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "cable flyes", "cable chest fly", "standing cable fly", "crossover fly", "cable crossovers", "cable crossover"
    ],
    defaultIncrement: 5
  },
  {
    id: "dips",
    name: "Dips",
    muscle: "Chest & Triceps",
    type: "bodyweight",
    aliases: [
      "dip", "chest dips", "tricep dips", "weighted dips", "parallel bar dips"
    ],
    defaultIncrement: 5
  },
  {
    id: "push-ups",
    name: "Push-Ups",
    muscle: "Chest",
    type: "bodyweight",
    aliases: [
      "push up", "pushups", "pushup", "press up", "press ups"
    ],
    defaultIncrement: 5
  },
  {
    id: "barbell-back-squat",
    name: "Barbell Back Squat",
    muscle: "Legs (Quads & Glutes)",
    type: "weight_reps",
    aliases: [
      "squat", "squats", "bb squat", "back squat", "barbell squat", "back squats"
    ],
    defaultIncrement: 10
  },
  {
    id: "barbell-deadlift",
    name: "Barbell Deadlift",
    muscle: "Posterior Chain",
    type: "weight_reps",
    aliases: [
      "deadlift", "deadlifts", "dl", "bb deadlift", "conventional deadlift"
    ],
    defaultIncrement: 10
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscle: "Hamstrings & Glutes",
    type: "weight_reps",
    aliases: [
      "rdl", "romanian deadlifts", "stiff leg deadlift", "db rdl", "barbell rdl"
    ],
    defaultIncrement: 10
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscle: "Legs (Quads)",
    type: "weight_reps",
    aliases: [
      "legpress", "45 degree leg press", "machine leg press"
    ],
    defaultIncrement: 20
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    muscle: "Legs (Quads)",
    type: "weight_reps",
    aliases: [
      "leg extensions", "quad extension", "quad extensions"
    ],
    defaultIncrement: 5
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    muscle: "Hamstrings",
    type: "weight_reps",
    aliases: [
      "leg curls", "hamstring curl", "hamstring curls", "lying leg curl", "seated leg curl"
    ],
    defaultIncrement: 5
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscle: "Legs & Glutes",
    type: "weight_reps",
    aliases: [
      "bss", "bulgarian split squats", "split squat", "split squats"
    ],
    defaultIncrement: 5
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    muscle: "Shoulders",
    type: "weight_reps",
    aliases: [
      "ohp", "shoulder press", "military press", "standing military press", "barbell shoulder press", "bb overhead press"
    ],
    defaultIncrement: 5
  },
  {
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    muscle: "Shoulders",
    type: "weight_reps",
    aliases: [
      "db shoulder press", "db overhead press", "seated dumbbell shoulder press", "seated db press"
    ],
    defaultIncrement: 5
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscle: "Shoulders (Side Delts)",
    type: "weight_reps",
    aliases: [
      "lateral raises", "side lateral raise", "side lateral raises", "side delt raise", "db lateral raise", "lat raise", "lat raises"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscle: "Shoulders & Upper Back",
    type: "weight_reps",
    aliases: [
      "face pulls", "facepull", "facepulls", "cable face pull"
    ],
    defaultIncrement: 5
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscle: "Back (Lats)",
    type: "weight_reps",
    aliases: [
      "lat pulldowns", "pulldown", "pulldowns", "cable lat pulldown", "front lat pulldown"
    ],
    defaultIncrement: 5
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscle: "Back",
    type: "weight_reps",
    aliases: [
      "bb row", "bent over row", "bent over barbell row", "pendlay row", "barbell bent over row"
    ],
    defaultIncrement: 5
  },
  {
    id: "pull-ups",
    name: "Pull-Ups",
    muscle: "Back & Biceps",
    type: "bodyweight",
    aliases: [
      "pull ups", "pullup", "pullups", "chin ups", "chin up", "chinups", "weighted pullups"
    ],
    defaultIncrement: 5
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    muscle: "Back",
    type: "weight_reps",
    aliases: [
      "cable row", "cable rows", "seated row", "seated rows", "seated cable rows"
    ],
    defaultIncrement: 5
  },
  {
    id: "bicep-curls",
    name: "Bicep Curls",
    muscle: "Arms (Biceps)",
    type: "weight_reps",
    aliases: [
      "curls", "curl", "bicep curl", "dumbbell curls", "db curl", "db curls", "barbell curls", "bb curl"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "hammer-curls",
    name: "Hammer Curls",
    muscle: "Arms (Biceps & Forearms)",
    type: "weight_reps",
    aliases: [
      "hammer curl", "db hammer curls", "dumbbell hammer curl"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "tricep-pushdown",
    name: "Tricep Pushdown",
    muscle: "Arms (Triceps)",
    type: "weight_reps",
    aliases: [
      "tricep pushdowns", "pushdown", "pushdowns", "cable tricep pushdown", "rope pushdown"
    ],
    defaultIncrement: 5
  },
  {
    id: "skull-crushers",
    name: "Skull Crushers",
    muscle: "Arms (Triceps)",
    type: "weight_reps",
    aliases: [
      "skull crusher", "skullcrushers", "ez bar skull crusher", "lying tricep extension"
    ],
    defaultIncrement: 5
  },
  {
    id: "plank",
    name: "Plank",
    muscle: "Core",
    type: "time",
    aliases: [
      "planks", "forearm plank", "front plank"
    ],
    defaultIncrement: 15
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    muscle: "Core",
    type: "bodyweight",
    aliases: [
      "hanging leg raises", "leg raises", "leg raise", "hanging knee raise"
    ],
    defaultIncrement: 5
  },
  {
    id: "treadmill",
    name: "Treadmill",
    muscle: "Cardio",
    type: "distance_time",
    aliases: [
      "treadmill run", "treadmill walk", "running", "jogging"
    ],
    defaultIncrement: 0.5
  },
  {
    id: "rowing-machine",
    name: "Rowing Machine",
    muscle: "Full Body / Cardio",
    type: "distance_time",
    aliases: [
      "rower", "rowing", "erg", "ergometer", "concept 2 row"
    ],
    defaultIncrement: 500
  }
];

export function getAllExerciseNames() {
  return EXERCISE_DATABASE.map(e => e.name);
}

export function findExerciseById(id) {
  return EXERCISE_DATABASE.find(e => e.id === id);
}

export function findExerciseByName(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  return EXERCISE_DATABASE.find(e => e.name.toLowerCase() === lower);
}
