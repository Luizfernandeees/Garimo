import { BagIcon } from "./BagIcon";

type LogoProps = {
  className?: string;
  /** "dark" para fundos grafite. */
  tone?: "light" | "dark";
  size?: "sm" | "md";
};

// Logotipo: sacola + "garimo" em minúsculas, como na arte original.
// Em textos corridos a marca é sempre escrita GARIMO.
export function Logo({ className = "", tone = "light", size = "md" }: LogoProps) {
  const icon = size === "sm" ? "h-7 w-8" : "h-8 w-9 sm:h-9 sm:w-10";
  const word = size === "sm" ? "text-xl" : "text-2xl sm:text-[1.7rem]";
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <BagIcon className={`${icon} text-brand`} />
      <span
        aria-hidden="true"
        className={`font-display font-extrabold leading-none tracking-[-0.04em] ${word} ${
          tone === "dark" ? "text-white" : "text-ink"
        }`}
      >
        garimo
      </span>
      <span className="sr-only">GARIMO</span>
    </span>
  );
}
