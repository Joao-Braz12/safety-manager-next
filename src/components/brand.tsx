import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "white";
}) {
  const ink = tone === "ink" ? "var(--color-ink)" : "white";
  const red = "var(--color-acciona-red)";
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-display font-black tracking-tight leading-none",
        className,
      )}
      style={{ color: ink }}
    >
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none" aria-hidden>
        <path
          d="M6.5 1L7 5.5L11 4L8.5 7.5L13 8L9 10.5L13 13L8.5 13.5L11 17L7 15.5L6.5 20L6 15.5L2 17L4.5 13.5L0 13L4 10.5L0 8L4.5 7.5L2 4L6 5.5L6.5 1Z"
          fill={red}
        />
      </svg>
      <span>acciona</span>
      <span
        className="ml-1 text-[9px] font-mono uppercase tracking-[0.2em] font-medium pt-1.5"
        style={{ color: "var(--color-graphite-500)" }}
      >
        / safety
      </span>
    </span>
  );
}

export function BrandLink({
  className,
  tone = "ink",
  href = "/",
}: {
  className?: string;
  tone?: "ink" | "white";
  href?: string;
}) {
  return (
    <Link href={href} className={cn("inline-block", className)}>
      <Wordmark tone={tone} className="text-xl" />
    </Link>
  );
}
