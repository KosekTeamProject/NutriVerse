import Image from "next/image";

export function BrandLogo({ compact = false, className = "" }: { readonly compact?: boolean; readonly className?: string }) {
  if (compact) {
    return (
      <span className={`inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-[28%] ${className}`}>
        <Image
          src="/brand/nutriverse-app-icon-200.png"
          alt="NutriVerse"
          width={200}
          height={200}
          priority
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex h-10 shrink-0 items-center gap-2.5 ${className}`} aria-label="NutriVerse">
      <Image
        src="/brand/nutriverse-app-icon-200.png"
        alt=""
        width={200}
        height={200}
        priority
        className="h-10 w-10 shrink-0 rounded-[28%] object-cover shadow-sm"
      />
      <span className="whitespace-nowrap font-display text-[1.35rem] font-extrabold tracking-[-0.055em] text-foreground">
        Nutri<span className="text-brand">Verse</span>
      </span>
    </span>
  );
}
