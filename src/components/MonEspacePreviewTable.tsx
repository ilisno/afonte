import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Define a simplified type for the static exercise data
interface StaticExercise {
  name: string;
  sets: string; // e.g., "3"
  reps: string; // e.g., "8-12"
  notes?: string; // e.g., "RPE 8"
  muscles?: string[]; // e.g., ["quadriceps", "fessiers"]
  // Simplified setsDetails for preview (optional, can just use sets/reps strings)
  // If you want to show 5/3/1 style, you'd need a structure similar to Program['weeks'][number]['days'][number]['exercises'][number]['setsDetails']
  // For simplicity in a static preview, we'll just use sets/reps strings.
}

// Static example data for a single day
const exampleDayData: { dayNumber: number; exercises: StaticExercise[] } = {
    dayNumber: 1,
    exercises: [
        {
            name: "Squat barre",
            sets: "3",
            reps: "8-12",
            notes: "RPE 7",
            muscles: ["quadriceps", "fessiers"],
        },
        {
            name: "Développé couché",
            sets: "3",
            reps: "8-12",
            notes: "RPE 7",
            muscles: ["pectoraux", "triceps", "deltoïdes antérieurs"],
        },
        {
            name: "Rowing barre",
            sets: "3",
            reps: "8-12",
            notes: "RPE 7",
            muscles: ["dorsaux", "trapèzes", "biceps"],
        },
         {
            name: "Élévations latérales haltères",
            sets: "3",
            reps: "12-15",
            notes: "RPE 10",
            muscles: ["deltoïdes moyens"],
        },
         {
            name: "Crunchs",
            sets: "3",
            reps: "15-20",
            notes: "RPE 10",
            muscles: ["abdominaux"],
        },
    ],
};


