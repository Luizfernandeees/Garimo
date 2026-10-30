"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductImage } from "./ProductImage";

type GalleryImage = { id: string; url: string; alt: string | null };

export function ProductGallery({ name, images }: { name: string; images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? null;

  return (
    <div>
      <ProductImage
        src={current?.url ?? null}
        alt={current?.alt || name}
        sizes="(min-width: 768px) 50vw, 100vw"
        priority
        className="rounded-[var(--radius-panel)]"
      />
      {images.length > 1 ? (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label="Mais fotos">
          {images.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver foto ${i + 1} de ${images.length}`}
                aria-pressed={i === active}
                className={`relative block size-16 overflow-hidden rounded-xl bg-cream ring-offset-2 transition sm:size-20 ${
                  i === active ? "ring-2 ring-ink" : "opacity-75 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
