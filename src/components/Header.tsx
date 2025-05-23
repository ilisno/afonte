import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { usePopup } from '@/contexts/PopupContext';
import { cn } from '@/lib/utils';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'; // Import hooks

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showRandomPopup } = usePopup();
  const navigate = useNavigate();
  const session = useSession(); // Get the user session
  const supabase = useSupabaseClient(); // Get the Supabase client

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Function to handle the click on the "coach virtuel" link
  const handleCoachVirtuelClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault(); // Prevent default navigation
    closeMenu(); // Close mobile menu if open

    // Define a callback function that navigates after the popup is closed
    const handlePopupCloseAndNavigate = () => {
        console.log("Popup closed, navigating to Coach Virtuel...");
        navigate('/coach-virtuel');
    };

    // Show a random popup. When it's closed, the callback will run.
    showRandomPopup({ onCloseCallback: handlePopupCloseAndNavigate });
  };

  // Handle logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
      // Optionally show an error toast
    } else {
      console.log("User logged out");
      // Redirect to home or login page after logout
      navigate('/');
    }
    closeMenu(); // Close menu after action
  };


  return (
    <header className="bg-white text-gray-800 p-4 shadow-md border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo with Image */}
        <Link to="/" className="flex items-center z-20" onClick={closeMenu}>
          <img src="/logo.png" alt="SBF coaching logo" className="h-10 w-auto" />
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden z-20"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="hover:underline">Accueil</Link>
          <Link to="/programme" className="hover:underline">Générateur de programme</Link>
          <Link to="/coach-virtuel" className="hover:underline" onClick={handleCoachVirtuelClick}>Coach virtuel</Link>
          <Link to="/blog" className="hover:underline">Blog</Link>
          {session ? ( // Show Mon espace and Logout if session exists
            <>
              <Link to="/mon-espace" className="hover:underline">Mon espace</Link>
              <button onClick={handleLogout} className="hover:underline text-gray-800">Se déconnecter</button>
            </>
          ) : ( // Show Se connecter if no session
            <Link to="/login" className="hover:underline">Se connecter</Link>
          )}
        </nav>
      </div>

      {/* Mobile Menu Panel */}
      <div className={cn(
        "fixed inset-0 bg-white z-10 flex flex-col items-center pt-16 space-y-6 md:hidden",
        "transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 translate-x-0 visible pointer-events-auto" : "opacity-0 translate-x-full invisible pointer-events-none"
      )}>
        <Link to="/" className="text-xl font-semibold" onClick={closeMenu}>Accueil</Link>
        <Link to="/programme" className="text-xl font-semibold" onClick={closeMenu}>Générateur de programme</Link>
        <Link to="/coach-virtuel" className="text-xl font-semibold" onClick={handleCoachVirtuelClick}>Coach virtuel</Link>
        <Link to="/blog" className="text-xl font-semibold" onClick={closeMenu}>Blog</Link>
         {session ? ( // Show Mon espace and Logout if session exists
            <>
              <Link to="/mon-espace" className="text-xl font-semibold" onClick={closeMenu}>Mon espace</Link>
              <button onClick={handleLogout} className="text-xl font-semibold text-gray-800">Se déconnecter</button>
            </>
          ) : ( // Show Se connecter if no session
            <Link to="/login" className="text-xl font-semibold" onClick={closeMenu}>Se connecter</Link>
          )}
      </div>
    </header>
  );
};

export default Header;