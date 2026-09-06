import { motion } from "framer-motion";
import Image from "@/components/ui/Image";
import type { Biography } from "@/lib/sanity/data";
import PortableText from "@/lib/sanity/portableText";
import { assetUrl } from "@/lib/assetUrl";
import { Award, GraduationCap, Briefcase, Building2, BookOpen } from "lucide-react";

interface BiographyProps {
  biography: Biography | null;
}

export default function Biography({ biography }: BiographyProps) {
  if (!biography) {
    return null;
  }

  return (
    <section id="biography" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-4">Biographie</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={assetUrl(biography.portraitUrl)}
                alt="Hugues Absil"
                fill
                className="object-cover grayscale"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="leading-relaxed">
              <PortableText
                content={biography.text}
                className="prose-p:text-foreground prose-p:text-base sm:prose-p:text-lg prose-p:leading-relaxed"
              />
            </div>

            {biography.gallery && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Représenté par</p>
                  <p className="text-sm text-gray-medium">{biography.gallery}</p>
                </div>
              </div>
            )}

            {biography.education && biography.education.length > 0 && (
              <div>
                <h3 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 flex-shrink-0" />
                  Formation
                </h3>
                <ul className="space-y-2 text-gray-medium text-sm leading-relaxed">
                  {biography.education.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {biography.professionalActivities && biography.professionalActivities.length > 0 && (
              <div>
                <h3 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 flex-shrink-0" />
                  Activités professionnelles
                </h3>
                <ul className="space-y-2 text-gray-medium text-sm leading-relaxed">
                  {biography.professionalActivities.map((activity, index) => (
                    <li key={index}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}

            {biography.awards && biography.awards.length > 0 && (
              <div>
                <h3 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 flex-shrink-0" />
                  Distinctions
                </h3>
                <ul className="space-y-2 text-gray-medium text-sm leading-relaxed">
                  {biography.awards.map((award, index) => (
                    <li key={index}>{award}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {biography.diplomas && biography.diplomas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 pt-12 border-t border-gray-200"
          >
            <h3 className="font-serif text-2xl font-semibold mb-6 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 flex-shrink-0" />
              Diplômes
            </h3>
            <div className="space-y-6">
              {biography.diplomas
                .sort((a, b) => b.year - a.year)
                .map((diploma, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-16 text-right">
                      <span className="text-2xl font-serif font-bold text-foreground">
                        {diploma.year}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{diploma.title}</h4>
                      <p className="text-sm text-gray-medium mb-1">{diploma.institution}</p>
                      {diploma.details && (
                        <p className="text-sm text-gray-medium italic">{diploma.details}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
