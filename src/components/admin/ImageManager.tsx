"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, Star, Trash2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { isAllowedImageUrl, MAX_IMAGES, STORAGE_BUCKET } from "@/lib/images";

export type FormImage = { url: string };

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_SIDE = 1600;

// Reduz a foto no próprio navegador (máx. 1600 px, WebP) antes de enviar:
// economiza armazenamento e banda do plano gratuito.
async function compress(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("encode");
  return { blob: jpeg, ext: "jpg", type: "image/jpeg" };
}

export function ImageManager({
  images,
  onChange,
  error,
}: {
  images: FormImage[];
  onChange: (images: FormImage[]) => void;
  error?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage(null);
    const room = MAX_IMAGES - images.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > room) setMessage(`Limite de ${MAX_IMAGES} imagens por produto.`);

    const supabase = getBrowserClient();
    const added: FormImage[] = [];
    setUploading(list.length);
    for (const file of list) {
      try {
        if (!file.type.startsWith("image/")) throw new Error("Arquivo não é uma imagem.");
        if (file.size > MAX_INPUT_BYTES) throw new Error("Imagem maior que 15 MB.");
        const { blob, ext, type } = await compress(file);
        const now = new Date();
        const path = `produtos/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false });
        if (upErr) throw new Error(upErr.message);
        added.push({ url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl });
      } catch (e) {
        console.error(e);
        const reason = e instanceof Error && e.message.length < 80 ? e.message : "falha no envio";
        setMessage(`Não foi possível enviar “${file.name}”: ${reason}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) onChange([...images, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    const url = link.trim();
    setMessage(null);
    if (!isAllowedImageUrl(url)) {
      setMessage("Use um link de imagem da CDN da Shopee (down-br.img.susercontent.com) ou envie o arquivo.");
      return;
    }
    if (images.some((i) => i.url === url)) {
      setMessage("Esta imagem já está na galeria.");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setMessage(`Limite de ${MAX_IMAGES} imagens por produto.`);
      return;
    }
    onChange([...images, { url }]);
    setLink("");
  }

  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const iconBtn = "rounded-full bg-white/95 p-1.5 text-ink shadow-sm hover:bg-white disabled:opacity-30";

  return (
    <div>
      {images.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.url} className="group relative overflow-hidden rounded-xl border border-ink/10 bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={`Imagem ${i + 1}`} className="aspect-square w-full object-cover" />
              {i === 0 ? (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white">
                  Principal
                </span>
              ) : null}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <div className="flex gap-1">
                  <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Mover imagem ${i + 1} para a esquerda`}>
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button type="button" className={iconBtn} disabled={i === images.length - 1} onClick={() => move(i, i + 1)} aria-label={`Mover imagem ${i + 1} para a direita`}>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {i > 0 ? (
                    <button type="button" className={iconBtn} onClick={() => move(i, 0)} aria-label={`Usar imagem ${i + 1} como principal`} title="Usar como principal">
                      <Star className="size-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={`${iconBtn} text-red-700`}
                    onClick={() => onChange(images.filter((_, j) => j !== i))}
                    aria-label={`Remover imagem ${i + 1}`}
                    title="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={`flex flex-col gap-3 sm:flex-row ${images.length ? "mt-4" : ""}`}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading > 0 || images.length >= MAX_IMAGES}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            error ? "border-red-400 text-red-800" : "border-ink/20 hover:border-ink/40"
          } ${images.length ? "" : "sm:flex-1 sm:py-8"}`}
        >
          {uploading > 0 ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
          {uploading > 0 ? `Enviando ${uploading} ${uploading === 1 ? "imagem" : "imagens"}…` : "Enviar fotos do aparelho"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="mt-3 flex gap-2">
        <label htmlFor="image-link" className="sr-only">
          Link de imagem da Shopee
        </label>
        <input
          id="image-link"
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder="Ou cole o link de uma imagem da Shopee"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm focus:border-ink/50 focus:outline-none"
        />
        <button type="button" onClick={addLink} className="rounded-xl bg-ink/8 px-4 text-sm font-semibold hover:bg-ink/12">
          Adicionar
        </button>
      </div>

      <p className="mt-2 text-sm text-ink/55">
        A primeira imagem é a principal. As fotos são reduzidas para até 1600 px antes do envio.
      </p>
      {message ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p id="images-erro" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
