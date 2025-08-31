import React from "react";
import HeroSection from "@/components/sections/hero-section";
import DemoSection from "@/components/sections/demo-section";
import AboutSection from "@/components/sections/about-section";
import ContactSection from "@/components/sections/contact-section";
const page = () => {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center">
      <HeroSection />
      <AboutSection />
      <DemoSection />
      <ContactSection />
    </main>
  );
};

export default page;
