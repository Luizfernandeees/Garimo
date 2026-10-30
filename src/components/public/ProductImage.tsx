import Image from "next/image";
import { BagIcon } from "@/components/brand/BagIcon";

// Imagem do produto com fundo creme. Sem imagem, mostra a sacola.
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square overflow-hidden bg-cream ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <BagIcon rays={false} className="size-1/3 text-brand/35" />
        </div>
      )}
    </div>
  );
}
