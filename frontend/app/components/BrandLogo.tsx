import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  /** Pass null for a non-linked logo (e.g. hero). */
  href?: string | null;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  variant?: "header" | "hero" | "footer";
};

const sizeByVariant = {
  header: "h-9 sm:h-10 w-auto max-w-[min(100%,240px)]",
  hero: "h-[4.5rem] sm:h-20 w-auto max-w-[min(100%,420px)]",
  footer: "h-10 w-auto max-w-[240px]",
} as const;

export function BrandLogo({
  href = "/",
  priority = false,
  className = "",
  imageClassName,
  variant = "header",
}: BrandLogoProps) {
  const img = (
    <Image
      src="/criticlens-logo.png"
      alt="CriticLens"
      width={1024}
      height={431}
      priority={priority}
      className={imageClassName ?? sizeByVariant[variant]}
    />
  );

  const wrapped = (
    <span className={`inline-flex items-center ${className}`}>{img}</span>
  );

  if (href === null) {
    return wrapped;
  }

  return (
    <Link href={href} className="inline-flex hover:opacity-95 transition">
      {wrapped}
    </Link>
  );
}
