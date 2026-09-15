import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Differentials } from "@/components/sections/differentials";
import { Accommodations } from "@/components/sections/accommodations";
import { GalleryPreview } from "@/components/sections/gallery-preview";
import { Amenities } from "@/components/sections/amenities";
import { Location } from "@/components/sections/location";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import { StructuredData } from "@/components/seo/structured-data";

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <About />
      <Differentials />
      <Accommodations />
      <GalleryPreview />
      <Amenities />
      <Testimonials />
      <Location />
      <Faq />
      <CtaBand />
    </>
  );
}
