import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import Image from "@/components/ui/Image";
import { getAdvicePostBySlug, getAdvicePosts } from "@/lib/sanity/data";
import { hasMeaningfulPortableContent } from "@/lib/utils";
import PortableText from "@/lib/sanity/portableText";
import Button from "@/components/ui/Button";

const categoryLabels: Record<string, string> = {
  technique: "Technique",
  inspiration: "Inspiration",
  tutorial: "Tutoriel",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function JournalPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Awaited<ReturnType<typeof getAdvicePostBySlug>>>(null);
  const [relatedPosts, setRelatedPosts] = useState<Awaited<ReturnType<typeof getAdvicePosts>>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getAdvicePostBySlug(slug).then((p) => {
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(p);
      getAdvicePosts().then((all) => {
        setRelatedPosts(
          all.filter((x) => x._id !== p._id && x.category === p.category).slice(0, 2)
        );
      });
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-gray-medium">Chargement...</p>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold mb-4">Article non trouvé</h1>
          <Link to="/#journal">
            <Button variant="primary">Retour au journal</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <Link to="/#journal">
          <Button variant="ghost" className="mb-8 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au journal
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-foreground rounded-full">
              {categoryLabels[post.category] || post.category}
            </span>
            <div className="flex items-center text-sm text-gray-medium">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(post.date)}
            </div>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4">{post.title}</h1>
          {hasMeaningfulPortableContent(post.content) && post.excerpt ? (
            <p className="text-xl text-gray-medium">{post.excerpt}</p>
          ) : null}
        </div>

        {post.imageUrl ? (
          <div className="relative aspect-video mb-12">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        ) : null}

        <article className="mb-12">
          {hasMeaningfulPortableContent(post.content) ? (
            <PortableText content={post.content} />
          ) : post.excerpt ? (
            <p className="text-lg text-gray-medium leading-relaxed whitespace-pre-wrap">
              {post.excerpt}
            </p>
          ) : null}
        </article>

        {post.videoUrl && (
          <div className="mb-12">
            <div className="relative aspect-video bg-gray-100 rounded-sm overflow-hidden">
              <iframe
                src={post.videoUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={post.title}
              />
            </div>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="font-serif text-2xl font-semibold mb-6">Articles similaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost._id}
                  to={`/journal/${relatedPost.slug}`}
                  className="group block"
                >
                  {relatedPost.imageUrl ? (
                    <div className="relative aspect-video mb-4">
                      <Image
                        src={relatedPost.imageUrl}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : null}
                  <h4 className="font-serif text-xl font-semibold group-hover:opacity-80 transition-opacity">
                    {relatedPost.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
