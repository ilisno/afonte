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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const query = `*[_type == "post" && slug.current == $slug]{
          _id,
          title,
          slug,
          content,
          "categories": categories[]->title,
          "author": author->{name, image}
        }`;
        const params = { slug: postSlug };
        const result = await sanityClient.fetch(query, params);
        if (result.length === 0) {
          throw new Error("Post not found");
        }
        setPost(result[0]);
      } catch (err) {
        setError("Une erreur est survenue lors de la récupération de l'article.");
        console.error("Error fetching post:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postSlug]);

  // Function to handle the click on the "Générer mon programme" button
  const handleGenerateProgramClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent default navigation
    console.log("Générer mon programme clicked");

    // Define a callback function that navigates after the popup is closed
    const handlePopupCloseAndNavigate = () => {
        console.log("Popup closed, navigating to ProgrammeGenerator...");
        navigate('/programme');
    };

    // Show a random popup. When it's closed, the callback will run.
    showRandomPopup({ onCloseCallback: handlePopupCloseAndNavigate });
  };

  if (isLoading) {
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

  // Function to render the call-to-action banner
  const renderCallToActionBanner = () => {
    return (
      <Card className="bg-sbf-red text-white p-6 mb-8">
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

  // Function to split content into sections and insert the banner
  const renderContentWithBanner = () => {
    const contentArray = post.content.split('\n');
    const oneThirdIndex = Math.ceil(contentArray.length / 3);
    const firstPart = contentArray.slice(0, oneThirdIndex);
    const secondPart = contentArray.slice(oneThirdIndex);

    return (
      <>
        <div className="prose prose-lg max-w-none">
          {firstPart.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        {renderCallToActionBanner()}
        <div className="prose prose-lg max-w-none">
          {secondPart.map((paragraph, index) => (
            <p key={index + oneThirdIndex}>{paragraph}</p>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        {renderContentWithBanner()}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPostDetail;