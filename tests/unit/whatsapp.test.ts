import { describe, expect, it } from "vitest";
import { buildWhatsappUrl, buildPhoneUrl } from "@/lib/whatsapp";
import { siteConfig } from "@/config/site";

describe("buildWhatsappUrl", () => {
  it("gera um link wa.me apenas com dígitos no telefone", () => {
    const url = buildWhatsappUrl();
    const phone = siteConfig.contact.whatsapp.replace(/\D/g, "");
    expect(url.startsWith(`https://wa.me/${phone}?text=`)).toBe(true);
  });

  it("codifica a mensagem personalizada na querystring", () => {
    const url = buildWhatsappUrl("Olá, tudo bem?");
    expect(url).toContain("text=");
    expect(url).toContain(encodeURIComponent("Olá, tudo bem?"));
  });

  it("usa a mensagem padrão quando nenhuma é informada", () => {
    const url = buildWhatsappUrl();
    expect(url).toContain(
      encodeURIComponent(siteConfig.contact.whatsappMessage),
    );
  });
});

describe("buildPhoneUrl", () => {
  it("gera um link tel: mantendo dígitos e o sinal de +", () => {
    const url = buildPhoneUrl();
    expect(url.startsWith("tel:")).toBe(true);
    expect(url).toMatch(/^tel:\+?\d+$/);
  });
});
