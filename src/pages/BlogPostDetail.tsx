import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sanityClient } from '@/integrations/sanity/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
// Removed: import { PortableText } from '@portabletext/react'; // No longer needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { usePopup } from '@/contexts/PopupContext';
import { useNavigate } from 'react-router-dom';

const BlogPostDetail: React.FC = () => {
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>();
  // Assuming post.body is now a string based on schema change
  const [post, setPost] = useState<any>(null); // Keep 'any' for now, but expect body to be string
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showRandomPopup } = usePopup();
  const navigate = useNavigate();

  console.log("[BlogPostDetail] Component mounted for slug:", postSlug); // Log the slug

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      setPost(null); // Clear previous post data

      try {
        // Ensure the query fetches the 'body' field
        const query = `*[_type == "post" && slug.current == $slug]{
          _id,
          title,
          slug,
          body, // Fetch the content from the 'body' field
          "categories": categories[]->title,
          "author": author->{name, image}
        }`;
        const params = { slug: postSlug };
        console.log("[BlogPostDetail] Fetching post with query:", query, "and params:", params); // Log query and params
        const result = await sanityClient.fetch(query, params);
        console.log("[BlogPostDetail] Sanity fetch result:", result); // Log the raw result

        if (result.length === 0) {
          setPost(null);
          setError("Article non trouvé.");
          console.log("[BlogPostDetail] Post not found.");
        } else {
          setPost(result[0]);
          console.log("[BlogPostDetail] Post data set:", result[0]);
        }
      } catch (err) {
        setError("Une erreur est survenue lors de la récupération de l'article.");
        console.error("[BlogPostDetail] Error fetching post:", err); // Log the error
        setPost(null);
      } finally {
        setIsLoading(false);
        console.log("[BlogPostDetail] Loading finished. isLoading:", false);
      }
    };

    if (postSlug) { // Only fetch if postSlug is available
        fetchPost();
    } else {
        setIsLoading(false);
        setError("Aucun slug d'article fourni.");
        console.log("[BlogPostDetail] No post slug provided.");
    }

  }, [postSlug]); // Re-run effect if postSlug changes

  // Function to handle the click on the "Générer mon programme" button
  const handleGenerateProgramClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("[BlogPostDetail] 'Générer mon programme' button clicked.");

    const handlePopupCloseAndNavigate = () => {
        console.log("[BlogPostDetail] Popup closed, navigating to ProgrammeGenerator...");
        navigate('/programme');
    };

    showRandomPopup({ onCloseCallback: handlePopupCloseAndNavigate });
  };

  // Function to render the call-to-action banner
  const renderCallToActionBanner = () => {
    return (
      <Card className="bg-sbf-red text-white p-6 my-8"> {/* Added margin-top and margin-bottom */}
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Générez votre programme personnalisé gratuitement !</CardTitle>
          <CardDescriptionShadcn className="text-lg">
            Besoin d'un programme sur mesure pour atteindre vos objectifs ? Utilisez notre générateur de programmes pour créer un plan d'entraînement adapté à vos besoins.
          </CardDescriptionShadcn>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={handleGenerateProgramClick}
            className="bg-white text-sbf-red hover:bg-gray-200 text-lg py-4 px-8 rounded-md font-semibold"
          >
            Générer mon programme
          </Button>
        </CardContent>
      </Card>
    );
  };

  // --- Conditional Rendering based on state ---
  if (isLoading) {
    console.log("[BlogPostDetail] Rendering: Loading state.");
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <p>Chargement de l'article...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    console.log("[BlogPostDetail] Rendering: Error state.", error);
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <p className="text-red-500">{error}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
     console.log("[BlogPostDetail] Rendering: No post found state.");
     return (
       <div className="flex flex-col min-h-screen bg-gray-100">
         <Header />
         <main className="flex-grow container mx-auto px-4 py-12 text-center">
           <p>Article non trouvé.</p>
         </main>
         <Footer />
       </div>
     );
  }

  // If post is loaded and available, render the post details
  console.log("[BlogPostDetail] Rendering: Post available.", post);
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">{post.title}</h1> {/* Increased bottom margin */}

        {/* Render the plain text content from 'body' by splitting lines */}
        {/* Apply prose classes to style the content */}
        <div className="prose prose-lg max-w-none mx-auto"> {/* Added mx-auto to center if max-width was applied */}
           {/* Check if post.body exists and is a string before splitting */}
           {typeof post.body === 'string' && post.body.length > 0 ? (
               post.body.split('\n').map((para, idx) => <p key={idx}>{para}</p>)
           ) : (
               <p>Contenu de l'article non disponible ou vide.</p> // Fallback message
           )}
        </div>

        {/* Render the Call-to-Action Banner after the content */}
        {renderCallToActionBanner()}

      </main>
      <Footer />
    </div>
  );
};

export default BlogPostDetail;