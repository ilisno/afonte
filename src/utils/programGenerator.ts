import * as z from "zod";

// Define the schema for form validation (needed for the generator function)
const programFormSchemaForGenerator = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"]),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"]),
  split: z.enum(["Full Body (Tout le corps)", "Half Body (Haut / Bas)", "Push Pull Legs", "Autre / Pas de préférence"]),
  joursEntrainement: z.coerce.number().min(1).max(7),
  dureeMax: z.coerce.number().min(15).max(180),
  materiel: z.array(z.string()).optional(),
  squat1RM: z.coerce.number().optional().nullable(),
  bench1RM: z.coerce.number().optional().nullable(),
  deadlift1RM: z.coerce.number().optional().nullable(),
  ohp1RM: z.coerce.number().optional().nullable(),
});

// Define a type for the form data used by the generator
export type ProgramFormData = z.infer<typeof programFormSchemaForGenerator>;

// Define types for exercise categories and muscle groups
type ExerciseCategory = "Exercice de powerlifting" | "Compound secondaire" | "Isolation lourde" | "Isolation légère";
type MuscleGroup = "Jambes" | "Pectoraux" | "Dos" | "Épaules" | "Biceps" | "Triceps" | "Abdos" | "Mollets" | "Avant-bras" | "Lombaires"; // Added Mollets, Avant-bras, Lombaires

// Define a type for an exercise with new fields
interface Exercise {
  name: string;
  category: ExerciseCategory;
  muscleGroup: MuscleGroup; // General muscle group for filtering
  muscles: string[]; // Specific muscles worked
  equipment: string[]; // Equipment needed
}


// Define a type for the program structure
export type Program = {
  title: string;
  description: string;
  is531?: boolean; // Flag to indicate 5/3/1 program
  weeks: {
    weekNumber: number;
    days: {
      dayNumber: number;
      exercises: {
        name: string;
        sets: string; // Still string for display like "3" or "5/3/1"
        reps: string; // Still string for display like "5+" or "3-5"
        notes?: string; // RPE or other notes
        muscles?: string[]; // Muscles worked for display
        // New fields for 5/3/1 sets
        setsDetails?: { // Array of details for each set
            setNumber: number;
            percentage: number; // e.g., 0.65
            calculatedWeight: number; // Weight rounded to 2.5kg
            reps: string; // Specific reps for this set (e.g., "5", "3", "1+")
            isAmrap?: boolean; // Flag for AMRAP set
        }[];
      }[];
    }[];
  }[];
};

// Helper function to round weight to the nearest 2.5 kg
const roundToNearest2_5 = (weight: number): number => {
    return Math.round(weight / 2.5) * 2.5;
};

