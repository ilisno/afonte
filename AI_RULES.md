# AI Rules and Guidelines

This document outlines the technical stack and specific library usage rules for this project, intended for AI assistance to ensure consistency and adherence to project standards.

## Tech Stack

*   **React**: The core JavaScript library for building the user interface.
*   **TypeScript**: Used for type safety, improving code maintainability and catching errors early.
*   **Tailwind CSS**: The utility-first CSS framework for styling components and layouts.
*   **shadcn/ui**: A collection of reusable UI components built with Radix UI and Tailwind CSS.
*   **React Router**: Handles client-side navigation within the application.
*   **Supabase**: Provides backend services including authentication, database (PostgreSQL), and Edge Functions.
*   **Sanity**: A headless CMS used for managing blog content.
*   **Groq Edge Function**: Used for the AI chatbot functionality, hosted on Supabase Edge Functions.
*   **Vercel Analytics**: Integrated for website analytics.
*   **Lucide React**: Provides a set of open-source icons.

## Library Usage Rules

*   **UI Components**: Always use components from `shadcn/ui` (`src/components/ui/`) for standard UI elements (Buttons, Cards, Forms, Accordions, etc.) unless a custom component is specifically required. Do not modify the files within `src/components/ui/`.
*   **Styling**: Use Tailwind CSS classes exclusively for styling. Avoid writing custom CSS in `.css` files unless absolutely necessary for global styles or specific overrides not possible with Tailwind.
*   **Navigation**: Use `react-router-dom` (`Link`, `useNavigate`, `Routes`, `Route`) for all internal application navigation.
*   **Authentication & Database**: Interact with the database and handle user authentication using the Supabase client (`@supabase/supabase-js` and `@supabase/auth-helpers-react`). Database operations should ideally go through dedicated utility functions (like `src/utils/workoutLogs.ts`).
*   **Content Management**: Fetch blog posts and other structured content using the Sanity client (`@sanity/client`).
*   **AI Chatbot**: The AI chatbot logic is handled by the Supabase Edge Function (`supabase/functions/chatbot/index.ts`). Client-side code should interact with this function via the Supabase client's `functions.invoke` method.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Toasts**: Use the `sonner` library (via `src/utils/toast.ts`) for displaying notifications to the user.
*   **Popups/Modals**: Use the custom `Popup` component and `PopupContext` (`src/components/Popup.tsx`, `src/contexts/PopupContext.tsx`) for displaying modal popups, especially for promotional content.