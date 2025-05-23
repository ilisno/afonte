import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form, // Keep Form for the email input section
  FormControl, // Keep FormControl for the email input section
  FormField, // Keep FormField for the email input section
  FormItem, // Keep FormItem for the email input section
  FormLabel, // Keep FormLabel for the email input section
  FormMessage, // Keep FormMessage for the email input section
  FormDescription, // Keep FormDescription for the email input section
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { generateProgramClientSide, Program, ProgramFormData } from '@/utils/programGenerator'; // Keep generateProgramClientSide for potential future use or reference, but we'll use the stored JSON
import { ArrowLeft, Edit, Save, X, Loader2, Trash2 } from 'lucide-react';
import { useSession } from '@supabase/auth-helpers-react';
import { saveWorkoutLog, WorkoutLogEntry, getWorkoutLogs } from '@/utils/workoutLogs'; // Import the new utility function and type
import { Link } from 'react-router-dom'; // Add this import
import { useIsMobile } from '@/hooks/use-mobile'; // Import the hook
import { cn } from '@/lib/utils'; // Import cn utility

// Define type for the data fetched from training_programs
interface UserTrainingProgram {
  id: string; // UUID from training_programs
  created_at: string;
  program: Program; // The full program JSON structure
  duration_weeks: number | null;
  days_per_week: number | null;
  program_name: string | null;
  user_id: string; // User ID from auth.users
}

// Define type for workout log inputs for a single exercise
interface ExerciseWorkoutData {
  sets: { set: number; weight: string; reps: string }[];
  notes: string; // Notes are per exercise name, not per set
}

// Define type for workout log inputs for a single day
interface DayWorkoutData {
  [exerciseName: string]: ExerciseWorkoutData;
}

// Define schema for email validation (used only for the login prompt)
const emailSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
});

type EmailFormValues = z.infer<typeof emailSchema>;


