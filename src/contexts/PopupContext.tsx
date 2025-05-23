import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import Popup from '@/components/Popup'; // Make sure this import is correct

interface PopupContent {
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryButtonText: string;
  primaryButtonAction: () => void; // Primary action is always a function (open link)
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void; // Secondary action is always a function (close or navigate)
  id: string; // Unique ID for this specific popup instance/type
  onCloseCallback?: () => void; // New: Callback to run when the popup is closed
}

interface PopupContextType {
  showPopup: (content: PopupContent) => void; // Keep original showPopup for specific cases if needed
  showRandomPopup: (options?: { onCloseCallback?: () => void }) => void; // New function for random popups, accepts callback
  hidePopup: () => void;
  popupState: {
    isOpen: boolean;
    content: PopupContent | null;
  };
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

// Define the four possible random popup contents with their specific links and generic actions
const randomPopupContents: Omit<PopupContent, 'onCloseCallback'>[] = [ // Omit callback here as it's added dynamically
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
];


export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [popupState, setPopupState] = useState<{ isOpen: boolean; content: PopupContent | null }>({
    isOpen: false,
    content: null,
  });

  // Function to show a specific popup (can still be used if needed)
  const showSpecificPopup = useCallback((content: PopupContent) => {
     // Keep the specific popup tracking if needed, or remove this localStorage check
     const hasBeenShown = localStorage.getItem(`popup_${content.id}_shown`);
     if (hasBeenShown) {
       console.log(`Specific popup with ID ${content.id} has already been shown.`);
       // If a specific popup is triggered but already shown, maybe still run its onCloseCallback?
       // Let's assume not for now, the trigger just fails silently.
       return;
     }
     setPopupState({ isOpen: true, content });
  }, []); // Empty dependency array as it doesn't depend on external state

  // Function to show a random popup from the predefined list
  const showRandomPopup = useCallback((options?: { onCloseCallback?: () => void }) => {
      // Removed the localStorage check 'any_random_popup_shown'
      // The popup will now show every time this function is called.

      // Select a random popup content
      const randomIndex = Math.floor(Math.random() * randomPopupContents.length);
      const randomContent = randomPopupContents[randomIndex];

      console.log("Showing random popup:", randomContent.id);
      // Add the onCloseCallback to the selected content before setting state
      setPopupState({ isOpen: true, content: { ...randomContent, onCloseCallback: options?.onCloseCallback } });
  }, []); // Empty dependency array as it doesn't depend on external state


  const hidePopup = useCallback(() => {
     // Get the content of the popup being closed
     const closedPopupContent = popupState.content;

     // Mark the currently open popup as shown in localStorage
     // If it's a random popup, set the 'any_random_popup_shown' flag
     // Re-adding the localStorage flag here, but only when the popup is *closed* by the user.
     // This prevents it from showing *again* after the user has seen it and closed it.
     // If the goal is to show it *every time* the form is submitted, this localStorage logic should be removed entirely.
     // Let's remove the localStorage logic entirely for random popups to ensure it shows on every form submit.
     /*
     if (closedPopupContent?.id.startsWith('random_popup_')) {
        localStorage.setItem('any_random_popup_shown', 'true');
        console.log("Marking 'any_random_popup_shown' as true.");
     } else if (closedPopupContent?.id) {
        // Keep specific popup tracking if needed
        localStorage.setItem(`popup_${closedPopupContent.id}_shown`, 'true');
     }
     */

    // Reset state *before* calling the callback to ensure context is updated
    setPopupState({ isOpen: false, content: null });

    // Execute the onCloseCallback if it exists
    closedPopupContent?.onCloseCallback?.();
  }, [popupState.content]); // Depend on popupState.content to access the callback


  // The value provided by the context
  const contextValue = useMemo(() => ({
      showPopup: showSpecificPopup, // Expose showSpecificPopup as showPopup
      showRandomPopup,
      hidePopup,
      popupState,
  }), [showSpecificPopup, showRandomPopup, hidePopup, popupState]); // Include all dependencies

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
          primaryButtonAction={popupState.content.primaryButtonAction} // Pass the function directly
          secondaryButtonText={popupState.content.secondaryButtonText}
          secondaryButtonAction={popupState.content.secondaryButtonAction} // Pass the function directly
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