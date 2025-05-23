import { supabase } from '@/integrations/supabase/client';

// Define the type for a single workout log entry to be inserted
export interface WorkoutLogEntry {
  user_id: string;
  program_id: string;
  week: number;
  day: number;
  exercise_name: string;
  sets: { set: number; weight: string; reps: string }[]; // Array of set data
  notes: string | null;
}

/**
 * Saves an array of workout log entries for a specific day to the database.
 * @param logs - An array of WorkoutLogEntry objects.
 * @returns A promise resolving to the Supabase insert result.
 */
export const saveWorkoutLog = async (logs: WorkoutLogEntry[]) => {
  console.log("Attempting to save workout logs:", logs);
  const { data, error } = await supabase
    .from('workout_logs')
    .insert(logs);

  if (error) {
    console.error("Error saving workout logs:", error);
  } else {
    console.log("Workout logs saved successfully:", data);
  }

  return { data, error };
};

/**
 * Fetches workout logs for a specific program.
 * @param programId - The ID of the program to fetch logs for.
 * @param userId - The ID of the user (for security).
 * @returns A promise resolving to the array of workout logs.
 */
export const getWorkoutLogs = async (programId: string, userId: string) => {
  console.log(`Fetching workout logs for program ${programId} for user ${userId}`);
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('program_id', programId);

  if (error) {
    console.error("Error fetching workout logs:", error);
    return [];
  } else {
    console.log("Fetched workout logs:", data);
    return data || [];
  }
};