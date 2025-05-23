import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sanityClient } from '@/integrations/sanity/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PortableText } from '@portabletext/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { usePopup } from '@/contexts/PopupContext';
import { useNavigate } from 'react-router-dom';

const BlogPostDetail: React.FC = () => {
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showRandomPopup } = usePopup();
  const navigate = useNavigate();

  console.log("[BlogPostDetail] Component mounted for slug:", postSlug);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      setPost(null);

      try {
        const query = `*[_type == "post" && slug.current == $slug]{
          _id,
          title,
          slug,
          body,
          mainImage{
            asset->{url},
            alt
          },
          "categories": categories[]->title,
          "author": author->{name, image}
        }`;
        const params = { slug: postSlug };
        console.log("[BlogPostDetail] Fetching post with query:", query, "and params:", params);
        const result = await sanityClient.fetch(query, params);
        console.log("[BlogPostDetail] Sanity fetch result:", result);

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
        console.error("[BlogPostDetail] Error fetching post:", err);
        setPost(null);
      } finally {
        setIsLoading(false);
        console.log("[BlogPostDetail] Loading finished. isLoading:", false);
      }
    };

    if (postSlug) {
        fetchPost();
    } else {
        setIsLoading(false);
        setError("Aucun slug d'article fourni.");
        console.log("[BlogPostDetail] No post slug provided.");
    }

  }, [postSlug]);

  const handleGenerateProgramClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("[BlogPostDetail] 'Générer mon programme' button clicked.");

    const handlePopupCloseAndNavigate = () => {
        console.log("[BlogPostDetail] Popup closed, navigating to ProgrammeGenerator...");
        navigate('/programme');
    };

    showRandomPopup({ onCloseCallback: handlePopupCloseAndNavigate });
  };

  const renderCallToActionBanner = () => {
    return (
      <Card className="bg-sbf-red text-white p-6 my-8">
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

  console.log("[BlogPostDetail] Rendering: Post available.", post);
  return (
    <div className="flex flex-col min-h-screen bg-gray-100"> {/* This div provides the grey background */}
      <Header />
      {/* Main content area, centered */}
      <main className="flex-grow container mx-auto px-4 py-12 flex justify-center">
        {/* Card wrapping the main article content */}
        <Card className="w-full max-w-3xl shadow-lg"> {/* Added max-w-3xl and shadow */}
          <CardContent className="p-6"> {/* Added padding inside the card */}
            <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">{post.title}</h1>

            {/* Display Main Image - Centered and smaller */}
            {post.mainImage?.asset?.url && (
                <img
                  src={post.mainImage.asset.url}
                  alt={post.mainImage.alt || post.title}
                  className="mx-auto max-w-xl h-auto object-cover rounded-md mb-8" // Added mx-auto, max-w-xl
                />
              )}

            {/* Render the Portable Text content from 'body' */}
            {/* Apply prose classes and max-w-prose to style and narrow the text block */}
            <div className="prose prose-lg max-w-prose mx-auto"> {/* Kept max-w-prose and mx-auto */}
               {post.body ? (
                   <PortableText value={post.body} />
               ) : (
                   <p>Contenu de l'article non disponible.</p>
               )}
            </div>

            {/* Render the Call-to-Action Banner after the content */}
            {renderCallToActionBanner()}

          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostDetail;