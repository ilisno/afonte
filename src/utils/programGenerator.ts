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
  // New 1RM fields
  squat1RM: z.coerce.number().min(0).optional(),
  bench1RM: z.coerce.number().min(0).optional(),
  deadlift1RM: z.coerce.number().min(0).optional(),
  ohp1RM: z.coerce.number().min(0).optional(),
});

// Define a type for the form data used by the generator
export type ProgramFormData = z.infer<typeof programFormSchemaForGenerator>;


// Define a type for the program structure
export type Program = {
  title: string;
  description: string;
  weeks: {
    weekNumber: number;
    days: {
      dayNumber: number;
      // Added 'weight' as an optional string property for calculated weights
      exercises: { name: string; sets: string; reps: string; notes?: string; weight?: string }[];
    }[];
  }[];
};

// Helper function to calculate Training Max (90% of 1RM, rounded to nearest 2.5 kg)
const calculateTrainingMax = (oneRM: number): number => {
    if (!oneRM || oneRM <= 0) return 0;
    const tm = oneRM * 0.9;
    // Round to the nearest 2.5 kg
    return Math.round(tm / 2.5) * 2.5;
};

// Helper function to calculate weight for a set based on TM and percentage
const calculateWeight = (tm: number, percentage: number): number => {
    if (!tm || tm <= 0) return 0;
    const weight = tm * percentage;
     // Round to the nearest 2.5 kg
    return Math.round(weight / 2.5) * 2.5;
};


// --- Simplified Client-Side Program Generation Logic ---
// NOTE: This is a basic placeholder. A real generator would be much more complex.
export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, split, joursEntrainement, materiel, dureeMax, squat1RM, bench1RM, deadlift1RM, ohp1RM } = values;

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

  // Filter exercises based on available equipment
  const availableExercises = allExercises.filter(ex =>
    ex.equipment.length === 0 || (materiel && materiel.some(eq => ex.equipment.includes(eq)))
  );

  // --- 5/3/1 Logic ---
  if (objectif === "Powerlifting" || objectif === "Powerbuilding") {
      console.log("Generating 5/3/1 program...");

      // Calculate Training Maxes (TM) - Use 0 if 1RM is undefined or null
      const tmSquat = calculateTrainingMax(squat1RM || 0);
      const tmBench = calculateTrainingMax(bench1RM || 0);
      const tmDeadlift = calculateTrainingMax(deadlift1RM || 0);
      const tmOhp = calculateTrainingMax(ohp1RM || 0);

      const trainingMaxes = {
          "Squat Barre": tmSquat,
          "Développé Couché": tmBench,
          // Use the exact names from allExercises list
          "Soulevé de Terre Roumain": tmDeadlift,
          "Développé Militaire Barre": tmOhp,
      };

      // 5/3/1 percentages and reps per week
      const cycle = [
          // Week 1 (5 reps)
          [{ percent: 0.65, reps: 5 }, { percent: 0.75, reps: 5 }, { percent: 0.85, reps: 5, amrap: true }],
          // Week 2 (3 reps)
          [{ percent: 0.70, reps: 3 }, { percent: 0.80, reps: 3 }, { percent: 0.90, reps: 3, amrap: true }],
          // Week 3 (5/3/1)
          [{ percent: 0.75, reps: 5 }, { percent: 0.85, reps: 3 }, { percent: 0.95, reps: 1, amrap: true }],
          // Week 4 (Deload)
          [{ percent: 0.40, reps: 5 }, { percent: 0.50, reps: 5 }, { percent: 0.60, reps: 5 }], // No AMRAP on deload
      ];

      // Main lifts order
      const mainLifts = ["Squat Barre", "Développé Couché", "Soulevé de Terre Roumain", "Développé Militaire Barre"];

      // Accessory exercises mapping (simplified) - Use names from allExercises
      const accessoryMap: { [key: string]: string[] } = {
          "Squat Barre": ["Leg Extension", "Leg Curl", "Calf Raises", "Crunchs", "Leg Raises"],
          "Développé Couché": ["Écartés Poulie", "Extension Triceps Poulie Haute", "Élévations Latérales Haltères", "Pompes"],
          "Soulevé de Terre Roumain": ["Tirage Vertical Machine", "Rowing Barre", "Leg Curl", "Leg Raises", "Tractions", "Tractions australiennes"],
          "Développé Militaire Barre": ["Élévations Latérales Haltères", "Extension Triceps Poulie Haute", "Tirage Vertical Machine", "Dips"],
      };

      // Filter available accessory exercise names based on user equipment
      const availableAccessoryNames = availableExercises
          .filter(ex => ex.type === 'isolation' || (ex.type === 'compound' && (ex.name === 'Pompes' || ex.name === 'Dips' || ex.name === 'Tractions' || ex.name === 'Tractions australiennes'))) // Include some compound bodyweight/machine as accessories
          .map(ex => ex.name);


      const program: Program = {
          title: `Programme 5/3/1 - ${objectif}`,
          description: `Basé sur vos 1RM et la méthode 5/3/1 de Jim Wendler. ${joursEntrainement} jours/semaine. Durée max par séance: ${dureeMax} minutes.`,
          weeks: [],
      };

      for (let weekNum = 1; weekNum <= 4; weekNum++) {
          const week: Program['weeks'][number] = {
              weekNumber: weekNum,
              days: [],
          };

          // Determine main lift(s) for each day based on joursEntrainement
          const daysWithLifts: string[][] = [];
          if (joursEntrainement === 1) {
               daysWithLifts.push(mainLifts); // All 4 lifts on day 1
          } else if (joursEntrainement === 2) {
               daysWithLifts.push([mainLifts[0], mainLifts[1]]); // Squat, Bench
               daysWithLifts.push([mainLifts[2], mainLifts[3]]); // Deadlift, OHP
          } else if (joursEntrainement === 3) {
               daysWithLifts.push([mainLifts[0]]); // Squat
               daysWithLifts.push([mainLifts[1]]); // Bench
               daysWithLifts.push([mainLifts[2], mainLifts[3]]); // Deadlift, OHP
          } else { // joursEntrainement >= 4
               // Cycle through the 4 lifts
               for(let i = 0; i < joursEntrainement; i++) {
                   daysWithLifts.push([mainLifts[i % 4]]);
               }
          }


          for (let dayIndex = 0; dayIndex < joursEntrainement; dayIndex++) {
              const day: Program['weeks'][number]['days'][number] = {
                  dayNumber: dayIndex + 1,
                  exercises: [],
              };

              const mainLiftsForDay = daysWithLifts[dayIndex % daysWithLifts.length]; // Use modulo for cycling

              // Add main lifts for the day
              mainLiftsForDay.forEach(liftName => {
                  const tm = trainingMaxes[liftName as keyof typeof trainingMaxes];
                  if (tm === undefined || tm <= 0) {
                      console.warn(`TM not found or invalid for ${liftName}`);
                      return; // Skip if TM is missing or invalid
                  }

                  const setsForWeek = cycle[weekNum - 1];

                  setsForWeek.forEach((set, setIndex) => {
                      const weight = calculateWeight(tm, set.percent);
                      day.exercises.push({
                          name: liftName,
                          sets: (setIndex + 1).toString(), // Set number (1, 2, 3, 4)
                          reps: set.reps.toString() + (set.amrap ? '+' : ''), // Add '+' for AMRAP
                          notes: `${(set.percent * 100).toFixed(0)}% TM` + (set.amrap ? ' (AMRAP)' : ''),
                          weight: weight.toString(), // Store calculated weight as string
                      });
                  });
              });

              // Add accessory exercises
              let exercisesAddedCount = day.exercises.length;
              const maxTotalExercises = 8; // Limit total exercises per day

              // Collect potential accessories from all main lifts on this day
              let potentialAccessoriesForDay: string[] = [];
              mainLiftsForDay.forEach(liftName => {
                  const relevantAccessories = accessoryMap[liftName] || [];
                  potentialAccessoriesForDay = [...potentialAccessoriesForDay, ...relevantAccessories];
              });

              // Filter for availability and uniqueness
              const uniqueAvailableAccessories = Array.from(new Set(potentialAccessoriesForDay)) // Get unique names
                  .filter(accName => availableAccessoryNames.includes(accName)) // Check availability
                  .filter(accName => !mainLifts.includes(accName)); // Exclude main lifts

              // Add up to 3 unique accessories, respecting total limit
              uniqueAvailableAccessories.slice(0, 3).forEach(accName => {
                   if (exercisesAddedCount < maxTotalExercises) {
                       day.exercises.push({
                          name: accName,
                          sets: '3', // Standard 3 sets for accessories
                          reps: objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12", // Reps based on objective
                          notes: 'Accessoire',
                       });
                       exercisesAddedCount++;
                   }
              });

              week.days.push(day);
          }
          program.weeks.push(week);
      }

      return program; // Return the 5/3/1 program

  } else {
      // --- Existing Generic Logic ---
      console.log("Generating generic program...");

      const baseReps = objectif === "Powerlifting" ? "3-5" : (objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12");
      const baseSets = 3; // Use number for calculations

      // Define "big strength" exercises for RPE calculation (using names from allExercises)
      const bigStrengthExercises = ["Squat Barre", "Soulevé de Terre Roumain", "Développé Couché", "Développé Militaire Barre"];

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

      const program: Program = {
          title: `Programme ${objectif} - ${experience}`,
          description: `Programme généré pour ${joursEntrainement} jours/semaine, split ${split}. Durée max par séance: ${dureeMax} minutes.`,
          weeks: [],
      };

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
              const isAvailable = exercise.equipment.length === 0 || (materiel && materiel.some(eq => ex.equipment.includes(eq)));
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
              notes: rpeNote,
              weight: undefined, // No calculated weight for generic programs
            };
          });

          week.days.push(day);
        }
        program.weeks.push(week);
      }

      return program; // Return the generic program
  }
};