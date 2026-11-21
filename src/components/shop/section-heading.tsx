import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Centered section label + Persian heading used across sections */
export function SectionHeading({
  label,
  title,
  className,
}: {
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("text-center", className)}>
      <p className="gh-label">{label}</p>
      <h2 className="mt-4 text-[28px] md:text-[32px] font-extralight text-cream">
        {title}
      </h2>
    </Reveal>
  );
}
