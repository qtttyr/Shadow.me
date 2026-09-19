import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import Doctrine from "@/components/landing/Doctrine";
import EngineStrip from "@/components/landing/EngineStrip";
import FooterCTA from "@/components/landing/FooterCTA";

export default function Home() {
  return (
    <main className="bg-canvas">
      <Hero />
      <Marquee />
      <Doctrine />
      <EngineStrip />
      <FooterCTA />
    </main>
  );
}