// --- Updated Exercise List ---
const allExercises: Exercise[] = [
  // Exercice de powerlifting
  { name: "Squat barre", category: "Exercice de powerlifting", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "ischios"], equipment: ["barre-halteres"] },
  { name: "Développé couché", category: "Exercice de powerlifting", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "épaules antérieures"], equipment: ["barre-halteres"] },
  { name: "Soulevé de terre roumain", category: "Exercice de powerlifting", muscleGroup: "Dos", muscles: ["ischios", "fessiers", "lombaires"], equipment: ["barre-halteres"] }, // Changed muscleGroup to Dos as it's a back exercise primarily
  { name: "Développé militaire barre", category: "Exercice de powerlifting", muscleGroup: "Épaules", muscles: ["épaules", "triceps"], equipment: ["barre-halteres"] },

  // Compound secondaire
  { name: "Développé incliné haltères", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux supérieurs", "triceps", "épaules"], equipment: ["barre-halteres"] },
  { name: "Rowing barre", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "trapèzes", "biceps"], equipment: ["barre-halteres"] },
  { name: "Tractions", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps"], equipment: ["poids-corps"] },
  { name: "Dips", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "épaules"], equipment: ["poids-corps"] },
  { name: "Presse à cuisses", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers"], equipment: ["machines-guidees"] },
  { name: "Fentes haltères", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "ischios"], equipment: ["barre-halteres"] },
  { name: "Tirage vertical machine", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps"], equipment: ["machines-guidees"] },
  { name: "Pompes", category: "Compound secondaire", muscleGroup: "Pectoraux", muscles: ["pectoraux", "triceps", "épaules"], equipment: [] },
  { name: "Tractions australiennes", category: "Compound secondaire", muscleGroup: "Dos", muscles: ["dorsaux", "biceps", "trapèzes"], equipment: ["poids-corps"] },
  { name: "Split squat bulgare", category: "Compound secondaire", muscleGroup: "Jambes", muscles: ["quadriceps", "fessiers", "ischios"], equipment: ["barre-halteres"] }, // Added

  // Isolation lourde
  { name: "Leg extension", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["quadriceps"], equipment: ["machines-guidees"] }, // Added
  { name: "Leg curl", category: "Isolation lourde", muscleGroup: "Jambes", muscles: ["ischios"], equipment: ["machines-guidees"] }, // Added
  { name: "Écartés poulie", category: "Isolation lourde", muscleGroup: "Pectoraux", muscles: ["pectoraux"], equipment: ["machines-guidees"] }, // Added
  { name: "Curl biceps barre", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps"], equipment: ["barre-halteres"] }, // Added
  { name: "Extension triceps poulie haute", category: "Isolation lourde", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] }, // Added
  { name: "Curl incliné haltères", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (longue portion)"], equipment: ["barre-halteres"] }, // Added
  { name: "Preacher curl", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["biceps (courte portion)"], equipment: ["barre-halteres", "machines-guidees"] }, // Added - assuming preacher bench/machine
  { name: "Reverse curls", category: "Isolation lourde", muscleGroup: "Biceps", muscles: ["brachial", "avant-bras"], equipment: ["barre-halteres"] }, // Added

  // Isolation légère
  { name: "Élévations latérales haltères", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["barre-halteres"] }, // Added
  { name: "Crunchs", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux (grand droit)"], equipment: [] }, // Added
  { name: "Leg raises", category: "Isolation légère", muscleGroup: "Abdos", muscles: ["abdominaux inférieurs", "fléchisseurs de hanches"], equipment: [] }, // Added
  { name: "Calf raises", category: "Isolation légère", muscleGroup: "Jambes", muscles: ["mollets"], equipment: [] }, // Added
  { name: "Face pulls", category: "Isolation légère", muscleGroup: "Dos", muscles: ["deltoïdes postérieurs", "trapèzes", "rotateurs externes"], equipment: ["machines-guidees"] }, // Added - assuming cable machine
  { name: "Pushdowns à la corde", category: "Isolation légère", muscleGroup: "Triceps", muscles: ["triceps"], equipment: ["machines-guidees"] }, // Added - assuming cable machine
  { name: "Élévations latérales à la poulie basse", category: "Isolation légère", muscleGroup: "Épaules", muscles: ["deltoïdes moyens"], equipment: ["machines-guidees"] }, // Added
];


// Helper to filter exercises by available equipment
const filterByEquipment = (exercises: Exercise[], availableEquipment?: string[]): Exercise[] => {
    if (!availableEquipment || availableEquipment.length === 0) {
        // If no equipment selected, only include exercises requiring no equipment
        return exercises.filter(ex => ex.equipment.length === 0);
    }
    return exercises.filter(ex =>
        ex.equipment.length === 0 || ex.equipment.some(eq => availableEquipment.includes(eq))
    );
};

// Helper to filter exercises by target muscle groups
const filterByMuscleGroups = (exercises: Exercise[], targetMuscleGroups: string[]): Exercise[] => {
    if (!targetMuscleGroups || targetMuscleGroups.length === 0) {
        return exercises; // If no target groups, return all
    }
    return exercises.filter(ex => targetMuscleGroups.includes(ex.muscleGroup));
};


// --- Client-Side Program Generation Logic ---
export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, split, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM } = values;

  // Filter all exercises by available equipment once
  const availableExercises = filterByEquipment(allExercises, materiel);

  // --- 5/3/1 Logic ---
  if (objectif === "Powerlifting" || objectif === "Powerbuilding") {
      // Ensure 1RMs are available (should be handled by Zod validation in component, but defensive check)
      if (squat1RM === null || bench1RM === null || deadlift1RM === null || ohp1RM === null ||
          squat1RM <= 0 || bench1RM <= 0 || deadlift1RM <= 0 || ohp1RM <= 0) {
          console.error("Missing 1RM values for 5/3/1 program generation.");
           return {
               title: "Erreur de Génération",
               description: "Impossible de générer le programme 5/3/1. Veuillez vérifier vos valeurs de 1RM.",
               is531: true,
               weeks: []
           };
      }

      // Calculate Training Max (TM) for each lift
      const tmSquat = roundToNearest2_5(squat1RM * 0.9);
      const tmBench = roundToNearest2_5(bench1RM * 0.9);
      const tmDeadlift = roundToNearest2_5(deadlift1RM * 0.9);
      const tmOhp = roundToNearest2_5(ohp1RM * 0.9);

      const trainingMaxes = {
          "Squat barre": tmSquat, // Use updated names
          "Développé couché": tmBench,
          "Soulevé de terre roumain": tmDeadlift, // Use updated names
          "Développé militaire barre": tmOhp, // Use updated names
      };

      // 5/3/1 percentages and reps per week
      const cycleWeeks = [
          { week: 1, reps: "5", percentages: [0.65, 0.75, 0.85], amrapSet: 3 }, // 5+
          { week: 2, reps: "3", percentages: [0.70, 0.80, 0.90], amrapSet: 3 }, // 3+
          { week: 3, reps: "5/3/1", percentages: [0.75, 0.85, 0.95], amrapSet: 3 }, // 1+
          { week: 4, reps: "5", percentages: [0.40, 0.50, 0.60], amrapSet: null }, // Deload
      ];

      const program531: Program = {
          title: `Programme 5/3/1 - ${objectif}`,
          description: `Programme basé sur la méthode 5/3/1 de Jim Wendler pour ${joursEntrainement} jours/semaine.`,
          is531: true,
          weeks: [],
      };

      // Define main lifts order for splitting
      const mainLifts = ["Squat barre", "Développé couché", "Soulevé de terre roumain", "Développé militaire barre"]; // Use updated names

      // Filter available exercises by category for accessory selection
      const availableSecondaryCompounds = availableExercises.filter(ex => ex.category === "Compound secondaire");
      const availableHeavyIsolations = availableExercises.filter(ex => ex.category === "Isolation lourde");
      const availableLightIsolations = availableExercises.filter(ex => ex.category === "Isolation légère");


      // Generate 4 weeks of 5/3/1
      for (const cycleWeek of cycleWeeks) {
          const week: Program['weeks'][number] = {
              weekNumber: cycleWeek.week,
              days: [],
          };

          // Determine main lifts for each day based on joursEntrainement
          const dailyLifts: string[][] = [];
          if (joursEntrainement === 1) {
              dailyLifts.push(mainLifts); // All 4 lifts on day 1
          } else if (joursEntrainement === 2) {
              dailyLifts.push(["Squat barre", "Développé militaire barre"]); // Day 1: Squat, OHP
              dailyLifts.push(["Développé couché", "Soulevé de terre roumain"]); // Day 2: Bench, Deadlift
          } else if (joursEntrainement === 3) {
              dailyLifts.push(["Squat barre"]); // Day 1: Squat
              dailyLifts.push(["Développé couché"]); // Day 2: Bench
              dailyLifts.push(["Soulevé de terre roumain", "Développé militaire barre"]); // Day 3: Deadlift, OHP
          } else { // joursEntrainement >= 4
              dailyLifts.push(["Squat barre"]); // Day 1: Squat
              dailyLifts.push(["Développé couché"]); // Day 2: Bench
              dailyLifts.push(["Soulevé de terre roumain"]); // Day 3: Deadlift
              dailyLifts.push(["Développé militaire barre"]); // Day 4: OHP
              // Days 5, 6, 7 will be rest or additional accessory/cardio days (handled below)
          }

          // Generate days
          for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
              const day: Program['weeks'][number]['days'][number] = {
                  dayNumber: dayIndex + 1,
                  exercises: [],
              };

              const liftsForToday = dailyLifts[dayIndex] || []; // Get main lifts for this day

              // Add main lifts for the day
              liftsForToday.forEach(liftName => {
                  const tm = trainingMaxes[liftName as keyof typeof trainingMaxes];
                  if (tm !== undefined) {
                      const setsDetails = cycleWeek.percentages.map((percent, setIdx) => {
                          const calculatedWeight = roundToNearest2_5(tm * percent);
                          const reps = cycleWeek.reps === "5/3/1" ? (setIdx === 0 ? "5" : (setIdx === 1 ? "3" : "1+")) : cycleWeek.reps;
                          const isAmrap = cycleWeek.amrapSet === setIdx + 1;

                          return {
                              setNumber: setIdx + 1,
                              percentage: percent,
                              calculatedWeight: calculatedWeight,
                              reps: reps,
                              isAmrap: isAmrap,
                          };
                      });

                      // Find the exercise object to get muscle info
                      const exerciseObj = allExercises.find(ex => ex.name === liftName);

                      day.exercises.push({
                          name: liftName,
                          sets: cycleWeek.percentages.length.toString(), // Total number of sets
                          reps: cycleWeek.reps, // General rep scheme for the week
                          notes: `TM: ${tm} kg`, // Display TM in notes
                          muscles: exerciseObj?.muscles, // Add muscles worked
                          setsDetails: setsDetails,
                      });
                  }
              });

              // Add accessory work for days with main lifts (days 1 to min(joursEntrainement, 4))
              if (dayIndex < Math.min(joursEntrainement, 4)) {
                  const addedAccessoryNames = new Set<string>();
                  const currentDayMuscles = day.exercises.flatMap(ex => ex.muscles || []); // Get muscles already hit by main lifts

                  // Simple accessory logic: add a few accessories from different categories
                  // Prioritize compounds, then heavy isolation, then light isolation
                  const potentialAccessoriesForDay = [
                      ...availableSecondaryCompounds,
                      ...availableHeavyIsolations,
                      ...availableLightIsolations,
                  ].filter(acc => !mainLifts.includes(acc.name)); // Exclude main lifts

                  // Add accessories, trying to hit muscles not already heavily targeted or adding volume
                  let accessoriesAddedCount = 0;
                  const maxAccessoriesPerDay = 4; // Limit total accessories

                  // Helper to add accessory if possible
                  const addAccessoryIfPossible = (acc: Exercise) => {
                      if (accessoriesAddedCount >= maxAccessoriesPerDay || addedAccessoryNames.has(acc.name)) {
                          return false;
                      }
                       // Simple check: avoid adding if the primary muscle group is already heavily targeted (basic)
                       // This is a very simple heuristic and could be improved.
                       // For now, just add if available and not already added.
                       day.exercises.push({
                           name: acc.name,
                           sets: "3", // Default accessory sets
                           reps: "8-12", // Default accessory reps
                           notes: "Accessoire",
                           muscles: acc.muscles, // Add muscles worked
                       });
                       addedAccessoryNames.add(acc.name);
                       accessoriesAddedCount++;
                       return true;
                  };

                  // Add a few secondary compounds
                  availableSecondaryCompounds.filter(acc => !mainLifts.includes(acc.name)).slice(0, 1).forEach(addAccessoryIfPossible);

                  // Add a few heavy isolations
                  availableHeavyIsolations.slice(0, 1).forEach(addAccessoryIfPossible);

                  // Add a few light isolations
                  availableLightIsolations.slice(0, 2).forEach(addAccessoryIfPossible);

              }

              week.days.push(day);
          }
          program531.weeks.push(week);
      }

      return program531;
  }

  // --- Existing Generation Logic (for other objectives) ---
  const baseReps = objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12"; // Simplified reps
  const baseSets = 3; // Use number for calculations

  // Define "big strength" exercises (using updated names) for RPE calculation
  const bigStrengthExercises = ["Squat barre", "Soulevé de terre roumain", "Développé couché", "Développé militaire barre"];

  // Define muscle groups for each split type (using general MuscleGroup type)
  const splitMuscles: { [key: string]: MuscleGroup[][] } = {
      "Full Body (Tout le corps)": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos"]], // All muscles each day
      "Half Body (Haut / Bas)": [["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"], ["Jambes", "Abdos", "Mollets"]], // Upper/Lower split, added Mollets
      "Push Pull Legs": [["Pectoraux", "Épaules", "Triceps"], ["Dos", "Biceps", "Avant-bras"], ["Jambes", "Abdos", "Mollets"]], // PPL split, added Avant-bras, Mollets
      "Autre / Pas de préférence": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos", "Mollets", "Avant-bras", "Lombaires"]], // Default to Full Body logic, include all general groups
  };

  const selectedSplitMuscles = splitMuscles[split] || splitMuscles["Autre / Pas de préférence"];
  const numSplitDays = selectedSplitMuscles.length;

  // Define large muscle groups for volume tracking (using general MuscleGroup type)
  const largeMuscleGroups: MuscleGroup[] = ["Jambes", "Pectoraux", "Dos", "Épaules"];
  const weeklyVolumeCap = 15; // Max sets per week for large muscle groups

  // Generate 4 weeks
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const week: Program['weeks'][number] = {
      weekNumber: weekNum,
      days: [],
    };

    // Initialize weekly volume tracker for this week
    const weeklyVolume: { [key in MuscleGroup]?: number } = {}; // Use MuscleGroup type for keys
    largeMuscleGroups.forEach(group => weeklyVolume[group] = 0);


    // Generate days based on joursEntrainement
    for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
      const day: Program['weeks'][number]['days'][number] = {
        dayNumber: dayIndex + 1,
        exercises: [],
      };

      // Determine which muscle groups to target based on the split and day index
      const targetMuscleGroups = selectedSplitMuscles[dayIndex % numSplitDays];

      let dayExercises: Exercise[] = [];
      const addedExerciseNames = new Set<string>(); // To track added exercises

      // Helper to add exercise if available, targets muscle group, not already added, and respects volume cap
      // Returns true if added, false otherwise
      const addExerciseIfPossible = (exercise: Exercise) => {
          if (!exercise || addedExerciseNames.has(exercise.name)) {
              return false;
          }

          // Check if exercise is available with current equipment (already filtered availableExercises)
          // This check is redundant if we only pick from availableExercises, but harmless.
          const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => exercise.equipment.includes(eq)));
          if (!isAvailable) {
              return false;
          }

          // Check volume cap only for large muscle groups
          if (largeMuscleGroups.includes(exercise.muscleGroup)) {
               if ((weeklyVolume[exercise.muscleGroup] || 0) + baseSets > weeklyVolumeCap) {
                   // console.log(`Skipping ${exercise.name} due to weekly volume cap for ${exercise.muscleGroup}`);
                   return false; // Cannot add due to cap
               }
               weeklyVolume[exercise.muscleGroup] = (weeklyVolume[exercise.muscleGroup] || 0) + baseSets; // Add sets to weekly volume
               // console.log(`Added ${exercise.name} for ${exercise.muscleGroup}. Weekly volume for ${exercise.muscleGroup}: ${weeklyVolume[exercise.muscleGroup] || 0}`);
          }

          dayExercises.push(exercise);
          addedExerciseNames.add(exercise.name);
          return true; // Exercise added
      };

      // Filter available exercises by target muscle groups for today
      const availableExercisesForToday = filterByMuscleGroups(availableExercises, targetMuscleGroups);

      // Categorize available exercises for today based on the new categories
      const powerliftingExercises = availableExercisesForToday.filter(ex => ex.category === "Exercice de powerlifting");
      const secondaryCompounds = availableExercisesForToday.filter(ex => ex.category === "Compound secondaire");
      const heavyIsolations = availableExercisesForToday.filter(ex => ex.category === "Isolation lourde");
      const lightIsolations = availableExercisesForToday.filter(ex => ex.category === "Isolation légère");


      // --- Add exercises based on category priority and limits ---
      const maxExercisesPerDay = 8; // Overall limit

      // 1. Powerlifting Exercises (Add up to 2)
      powerliftingExercises.slice(0, 2).forEach(addExerciseIfPossible);

      // 2. Secondary Compounds (Add up to 3)
      secondaryCompounds.slice(0, 3).forEach(addExerciseIfPossible);

      // 3. Heavy Isolations (Add up to 2)
      heavyIsolations.slice(0, 2).forEach(addExerciseIfPossible);

      // 4. Light Isolations (Add up to 2)
      lightIsolations.slice(0, 2).forEach(addExerciseIfPossible);

      // Ensure total exercises don't exceed maxExercisesPerDay (redundant with slicing above, but safe)
      const finalDayExercises = dayExercises.slice(0, maxExercisesPerDay);


      // Format exercises for the program structure and calculate RPE
      day.exercises = finalDayExercises.map(ex => {
        let rpeNote = "";
        // RPE logic based on new categories
        if (ex.category === "Isolation légère") {
           rpeNote = "RPE 10"; // Push to failure
        } else if (ex.category === "Isolation lourde") {
           // RPE progression for heavy isolation: 8 -> 8.5 -> 9 -> 10
           const rpeMap: { [key: number]: number | string } = { 1: 8, 2: 8.5, 3: 9, 4: 10 };
           rpeNote = `RPE ${rpeMap[weekNum] || 8}`;
        } else if (ex.category === "Compound secondaire") {
           // RPE progression for secondary compounds: 7 -> 7.5 -> 8 -> 9
           const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
           rpeNote = `RPE ${rpeMap[weekNum] || 7}`;
        } else if (ex.category === "Exercice de powerlifting") {
           // RPE progression for powerlifting exercises: 6 -> 7 -> 8 -> 10
           const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
           rpeNote = `RPE ${rpeMap[weekNum] || 6}`;
        }


        return {
          name: ex.name,
          sets: baseSets.toString(), // Convert back to string for display
          reps: baseReps,
          notes: rpeNote,
          muscles: ex.muscles, // Add muscles worked
        };
      });

      week.days.push(day);
    }
    program.weeks.push(week);
  }

  return program;
};