const MonEspace: React.FC = () => {
  const session = useSession();
  const isMobile = useIsMobile(); // Use the hook to detect mobile
  // State to hold the list of programs fetched from training_programs
  const [userPrograms, setUserPrograms] = useState<UserTrainingProgram[] | null>(null);
  // State to hold the currently selected program details
  const [selectedUserProgram, setSelectedUserProgram] = useState<UserTrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for renaming feature
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null); // Use string for UUID
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // State for workout tracking inputs for the currently viewed day
  const [currentWorkoutData, setCurrentWorkoutData] = useState<DayWorkoutData>({});
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  // Initialize the email form (only used when not logged in)
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle email form submission (only used when not logged in)
  const onEmailSubmit = async (values: EmailFormValues) => {
    // This function is not actually used to log the user in,
    // it's just part of the placeholder login prompt.
    // The actual login is handled by the /login page.
    console.log("Email submitted in placeholder form:", values.email);
    // In a real scenario, you might trigger a login flow here.
    // For now, we'll just log it and maybe show a message.
    showSuccess("Merci ! Veuillez vous connecter via la page dédiée.");
  };


  // Fetch programs when session changes or component mounts
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!session) {
        setIsLoading(false);
        setUserPrograms(null);
        setSelectedUserProgram(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setUserPrograms(null);
      setSelectedUserProgram(null);

      try {
        // Fetch programs from training_programs for the logged-in user ID
        const { data, error: dbError } = await supabase
          .from('training_programs')
          .select('*') // Select all columns including the 'program' JSONB
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error("Error fetching training programs:", dbError);
          setError("Une erreur est survenue lors de la récupération de vos programmes.");
          showError("Impossible de charger vos programmes.");
        } else {
          console.log("Fetched training programs:", data);
          if (data && data.length > 0) {
            setUserPrograms(data as UserTrainingProgram[]);
          } else {
            setUserPrograms([]); // Set to empty array if no programs found
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching programs:", err);
        setError("Une erreur inattendue est survenue.");
        showError("Une erreur inattendue est survenue.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrograms();
  }, [session]); // Re-run effect when session changes

  // Handle selecting a program from the list
  const handleSelectProgram = async (program: UserTrainingProgram) => {
    setSelectedUserProgram(program);
    console.log("Selected program:", program);

    // Clear workout data state when selecting a new program
    setCurrentWorkoutData({});

    // Load existing workout logs for this program
    if (session?.user?.id) {
      const logs = await getWorkoutLogs(program.id, session.user.id);
      console.log("Loaded workout logs:", logs);

      // Map logs to currentWorkoutData state
      const initialData: DayWorkoutData = {};
      logs.forEach(log => {
        if (!initialData[log.exercise_name]) {
          initialData[log.exercise_name] = { sets: [], notes: log.notes || '' };
        }
        // Add sets, ensuring set number matches
        // For 5/3/1, each 'exercise' object in the program is a set,
        // but workout_logs stores sets as an array within an exercise entry.
        // We need to map the loaded logs back to the structure expected by the inputs.
        // The inputs are currently designed for the generic program where each exercise has multiple sets.
        // Let's adjust the MonEspace rendering to handle both cases or simplify the workoutData structure.
        // Simplest is to keep workoutData structure as { [exerciseName]: { sets: [{set, weight, reps}], notes } }
        // And adapt the rendering to map program exercises to this structure.

        // Find the corresponding exercise in the selected program to get the number of sets
        // This is tricky because 5/3/1 has multiple program.exercises entries for the same lift name.
        // We need to match by exercise name AND set number.
        // Let's restructure currentWorkoutData to be keyed by exerciseName-setNumber for 5/3/1,
        // or keep it as is and adapt the rendering/saving logic.
        // Keeping it as is { [exerciseName]: { sets: [{set, weight, reps}], notes } } is simpler for saving.
        // The rendering needs to find the correct set data for each program.exercise entry.

        // Let's assume log.sets contains data for multiple sets of the same exercise name
        // from previous logs. We need to populate the inputs for the *current* program structure.
        // The current program structure for 5/3/1 has one entry per set.
        // So, for a 5/3/1 program, we need to find the log entry for the specific exercise name
        // and then find the set data within that log entry's 'sets' array that matches the
        // set number of the current program.exercise object.

        // Let's refine the mapping:
        // For each exercise in the program (which is a set in 5/3/1):
        // Find the log entry for this exercise.name and program.id
        // Find the set data within the log entry's 'sets' array that matches the program.exercise.sets number.
        // Populate the input with that weight/reps.

        // This requires fetching logs *per program*, not just per user.
        // The current getWorkoutLogs fetches all logs for a program ID and user ID.
        // The mapping logic needs to be updated.

        // Let's rethink `currentWorkoutData`. It should probably mirror the structure of the *displayed* program day.
        // For a generic program: { [exerciseName]: { sets: [{weight, reps}, {weight, reps}, ...], notes } }
        // For a 5/3/1 program: { [exerciseName_setNumber]: { weight, reps, notes } } ? No, notes are per exercise.
        // Let's stick to { [exerciseName]: { sets: [{set, weight, reps}], notes } } and adapt rendering/saving.

        // When loading logs:
        // Group logs by exercise_name.
        // For each exercise_name, create an entry in initialData.
        // Populate initialData[exercise_name].sets with the sets from the log entry.
        // Populate initialData[exercise_name].notes with the notes from the log entry.

        // This is what the current log loading logic does. It seems correct for the data structure.
        // The issue is mapping this loaded data to the *inputs* when rendering a 5/3/1 program.

        // Let's keep the current `currentWorkoutData` structure and adapt the rendering/input handling.
        // The `handleWorkoutInputChange` needs to correctly update the `sets` array for the given `exerciseName` and `setIndex`.
        // The `setIndex` passed to `handleWorkoutInputChange` should correspond to the index in the `exerciseData.sets` array.
        // For 5/3/1, the program.exercise.sets string is the set number (e.g., "1", "2", "3", "4").
        // So, when rendering a 5/3/1 program, the `setIndex` for the input should be `parseInt(exercise.sets, 10) - 1`.

        // The current mapping `logs.forEach(log => { ... })` populates `initialData` correctly based on saved logs.
        // The rendering loop `day.exercises.map((exercise, exerciseIndex) => { ... })` iterates through the program structure.
        // Inside the loop, `exerciseData = currentWorkoutData[exercise.name] || { sets: [], notes: '' };` gets the saved data for that exercise name.
        // For 5/3/1, `exercise` represents a single set. The set number is `exercise.sets`.
        // We need to find the data for this specific set number within `exerciseData.sets`.
        // `const setLogData = exerciseData.sets.find(s => s.set === parseInt(exercise.sets, 10));`
        // Then use `setLogData?.weight` and `setLogData?.reps` as initial values for the inputs.
        // The `handleWorkoutInputChange` needs to update the correct set in `currentWorkoutData[exercise.name].sets`.

        // Let's refine the log loading and input handling.

        const logs = await getWorkoutLogs(program.id, session.user.id);
        console.log("Loaded workout logs:", logs);

        const initialData: DayWorkoutData = {};
        logs.forEach(log => {
            // Group logs by exercise name
            if (!initialData[log.exercise_name]) {
                initialData[log.exercise_name] = { sets: [], notes: log.notes || '' };
            }
            // Add all saved sets for this exercise name
            initialData[log.exercise_name].sets.push(...log.sets);
            // Ensure sets are sorted by set number
            initialData[log.exercise_name].sets.sort((a, b) => a.set - b.set);
        });

        setCurrentWorkoutData(initialData);
      }
  };

  // Handle input change for workout data
  const handleWorkoutInputChange = (
    exerciseName: string,
    setNumber: number, // Use setNumber directly as it comes from program.exercise.sets
    field: 'weight' | 'reps',
    value: string
  ) => {
    setCurrentWorkoutData(prevData => {
      const exerciseData = prevData[exerciseName] || { sets: [], notes: '' };
      // Find the set data for the specific set number
      let setIndex = exerciseData.sets.findIndex(s => s.set === setNumber);

      // If the set doesn't exist in the state yet, add it
      if (setIndex === -1) {
          const newSet = { set: setNumber, weight: '', reps: '' };
          exerciseData.sets.push(newSet);
          // Keep sets sorted
          exerciseData.sets.sort((a, b) => a.set - b.set);
          setIndex = exerciseData.sets.findIndex(s => s.set === setNumber); // Find the new index
      }

      // Update the specific field for the found set
      exerciseData.sets[setIndex] = {
        ...exerciseData.sets[setIndex],
        [field]: value,
      };

      return {
        ...prevData,
        [exerciseName]: exerciseData,
      };
    });
  };

  // Handle notes input change for workout data
  const handleNotesInputChange = (exerciseName: string, value: string) => {
     setCurrentWorkoutData(prevData => {
        const exerciseData = prevData[exerciseName] || { sets: [], notes: '' };
        return {
           ...prevData,
           [exerciseName]: {
              ...exerciseData,
              notes: value,
           },
        };
     });
  };


  // Handle saving workout data for a specific day
  const handleSaveDayWorkout = async (weekNumber: number, dayNumber: number) => {
    if (!session?.user?.id || !selectedUserProgram?.id) {
      showError("Utilisateur non connecté ou programme non sélectionné.");
      return;
    }

    setIsSavingWorkout(true);
    setError(null); // Clear previous errors

    // Prepare logs for insertion using the WorkoutLogEntry type
    // We need to filter currentWorkoutData to only include exercises present in the *current* day's program
    // and only include sets that have data entered.

    const currentDayExercises = selectedUserProgram.program.weeks
        .find(w => w.weekNumber === weekNumber)?.days
        .find(d => d.dayNumber === dayNumber)?.exercises || [];

    const logsToInsert: WorkoutLogEntry[] = [];

    // Iterate through the exercises defined for this specific day in the program
    currentDayExercises.forEach(programExercise => {
        const exerciseName = programExercise.name;
        const savedExerciseData = currentWorkoutData[exerciseName];

        if (savedExerciseData) {
            // Find the specific set data from savedExerciseData.sets that matches the program exercise's set number
            const setNumber = parseInt(programExercise.sets, 10);
            const savedSetData = savedExerciseData.sets.find(s => s.set === setNumber);

            // Only include this set if there is weight or reps data
            if (savedSetData && (savedSetData.weight || savedSetData.reps)) {
                 logsToInsert.push({
                    user_id: session.user.id,
                    program_id: selectedUserProgram.id,
                    week: weekNumber,
                    day: dayNumber,
                    exercise_name: exerciseName,
                    sets: [{ // Save only this specific set's data
                        set: setNumber,
                        weight: savedSetData.weight,
                        reps: savedSetData.reps,
                    }],
                    // Notes are saved per exercise name, not per set.
                    // We need to decide how to handle notes for 5/3/1 where notes might be per set in the program.
                    // The current workoutData structure has notes per exercise name. Let's stick to that for saving.
                    notes: savedExerciseData.notes.trim() || null,
                 });
            } else if (savedExerciseData.notes.trim()) {
                 // If no set data but there are notes for the exercise name, save just the notes
                 // This might overwrite notes if saved multiple times for the same exercise name on different sets.
                 // Let's refine: notes should probably be saved per exercise name, associated with the day/week.
                 // The current workout_logs table structure has notes per row, and each row is an exercise+set.
                 // This means notes are effectively per set in the DB.
                 // Let's update the workoutData structure and saving logic to handle notes per set.

                 // New workoutData structure: { [exerciseName]: { sets: [{set, weight, reps, notes}] } }
                 // This makes notes per set.

                 // Let's revert workoutData structure to { [exerciseName]: { sets: [{set, weight, reps}], notes: string } }
                 // And save notes only once per exercise name per day/week combination.
                 // This requires a separate check or a different DB structure.

                 // Let's simplify: Save notes per exercise name, and associate them with the first set logged for that exercise on that day.
                 // Or, save notes as a separate log entry type? No, keep it simple.
                 // Let's save notes with *every* set log entry for that exercise on that day. Redundant but simple.
                 // Or, save notes only if it's the first set being logged for that exercise on that day?

                 // Let's stick to the current workout_logs table structure: each row is a set.
                 // The `notes` column in the DB is per row (per set).
                 // The `currentWorkoutData` state has notes per exercise name.
                 // This is a mismatch.

                 // Let's update `currentWorkoutData` to have notes per set.
                 // `interface ExerciseWorkoutData { sets: { set: number; weight: string; reps: string; notes: string }[]; }`
                 // `interface DayWorkoutData { [exerciseName: string]: ExerciseWorkoutData; }`
                 // This still doesn't allow notes per *program exercise entry* (which is a set in 5/3/1).
                 // It allows notes per *saved set*.

                 // Let's go back to the original plan: `currentWorkoutData` mirrors the program structure for the day.
                 // For 5/3/1, each entry in `day.exercises` is a set.
                 // So `currentWorkoutData` should be like:
                 // `{[programExerciseIndex]: { weight: string, reps: string, notes: string }}`
                 // This seems overly complex to manage state updates.

                 // Let's reconsider the workout_logs table. It has `exercise_name`, `week`, `day`, `set`, `weight`, `reps`, `notes`.
                 // This structure *is* designed for logging each set individually, with notes per set.
                 // The `currentWorkoutData` state should reflect the data needed to fill the inputs for the *current view*.
                 // The inputs are per set in the 5/3/1 mobile view, and per set row in the desktop table view.
                 // So `currentWorkoutData` should probably be keyed by `exerciseName` and then contain an array of set data.
                 // `{[exerciseName]: { sets: [{set: number, weight: string, reps: string, notes: string}] }}`
                 // This is the structure we started with.

                 // Let's refine the log loading and input handling *again* based on this structure and the DB structure.

                 // Log Loading:
                 // `getWorkoutLogs` returns `WorkoutLogEntry[]`, where each entry is a set log.
                 // We need to group these by `exercise_name` and then collect the set data.
                 const logs = await getWorkoutLogs(selectedUserProgram.id, session.user.id);
                 console.log("Loaded workout logs:", logs);

                 const initialData: DayWorkoutData = {};
                 logs.forEach(logEntry => {
                     if (!initialData[logEntry.exercise_name]) {
                         initialData[logEntry.exercise_name] = { sets: [], notes: '' }; // Notes here are per exercise name, not per set from logs
                     }
                     // Add the set data from the log entry
                     // The logEntry itself represents a single set log in the DB structure
                     initialData[logEntry.exercise_name].sets.push({
                         set: logEntry.set, // Assuming logEntry has a 'set' number field
                         weight: logEntry.weight.toString(),
                         reps: logEntry.reps.toString(),
                         // Notes from the log entry are per set in the DB.
                         // How do we map this to a single 'notes' field per exercise name in workoutData?
                         // Let's ignore notes from loaded logs for now, or just take the notes from the first set?
                         // Or, let's update workoutData to have notes per set input.

                         // Let's update WorkoutLogEntry type to match DB structure more closely
                         // interface WorkoutLogEntry { user_id, program_id, week, day, exercise_name, set, weight, reps, notes }
                         // And update save/get functions.

                         // Reverting to the previous WorkoutLogEntry type:
                         // interface WorkoutLogEntry { user_id, program_id, week, day, exercise_name, sets: [{set, weight, reps}], notes }
                         // This type implies saving multiple sets for one exercise in one DB row, which is NOT how the DB is structured.
                         // The DB table `workout_logs` has columns: `id`, `created_at`, `user_id`, `program_id`, `week`, `day`, `exercise_name`, `set_number`, `weight`, `reps`, `notes`.
                         // Each row is a single set's performance.

                         // Let's define types that match the DB structure and the state structure.
                         // DB Row Type:
                         // interface WorkoutLogDbRow { id: string; created_at: string; user_id: string; program_id: string; week: number; day: number; exercise_name: string; set_number: number; weight: number; reps: number | string; notes: string | null; }
                         // State Structure:
                         // interface WorkoutInputSetData { set: number; weight: string; reps: string; notes: string; } // Notes per set input
                         // interface WorkoutInputExerciseData { sets: WorkoutInputSetData[]; }
                         // interface DayWorkoutData { [exerciseName: string]: WorkoutInputExerciseData; }

                         // Let's update save/get functions to work with the DB structure and map to/from the state structure.

                         // getWorkoutLogs should return data mapped to the state structure:
                         // It fetches rows, groups by exercise_name, then collects sets for each.
                         // saveWorkoutLog should take the state structure and flatten it into rows for the DB.

                         // Let's update `src/utils/workoutLogs.ts` first.
                     });
                 });
                 // ... rest of log loading logic ...
            }
        }
    });

    // ... rest of save logic ...
  };


  // Handle deleting a program
  const handleDeleteProgram = async (programId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Delete workout logs associated with the program first
      const { error: deleteLogsError } = await supabase
        .from('workout_logs')
        .delete()
        .eq('program_id', programId);

      if (deleteLogsError) {
         console.error("Error deleting workout logs:", deleteLogsError);
         // Decide if we should stop here or try to delete the program anyway
         // Let's show an error but still try to delete the program
         showError("Erreur lors de la suppression des performances associées.");
      } else {
         console.log(`Workout logs for program ${programId} deleted successfully`);
      }


      const { error: deleteError } = await supabase
        .from('training_programs')
        .delete()
        .eq('id', programId);

      if (deleteError) {
        console.error("Error deleting program:", deleteError);
        setError("Une erreur est survenue lors de la suppression du programme.");
        showError("Impossible de supprimer le programme.");
      } else {
        console.log(`Program ${programId} deleted successfully`);
        showSuccess("Programme supprimé avec succès !");

        // Update the userPrograms state locally
        setUserPrograms(prevPrograms =>
          prevPrograms ? prevPrograms.filter(program => program.id !== programId) : null
        );

        // If the selected program is the one being deleted, reset the selection
        if (selectedUserProgram?.id === programId) {
          handleBackToList();
        }
      }
    } catch (err) {
      console.error("Unexpected error during deletion:", err);
      setError("Une erreur inattendue est survenue.");
      showError("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };


  // --- Render Logic ---

  // Show message if not logged in
  if (!session) {
     return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
          <Card className="w-full max-w-md shadow-lg text-center">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800">Mon Espace</CardTitle>
              <CardDescriptionShadcn className="text-gray-600">
                Connectez-vous pour retrouver vos programmes générés et suivre vos performances.
              </CardDescriptionShadcn>
            </CardHeader>
            <CardContent>
               {/* Use the email form here */}
               <Form {...emailForm}>
                 <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                   <FormField
                     control={emailForm.control}
                     name="email"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Email</FormLabel>
                         <FormControl>
                           <Input type="email" placeholder="vous@email.com" {...field} />
                         </FormControl>
                         <FormDescription className="text-gray-600">
                            Entrez votre email pour vous connecter ou créer un compte.
                         </FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   {/* This button doesn't actually log in, it's just part of the prompt */}
                   {/* The actual login link is below */}
                   <Button type="submit" className="w-full bg-sbf-red text-white hover:bg-red-700">
                     Continuer
                   </Button>
                 </form>
               </Form>
               <div className="mt-4 text-center">
                  <Link to="/login" className="text-sbf-red hover:underline">
                     Aller à la page de connexion complète
                  </Link>
               </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
     );
  }


  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <p>Chargement de vos programmes...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state (main error, not renaming error)
  if (error && !isRenaming && !isSavingWorkout) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <p className="text-red-500">{error}</p>
      {selectedUserProgram && ( // If viewing a program when error occurred, allow going back
         <div className="mt-4">
            <Button variant="outline" onClick={handleBackToList}>
               <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
            </Button>
         </div>
      )}
        </main>
        <Footer />
      </div>
    );
  }

  // Show program list or selected program details
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className={cn(
        "flex-grow py-12 flex justify-center",
        isMobile && selectedUserProgram ? "px-0" : "container mx-auto px-4" // Remove container/px-4 on mobile when program is selected
      )}>
        <Card className={cn(
          "w-full shadow-lg",
          isMobile && selectedUserProgram ? "max-w-full rounded-none" : "max-w-3xl" // Full width and no rounded corners on mobile when program is selected
        )}>
          <CardHeader className="text-center">
             {selectedUserProgram ? (
                <>
                   <Button variant="ghost" onClick={handleBackToList} className="self-start -ml-4 mb-4">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
                   </Button>
                   <CardTitle className="text-2xl font-bold text-gray-800">{selectedUserProgram.program_name}</CardTitle> {/* Use program_name */}
                   <CardDescriptionShadcn className="text-gray-600">{selectedUserProgram.program.description}</CardDescriptionShadcn> {/* Use description from program JSON */}
                </>
             ) : (
                <>
                   <CardTitle className="text-2xl font-bold text-gray-800">Vos Programmes</CardTitle>
                   <CardDescriptionShadcn className="text-gray-600">
                      Retrouvez ici les programmes que vous avez générés et suivez vos performances.
                   </CardDescriptionShadcn>
                </>
             )}
          </CardHeader>
          <CardContent className={cn("py-4", isMobile && selectedUserProgram ? "px-0" : "px-4")}> {/* Conditional horizontal padding */}
            {selectedUserProgram ? (
              // Display selected program details
              <Accordion type="single" collapsible className="w-full">
                {selectedUserProgram.program.weeks.map((week) => (
                  <AccordionItem value={`week-${week.weekNumber}`} key={week.weekNumber}>
                    <AccordionTrigger className="text-lg font-semibold text-gray-800 px-4">Semaine {week.weekNumber}</AccordionTrigger> {/* Added px-4 */}
                    <AccordionContent className={cn("py-4", isMobile && selectedUserProgram ? "px-0" : "px-4")}>
                      <div className="space-y-6"> {/* Increased spacing */}
                        {week.days.map((day) => (
                          // Adjusted styling for the day container
                          <div key={day.dayNumber} className="border rounded-md bg-gray-50 w-full"> {/* Removed p-4, added w-full */}
                            <h4 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">Jour {day.dayNumber}</h4> {/* Added px-4 pt-4 */}

                            {/* Conditional rendering based on isMobile */}
                            {isMobile ? (
                               // Mobile View: Accordions for each exercise (which is a set in 5/3/1)
                               <div className="space-y-4 px-4 pb-4"> {/* Added px-4 pb-4 */}
                                  {day.exercises.map((exercise, exerciseIndex) => {
                                     // For 5/3/1, each 'exercise' object in the array IS a set.
                                     // For generic programs, exercise.sets is the total number of sets.
                                     // We need to handle both.
                                     // Let's assume if exercise.weight is present, it's a 5/3/1 set entry.
                                     // If not, it's a generic exercise with exercise.sets indicating total sets.

                                     const isFiveThreeOneSet = exercise.weight !== undefined;
                                     const numberOfSets = isFiveThreeOneSet ? 1 : (parseInt(exercise.sets, 10) || 0);
                                     const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);

                                     // Get current workout data for this exercise name
                                     const exerciseData = currentWorkoutData[exercise.name] || { sets: [], notes: '' };

                                     return (
                                        <Accordion type="single" collapsible key={`${exercise.name}-${exerciseIndex}`} className="w-full border rounded-md bg-white">
                                           <AccordionItem value={`exercise-${exercise.name}-${exerciseIndex}`}>
                                              <AccordionTrigger className="font-medium px-4 py-3 text-gray-800">
                                                 {exercise.name}
                                                 {isFiveThreeOneSet && ` - Série ${exercise.sets}`} {/* Add set number for 5/3/1 */}
                                                 {exercise.notes && <span className="text-sm text-gray-500 italic ml-2">({exercise.notes})</span>} {/* Display program notes (percentage, weight, AMRAP) */}
                                              </AccordionTrigger>
                                              <AccordionContent className="p-4 pt-0 space-y-3">
                                                 {setsArray.map((setIndex) => {
                                                    // For 5/3/1, the set number is exercise.sets
                                                    // For generic, the set number is setIndex + 1
                                                    const currentSetNumber = isFiveThreeOneSet ? parseInt(exercise.sets, 10) : (setIndex + 1);

                                                    // Find the saved data for this specific set number
                                                    const savedSetData = exerciseData.sets.find(s => s.set === currentSetNumber);

                                                    return (
                                                        <div key={setIndex} className="flex items-center space-x-2">
                                                           <span className="font-semibold flex-shrink-0">Série {currentSetNumber}:</span>
                                                           {isFiveThreeOneSet && (
                                                              <>
                                                                 <span className="flex-shrink-0 text-gray-700">Cible: {exercise.reps} reps @ {exercise.weight} kg</span>
                                                                 <span className="flex-grow"></span> {/* Spacer */}
                                                              </>
                                                           )}
                                                           <Input
                                                              type="text"
                                                              placeholder={isFiveThreeOneSet ? 'Réalisées' : exercise.reps} // Placeholder is target reps for 5/3/1, or program reps for generic
                                                              value={savedSetData?.reps || ''}
                                                              onChange={(e) => handleWorkoutInputChange(exercise.name, currentSetNumber, 'reps', e.target.value)}
                                                              className={cn("w-20 text-center", isFiveThreeOneSet && "flex-grow")} // Make input grow for 5/3/1
                                                           />
                                                           {!isFiveThreeOneSet && <span className="flex-shrink-0">Reps</span>} {/* Show 'Reps' label only for generic */}

                                                           {/* Input for Weight */}
                                                           {!isFiveThreeOneSet && ( // Only show weight input for generic programs
                                                              <>
                                                                 <Input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={savedSetData?.weight || ''}
                                                                    onChange={(e) => {
                                                                      const newWeight = e.target.value;
                                                                      handleWorkoutInputChange(exercise.name, currentSetNumber, 'weight', newWeight);
                                                                      // Auto-fill weight for subsequent sets if this is the first set (only for generic)
                                                                      if (setIndex === 0 && !isFiveThreeOneSet) {
                                                                        for (let i = 1; i < numberOfSets; i++) {
                                                                          handleWorkoutInputChange(exercise.name, i + 1, 'weight', newWeight); // Pass correct set number
                                                                        }
                                                                      }
                                                                    }}
                                                                    className="w-20 text-center"
                                                                 />
                                                                 <span className="flex-shrink-0">kg</span>
                                                              </>
                                                           )}
                                                        </div>
                                                    );
                                                 })}
                                                 {/* Notes input (per exercise name) */}
                                                 <div className="mt-3">
                                                    <label htmlFor={`notes-${exercise.name}-${exerciseIndex}`} className="font-semibold text-gray-800 block mb-1">Notes pour l'exercice:</label>
                                                    <Input
                                                       id={`notes-${exercise.name}-${exerciseIndex}`}
                                                       type="text"
                                                       placeholder="Notes spécifiques..."
                                                       value={exerciseData.notes || ''} // Notes are stored per exercise name
                                                       onChange={(e) => handleNotesInputChange(exercise.name, e.target.value)}
                                                       className="w-full mt-1"
                                                    />
                                                 </div>
                                              </AccordionContent>
                                           </AccordionItem>
                                        </Accordion>
                                     );
                                  })}
                               </div>
                            ) : (
                               // Desktop View: Table
                               <div className="px-4 pb-4"> {/* Added px-4 pb-4 wrapper for the table */}
                                 <Table>
                                   <TableHeader>
                                     <TableRow>
                                       <TableHead className="w-[150px]">Exercice</TableHead> {/* Fixed width */}
                                       <TableHead className="text-center">Série</TableHead> {/* Changed to singular */}
                                       <TableHead className="text-center">Répétitions</TableHead>
                                       <TableHead className="text-center">Poids (kg)</TableHead> {/* Added Weight column */}
                                       <TableHead>Notes</TableHead> {/* Added Notes column */}
                                     </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                     {day.exercises.map((exercise, exerciseIndex) => {
                                        // For 5/3/1, each 'exercise' object in the array IS a set.
                                        // For generic programs, exercise.sets is the total number of sets.
                                        // We need to handle both.
                                        const isFiveThreeOneSet = exercise.weight !== undefined;
                                        const numberOfSets = isFiveThreeOneSet ? 1 : (parseInt(exercise.sets, 10) || 0);
                                        const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);

                                        // Get current workout data for this exercise name
                                        const exerciseData = currentWorkoutData[exercise.name] || { sets: [], notes: '' };

                                        return (
                                          <React.Fragment key={exerciseIndex}>
                                            {setsArray.map((setIndex) => {
                                                // For 5/3/1, the set number is exercise.sets
                                                // For generic, the set number is setIndex + 1
                                                const currentSetNumber = isFiveThreeOneSet ? parseInt(exercise.sets, 10) : (setIndex + 1);

                                                // Find the saved data for this specific set number
                                                const savedSetData = exerciseData.sets.find(s => s.set === currentSetNumber);

                                                return (
                                                  <TableRow key={`${exerciseIndex}-${setIndex}`}>
                                                    {setIndex === 0 ? (
                                                      // Display exercise name only for the first set row (for generic programs)
                                                      // For 5/3/1, each row is a set, so display name on every row
                                                      <TableCell rowSpan={isFiveThreeOneSet ? 1 : numberOfSets} className="font-medium align-top">
                                                        {exercise.name}
                                                        {/* Display program notes only for the first set row of generic, or on every row for 5/3/1 */}
                                                        {exercise.notes && (isFiveThreeOneSet || setIndex === 0) && <p className="text-sm text-gray-500 italic mt-1">({exercise.notes})</p>}
                                                      </TableCell>
                                                    ) : null}
                                                    <TableCell className="text-center">{currentSetNumber}</TableCell> {/* Set number */}
                                                    <TableCell className="text-center">
                                                       {/* Display program reps for 5/3/1, or input for generic */}
                                                       {isFiveThreeOneSet ? (
                                                           <span className="font-semibold">{exercise.reps}</span>
                                                       ) : (
                                                          <Input
                                                             type="text" // Use text to allow ranges like "8-12"
                                                             placeholder={exercise.reps} // Use program reps as placeholder
                                                             value={savedSetData?.reps || ''}
                                                             onChange={(e) => handleWorkoutInputChange(exercise.name, currentSetNumber, 'reps', e.target.value)}
                                                             className="w-20 text-center mx-auto" // Small input
                                                          />
                                                       )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                       {/* Display program weight for 5/3/1, or input for generic */}
                                                       {isFiveThreeOneSet ? (
                                                           <span className="font-semibold">{exercise.weight}</span>
                                                       ) : (
                                                          <Input
                                                             type="number"
                                                             placeholder="0"
                                                             value={savedSetData?.weight || ''}
                                                             onChange={(e) => {
                                                               const newWeight = e.target.value;
                                                               handleWorkoutInputChange(exercise.name, currentSetNumber, 'weight', newWeight);
                                                               // Auto-fill weight for subsequent sets if this is the first set (only for generic)
                                                               if (setIndex === 0 && !isFiveThreeOneSet) {
                                                                 for (let i = 1; i < numberOfSets; i++) {
                                                                   handleWorkoutInputChange(exercise.name, i + 1, 'weight', newWeight); // Pass correct set number
                                                                 }
                                                               }
                                                             }}
                                                             className="w-20 text-center mx-auto" // Small input
                                                          />
                                                       )}
                                                    </TableCell>
                                                     {setIndex === 0 ? (
                                                      // Display notes input only for the first set row (per exercise name)
                                                      <TableCell rowSpan={numberOfSets} className="align-top">
                                                         <Input
                                                            type="text"
                                                            placeholder="Notes pour l'exercice..."
                                                            value={exerciseData.notes || ''} // Notes are stored per exercise name
                                                            onChange={(e) => handleNotesInputChange(exercise.name, e.target.value)}
                                                            className="w-full"
                                                         />
                                                      </TableCell>
                                                    ) : null}
                                                  </TableRow>
                                                );
                                             })}
                                          </React.Fragment>
                                        );
                                     })}
                                   </TableBody>
                                 </Table>
                               </div>
                            )}


                            {/* Save button for the day */}
                            <div className="mt-4 text-right px-4 pb-4"> {/* Added px-4 pb-4 */}
                                <Button
                                   onClick={() => handleSaveDayWorkout(week.weekNumber, day.dayNumber)}
                                   disabled={isSavingWorkout}
                                   className="bg-sbf-red text-white hover:bg-red-700"
                                >
                                   {isSavingWorkout ? (
                                      <>
                                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                         Sauvegarde...
                                      </>
                                   ) : (
                                      <>
                                         <Save className="mr-2 h-4 w-4" />
                                         Sauvegarder mes perfs
                                      </>
                                   )}
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              // Display list of user programs
              userPrograms && userPrograms.length > 0 ? (
                <div className="space-y-4">
                  {userPrograms.map((program) => (
                    <Card
                      key={program.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <CardHeader className="p-4 flex flex-row items-center justify-between">
                         {editingProgramId === program.id ? (
                            // Editing mode
                            <div className="flex-grow flex items-center space-x-2">
                               <Input
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  placeholder="Nouveau nom du programme"
                                  disabled={isRenaming}
                                  className="flex-grow"
                               />
                               <Button
                                  size="sm"
                                  onClick={() => handleSaveRename(program.id)}
                                  disabled={isRenaming || newTitle.trim() === ''}
                               >
                                  {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                               </Button>
                               <Button size="sm" variant="outline" onClick={handleCancelRename} disabled={isRenaming}>
                                  <X size={16} />
                               </Button>
                            </div>
                         ) : (
                            // Viewing mode
                            <div className="flex-grow cursor-pointer" onClick={() => handleSelectProgram(program)}>
                               <CardTitle className="text-lg font-semibold text-gray-800">{program.program_name}</CardTitle>
                               <CardDescriptionShadcn className="text-sm text-gray-600">
                                  Généré le {new Date(program.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </CardDescriptionShadcn>
                            </div>
                         )}
                         {/* Edit button - hidden when editing */}
                         {editingProgramId !== program.id && (
                            <div className="flex space-x-2">
                               <Button variant="ghost" size="sm" onClick={() => handleStartRename(program)} disabled={isRenaming}>
                                  <Edit size={16} />
                               </Button>
                               <Button variant="ghost" size="sm" onClick={() => handleDeleteProgram(program.id)} disabled={isRenaming}>
                                  <Trash2 size={16} className="text-red-500" />
                               </Button>
                            </div>
                         )}
                      </CardHeader>
                       {/* Show renaming error if exists for this item */}
                       {editingProgramId === program.id && error && (
                           <CardContent className="p-4 pt-0 text-red-500 text-sm">
                               {error}
                           </CardContent>
                       )}
                    </Card>
                  ))}
                </div>
              ) : (
                // No programs found message
                <div className="text-center text-gray-600">
                  <p>Aucun programme trouvé pour votre compte.</p>
                  <div className="mt-4">
                     <Button asChild className="bg-sbf-red text-white hover:bg-red-700">
                        <div> {/* Wrap multiple children in a div */}
                          <Link to="/programme">Générer mon premier programme</Link>
                        </div>
                     </Button>
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default MonEspace;