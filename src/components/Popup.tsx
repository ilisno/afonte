import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import MonEspacePreviewTable from './MonEspacePreviewTable'; // Import the preview table component

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
  showPreviewTable?: boolean; // New prop to conditionally show the table
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
  showPreviewTable, // Destructure the new prop
}) => {

  const handlePrimaryAction = () => {
    if (typeof primaryButtonAction === 'string') {
      onClose(); // Close popup before navigating
    } else {
      primaryButtonAction();
      onClose(); // Close popup after action
    }
  };

   const handleSecondaryAction = () => {
    if (typeof secondaryButtonAction === 'string') {
      onClose(); // Close popup before navigating
    } else if (secondaryButtonAction) {
      secondaryButtonAction();
      onClose(); // Close popup after action
    } else {
       onClose(); // Just close if no action
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-6 text-center">
        <DialogHeader>
          {/* Only show image if imageSrc is provided AND we are NOT showing the preview table */}
          {imageSrc && !showPreviewTable && (
            <img src={imageSrc} alt={imageAlt || title} className="mx-auto mb-4 max-h-48 object-contain" />
          )}
          <DialogTitle className="text-2xl font-bold text-gray-800">{title}</DialogTitle>
          {/* Conditionally render description or preview table */}
          {showPreviewTable ? (
             // Render the preview table component
             <div className="mt-4"> {/* Add some top margin */}
                <MonEspacePreviewTable />
             </div>
          ) : (
             // Render the description if no preview table is requested
             description && <DialogDescription className="text-gray-600 mt-2">{description}</DialogDescription>
          )}
        </DialogHeader>
        {/* Removed the empty grid div */}
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-3 mt-4">
          {typeof primaryButtonAction === 'string' ? (
             <Button asChild>
               <Link to={primaryButtonAction} onClick={handlePrimaryAction} className="bg-sbf-red text-white hover:bg-red-700 text-base px-6 py-3 rounded-md font-semibold">
                 {primaryButtonText}
               </Link>
             </Button>
          ) : (
            <Button onClick={handlePrimaryAction} className="bg-sbf-red text-white hover:bg-red-700 text-base px-6 py-3 rounded-md font-semibold">
              {primaryButtonText}
            </Button>
          )}

          {secondaryButtonText && (
            typeof secondaryButtonAction === 'string' ? (
              <Button asChild variant="outline">
                <Link to={secondaryButtonAction} onClick={handleSecondaryAction} className="text-gray-800 border-gray-300 hover:bg-gray-200 text-base px-6 py-3 rounded-md font-semibold">
                  {secondaryButtonText}
                </Link>
              </Button>
            ) : (
              <Button onClick={handleSecondaryAction} variant="outline" className="text-gray-800 border-gray-300 hover:bg-gray-200 text-base px-6 py-3 rounded-md font-semibold">
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