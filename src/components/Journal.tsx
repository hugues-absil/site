import { motion } from "framer-motion";
import Image from "@/components/ui/Image";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import type { AdvicePost } from "@/lib/sanity/data";
import Card from "@/components/ui/Card";
import ExpandableText from "@/components/ui/ExpandableText";

interface JournalProps {
  posts: AdvicePost[];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const categoryLabels: Record<string, string> = {
  technique: "Technique",
  inspiration: "Inspiration",
  tutorial: "Tutoriel",
};

export default function Journal({ posts }: JournalProps) {
  return (
    <section id="journal" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Journal</h2>
          <p className="text-gray-medium max-w-2xl mx-auto">
            Réflexions, coulisses de l'atelier et pensées sur l'art
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                {post.imageUrl ? (
                  <div className="relative aspect-video">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : null}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-foreground rounded-full">
                      {categoryLabels[post.category] || post.category}
                    </span>
                    <div className="flex items-center text-xs text-gray-medium">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(post.date)}
                    </div>
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3">{post.title}</h3>
                  <div className="mb-4 flex-1">
                    <ExpandableText
                      text={post.excerpt ?? ""}
                      maxLength={150}
                      className="min-h-0"
                    />
                  </div>
                  <Link
                    to={`/journal/${post.slug}`}
                    className="inline-flex items-center text-sm text-foreground hover:opacity-80 transition-opacity group"
                  >
                    Lire la suite
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
