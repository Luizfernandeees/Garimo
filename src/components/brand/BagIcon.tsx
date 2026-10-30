type BagIconProps = {
  className?: string;
  /** Mostra os três raios de "achado" ao lado da sacola. */
  rays?: boolean;
  /** Anima os raios uma única vez (usado só no hero). */
  animateRays?: boolean;
  title?: string;
};

// Sacola sorridente da GARIMO, redesenhada em vetor a partir da logo.
export function BagIcon({ className, rays = true, animateRays = false, title }: BagIconProps) {
  return (
    <svg
      viewBox={rays ? "0 0 72 64" : "6 4 56 58"}
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M25 21v-3.5a9.5 9.5 0 0 1 19 0V21" />
      <path d="M20 21h28q4 0 4.6 4l3.8 29q.6 4-3.4 4H15q-4 0-3.4-4l3.8-29q.6-4 4.6-4z" />
      <path d="M25.5 34c4 8 13.5 8 17.5 0" />
      {rays ? (
        <g className={animateRays ? "rays" : undefined}>
          <path d="M55.5 6.5l-2.3 6" />
          <path d="M60 15.5l5.5-3.4" />
          <path d="M61 23l6.5 1.2" />
        </g>
      ) : null}
    </svg>
  );
}
