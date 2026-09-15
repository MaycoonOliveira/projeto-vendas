import { cn } from "@/lib/utils";

/** Wrapper de largura máxima com padding lateral responsivo consistente. */
export function Container({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </Tag>
  );
}
