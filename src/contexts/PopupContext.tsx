import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import Popup from '@/components/Popup'; // Make sure this import is correct

interface PopupContent {
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryButtonText: string;
  primaryButtonAction: () => void | string; // Primary action can be a function or a link path
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void | string; // Secondary action can be a function or a link path
  id: string; // Unique ID for this specific popup instance/type
  onCloseCallback?: () => void; // Callback to run when the popup is closed
  showPreviewTable?: boolean; // New property to indicate showing the preview table
}

interface PopupContextType {
  showPopup: (content: Omit<PopupContent, 'onCloseCallback'> & { onCloseCallback?: () => void }) => void; // Allow passing callback with specific content
  showRandomPopup: (options?: { onCloseCallback?: () => void }) => void; // Function for random popups, accepts callback
  hidePopup: () => void;
  popupState: {
    isOpen: boolean;
    content: PopupContent | null;
  };
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

// Define all possible popup contents
const popupContents: Omit<PopupContent, 'onCloseCallback'>[] = [ // Omit callback here as it's added dynamically
  {
    id: 'random_popup_1',
    title: "Nutrimuscle - Que du propre, du traçable et du performant.",
    description: "La whey Nutrimuscle, c’est du sérieux pour des vrais résultats. Formulations haut de gamme, sans compromis.",
    imageSrc: "/popup-placeholder-1.jpg",
    imageAlt: "Nutrimuscle Whey Protein",
    primaryButtonText: "Découvrir l'offre",
    primaryButtonAction: () => window.open('https://nmsquad.link/03olk', '_blank'),
    secondaryButtonText: "Continuer",
    secondaryButtonAction: () => {}, // Action to just close the popup
  },
  {
    id: 'random_popup_2',
    title: "NordVPN - Aujourd’hui, protéger sa connexion, c’est comme fermer sa porte à clé.",
    description: "NordVPN, c’est le chien de garde numérique de +15 millions d’utilisateurs. Jusqu’à -73 % de réduction + 4 mois offerts maintenant.",
    imageSrc: "/popup-placeholder-2.jpg",
    imageAlt: "NordVPN",
    primaryButtonText: "Profiter de l'offre",
    primaryButtonAction: () => window.open('https://go.nordvpn.net/aff_c?offer_id=15&aff_id=122852&url_id=1172', '_blank'),
    secondaryButtonText: "Continuer",
    secondaryButtonAction: () => {}, // Action to just close the popup
  },
  {
    id: 'random_popup_3',
    title: "Eric Flag, matériel pour faire de la muscu chez soi",
    description: "Bandes élastiques, barres de traction, anneaux… Tout ce qu’il faut pour t’entraîner chez toi ou dehors. Du matériel minimaliste, solide, et stylé.",
    imageSrc: "/popup-placeholder-3.jpg",
    imageAlt: "Eric Flag",
    primaryButtonText: "Visiter le site",
    primaryButtonAction: () => window.open('https://ericflag.com/?ref=ebdudilx', '_blank'),
    secondaryButtonText: "Continuer",
    secondaryButtonAction: () => {}, // Action to just close the popup
  },
  {
    id: 'random_popup_4',
    title: "BoursoBank — Change de banque, gagne du cash",
    description: "Tu peux toucher jusqu’à 200€ de prime rien qu’en ouvrant ton compte. C’est la banque la moins chère de France, et c’est pas nous qui le disons. Application fluide, carte gratuite, zéro paperasse inutile.",
    imageSrc: "/popup-placeholder-4.jpg",
    imageAlt: "BoursoBank",
    primaryButtonText: "Découvrir l'offre",
    primaryButtonAction: () => window.open('https://bour.so/p/pC1PYLtQLf6', '_blank'),
    secondaryButtonText: "Continuer",
    secondaryButtonAction: () => {}, // Action to just close the popup
  },
  // Updated entry for the blog post CTA popup
  {
    id: 'blog_cta_program',
    title: "Mon programme musculation personnalisé gratuitement !", // Updated title
    // Removed imageSrc and imageAlt
    description: "Besoin d'un programme sur mesure pour atteindre vos objectifs ? Utilisez notre générateur de programmes pour créer un plan d'entraînement adapté à vos besoins.", // Keep description for now, but it will be replaced by the table
    primaryButtonText: "Générer mon programme",
    primaryButtonAction: "/programme", // This is a link path to the program generator page
    secondaryButtonText: "Fermer",
    secondaryButtonAction: () => {}, // Action to just close the popup
    showPreviewTable: true, // Add flag to show the preview table
  },
];


export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [popupState, setPopupState] = useState<{ isOpen: boolean; content: PopupContent | null }>({
    isOpen: false,
    content: null,
  });

