import { describe, expect, it } from "vitest";
import { cn, formatCurrency } from "@/lib/utils";

describe("cn", () => {
  it("combina classes e resolve conflitos do tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});

describe("formatCurrency", () => {
  it("formata valores em reais sem casas decimais", () => {
    const result = formatCurrency(1200);
    expect(result).toContain("1.200");
    expect(result).toContain("R$");
  });
});
