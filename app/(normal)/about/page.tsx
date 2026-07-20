import AboutCta from "@/components/about/AboutCta";
import AboutHero from "@/components/about/AboutHero";
import GallerySection from "@/components/about/GallerySection";
import HeritageSection from "@/components/about/HeritageSection";
import MissionSection from "@/components/about/MissionSection";
import StorySection from "@/components/about/StorySection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Roopshree - A Legacy of Bandhej Craftsmanship Since 1978",
  description:
    "Roopshree brings you handcrafted Bandhej sarees & dupattas. Gajji silk, zardozi & gota patti pieces, rooted in Rajasthan's textile heritage. Browse the collection.",
  alternates: {
    canonical: "https://roopshreebandhej.com/about",
  },
  openGraph: {
    title: "About Roopshree - A Legacy of Bandhej Craftsmanship Since 1978",
    description:
      "Roopshree brings you handcrafted Bandhej sarees & dupattas. Gajji silk, zardozi & gota patti pieces, rooted in Rajasthan's textile heritage. Browse the collection.",
    url: "https://roopshreebandhej.com/about",
    type: "website",
    images: [{ url: "https://roopshreebandhej.com/about/hero_bg.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Roopshree - A Legacy of Bandhej Craftsmanship Since 1978",
    description:
      "Roopshree brings you handcrafted Bandhej sarees & dupattas. Gajji silk, zardozi & gota patti pieces, rooted in Rajasthan's textile heritage. Browse the collection.",
  },
};

const AboutPage = () => {
  return (
    <main className="flex-1">
      <AboutHero />
      <HeritageSection />
      <StorySection />
      <MissionSection />

      <GallerySection />
      <AboutCta />
    </main>
  );
};

export default AboutPage;
