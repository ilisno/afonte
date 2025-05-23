import { supabase } from '@/integrations/supabase/client';

// Define the type for a single set's performance data
interface SetPerformanceData {
  set: number;
  weight: string; // Store as string to handle potential empty input
  reps: string; // Store as string to handle potential empty input or ranges
  notes?: string; // Notes per set
}

// Define the type for the data structure used in the MonEspace state
// This structure groups sets by exercise name
interface WorkoutInputExerciseData {
    sets: SetPerformanceData[];
    // Notes are now per set in the DB, but the input is per exercise name.
    // Let's keep notes per exercise name in the state for simplicity of input,
    // but save them with each set log entry.
    notes: string; // Notes for the exercise (will be saved with each set)
}

// Define the type for the overall state structure for a day's workout inputs
interface DayWorkoutDataState {
  [exerciseName: string]: WorkoutInputExerciseData;
}


// Define the type that matches the Supabase DB table `workout_logs` row structure
interface WorkoutLogDbRow {
  id?: string; // UUID, optional for inserts
  created_at?: string; // Timestamp, optional for inserts
  user_id: string;
  program_id: string;
  week: number;
  day: number;
  exercise_name: string;
  set_number: number; // Matches the 'set' property in SetPerformanceData
  weight: number | null; // Store as number in DB, null if empty
  reps: number | string | null; // Store as number or string in DB, null if empty
  notes: string | null; // Notes for this specific set
}


/**
 * Saves workout log entries for a specific day to the database.
 * Takes the state structure and flattens it into rows for the DB.
 * @param programId - The ID of the program.
 * @param userId - The ID of the user.
 * @param weekNumber - The week number.
 * @param dayNumber - The day number.
 * @param workoutData - The workout data from the MonEspace state for this day.
 * @returns A promise resolving to the Supabase insert result.
 */
export const saveWorkoutLog = async (
    programId: string,
    userId: string,
    weekNumber: number,
    dayNumber: number,
    workoutData: DayWorkoutDataState
) => {
  console.log("Attempting to save workout logs for day:", workoutData);

  const logsToInsert: WorkoutLogDbRow[] = [];

  // Iterate through exercises in the state data
  Object.entries(workoutData).forEach(([exerciseName, exerciseData]) => {
      // Iterate through sets for each exercise
      exerciseData.sets.forEach(set => {
          // Only include sets that have weight or reps data entered
          if (set.weight || set.reps) {
              logsToInsert.push({
                  user_id: userId,
                  program_id: programId,
                  week: weekNumber,
                  day: dayNumber,
                  exercise_name: exerciseName,
                  set_number: set.set,
                  // Convert weight to number or null
                  weight: set.weight ? parseFloat(set.weight) : null,
                  // Keep reps as string or convert to number if possible, null if empty
                  reps: set.reps.trim() === '' ? null : (isNaN(parseFloat(set.reps)) ? set.reps.trim() : parseFloat(set.reps)),
                  // Use the notes from the exerciseData (notes per exercise name)
                  notes: exerciseData.notes.trim() || null,
              });
          }
      });
  });

  if (logsToInsert.length === 0) {
      console.log("No workout data to save.");
      return { data: null, error: null }; // Nothing to save
  }

  console.log("Logs prepared for insertion:", logsToInsert);

  // First, delete existing logs for this specific day, week, program, and user
  // This prevents duplicate entries if the user saves multiple times for the same day
  const { error: deleteError } = await supabase
    .from('workout_logs')
    .delete()
    .eq('user_id', userId)
    .eq('program_id', programId)
    .eq('week', weekNumber)
    .eq('day', dayNumber);

  if (deleteError) {
      console.error("Error deleting existing workout logs:", deleteError);
      // Decide if we should proceed with insert or return error
      // Let's return the error for now
      return { data: null, error: deleteError };
  }
   console.log(`Deleted existing logs for program ${programId}, week ${weekNumber}, day ${dayNumber}`);


  // Then, insert the new logs
  const { data, error: insertError } = await supabase
    .from('workout_logs')
    .insert(logsToInsert)
    .select('*'); // Select inserted data if needed

  if (insertError) {
    console.error("Error saving workout logs:", insertError);
    return { data: null, error: insertError };
  } else {
    console.log("Workout logs saved successfully:", data);
    return { data, error: null };
  }
};

/**
 * Fetches workout logs for a specific program and user, grouped by exercise name.
 * Maps DB rows to the state structure.
 * @param programId - The ID of the program to fetch logs for.
 * @param userId - The ID of the user (for security).
 * @returns A promise resolving to the workout data in the state structure format.
 */
export const getWorkoutLogs = async (programId: string, userId: string): Promise<DayWorkoutDataState> => {
  console.log(`Fetching workout logs for program ${programId} for user ${userId}`);
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId)
    .order('exercise_name', { ascending: true })
    .order('set_number', { ascending: true }); // Order by set number

  if (error) {
    console.error("Error fetching workout logs:", error);
    return {}; // Return empty object on error
  } else {
    console.log("Fetched workout logs:", data);

    const workoutData: DayWorkoutDataState = {};

    if (data) {
        data.forEach(logRow => {
            const exerciseName = logRow.exercise_name;
            if (!workoutData[exerciseName]) {
                workoutData[exerciseName] = { sets: [], notes: logRow.notes || '' }; // Initialize notes from the first set's notes (might be inconsistent if notes differ per set in DB)
            }
            // Add set data
            workoutData[exerciseName].sets.push({
                set: logRow.set_number,
                weight: logRow.weight !== null ? logRow.weight.toString() : '',
                reps: logRow.reps !== null ? logRow.reps.toString() : '',
                notes: logRow.notes || '', // Add notes per set here
            });
             // Update the exercise-level notes with the latest notes encountered for this exercise name
             // This is a simplification; ideally, notes would be stored per exercise per day, not per set.
             // For now, let's just use the notes from the last set processed for this exercise name.
             workoutData[exerciseName].notes = logRow.notes || '';
        });
    }

    return workoutData;
  }
};