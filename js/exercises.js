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
      "rdl", "romanian deadlifts", "stiff leg deadlift", "barbell rdl", "bb rdl"
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
  },
  {
    id: "machine-lateral-raise",
    name: "Machine Lateral Raise",
    muscle: "Shoulders (Side Delts)",
    type: "weight_reps",
    aliases: [
      "lateral raise machine", "machine lateral raise", "machine side raise", "machine lat raise", "lever lateral raise", "seated lateral raise machine"
    ],
    defaultIncrement: 5
  },
  {
    id: "pec-fly-machine",
    name: "Pec Fly Machine",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "pec fly machine", "machine pec fly", "machine fly", "machine flyes", "pec deck", "peck deck", "pec dec", "butterfly machine", "seated machine fly"
    ],
    defaultIncrement: 5
  },
  {
    id: "machine-chest-press",
    name: "Machine Chest Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "chest press machine", "machine chest press", "seated chest press", "machine bench press", "selectorized chest press"
    ],
    defaultIncrement: 10
  },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    muscle: "Shoulders",
    type: "weight_reps",
    aliases: [
      "shoulder press machine", "machine shoulder press", "seated machine shoulder press", "overhead press machine", "lever shoulder press"
    ],
    defaultIncrement: 10
  },
  {
    id: "smith-machine-bench-press",
    name: "Smith Machine Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "smith machine bench", "smith bench", "smith machine chest press", "smith bench press", "smith machine incline bench", "smith incline"
    ],
    defaultIncrement: 5
  },
  {
    id: "smith-machine-squat",
    name: "Smith Machine Squat",
    muscle: "Legs (Quads & Glutes)",
    type: "weight_reps",
    aliases: [
      "smith machine squats", "smith squat", "smith squats"
    ],
    defaultIncrement: 10
  },
  {
    id: "machine-row",
    name: "Machine Row",
    muscle: "Back",
    type: "weight_reps",
    aliases: [
      "machine row", "chest supported row", "machine rows", "chest supported machine row", "t bar machine row", "lever row"
    ],
    defaultIncrement: 10
  },
  {
    id: "hack-squat",
    name: "Hack Squat",
    muscle: "Legs (Quads)",
    type: "weight_reps",
    aliases: [
      "hack squat", "hack squats", "machine hack squat", "reverse hack squat"
    ],
    defaultIncrement: 10
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    muscle: "Hamstrings",
    type: "weight_reps",
    aliases: [
      "seated leg curl", "seated leg curls", "seated hamstring curl", "machine leg curl"
    ],
    defaultIncrement: 5
  },
  {
    id: "lying-leg-curl",
    name: "Lying Leg Curl",
    muscle: "Hamstrings",
    type: "weight_reps",
    aliases: [
      "lying leg curl", "lying leg curls", "prone leg curl", "prone hamstring curl"
    ],
    defaultIncrement: 5
  },
  {
    id: "cable-lateral-raise",
    name: "Cable Lateral Raise",
    muscle: "Shoulders (Side Delts)",
    type: "weight_reps",
    aliases: [
      "cable lateral raise", "cable lateral raises", "cable side raise", "cuffed cable lateral raise"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "machine-preacher-curl",
    name: "Machine Preacher Curl",
    muscle: "Arms (Biceps)",
    type: "weight_reps",
    aliases: [
      "machine preacher curl", "preacher curl machine", "bicep curl machine", "machine curl"
    ],
    defaultIncrement: 5
  },
  {
    id: "seated-calf-raise",
    name: "Seated Calf Raise",
    muscle: "Calves",
    type: "weight_reps",
    aliases: [
      "seated calf raise", "calf raise machine", "machine calf raise", "standing calf raise machine", "donkey calf raise"
    ],
    defaultIncrement: 10
  },
  {
    id: "assisted-pull-up",
    name: "Assisted Pull-Up",
    muscle: "Back & Biceps",
    type: "weight_reps",
    aliases: [
      "assisted pull up", "assisted pull-up", "assisted chin up", "pull up machine"
    ],
    defaultIncrement: 10
  },
  {
    id: "assisted-dip",
    name: "Assisted Dip",
    muscle: "Chest & Triceps",
    type: "weight_reps",
    aliases: [
      "assisted dip", "assisted dips", "dip machine"
    ],
    defaultIncrement: 10
  },
  {
    id: "hip-abductor-machine",
    name: "Hip Abductor Machine",
    muscle: "Glutes & Hips",
    type: "weight_reps",
    aliases: [
      "hip abductor", "abductor machine", "hip abduction machine", "outer thigh machine"
    ],
    defaultIncrement: 10
  },
  {
    id: "hip-adductor-machine",
    name: "Hip Adductor Machine",
    muscle: "Inner Thighs",
    type: "weight_reps",
    aliases: [
      "hip adductor", "adductor machine", "hip adduction machine", "inner thigh machine"
    ],
    defaultIncrement: 10
  },
  // =========================================================================
  // Equipment Variants & Expanded Exercise Library
  // =========================================================================
  {
    id: "dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "db bench", "db bench press", "dumbbell bench", "flat db bench", "flat dumbbell bench", "db flat bench", "db press", "dumbbell press", "flat db press"
    ],
    defaultIncrement: 5
  },
  {
    id: "decline-barbell-bench-press",
    name: "Decline Barbell Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "decline bench", "decline bench press", "decline barbell bench", "decline bb bench", "decline press"
    ],
    defaultIncrement: 5
  },
  {
    id: "decline-dumbbell-bench-press",
    name: "Decline Dumbbell Bench Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "decline db bench", "decline dumbbell press", "decline db press", "decline dumbbell bench"
    ],
    defaultIncrement: 5
  },
  {
    id: "incline-dumbbell-fly",
    name: "Incline Dumbbell Fly",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "incline db fly", "incline db flyes", "incline dumbbell flyes", "incline fly"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "cable-chest-press",
    name: "Cable Chest Press",
    muscle: "Chest",
    type: "weight_reps",
    aliases: [
      "cable press", "cable bench press", "standing cable chest press"
    ],
    defaultIncrement: 5
  },
  {
    id: "dumbbell-row",
    name: "Dumbbell Row",
    muscle: "Back",
    type: "weight_reps",
    aliases: [
      "db row", "single arm dumbbell row", "one arm dumbbell row", "one arm db row", "single arm db row", "db rows", "dumbbell rows"
    ],
    defaultIncrement: 5
  },
  {
    id: "t-bar-row",
    name: "T-Bar Row",
    muscle: "Back",
    type: "weight_reps",
    aliases: [
      "t bar row", "tbar row", "t-bar rows", "tbar rows", "chest supported t bar row"
    ],
    defaultIncrement: 5
  },
  {
    id: "straight-arm-cable-pulldown",
    name: "Straight-Arm Cable Pulldown",
    muscle: "Back (Lats)",
    type: "weight_reps",
    aliases: [
      "straight arm pulldown", "straight arm cable pulldown", "cable lat pushdown", "lat pullover", "cable pullover", "straight arm pushdown"
    ],
    defaultIncrement: 5
  },
  {
    id: "neutral-grip-lat-pulldown",
    name: "Neutral Grip Lat Pulldown",
    muscle: "Back (Lats)",
    type: "weight_reps",
    aliases: [
      "close grip lat pulldown", "close grip pulldown", "v bar pulldown", "neutral grip pulldown", "mag grip pulldown"
    ],
    defaultIncrement: 5
  },
  {
    id: "barbell-front-squat",
    name: "Barbell Front Squat",
    muscle: "Legs (Quads)",
    type: "weight_reps",
    aliases: [
      "front squat", "front squats", "bb front squat", "barbell front squats"
    ],
    defaultIncrement: 10
  },
  {
    id: "dumbbell-goblet-squat",
    name: "Dumbbell Goblet Squat",
    muscle: "Legs (Quads & Glutes)",
    type: "weight_reps",
    aliases: [
      "goblet squat", "goblet squats", "db goblet squat", "dumbbell squat", "db squat"
    ],
    defaultIncrement: 5
  },
  {
    id: "dumbbell-lunges",
    name: "Dumbbell Lunges",
    muscle: "Legs & Glutes",
    type: "weight_reps",
    aliases: [
      "lunges", "db lunges", "walking lunges", "db walking lunges", "dumbbell walking lunges", "reverse lunges", "db reverse lunges"
    ],
    defaultIncrement: 5
  },
  {
    id: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    muscle: "Glutes & Hips",
    type: "weight_reps",
    aliases: [
      "hip thrust", "hip thrusts", "bb hip thrust", "barbell hip thrusts", "glute bridge", "barbell glute bridge"
    ],
    defaultIncrement: 10
  },
  {
    id: "dumbbell-romanian-deadlift",
    name: "Dumbbell Romanian Deadlift",
    muscle: "Hamstrings & Glutes",
    type: "weight_reps",
    aliases: [
      "db rdl", "db romanian deadlift", "dumbbell rdl", "dumbbell stiff leg deadlift", "db romanian deadlifts"
    ],
    defaultIncrement: 5
  },
  {
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    muscle: "Calves",
    type: "weight_reps",
    aliases: [
      "standing calf raise machine", "standing calf raises", "smith machine calf raise", "calf raise", "calf raises", "standing calf"
    ],
    defaultIncrement: 10
  },
  {
    id: "dumbbell-shrugs",
    name: "Dumbbell Shrugs",
    muscle: "Shoulders & Upper Back",
    type: "weight_reps",
    aliases: [
      "db shrugs", "db shrug", "dumbbell shrug", "shrugs", "shrug"
    ],
    defaultIncrement: 5
  },
  {
    id: "barbell-shrugs",
    name: "Barbell Shrugs",
    muscle: "Shoulders & Upper Back",
    type: "weight_reps",
    aliases: [
      "barbell shrug", "bb shrug", "bb shrugs", "smith machine shrug", "smith shrug"
    ],
    defaultIncrement: 10
  },
  {
    id: "reverse-pec-deck",
    name: "Reverse Pec Deck",
    muscle: "Shoulders (Rear Delts)",
    type: "weight_reps",
    aliases: [
      "rear delt fly", "rear delt flyes", "reverse fly", "reverse flyes", "rear delt machine", "machine rear delt fly", "reverse peck deck"
    ],
    defaultIncrement: 5
  },
  {
    id: "dumbbell-front-raise",
    name: "Dumbbell Front Raise",
    muscle: "Shoulders",
    type: "weight_reps",
    aliases: [
      "front raise", "front raises", "db front raise", "db front raises", "dumbbell front raises"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "barbell-bicep-curl",
    name: "Barbell Bicep Curl",
    muscle: "Arms (Biceps)",
    type: "weight_reps",
    aliases: [
      "barbell curl", "barbell curls", "bb curl", "bb curls", "straight bar curl", "ez bar curl", "ez bar curls"
    ],
    defaultIncrement: 5
  },
  {
    id: "incline-dumbbell-curl",
    name: "Incline Dumbbell Curl",
    muscle: "Arms (Biceps)",
    type: "weight_reps",
    aliases: [
      "incline db curl", "incline db curls", "incline dumbbell curls", "incline curl", "incline curls"
    ],
    defaultIncrement: 2.5
  },
  {
    id: "cable-bicep-curl",
    name: "Cable Bicep Curl",
    muscle: "Arms (Biceps)",
    type: "weight_reps",
    aliases: [
      "cable curl", "cable curls", "cable bicep curls"
    ],
    defaultIncrement: 5
  },
  {
    id: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    muscle: "Arms (Triceps)",
    type: "weight_reps",
    aliases: [
      "overhead tricep extension", "cable overhead tricep extension", "rope overhead extension", "db overhead extension", "dumbbell tricep extension", "french press"
    ],
    defaultIncrement: 5
  },
  {
    id: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    muscle: "Arms (Triceps)",
    type: "weight_reps",
    aliases: [
      "close grip bench", "close grip bench press", "cgbp", "close grip barbell bench"
    ],
    defaultIncrement: 5
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    muscle: "Core",
    type: "weight_reps",
    aliases: [
      "cable crunches", "kneeling cable crunch", "rope crunch", "ab crunch machine"
    ],
    defaultIncrement: 5
  },
  {
    id: "ab-wheel-rollout",
    name: "Ab Wheel Rollout",
    muscle: "Core",
    type: "bodyweight",
    aliases: [
      "ab wheel", "ab rollout", "ab rollouts", "wheel rollout"
    ],
    defaultIncrement: 1
  },
  {
    id: "stationary-bike",
    name: "Stationary Bike",
    muscle: "Cardio",
    type: "distance_time",
    aliases: [
      "spin bike", "exercise bike", "cycling", "bike", "indoor cycling", "assault bike", "air bike"
    ],
    defaultIncrement: 1
  },
  {
    id: "stairmaster",
    name: "Stairmaster",
    muscle: "Cardio",
    type: "distance_time",
    aliases: [
      "stair master", "stepmill", "stairs", "stair climber"
    ],
    defaultIncrement: 1
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
