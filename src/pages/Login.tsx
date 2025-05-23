import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
// Removed: import fr from '@supabase/auth-ui-shared/dist/esm/locales/fr';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

// Manually defined French translations
const frenchTranslations = {
  sign_in: {
    email_label: 'Adresse e-mail',
    password_label: 'Mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    password_input_placeholder: 'Votre mot de passe',
    button_label: 'Se connecter',
    loading_button_label: 'Connexion en cours...',
    link_text: 'Vous avez déjà un compte ? Connectez-vous',
  },
  sign_up: {
    email_label: 'Adresse e-mail',
    password_label: 'Mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    password_input_placeholder: 'Votre mot de passe',
    button_label: "S'inscrire",
    loading_button_label: 'Inscription en cours...',
    link_text: "Pas encore de compte ? Inscrivez-vous",
    first_name_label: 'Prénom',
    first_name_input_placeholder: 'Votre prénom',
    last_name_label: 'Nom',
    last_name_input_placeholder: 'Votre nom',
    confirmation_text: 'Vérifiez votre e-mail pour le lien de confirmation',
  },
  magic_link: {
    email_input_label: 'Adresse e-mail',
    email_input_placeholder: 'Votre adresse e-mail',
    button_label: 'Envoyer un lien magique',
    loading_button_label: 'Envoi en cours...',
    link_text: 'Connexion par lien magique',
  },
  forgotten_password: {
    email_label: 'Adresse e-mail',
    password_label: 'Nouveau mot de passe',
    email_input_placeholder: 'Votre adresse e-mail',
    button_label: 'Réinitialiser le mot de passe',
    loading_button_label: 'Réinitialisation...',
    link_text: 'Mot de passe oublié ?',
  },
  update_password: {
    password_label: 'Nouveau mot de passe',
    password_input_placeholder: 'Votre nouveau mot de passe',
    button_label: 'Mettre à jour le mot de passe',
    loading_button_label: 'Mise à jour...',
  },
  verify_otp: {
    email_input_label: 'Adresse e-mail',
    email_input_placeholder: 'Votre adresse e-mail',
    phone_input_label: 'Numéro de téléphone',
    phone_input_placeholder: 'Votre numéro de téléphone',
    token_input_label: 'Code OTP',
    token_input_placeholder: 'Votre code OTP',
    button_label: 'Vérifier le code OTP',
    loading_button_label: 'Vérification...',
  },
  // Added common translations for messages like errors
  common: {
    email_not_confirmed: 'Email pas encore confirmé',
    // Add other common messages here if needed
    // e.g., 'invalid_credentials': 'Identifiants invalides',
  },
};


function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If a session exists (user is logged in), redirect to the home page
      if (session) {
        navigate('/');
      }
    });

    // Cleanup the subscription on component unmount
    return () => subscription.unsubscribe();
  }, [navigate]); // Depend on navigate to avoid lint warnings

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Connexion / Inscription</h1>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers for simplicity
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--sbf-red))', // Use your custom red color
                    brandAccent: 'hsl(var(--sbf-yellow))', // Use your custom yellow color
                  },
                },
              },
            }}
            theme="light" // Use light theme
            redirectTo={window.location.origin + '/'} // Redirect to home after login
            localization={{
              variables: frenchTranslations,
            }}
            data-attributes={{
              first_name: 'first_name',
              last_name: 'last_name',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;