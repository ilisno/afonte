import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { sanityClient } from '@/integrations/sanity/client'; // Import Sanity client
import { usePopup } from '@/contexts/PopupContext'; // Import usePopup hook

// Define the type for blog posts based on the Sanity query
type BlogPost = {
  _id: string;
  title: string;
  slug: { current: string }; // Sanity slugs have a 'current' property
  publishedAt: string;
  category?: { title: string; slug: { current: string } }; // Category is a reference
  mainImage?: {
    asset: { url: string }; // Image asset has a url
    alt?: string; // Alt text for the image
  };
  // Add other fields if needed for the list view (e.g., excerpt)
  excerpt?: string;
};

const Blog: React.FC = () => {
  // State to hold blog posts
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showRandomPopup } = usePopup(); // Use the showRandomPopup hook
  const navigate = useNavigate(); // Hook for navigation

  // --- Sanity Data Fetching ---
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // GROQ query to fetch all documents of type 'post'
        // Select specific fields and structure them correctly
        const query = `*[_type == "post"]{
          _id,
          title,
          slug,
          publishedAt,
          "category": category->{title, slug}, // Fetch category title and slug
          mainImage{
            asset->{url}, // Fetch image URL
            alt
          },
          excerpt // Assuming you have an excerpt field
        } | order(publishedAt desc)`; // Order by published date, newest first

        console.log("Fetching posts with query:", query); // Log the query

        const data = await sanityClient.fetch<BlogPost[]>(query);

        console.log("Fetched data:", data); // Log the fetched data

        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError("Impossible de charger les articles du blog. Veuillez vérifier la console pour plus de détails.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means this runs once on mount

  // --- Timer for Blog Popup ---
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("2 minutes passed on blog page, showing random popup...");

      // No specific action needed after the blog timer popup closes,
      // so no onCloseCallback is required here. The user just stays on the blog page.
      showRandomPopup();

    }, 2 * 60 * 1000); // 2 minutes in milliseconds

    // Cleanup the timer when the component unmounts or the effect re-runs
    return () => clearTimeout(timer);
  }, [showRandomPopup]); // Re-run effect if showRandomPopup changes (though it's stable from context)


  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 text-center">
        {/* Blog Header Section */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          Notre Blog Musculation
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Conseils, astuces et informations pour vous aider à atteindre vos objectifs de fitness et de musculation.
        </p>

        {/* Blog Posts Grid */}
        {loading && <p>Chargement des articles...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && posts.length === 0 && <p>Aucun article trouvé pour le moment.</p>}

        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              // Wrap the content inside the Card with a Link
              <Card key={post._id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"> {/* Added cursor-pointer */}
                {/* Link wraps the image and header */}
                {post.slug?.current && post.category?.slug?.current ? (
                  <Link to={`/${post.category.slug.current}/${post.slug.current}`} className="flex flex-col h-full"> {/* Added flex-col h-full to make link cover card content */}
                    {post.mainImage?.asset?.url && ( // Check if url exists
                        <img
                          src={post.mainImage.asset.url} // Use the correct path for the URL
                          alt={post.mainImage.alt || post.title} // Use alt text or title
                          className="w-full h-48 object-cover" // Fixed height for images
                        />
                      )}
                    <CardHeader className="flex-grow p-4"> {/* Added flex-grow */}
                      <CardTitle className="text-lg font-semibold text-gray-800 text-left mb-2">{post.title}</CardTitle>
                      <p className="text-sm text-gray-500 text-left">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date inconnue'}
                        {post.category?.title && ` • ${post.category.title}`} {/* Use category title */}
                      </p>
                    </CardHeader>
                  </Link>
                ) : (
                   // Fallback if slug or category slug is missing (shouldn't happen with valid data)
                   <>
                     {post.mainImage?.asset?.url && (
                         <img
                           src={post.mainImage.asset.url}
                           alt={post.mainImage.alt || post.title}
                           className="w-full h-48 object-cover"
                         />
                       )}
                     <CardHeader className="flex-grow p-4">
                       <CardTitle className="text-lg font-semibold text-gray-800 text-left mb-2">{post.title}</CardTitle>
                       <p className="text-sm text-gray-500 text-left">
                         {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date inconnue'}
                         {post.category?.title && ` • ${post.category.title}`}
                       </p>
                     </CardHeader>
                   </>
                )}
                 <CardContent className="p-4 pt-0"> {/* Adjusted padding */}
                   {post.excerpt && <p className="text-gray-700 text-left mb-4">{post.excerpt}</p>} {/* Display excerpt if available */}
                   {/* Keep the "Lire la suite" link as well */}
                   {post.slug?.current && post.category?.slug?.current && (
                     <Link to={`/${post.category.slug.current}/${post.slug.current}`} className="text-sbf-red hover:underline font-semibold flex items-center justify-start"> {/* Adjusted link color and alignment */}
                       Lire la suite →
                     </Link>
                   )}
                 </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Blog;