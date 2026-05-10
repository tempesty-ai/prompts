"use client";

import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  Catalog: [
    { name: "All prompts", href: "#catalog" },
    { name: "Featured", href: "#catalog" },
    { name: "Source images", href: "#catalog" },
  ],
  Source: [
    { name: "NanoBanana prompts", href: "https://github.com/jau123/nanobanana-trending-prompts" },
    { name: "OpenAI images", href: "https://platform.openai.com/docs/guides/images" },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative border-t border-foreground/10">
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="py-16 lg:py-24">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 lg:gap-8">
            <div className="col-span-2">
              <a href="#" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">Prompts K</span>
                <span className="text-xs text-muted-foreground font-mono">catalog</span>
              </a>
              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                이미지 생성 프롬프트를 빠르게 탐색하고, 소스 이미지와 원문을 바로 확인하는 compact catalog.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                local catalog ready
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">2026 Prompts K</p>
          <p className="text-sm text-muted-foreground font-mono">NanoBanana prompt catalog</p>
        </div>
      </div>
    </footer>
  );
}
