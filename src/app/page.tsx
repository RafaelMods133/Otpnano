import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { BestSeller } from "@/components/home/BestSeller";
import { CountryGrid } from "@/components/home/CountryGrid";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FAQ } from "@/components/home/FAQ";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BestSeller />
        <CountryGrid />
        <ServiceGrid />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