  // Function to show a specific popup by its ID or by providing full content
  const showPopup = useCallback((contentOrId: string | (Omit<PopupContent, 'onCloseCallback'> & { onCloseCallback?: () => void })) => {
     let contentToShow: PopupContent | undefined;

     if (typeof contentOrId === 'string') {
         // Find content by ID
         const foundContent = popupContents.find(p => p.id === contentOrId);
         if (!foundContent) {
             console.error(`Popup content with ID "${contentOrId}" not found.`);
             return; // Don't show popup if content is missing
         }
         contentToShow = { ...foundContent, onCloseCallback: undefined }; // Start with found content, no callback initially
     } else {
         // Use provided content object
         contentToShow = contentOrId as PopupContent; // Cast to PopupContent
     }

     console.log("Showing popup:", contentToShow.id || 'ad-hoc');
     setPopupState({ isOpen: true, content: contentToShow });

  }, []); // Empty dependency array as it doesn't depend on external state

  // Function to show a random popup from the predefined list (excluding specific ones like preview)
  const showRandomPopup = useCallback((options?: { onCloseCallback?: () => void }) => {
      // Filter out specific popups that should only be shown on demand (like blog_cta_program)
      const randomizablePopups = popupContents.filter(p => p.id.startsWith('random_popup_'));

      if (randomizablePopups.length === 0) {
          console.warn("No randomizable popups defined.");
          options?.onCloseCallback?.(); // Still run callback even if no popup is shown
          return;
      }

      // Select a random popup content
      const randomIndex = Math.floor(Math.random() * randomizablePopups.length);
      const randomContent = randomizablePopups[randomIndex];

      console.log("Showing random popup:", randomContent.id);
      // Add the onCloseCallback to the selected content before setting state
      setPopupState({ isOpen: true, content: { ...randomContent, onCloseCallback: options?.onCloseCallback } });
  }, []); // Empty dependency array as it doesn't depend on external state


  const hidePopup = useCallback(() => {
     // Get the content of the popup being closed
     const closedPopupContent = popupState.content;

    // Reset state *before* calling the callback to ensure context is updated
    setPopupState({ isOpen: false, content: null });

    // Execute the onCloseCallback if it exists
    closedPopupContent?.onCloseCallback?.();
  }, [popupState.content]); // Depend on popupState.content to access the callback


  // The value provided by the context
  const contextValue = useMemo(() => ({
      showPopup,
      showRandomPopup,
      hidePopup,
      popupState,
  }), [showPopup, showRandomPopup, hidePopup, popupState]); // Include all dependencies

  return (
    <PopupContext.Provider value={contextValue}>
      {children}
      {/* Render the Popup component here, controlled by the context state */}
      {popupState.isOpen && popupState.content && (
        <Popup
          isOpen={popupState.isOpen}
          onClose={hidePopup} // Popup calls hidePopup when closed
          title={popupState.content.title}
          description={popupState.content.description}
          imageSrc={popupState.content.imageSrc}
          imageAlt={popupState.content.imageAlt}
          primaryButtonText={popupState.content.primaryButtonText}
          primaryButtonAction={popupState.content.primaryButtonAction} // Pass the action directly (can be string or function)
          secondaryButtonText={popupState.content.secondaryButtonText}
          secondaryButtonAction={popupState.content.secondaryButtonAction} // Pass the action directly (can be string or function)
          showPreviewTable={popupState.content.showPreviewTable} // Pass the new property
        />
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};