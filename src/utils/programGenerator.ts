import * as z from "zod";

// Define the schema for form validation (needed for the generator function)
// We need to redefine or import the schema used in ProgrammeGenerator
// Let's define it here for now, assuming it's stable.
// A better approach might be to define it in a shared schema file.
// For simplicity, let's copy the relevant parts needed by the generator.
const programFormSchemaForGenerator = z.object({
  objectif: z.enum(["Prise de Masse", "Sèche / Perte de Gras", "Powerlifting", "Powerbuilding"]),
  experience: z.enum(["Débutant (< 1 an)", "Intermédiaire (1-3 ans)", "Avancé (3+ ans)"]),
  split: z.enum(["Full Body (Tout le corps)", "Half Body (Haut / Bas)", "Push Pull Legs", "Autre / Pas de préférence"]),
  joursEntrainement: z.coerce.number().min(1).max(7),
  dureeMax: z.coerce.number().min(15).max(180),
  materiel: z.array(z.string()).optional(),
  // Email is not needed for generation itself, but is part of the original schema
  // email: z.string().email().or(z.literal("b")),

  // New fields for 1RM (optional by default, but validated in component)
  squat1RM: z.coerce.number().optional().nullable(),
  bench1RM: z.coerce.number().optional().nullable(),
  deadlift1RM: z.coerce.number().optional().nullable(),
  ohp1RM: z.coerce.number().optional().nullable(),
});

// Define a type for the form data used by the generator
export type ProgramFormData = z.infer<typeof programFormSchemaForGenerator>;


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

