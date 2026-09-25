import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  /** Pass null for a non-linked logo (e.g. hero). */
  href?: string | null;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  variant?: "header" | "hero" | "footer" | "marketing";
};

const sizeByVariant = {
  header: "h-9 sm:h-10 w-auto max-w-[min(100%,240px)]",
  hero: "h-[4.5rem] sm:h-20 w-auto max-w-[min(100%,420px)]",
  footer: "h-10 w-auto max-w-[240px]",
  marketing: "h-12 sm:h-14 md:h-[3.75rem] w-auto max-w-[min(100%,320px)]",
} as const;

const wrapByVariant = {
  header: "",
  hero: "",
  footer: "",
  marketing:
    "rounded-2xl bg-black/50 backdrop-blur-md ring-1 ring-white/20 px-4 py-2.5 sm:px-5 sm:py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
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
    <span
      className={`inline-flex items-center justify-center ${wrapByVariant[variant]} ${className}`}
    >
      {img}
    </span>
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
