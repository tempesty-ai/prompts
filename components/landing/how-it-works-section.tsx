"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Import the source catalog",
    description: "Pull the NanoBanana trending prompt data, normalize it, and remove broken text from visible fields.",
    code: `npm run import:nanobanana
source: jau123/nanobanana-trending-prompts
output: public/nanobanana-trending-prompts/prompts-ko.json`,
  },
  {
    number: "II",
    title: "Browse and shortlist",
    description: "Filter by prompt type, metrics, source image availability, or rank to find ideas worth testing.",
    code: `filters: poster, product, UI, photo
sort: featured, newest, oldest, title
queue: incomplete items first`,
  },
  {
    number: "III",
    title: "Generate final thumbnails",
    description: "Use the batch script or admin uploader to replace source thumbnails with clean generated R2 images.",
    code: `npm run generate:images -- --limit 20
output: generated-r2-queue/{id}.png
priority: R2 image > source image > placeholder`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((prev) => (prev + 1) % steps.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="relative py-24 lg:py-32 bg-foreground text-background overflow-hidden">
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-background/50 mb-6">
            <span className="w-8 h-px bg-background/30" />
            WORKFLOW
          </span>
          <h2 className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            From source prompt
            <br />
            <span className="text-background/50">to finished thumbnail.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-background/10 transition-all duration-500 group ${activeStep === index ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-display text-3xl text-background/30">{step.number}</span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-display mb-3 group-hover:translate-x-2 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-background/60 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-background/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-background/10 flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                  <div className="w-3 h-3 rounded-full bg-background/20" />
                </div>
                <span className="text-xs font-mono text-background/40">prompts-k</span>
              </div>
              <pre className="p-8 font-mono text-sm min-h-[220px] text-background/70 whitespace-pre-wrap">
                {steps[activeStep].code}
              </pre>
              <div className="px-6 py-4 border-t border-background/10 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono text-background/40">ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