// --- Simplified Client-Side Program Generation Logic ---
// NOTE: This is a basic placeholder. A real generator would be much more complex.
export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, split, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM } = values;

  // --- 5/3/1 Logic ---
  if (objectif === "Powerlifting" || objectif === "Powerbuilding") {
      // Ensure 1RMs are available (should be handled by Zod validation in component, but defensive check)
      if (squat1RM === null || bench1RM === null || deadlift1RM === null || ohp1RM === null ||
          squat1RM <= 0 || bench1RM <= 0 || deadlift1RM <= 0 || ohp1RM <= 0) {
          // This case should ideally not happen if form validation works, but return a minimal program or throw error
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
          "Squat": tmSquat,
          "Développé Couché": tmBench,
          "Soulevé de Terre": tmDeadlift,
          "Overhead Press": tmOhp,
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
      const mainLifts = ["Squat", "Développé Couché", "Soulevé de Terre", "Overhead Press"];

      // Define accessory exercises (simple list, could be more complex based on split/day)
      const accessoryExercises = [
          { name: "Fentes Haltères", muscleGroup: "Jambes", type: "compound", equipment: ["barre-halteres"] },
          { name: "Leg Extension", muscleGroup: "Jambes", type: "isolation", equipment: ["machines-guidees"] },
          { name: "Leg Curl", muscleGroup: "Jambes", type: "isolation", equipment: ["machines-guidees"] },
          { name: "Écartés Poulie", muscleGroup: "Pectoraux", type: "isolation", equipment: ["machines-guidees"] },
          { name: "Dips", muscleGroup: "Triceps", type: "compound", equipment: ["poids-corps"] },
          { name: "Tirage Vertical Machine", muscleGroup: "Dos", type: "compound", equipment: ["machines-guidees"] },
          { name: "Rowing Barre", muscleGroup: "Dos", type: "compound", equipment: ["barre-halteres"] },
          { name: "Élévations Latérales Haltères", muscleGroup: "Épaules", type: "isolation", equipment: ["barre-halteres"] },
          { name: "Curl Biceps Barre", muscleGroup: "Biceps", type: "isolation", equipment: ["barre-halteres"] },
          { name: "Extension Triceps Poulie Haute", muscleGroup: "Triceps", type: "isolation", equipment: ["machines-guidees"] },
          { name: "Crunchs", muscleGroup: "Abdos", type: "isolation", equipment: [] },
          { name: "Leg Raises", muscleGroup: "Abdos", type: "isolation", equipment: [] },
      ];

      // Filter accessories by available equipment
      const availableAccessories = accessoryExercises.filter(ex =>
          ex.equipment.length === 0 || (materiel && materiel.some(eq => ex.equipment.includes(eq)))
      );

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
              dailyLifts.push(["Squat", "Overhead Press"]); // Day 1: Squat, OHP
              dailyLifts.push(["Développé Couché", "Soulevé de Terre"]); // Day 2: Bench, Deadlift
          } else if (joursEntrainement === 3) {
              dailyLifts.push(["Squat"]); // Day 1: Squat
              dailyLifts.push(["Développé Couché"]); // Day 2: Bench
              dailyLifts.push(["Soulevé de Terre", "Overhead Press"]); // Day 3: Deadlift, OHP
          } else { // joursEntrainement >= 4
              dailyLifts.push(["Squat"]); // Day 1: Squat
              dailyLifts.push(["Développé Couché"]); // Day 2: Bench
              dailyLifts.push(["Soulevé de Terre"]); // Day 3: Deadlift
              dailyLifts.push(["Overhead Press"]); // Day 4: OHP
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

                      day.exercises.push({
                          name: liftName,
                          sets: cycleWeek.percentages.length.toString(), // Total number of sets
                          reps: cycleWeek.reps, // General rep scheme for the week
                          notes: `TM: ${tm} kg`, // Display TM in notes
                          setsDetails: setsDetails,
                      });
                  }
              });

              // Add accessory work for days with main lifts (days 1 to min(joursEntrainement, 4))
              if (dayIndex < Math.min(joursEntrainement, 4)) {
                  let accessoryCount = 0;
                  const addedAccessoryNames = new Set<string>();

                  // Simple accessory logic: add 2-3 random available accessories
                  // Could be improved to target specific muscle groups based on the main lift
                  const potentialAccessoriesForDay = availableAccessories.filter(acc => {
                      // Basic filtering: avoid adding accessories that are the main lifts
                      return !mainLifts.includes(acc.name);
                  });

                  // Shuffle and pick a few accessories
                  const shuffledAccessories = potentialAccessoriesForDay.sort(() => 0.5 - Math.random());
                  shuffledAccessories.slice(0, 3).forEach(acc => { // Add up to 3 accessories
                      if (!addedAccessoryNames.has(acc.name)) {
                           day.exercises.push({
                               name: acc.name,
                               sets: "3", // Default accessory sets
                               reps: "8-12", // Default accessory reps
                               notes: "Accessoire",
                           });
                           addedAccessoryNames.add(acc.name);
                           accessoryCount++;
                      }
                  });
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

  // Exercise list with type, muscle group (general), and specific muscle group (for legs)
  const allExercises = [
    { name: "Squat Barre", muscleGroup: "Jambes", specificMuscleGroup: "Quadriceps", type: "compound", equipment: ["barre-halteres"] },
    { name: "Soulevé de Terre Roumain", muscleGroup: "Jambes", specificMuscleGroup: "Ischios", type: "compound", equipment: ["barre-halteres"] },
    { name: "Développé Couché", muscleGroup: "Pectoraux", specificMuscleGroup: null, type: "compound", equipment: ["barre-halteres"] },
    { name: "Développé Incliné Haltères", muscleGroup: "Pectoraux", specificMuscleGroup: null, type: "compound", equipment: ["barre-halteres"] },
    { name: "Tractions", muscleGroup: "Dos", specificMuscleGroup: null, type: "compound", equipment: ["poids-corps"] },
    { name: "Tractions australiennes", muscleGroup: "Dos", specificMuscleGroup: null, type: "compound", equipment: ["poids-corps"] },
    { name: "Dips", muscleGroup: "Triceps", specificMuscleGroup: null, type: "compound", equipment: ["poids-corps"] }, // Renamed Dips
    { name: "Pompes", muscleGroup: "Pectoraux", specificMuscleGroup: null, type: "compound", equipment: [] },
    { name: "Rowing Barre", muscleGroup: "Dos", specificMuscleGroup: null, type: "compound", equipment: ["barre-halteres"] },
    { name: "Presse à Cuisses", muscleGroup: "Jambes", specificMuscleGroup: "Quadriceps", type: "compound", equipment: ["machines-guidees"] },
    { name: "Fentes Haltères", muscleGroup: "Jambes", specificMuscleGroup: "Quadriceps", type: "compound", equipment: ["barre-halteres"] },
    { name: "Développé Militaire Barre", muscleGroup: "Épaules", specificMuscleGroup: null, type: "compound", equipment: ["barre-halteres"] },
    { name: "Écartés Poulie", muscleGroup: "Pectoraux", specificMuscleGroup: null, type: "isolation", equipment: ["machines-guidees"] },
    { name: "Tirage Vertical Machine", muscleGroup: "Dos", specificMuscleGroup: null, type: "compound", equipment: ["machines-guidees"] },
    { name: "Élévations Latérales Haltères", muscleGroup: "Épaules", specificMuscleGroup: null, type: "isolation", equipment: ["barre-halteres"] },
    { name: "Curl Biceps Barre", muscleGroup: "Biceps", specificMuscleGroup: null, type: "isolation", equipment: ["barre-halteres"] },
    { name: "Extension Triceps Poulie Haute", muscleGroup: "Triceps", specificMuscleGroup: null, type: "isolation", equipment: ["machines-guidees"] },
    { name: "Crunchs", muscleGroup: "Abdos", specificMuscleGroup: null, type: "isolation", equipment: [] }, // Added Crunchs
    { name: "Leg Raises", muscleGroup: "Abdos", specificMuscleGroup: null, type: "isolation", equipment: [] }, // Added Leg Raises
    { name: "Leg Extension", muscleGroup: "Jambes", specificMuscleGroup: "Quadriceps", type: "isolation", equipment: ["machines-guidees"] }, // New
    { name: "Leg Curl", muscleGroup: "Jambes", specificMuscleGroup: "Ischios", type: "isolation", equipment: ["machines-guidees"] }, // New
    { name: "Calf Raises", muscleGroup: "Jambes", specificMuscleGroup: "Mollets", type: "isolation", equipment: [] }, // New
  ];

  // Define "big strength" exercises for RPE calculation (used in old logic)
  const bigStrengthExercises = ["Squat Barre", "Soulevé de Terre Roumain", "Développé Couché", "Développé Militaire Barre"];

  // Filter exercises based on available equipment
  const availableExercises = allExercises.filter(ex =>
    ex.equipment.length === 0 || (materiel && materiel.some(eq => ex.equipment.includes(eq)))
  );

  const program: Program = {
    title: `Programme ${objectif} - ${experience}`,
    description: `Programme généré pour ${joursEntrainement} jours/semaine, split ${split}. Durée max par séance: ${dureeMax} minutes.`,
    weeks: [],
  };

  // Define muscle groups for each split type
  const splitMuscles: { [key: string]: string[][] } = {
      "Full Body (Tout le corps)": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos"]], // All muscles each day
      "Half Body (Haut / Bas)": [["Pectoraux", "Dos", "Épaules", "Biceps", "Triceps"], ["Jambes", "Abdos"]], // Upper/Lower split
      "Push Pull Legs": [["Pectoraux", "Épaules", "Triceps"], ["Dos", "Biceps"], ["Jambes", "Abdos"]], // PPL split
      "Autre / Pas de préférence": [["Jambes", "Pectoraux", "Dos", "Épaules", "Biceps", "Triceps", "Abdos"]], // Default to Full Body logic
  };

  const selectedSplitMuscles = splitMuscles[split] || splitMuscles["Autre / Pas de préférence"];
  const numSplitDays = selectedSplitMuscles.length;

  // Define large muscle groups for volume tracking
  const largeMuscleGroups = ["Jambes", "Pectoraux", "Dos", "Épaules"];
  const weeklyVolumeCap = 15; // Max sets per week for large muscle groups

  // Generate 4 weeks
  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const week: Program['weeks'][number] = {
      weekNumber: weekNum,
      days: [],
    };

    // Initialize weekly volume tracker for this week
    const weeklyVolume: { [key: string]: number } = {};
    largeMuscleGroups.forEach(group => weeklyVolume[group] = 0);


    // Generate days based on joursEntrainement
    for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
      const day: Program['weeks'][number]['days'][number] = {
        dayNumber: dayIndex + 1,
        exercises: [],
      };

      // Determine which muscle groups to target based on the split and day index
      const targetMuscleGroups = selectedSplitMuscles[dayIndex % numSplitDays];

      let dayExercises: typeof allExercises = [];
      const addedExerciseNames = new Set<string>(); // To track added exercises

      // Helper to add exercise if available, targets muscle group, not already added, and respects volume cap
      // Returns true if added, false otherwise
      const addExerciseIfPossible = (exercise: typeof allExercises[number]) => {
          if (!exercise || addedExerciseNames.has(exercise.name)) {
              return false;
          }

          // Check if exercise is available with current equipment
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

      // Filter all exercises by target muscle groups for today
      const potentialExercisesForToday = allExercises.filter(ex =>
          targetMuscleGroups.includes(ex.muscleGroup)
      );

      // Categorize potential exercises for today based on type and specific needs
      const bigStrengthForToday = potentialExercisesForToday.filter(ex => bigStrengthExercises.includes(ex.name));
      const inclineBenchForToday = potentialExercisesForToday.filter(ex => ex.name === "Développé Incliné Haltères");
      const otherCompoundsForToday = potentialExercisesForToday.filter(ex =>
          ex.type === 'compound' &&
          !bigStrengthExercises.includes(ex.name) &&
          ex.name !== "Développé Incliné Haltères"
      );
      const legIsolationsForToday = potentialExercisesForToday.filter(ex =>
          ex.type === 'isolation' &&
          ex.muscleGroup === 'Jambes' // Filter by general muscle group 'Jambes' for isolation
      );
      const armShoulderIsolationsForToday = potentialExercisesForToday.filter(ex =>
          ex.type === 'isolation' &&
          (ex.muscleGroup === 'Biceps' || ex.muscleGroup === 'Triceps' || ex.muscleGroup === 'Épaules')
      );
      const absIsolationsForToday = potentialExercisesForToday.filter(ex => ex.muscleGroup === "Abdos" && ex.type === 'isolation');


      // --- Add exercises in the desired order and quantity ---

      // 1. Big Strength (Add all available big strength exercises for today)
      bigStrengthForToday.forEach(ex => addExerciseIfPossible(ex));

      // 2. Développé Incliné Haltères (Add if available and targeted)
      inclineBenchForToday.forEach(ex => addExerciseIfPossible(ex));

      // 3. Other Compounds (Add a few other compounds if available and targeted)
      otherCompoundsForToday.slice(0, 2).forEach(ex => addExerciseIfPossible(ex)); // Limit to 2 other compounds

      // 4. Leg Isolations (Add a few leg isolations if available and targeted)
      legIsolationsForToday.slice(0, 2).forEach(ex => addExerciseIfPossible(ex)); // Limit to 2 leg isolations

      // 5. Arm/Shoulder Isolations (Add a few arm/shoulder isolations if available and targeted)
      armShoulderIsolationsForToday.slice(0, 2).forEach(ex => addExerciseIfPossible(ex)); // Limit to 2 arm/shoulder isolations

      // 6. Abs Isolations (Add a few ab isolations if available and targeted)
      absIsolationsForToday.slice(0, 2).forEach(ex => addExerciseIfPossible(ex)); // Limit to 2 ab isolations


      // The total exercise limit (max 8) is implicitly handled by the slicing and limited additions above.
      // If the total number of exercises added exceeds 8, the slicing below will still apply,
      // but the goal is to build the list in order up to a reasonable number.
      // Let's keep the slice as a final safeguard, although the ordered additions should manage this.
      const finalDayExercises = dayExercises.slice(0, 8); // Keep the slice as a safeguard


      // Format exercises for the program structure and calculate RPE
      day.exercises = finalDayExercises.map(ex => {
        let rpeNote = "";
        if (ex.type === "isolation") {
          rpeNote = "RPE 10";
        } else if (bigStrengthExercises.includes(ex.name)) {
          // RPE progression for big strength: 6 -> 7 -> 8 -> 10
          const rpeMap: { [key: number]: number } = { 1: 6, 2: 7, 3: 8, 4: 10 };
          rpeNote = `RPE ${rpeMap[weekNum] || 6}`; // Default to 6 if weekNum is unexpected
        } else {
          // RPE progression for other compounds: 7 -> 7.5 -> 8 -> 9
           const rpeMap: { [key: number]: number | string } = { 1: 7, 2: 7.5, 3: 8, 4: 9 };
           rpeNote = `RPE ${rpeMap[weekNum] || 7}`; // Default to 7 if weekNum is unexpected
        }

        return {
          name: ex.name,
          sets: baseSets.toString(), // Convert back to string for display
          reps: baseReps,
          notes: rpeNote
        };
      });

      week.days.push(day);
    }
    program.weeks.push(week);
  }

  return program;
};