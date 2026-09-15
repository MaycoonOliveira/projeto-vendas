import type { LucideIcon } from "lucide-react";

export type GalleryImage = {
  src: string;
  alt: string;
  /** Marca as fotos de melhor qualidade para destaques (hero/prévia). */
  featured?: boolean;
};

export type Amenity = {
  icon: LucideIcon;
  label: string;
  description?: string;
};

export type Differential = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Accommodation = {
  slug: string;
  name: string;
  summary: string;
  description: string[];
  image: GalleryImage;
  capacity: {
    guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: string;
  };
  highlights: string[];
};

export type Testimonial = {
  quote: string;
  author: string;
  context?: string;
};

export type PointOfInterest = {
  name: string;
  description: string;
};
