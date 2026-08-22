import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 border border-gray-300 rounded-sm bg-white text-foreground placeholder-gray-medium focus:outline-none focus:border-foreground transition-colors resize-none",
          error && "border-red-500",
          className
        )}
        rows={5}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
