type Props = {
  rating: number;
  size?: number;
  className?: string;
};

/** Static 5-star display (usable in both server and client components). */
export default function StarRating({ rating, size = 16, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${rating}/5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={i <= Math.round(rating) ? "text-accent" : "text-white/15"}
          fill="currentColor"
        >
          <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.58L12 17.57l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}
