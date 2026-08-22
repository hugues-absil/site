import { PortableText as SanityPortableText } from "@portabletext/react";
import type { PortableTextComponentProps, PortableTextMarkComponentProps } from "@portabletext/react";
import type { PortableTextBlock, TypedObject } from "@portabletext/types";
import { urlFor } from "./client";

interface PortableTextProps {
  content: TypedObject | TypedObject[] | unknown;
  className?: string;
}

const LAYOUT_CLASSES: Record<string, string> = {
  fullWidth: "w-full",
  centered: "mx-auto max-w-[720px]",
  betweenText: "mx-auto my-6 max-w-[720px]",
  floatLeft: "float-left mr-4 mb-4 w-full max-w-[50%]",
  floatRight: "float-right ml-4 mb-4 w-full max-w-[50%]",
};

const SIZE_CLASSES: Record<string, string> = {
  small: "max-w-xs",
  medium: "max-w-md",
  large: "max-w-2xl",
};

/** Normalise une URL vidéo en URL d'embed (YouTube, Vimeo) et force HTTPS. */
function normalizeVideoEmbedUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url = raw;
  if (url.startsWith("http://")) url = "https://" + url.slice(7);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (parsed.searchParams.has("v")) {
        videoId = parsed.searchParams.get("v");
      }
      if (!videoId && host === "youtu.be") {
        videoId = parsed.pathname.slice(1).split("/")[0];
      }
      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.replace(/^\/embed\//, "").split("/")[0];
      }
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}`;
      }
      return null;
    }

    if (host === "vimeo.com") {
      const match = parsed.pathname.match(/^\/(?:video\/)?(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function VideoEmbedBlock({
  value,
}: {
  value: { url?: string; title?: string; layout?: string };
}) {
  const rawUrl = value?.url;
  if (!rawUrl) return null;
  const url = normalizeVideoEmbedUrl(rawUrl);
  if (!url) return null;
  const layout = value.layout || "betweenText";
  const layoutClass = LAYOUT_CLASSES[layout] ?? LAYOUT_CLASSES.betweenText;
  return (
    <div className={`relative aspect-video overflow-hidden rounded-sm bg-gray-100 ${layoutClass}`}>
      <iframe
        src={url}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={value.title || "Vidéo"}
      />
      {value.title && (
        <p className="mt-2 text-sm text-gray-medium">{value.title}</p>
      )}
    </div>
  );
}

function ImageBlock({
  value,
}: {
  value: { asset?: { _ref?: string; url?: string }; alt?: string };
}) {
  if (!value?.asset) return null;
  let src: string | null = null;
  if ("url" in value.asset && typeof value.asset.url === "string") {
    src = value.asset.url;
  }
  if (!src) {
    try {
      src = urlFor(value).url();
    } catch {
      return null;
    }
  }
  return (
    <figure className="my-6">
      <img
        src={src}
        alt={value.alt || ""}
        className="h-auto max-w-full rounded-sm object-contain"
      />
      {value.alt && (
        <figcaption className="mt-2 text-sm text-gray-medium">{value.alt}</figcaption>
      )}
    </figure>
  );
}

function ImageWithLayoutBlock({
  value,
}: {
  value: {
    image?: { asset?: { _ref?: string; url?: string }; alt?: string };
    caption?: string;
    layout?: string;
    size?: string;
  };
}) {
  if (!value?.image?.asset) return null;
  let src: string | null = null;
  const asset = value.image.asset;
  if ("url" in asset && typeof asset.url === "string") {
    src = asset.url;
  }
  if (!src) {
    try {
      src = urlFor(value.image).url();
    } catch {
      return null;
    }
  }
  const layout = value.layout || "betweenText";
  const layoutClass = LAYOUT_CLASSES[layout] ?? LAYOUT_CLASSES.betweenText;
  const sizeClass = value.size ? SIZE_CLASSES[value.size] ?? "" : "";
  return (
    <figure className={`my-6 ${layoutClass} ${sizeClass}`.trim()}>
      <img
        src={src}
        alt={value.caption || ""}
        className="h-auto max-w-full rounded-sm object-contain"
      />
      {value.caption && (
        <figcaption className="mt-2 text-sm text-gray-medium">{value.caption}</figcaption>
      )}
    </figure>
  );
}

const portableTextComponents = {
  types: {
    videoEmbed: VideoEmbedBlock,
    image: ImageBlock,
    imageWithLayout: ImageWithLayoutBlock,
  },
  marks: {
    link: ({
      children,
      value,
    }: PortableTextMarkComponentProps<{ _type: "link"; href?: string }>) => {
      const href = value?.href?.trim();
      if (!href) return <span>{children}</span>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          href={href}
          className="text-foreground underline underline-offset-2 hover:opacity-80"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
  // Composant unique pour tous les styles de bloc : garantit l'affichage quel que soit le style (normal, h1, undefined, etc.)
  block: (props: PortableTextComponentProps<PortableTextBlock>) => {
    const { children, value } = props;
    const style = value?.style;
    if (style === "h1") return <h2 className="font-serif text-2xl font-bold mt-8 mb-4">{children}</h2>;
    if (style === "h2") return <h3 className="font-serif text-xl font-semibold mt-6 mb-3">{children}</h3>;
    if (style === "h3") return <h4 className="font-serif text-lg font-semibold mt-4 mb-2">{children}</h4>;
    if (style === "blockquote")
      return (
        <blockquote className="border-l-4 border-gray-300 pl-4 my-4 text-gray-medium italic">
          {children}
        </blockquote>
      );
    return <p className="mb-4 text-foreground">{children}</p>;
  },
};

export default function PortableText({ content, className = "" }: PortableTextProps) {
  const value = Array.isArray(content) || (content && typeof content === "object")
    ? (content as TypedObject | TypedObject[])
    : [];
  return (
    <div className={`prose prose-lg max-w-none text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground ${className}`}>
      <SanityPortableText value={value} components={portableTextComponents} />
    </div>
  );
}
