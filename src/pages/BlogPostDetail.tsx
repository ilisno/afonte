import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sanityClient } from '@/integrations/sanity/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PortableText } from '@portabletext/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionShadcn } from "@/components/ui/card";
import { usePopup } from '@/contexts/PopupContext'; // Import usePopup
import { useNavigate } from 'react-router-dom';

const BlogPostDetail: React.FC = () => {
  const { categorySlug, postSlug } = useParams<{ categorySlug: string; postSlug: string }>();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showPopup } = usePopup(); // Use showPopup from context
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

  // --- Effect to show the program generator CTA popup after a delay ---
  useEffect(() => {
      // Only set the timer if the post is loaded and there's no error
      if (!isLoading && !error && post) {
          console.log("[BlogPostDetail] Setting timer for program generator CTA popup...");
          const timer = setTimeout(() => {
              console.log("[BlogPostDetail] Timer finished, showing program generator CTA popup.");
              // Use the showPopup function with the specific popup ID
              showPopup('blog_cta_program');
          }, 10000); // 10 seconds delay

          // Cleanup the timer when the component unmounts or dependencies change
          return () => {
              console.log("[BlogPostDetail] Clearing timer.");
              clearTimeout(timer);
          };
      }
      // The effect depends on isLoading, error, post, and showPopup
  }, [isLoading, error, post, showPopup]);


  // Removed: renderCallToActionBanner function is no longer needed
  // const renderCallToActionBanner = () => { ... };


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
               {/* Check if post.body exists before rendering PortableText */}
               {post.body ? (
                   <PortableText value={post.body} />
               ) : (
                   <p>Contenu de l'article non disponible.</p> // Fallback message
               )}
            </div>

            {/* Removed: Call to renderCallToActionBanner() */}

          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostDetail;