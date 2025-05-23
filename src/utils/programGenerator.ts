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
      exercises: { name: string; sets: string; reps: string; notes?: string }[];
    }[];
  }[];
};

// --- Simplified Client-Side Program Generation Logic ---
// NOTE: This is a basic placeholder. A real generator would be much more complex.
export const generateProgramClientSide = (values: ProgramFormData): Program => {
  const { objectif, experience, split, joursEntrainement, materiel, dureeMax } = values;

  const baseReps = objectif === "Powerlifting" ? "3-5" : (objectif === "Sèche / Perte de Gras" ? "12-15" : "8-12");
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

  // Define "big strength" exercises for RPE calculation
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