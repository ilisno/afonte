import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card"; // Import CardHeader, CardTitle, CardDescription
import { Send, Loader2 } from 'lucide-react'; // Icons for send and loading
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
import { showError } from '@/utils/toast'; // Import toast utility for errors
import { useForm } from "react-hook-form"; // Import useForm
import { zodResolver } from "@hookform/resolvers/zod"; // Import zodResolver
import * as z from "zod"; // Import zod
import {
  Form, // Import Form
  FormField, // Import FormField
  FormItem, // Import FormItem
  FormLabel, // Import FormLabel
  FormControl, // Import FormControl
  FormMessage, // Import FormMessage
  FormDescription, // Import FormDescription
} from "@/components/ui/form"; // Import form components

// Define message types
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define schema for email validation
const emailSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const CoachVirtuel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bienvenue dans ton chat de musculation. Comment puis-je t'aider aujourd'hui ?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); // State to store the user's email
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

  // Initialize the email form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle email form submission
  const onEmailSubmit = async (values: EmailFormValues) => {
    setUserEmail(values.email); // Store the submitted email
    console.log("Email submitted:", values.email);

    // --- Insert email into subscribers table (if email is provided and valid) ---
    // This is now handled by a database trigger on program_generation_logs
    // We still need to save the email to the chatbot_conversations table later,
    // so we store it in the userEmail state.
    // The trigger will handle adding it to subscribers if it's a new email.

    // Optionally save the email to local storage or session storage
    // localStorage.setItem('chatbotUserEmail', values.email);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() === '' || isLoading || !userEmail) return; // Ensure email is available

    const userMessageContent = inputMessage.trim();
    const newUserMessage: Message = { role: 'user', content: userMessageContent };

    // Add user message immediately to the state
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage(''); // Clear input field
    setIsLoading(true);

    try {
      // Prepare messages for the API (last 5 messages + new user message)
      // The system message is added in the Edge Function
      const history = messages.slice(-5); // Get last 5 messages
      const messagesToSend = [...history, newUserMessage];

      // Call the Supabase Edge Function
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('chatbot', {
        body: { messages: messagesToSend },
      });

      let assistantMessageContent = "Désolé, une erreur est survenue lors de la communication avec le coach virtuel.";

      if (edgeFunctionError) {
        console.error("Error invoking Edge Function:", edgeFunctionError);
        // Use the default error message
      } else if (data && data.assistantMessage) {
        assistantMessageContent = data.assistantMessage;
      } else {
         console.error("Edge Function returned unexpected data:", data);
         // Use the default error message
      }

      const newAssistantMessage: Message = { role: 'assistant', content: assistantMessageContent };

      // Add AI response to the state
      setMessages(prevMessages => [...prevMessages, newAssistantMessage]);

      // --- Save conversation to Supabase ---
      // This insertion will NOT trigger the subscribers update, only the program_generation_logs one does.
      // If you wanted chatbot emails to also populate subscribers, you'd need a similar trigger on chatbot_conversations.
      const { error: dbError } = await supabase
        .from('chatbot_conversations')
        .insert([
          {
            user_email: userEmail, // Use the stored user email
            user_message: userMessageContent,
            ai_response: assistantMessageContent,
          },
        ]);

      if (dbError) {
        console.error("Error saving conversation to database:", dbError);
        showError("Impossible d'enregistrer la conversation."); // Notify user about DB error
      } else {
        console.log("Conversation saved to database.");
      }
      // --- End Save conversation ---


    } catch (error) {
      console.error("Unexpected error:", error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: "Désolé, une erreur inattendue est survenue." }
      ]);
      showError("Une erreur inattendue est survenue."); // Notify user about unexpected error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // If email is not submitted, show the email form
  if (!userEmail) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex justify-center items-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">Accéder au Coach Virtuel</CardTitle>
              <CardDescriptionShadcn className="text-gray-600">
                Veuillez entrer votre email pour commencer la conversation.
              </CardDescriptionShadcn>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}> {/* Wrap the form with the Form component */}
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
                           Pas de spam, promis :)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-sbf-red text-white hover:bg-red-700">
                    Commencer la conversation
                  </Button>
                </form>
              </Form> {/* Close Form component */}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // If email is submitted, show the chatbot interface
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col max-w-3xl">
        <Card className="flex flex-col flex-grow shadow-lg">
          <CardContent className="flex flex-col flex-grow p-4 h-[60vh] overflow-y-auto"> {/* Fixed height and scrolling */}
            <div className="flex flex-col space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-sbf-red text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800 flex items-center">
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Le coach réfléchit...
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} /> {/* Element to scroll into view */}
            </div>
          </CardContent>
          <div className="p-4 border-t bg-white"> {/* Input area */}
            <div className="flex space-x-2">
              <Input
                placeholder="Posez votre question au coach..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button onClick={sendMessage} disabled={isLoading}>
                <Send size={20} />
              </Button>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CoachVirtuel;