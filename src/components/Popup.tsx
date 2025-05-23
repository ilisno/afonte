import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom'; // Assuming buttons might link to other pages

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  primaryButtonText: string;
  primaryButtonAction: () => void | string; // Can be a function or a link path
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void | string; // Can be a function or a link path
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  description,
  imageSrc,
  imageAlt,
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText,
  secondaryButtonAction,
}) => {

  const handlePrimaryAction = () => {
    if (typeof primaryButtonAction === 'string') {
      // If it's a string, it's a link path, handled by the Link component
      // We still close the popup
      onClose();
    } else {
      // If it's a function, execute it and close the popup
      primaryButtonAction();
      onClose();
    }
  };

   const handleSecondaryAction = () => {
    if (typeof secondaryButtonAction === 'string') {
      // If it's a string, it's a link path, handled by the Link component
      // We still close the popup
      onClose();
    } else if (secondaryButtonAction) {
      // If it's a function, execute it and close the popup
      secondaryButtonAction();
      onClose();
    } else {
       // If no action is provided, just close the popup
       onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 text-center"> {/* Added text-center */}
        <DialogHeader>
          {imageSrc && (
            <img src={imageSrc} alt={imageAlt || title} className="mx-auto mb-4 max-h-48 object-contain" /> // Added styling
          )}
          <DialogTitle className="text-2xl font-bold text-gray-800">{title}</DialogTitle> {/* Added styling */}
          {description && <DialogDescription className="text-gray-600 mt-2">{description}</DialogDescription>} {/* Added styling */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Content goes here if needed, but for this style, header/footer is enough */}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-4"> {/* Adjusted layout */}
          {typeof primaryButtonAction === 'string' ? (
             <Button asChild className="bg-sbf-red text-white hover:bg-red-700 text-base px-6 py-3 rounded-md font-semibold"> {/* Added styling */}
               <Link to={primaryButtonAction} onClick={handlePrimaryAction}>{primaryButtonText}</Link>
             </Button>
          ) : (
            <Button onClick={handlePrimaryAction} className="bg-sbf-red text-white hover:bg-red-700 text-base px-6 py-3 rounded-md font-semibold"> {/* Added styling */}
              {primaryButtonText}
            </Button>
          )}

          {secondaryButtonText && (
            typeof secondaryButtonAction === 'string' ? (
              <Button asChild variant="outline" className="text-gray-800 border-gray-300 hover:bg-gray-200 text-base px-6 py-3 rounded-md font-semibold"> {/* Added styling */}
                <Link to={secondaryButtonAction} onClick={handleSecondaryAction}>{secondaryButtonText}</Link>
              </Button>
            ) : (
              <Button onClick={handleSecondaryAction} variant="outline" className="text-gray-800 border-gray-300 hover:bg-gray-200 text-base px-6 py-3 rounded-md font-semibold"> {/* Added styling */}
                {secondaryButtonText}
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Popup;