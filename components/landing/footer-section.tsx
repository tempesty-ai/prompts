"use client";

import { AnimatedWave } from "./animated-wave";

const footerLinks = {
  카탈로그: [
    { name: "전체 프롬프트", href: "#catalog" },
    { name: "추천 프롬프트", href: "#catalog" },
    { name: "카테고리별 보기", href: "#catalog" },
    { name: "인기 프롬프트", href: "#catalog" },
  ],
  사용법: [
    { name: "3단계 가이드", href: "#how-it-works" },
    { name: "결과 한글화란?", href: "#how-it-works" },
    { name: "레퍼런스 이미지", href: "#how-it-works" },
  ],
  정보: [
    { name: "데이터 출처", href: "#" },
    { name: "GPT Image 2", href: "#" },
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
                <span className="text-xs text-muted-foreground font-mono">한국어</span>
              </a>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                GPT Image 2용 한국어 프롬프트 카탈로그.
                무료로 사용하는 로컬 전용 도구입니다.
              </p>

              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                로컬 실행 중
              </div>
            </div>

            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
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
          <p className="text-sm text-muted-foreground">
            2025 Prompts K · 로컬 전용 · 무료
          </p>
          <p className="text-sm text-muted-foreground font-mono">
            GPT Image 2 데이터 기반
          </p>
        </div>
      </div>
    </footer>
  );
}
