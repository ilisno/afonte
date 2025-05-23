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
  program: Program; // The full program JSON structure (now includes is531 and setsDetails)
  duration_weeks: number | null;
  days_per_week: number | null;
  program_name: string | null;
  user_id: string; // User ID from auth.users
}

// Define type for workout log inputs for a single exercise
interface ExerciseWorkoutData {
  sets: { set: number; weight: string; reps: string }[];
  notes: string;
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
        log.sets.forEach(set => {
          while (initialData[log.exercise_name]!.sets.length < set.set) {
            initialData[log.exercise_name]!.sets.push({ set: initialData[log.exercise_name]!.sets.length + 1, weight: '', reps: '' });
          }
          if (set.set <= initialData[log.exercise_name]!.sets.length) {
            initialData[log.exercise_name]!.sets[set.set - 1] = {
              set: set.set,
              weight: set.weight.toString(),
              reps: set.reps.toString(),
            };
          }
        });
      });

      setCurrentWorkoutData(initialData);
    }
  };

  // Handle going back to the program list
  const handleBackToList = () => {
    setSelectedUserProgram(null);
    setEditingProgramId(null);
    setNewTitle('');
    setCurrentWorkoutData({}); // Clear workout data state
  };

  // Handle starting rename mode
  const handleStartRename = (program: UserTrainingProgram) => {
    setEditingProgramId(program.id);
    setNewTitle(program.program_name || ''); // Use program_name
  };

  // Handle canceling rename mode
  const handleCancelRename = () => {
    setEditingProgramId(null);
    setNewTitle('');
  };

  // Handle saving the new program title
  const handleSaveRename = async (programId: string) => {
    if (newTitle.trim() === '') {
      showError("Le nom du programme ne peut pas être vide.");
      return;
    }

    setIsRenaming(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('training_programs') // Update training_programs table
        .update({ program_name: newTitle.trim() })
        .eq('id', programId);

      if (updateError) {
        console.error("Error updating program name:", updateError);
        setError("Une erreur est survenue lors du renommage.");
        showError("Impossible de renommer le programme.");
      } else {
        console.log(`Program ${programId} renamed to "${newTitle.trim()}"`);
        showSuccess("Programme renommé avec succès !");

        // Update the userPrograms state locally
        setUserPrograms(prevPrograms =>
          prevPrograms ? prevPrograms.map(program =>
            program.id === programId ? { ...program, program_name: newTitle.trim() } : program
          ) : null
        );

        // If the selected program is the one being renamed, update its name too
        if (selectedUserProgram?.id === programId) {
             setSelectedUserProgram(prev => prev ? { ...prev, program_name: newTitle.trim() } : null);
        }

        handleCancelRename(); // Exit editing mode
      }
    } catch (err) {
      console.error("Unexpected error during renaming:", err);
      setError("Une erreur inattendue est survenue.");
      showError("Une erreur inattendue est survenue.");
    } finally {
      setIsRenaming(false);
    }
  };

  // Handle input change for workout data
  const handleWorkoutInputChange = (
    exerciseName: string,
    setIndex: number,
    field: 'weight' | 'reps',
    value: string
  ) => {
    setCurrentWorkoutData(prevData => {
      const exerciseData = prevData[exerciseName] || { sets: [], notes: '' };
      // Ensure sets array has enough elements
      while (exerciseData.sets.length <= setIndex) {
        exerciseData.sets.push({ set: exerciseData.sets.length + 1, weight: '', reps: '' });
      }
      // Update the specific field
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
    const logsToInsert: WorkoutLogEntry[] = Object.entries(currentWorkoutData).map(([exerciseName, data]) => ({
      user_id: session.user.id,
      program_id: selectedUserProgram.id,
      week: weekNumber,
      day: dayNumber,
      exercise_name: exerciseName,
      sets: data.sets.filter(set => set.weight || set.reps), // Only save sets with data
      notes: data.notes.trim() || null, // Save notes, null if empty
    })).filter(log => log.sets.length > 0 || log.notes); // Only insert logs with sets data or notes

    if (logsToInsert.length === 0) {
        showError("Aucune donnée de performance à sauvegarder pour cette journée.");
        setIsSavingWorkout(false);
        return;
    }

    // Use the new utility function to save logs
    const { error: dbError } = await saveWorkoutLog(logsToInsert);

    if (dbError) {
      // Error handling is already logged in saveWorkoutLog, just show toast
      setError("Une erreur est survenue lors de la sauvegarde de vos performances.");
      showError("Impossible de sauvegarder vos performances.");
    } else {
      console.log("Workout logs saved successfully via utility function.");
      showSuccess("Performances sauvegardées avec succès !");
      // Optionally clear the form or provide feedback that data is saved
      // For now, we'll leave the data in the inputs
    }

    setIsSavingWorkout(false);
  };

  // Handle deleting a program
  const handleDeleteProgram = async (programId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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
                               // Mobile View: Accordions for each exercise
                               <div className="space-y-4 px-4 pb-4"> {/* Added px-4 pb-4 */}
                                  {day.exercises.map((exercise, exerciseIndex) => {
                                     // Determine number of sets based on program type
                                     const numberOfSets = selectedUserProgram.program.is531 && exercise.setsDetails
                                        ? exercise.setsDetails.length
                                        : parseInt(exercise.sets, 10) || 0;

                                     const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);
                                     const exerciseData = currentWorkoutData[exercise.name] || { sets: [], notes: '' };

                                     return (
                                        <Accordion type="single" collapsible key={exerciseIndex} className="w-full border rounded-md bg-white">
                                           <AccordionItem value={`exercise-${exerciseIndex}`}>
                                              <AccordionTrigger className="font-medium px-4 py-3 text-gray-800">
                                                 {exercise.name}
                                                 {exercise.notes && <span className="text-sm text-gray-500 italic ml-2">({exercise.notes})</span>}
                                              </AccordionTrigger>
                                              <AccordionContent className="p-4 pt-0 space-y-3">
                                                 {setsArray.map((setIndex) => {
                                                    const setDetail = selectedUserProgram.program.is531 && exercise.setsDetails ? exercise.setsDetails[setIndex] : null;
                                                    const placeholderReps = setDetail ? setDetail.reps : exercise.reps;
                                                    const placeholderWeight = setDetail ? `${setDetail.calculatedWeight}` : '0'; // Use calculated weight as placeholder for 5/3/1

                                                    return (
                                                        <div key={setIndex} className="flex items-center space-x-2">
                                                           <span className="font-semibold flex-shrink-0">Série {setIndex + 1}:</span>
                                                           <Input
                                                              type="text"
                                                              placeholder={placeholderReps} // Use program reps or 5/3/1 specific reps
                                                              value={exerciseData.sets[setIndex]?.reps || ''}
                                                              onChange={(e) => handleWorkoutInputChange(exercise.name, setIndex, 'reps', e.target.value)}
                                                              className="w-20 text-center"
                                                           />
                                                           <span className="flex-shrink-0">Reps</span>
                                                           <Input
                                                              type="number"
                                                              placeholder={placeholderWeight} // Use calculated weight as placeholder for 5/3/1
                                                              value={exerciseData.sets[setIndex]?.weight || ''}
                                                              onChange={(e) => {
                                                                const newWeight = e.target.value;
                                                                handleWorkoutInputChange(exercise.name, setIndex, 'weight', newWeight);
                                                                // Auto-fill weight for subsequent sets if this is the first set (only for non-5/3/1 or if desired)
                                                                // For 5/3/1, weights are pre-calculated per set, so auto-fill might not be desired.
                                                                // Let's keep auto-fill for simplicity for now, but it might overwrite 5/3/1 weights.
                                                                // A better approach would be to pre-fill inputs with saved logs or calculated 5/3/1 weights.
                                                                // For now, auto-fill only if not 5/3/1 or if it's the first set.
                                                                if (!selectedUserProgram.program.is531 && setIndex === 0) {
                                                                  for (let i = 1; i < numberOfSets; i++) {
                                                                    handleWorkoutInputChange(exercise.name, i, 'weight', newWeight);
                                                                  }
                                                                }
                                                              }}
                                                              className="w-20 text-center"
                                                           />
                                                           <span className="flex-shrink-0">kg</span>
                                                           {setDetail?.isAmrap && <span className="text-sbf-red font-bold ml-2">(AMRAP)</span>} {/* Highlight AMRAP */}
                                                        </div>
                                                    );
                                                 })}
                                                 <div className="mt-3">
                                                    <label htmlFor={`notes-${exercise.name}`} className="font-semibold text-gray-800 block mb-1">Notes pour l'exercice:</label> {/* Use standard label */}
                                                    <Input
                                                       id={`notes-${exercise.name}`} // Add id for label
                                                       type="text"
                                                       placeholder="Notes spécifiques..."
                                                       value={exerciseData.notes || ''}
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
                                       <TableHead className="text-center">Séries</TableHead>
                                       <TableHead className="text-center">Répétitions</TableHead>
                                       <TableHead className="text-center">Poids (kg)</TableHead> {/* Added Weight column */}
                                       <TableHead>Notes</TableHead> {/* Added Notes column */}
                                     </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                     {day.exercises.map((exercise, exerciseIndex) => {
                                        // Determine number of sets based on program type
                                        const numberOfSets = selectedUserProgram.program.is531 && exercise.setsDetails
                                           ? exercise.setsDetails.length
                                           : parseInt(exercise.sets, 10) || 0;

                                        const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);
                                        const exerciseData = currentWorkoutData[exercise.name] || { sets: [], notes: '' };

                                        return (
                                          <React.Fragment key={exerciseIndex}>
                                            {setsArray.map((setIndex) => {
                                               const setDetail = selectedUserProgram.program.is531 && exercise.setsDetails ? exercise.setsDetails[setIndex] : null;
                                               const placeholderReps = setDetail ? setDetail.reps : exercise.reps;
                                               const placeholderWeight = setDetail ? `${setDetail.calculatedWeight}` : '0'; // Use calculated weight as placeholder for 5/3/1

                                               return (
                                                 <TableRow key={`${exerciseIndex}-${setIndex}`}>
                                                   {setIndex === 0 ? (
                                                     // Display exercise name only for the first set row
                                                     <TableCell rowSpan={numberOfSets} className="font-medium align-top">
                                                       {exercise.name}
                                                       {exercise.notes && <p className="text-sm text-gray-500 italic mt-1">({exercise.notes})</p>} {/* Display program notes */}
                                                     </TableCell>
                                                   ) : null}
                                                   <TableCell className="text-center">{setIndex + 1}</TableCell> {/* Set number */}
                                                   <TableCell className={cn("text-center", setDetail?.isAmrap && 'font-bold text-sbf-red')}>
                                                      {/* Input for Reps */}
                                                      <Input
                                                         type="text" // Use text to allow ranges like "8-12"
                                                         placeholder={placeholderReps} // Use program reps or 5/3/1 specific reps
                                                         value={exerciseData.sets[setIndex]?.reps || ''}
                                                         onChange={(e) => handleWorkoutInputChange(exercise.name, setIndex, 'reps', e.target.value)}
                                                         className="w-20 text-center mx-auto" // Small input
                                                      />
                                                      {setDetail?.isAmrap && <span className="ml-1">(AMRAP)</span>} {/* Highlight AMRAP */}
                                                   </TableCell>
                                                   <TableCell className="text-center">
                                                      {/* Input for Weight */}
                                                      <Input
                                                         type="number"
                                                         placeholder={placeholderWeight} // Use calculated weight as placeholder for 5/3/1
                                                         value={exerciseData.sets[setIndex]?.weight || ''}
                                                         onChange={(e) => {
                                                           const newWeight = e.target.value;
                                                           handleWorkoutInputChange(exercise.name, setIndex, 'weight', newWeight);
                                                           // Auto-fill weight for subsequent sets if this is the first set (only for non-5/3/1 or if desired)
                                                           if (!selectedUserProgram.program.is531 && setIndex === 0) {
                                                             for (let i = 1; i < numberOfSets; i++) {
                                                               handleWorkoutInputChange(exercise.name, i, 'weight', newWeight);
                                                             }
                                                           }
                                                         }}
                                                         className="w-20 text-center mx-auto" // Small input
                                                      />
                                                   </TableCell>
                                                    {setIndex === 0 ? (
                                                     // Display notes input only for the first set row
                                                     <TableCell rowSpan={numberOfSets} className="align-top">
                                                        <Input
                                                           type="text"
                                                           placeholder="Notes pour l'exercice..."
                                                           value={exerciseData.notes || ''}
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