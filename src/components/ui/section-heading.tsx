import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2" | "h3";
};

/** Cabeçalho de seção padronizado (eyebrow + título + descrição). */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  as: Tag = "h2",
}: Props) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
      <Tag
        className={cn(
          "text-3xl leading-[1.1] sm:text-4xl lg:text-5xl",
          align === "center" && "max-w-3xl",
        )}
      >
        {title}
      </Tag>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
