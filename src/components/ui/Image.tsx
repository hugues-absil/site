interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  objectFit?: "contain" | "cover";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function Image({ src, alt, className = "", fill, sizes, objectFit, onError }: ImageProps) {
  if (fill) {
    const baseClasses = "absolute inset-0 w-full h-full";
    const classNameWithFit = objectFit != null ? `${baseClasses} ${className}` : `${baseClasses} object-cover ${className}`;
    const style = objectFit != null ? { objectFit } : undefined;
    return (
      <img
        src={src}
        alt={alt}
        className={classNameWithFit}
        style={style}
        sizes={sizes}
        onError={onError}
      />
    );
  }
  return <img src={src} alt={alt} className={className} sizes={sizes} onError={onError} />;
}