const MonEspacePreviewTable: React.FC = () => {
  const isMobile = useIsMobile();

  // This component is for preview only, so workout data state is not needed.
  // We'll use placeholder values or leave inputs empty.

  return (
    <Card className={cn(
      "w-full shadow-lg",
      isMobile ? "max-w-full rounded-none" : "max-w-3xl" // Full width and no rounded corners on mobile
    )}>
      <CardHeader className="text-center">
         <CardTitle className="text-2xl font-bold text-gray-800">Aperçu de votre programme</CardTitle>
         <CardDescriptionShadcn className="text-gray-600">
            Voici à quoi ressemble le suivi de vos séances dans votre espace personnel.
         </CardDescriptionShadcn>
      </CardHeader>
      <CardContent className={cn("py-4", isMobile ? "px-0" : "px-4")}> {/* Conditional horizontal padding */}
        {/* Display a single example day */}
        <div className="space-y-6"> {/* Increased spacing */}
          <div key={exampleDayData.dayNumber} className="border rounded-md bg-gray-50 w-full"> {/* Removed p-4, added w-full */}
            <h4 className="text-lg font-bold mb-4 text-gray-800 px-4 pt-4">Jour {exampleDayData.dayNumber}</h4> {/* Added px-4 pt-4 */}

            {/* Conditional rendering based on isMobile */}
            {isMobile ? (
               // Mobile View: Accordions for each exercise
               <div className="space-y-4 px-4 pb-4"> {/* Added px-4 pb-4 */}
                  {exampleDayData.exercises.map((exercise, exerciseIndex) => {
                     // Determine number of sets from the string (e.g., "3" -> 3)
                     const numberOfSets = parseInt(exercise.sets, 10) || 0;
                     const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);

                     return (
                        <Accordion type="single" collapsible key={exerciseIndex} className="w-full border rounded-md bg-white">
                           <AccordionItem value={`exercise-${exerciseIndex}`}>
                              <AccordionTrigger className="font-medium px-4 py-3 text-gray-800">
                                 {exercise.name}
                                 {exercise.notes && <span className="text-sm text-gray-500 italic ml-2">({exercise.notes})</span>}
                              </AccordionTrigger>
                              <AccordionContent className="p-4 pt-0 space-y-3">
                                 {/* Display muscles worked */}
                                 {exercise.muscles && exercise.muscles.length > 0 && (
                                    <p className="text-sm text-gray-600 italic mb-2">Muscles: {exercise.muscles.join(', ')}</p>
                                 )}
                                 {setsArray.map((setIndex) => (
                                     <div key={setIndex} className="flex items-center space-x-2">
                                        <span className="font-semibold flex-shrink-0">Série {setIndex + 1}:</span>
                                        <Input
                                           type="text"
                                           placeholder={exercise.reps} // Use program reps as placeholder
                                           value={''} // Static preview, inputs are empty
                                           disabled // Disable inputs for preview
                                           className="w-20 text-center"
                                        />
                                        <span className="flex-shrink-0">Reps</span>
                                        <Input
                                           type="number"
                                           placeholder="0" // Placeholder weight
                                           value={''} // Static preview, inputs are empty
                                           disabled // Disable inputs for preview
                                           className="w-20 text-center"
                                        />
                                        <span className="flex-shrink-0">kg</span>
                                     </div>
                                 ))}
                                 <div className="mt-3">
                                    <label htmlFor={`notes-${exercise.name}-preview`} className="font-semibold text-gray-800 block mb-1">Notes pour l'exercice:</label> {/* Use standard label */}
                                    <Input
                                       id={`notes-${exercise.name}-preview`} // Add id for label
                                       type="text"
                                       placeholder="Notes spécifiques..."
                                       value={''} // Static preview, inputs are empty
                                       disabled // Disable inputs for preview
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
                     {exampleDayData.exercises.map((exercise, exerciseIndex) => {
                        // Determine number of sets from the string (e.g., "3" -> 3)
                        const numberOfSets = parseInt(exercise.sets, 10) || 0;
                        const setsArray = Array.from({ length: numberOfSets }, (_, i) => i);

                        return (
                          <React.Fragment key={exerciseIndex}>
                            {setsArray.map((setIndex) => (
                              <TableRow key={`${exerciseIndex}-${setIndex}`}>
                                {setIndex === 0 ? (
                                  // Display exercise name only for the first set row
                                  <TableCell rowSpan={numberOfSets} className="font-medium align-top">
                                    {exercise.name}
                                    {/* Display muscles worked */}
                                    {exercise.muscles && exercise.muscles.length > 0 && (
                                       <p className="text-sm text-gray-600 italic mt-1">({exercise.muscles.join(', ')})</p>
                                    )}
                                    {exercise.notes && <p className="text-sm text-gray-500 italic mt-1">({exercise.notes})</p>} {/* Display program notes */}
                                  </TableCell>
                                ) : null}
                                <TableCell className="text-center">{setIndex + 1}</TableCell> {/* Set number */}
                                <TableCell className="text-center">
                                   {/* Input for Reps */}
                                   <Input
                                      type="text" // Use text to allow ranges like "8-12"
                                      placeholder={exercise.reps} // Use program reps as placeholder
                                      value={''} // Static preview, inputs are empty
                                      disabled // Disable inputs for preview
                                      className="w-20 text-center mx-auto" // Small input
                                   />
                                </TableCell>
                                <TableCell className="text-center">
                                   {/* Input for Weight */}
                                   <Input
                                      type="number"
                                      placeholder="0" // Placeholder weight
                                      value={''} // Static preview, inputs are empty
                                      disabled // Disable inputs for preview
                                      className="w-20 text-center mx-auto" // Small input
                                   />
                                </TableCell>
                                 {setIndex === 0 ? (
                                  // Display notes input only for the first set row
                                  <TableCell rowSpan={numberOfSets} className="align-top">
                                     <Input
                                        type="text"
                                        placeholder="Notes pour l'exercice..."
                                        value={''} // Static preview, inputs are empty
                                        disabled // Disable inputs for preview
                                        className="w-full"
                                     />
                                  </TableCell>
                                ) : null}
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                     })}
                   </TableBody>
                 </Table>
               </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonEspacePreviewTable;