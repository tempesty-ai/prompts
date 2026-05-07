"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "사진 변환",
    description: "셀카, 가족 사진, 프로필 이미지를 다양한 스타일의 결과물로 바꿉니다. 인물 사진 하나면 충분합니다.",
    visual: "photo",
  },
  {
    number: "02",
    title: "상업 이미지",
    description: "제품 상세컷, 메뉴 포스터, 라이브커머스 화면, 광고 배너에 맞는 프롬프트를 바로 찾을 수 있습니다.",
    visual: "commerce",
  },
  {
    number: "03",
    title: "콘텐츠 제작",
    description: "웹툰, 썸네일, 카드뉴스, 슬라이드, 게임 에셋을 빠르게 탐색합니다. 카테고리별로 정리되어 있습니다.",
    visual: "content",
  },
  {
    number: "04",
    title: "한국어 타이포",
    description: "한글 문구가 들어가는 포스터와 UI 프롬프트를 바로 찾을 수 있습니다. 결과물 한글화 지시문도 제공합니다.",
    visual: "typo",
  },
];

function PhotoVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <circle cx="100" cy="55" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 140 Q 60 100 100 100 Q 140 100 140 140" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="100" cy="55" r="12" fill="currentColor" opacity="0.2">
        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2s" repeatCount="indefinite" />
      </circle>
      <path d="M 150 30 L 175 30 L 175 65 L 150 65 Z" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M 155 47 L 162 40 L 169 48 L 165 44 L 170 37" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="158" cy="38" r="2.5" fill="currentColor" opacity="0.5" />
      <line x1="143" y1="47" x2="150" y2="47" stroke="currentColor" strokeWidth="1" opacity="0.4">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

function CommerceVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <rect x="30" y="30" width="80" height="100" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="35" y="35" width="70" height="50" rx="2" fill="currentColor" opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
      </rect>
      <line x1="35" y1="100" x2="105" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <rect x="35" y="108" width="40" height="6" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="35" y="118" width="55" height="4" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="130" y="55" width="45" height="55" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="136" y="61" width="33" height="22" rx="2" fill="currentColor" opacity="0.08" />
      <rect x="136" y="90" width="20" height="4" rx="2" fill="currentColor" opacity="0.3" />
      <rect x="136" y="98" width="28" height="3" rx="2" fill="currentColor" opacity="0.2" />
      <path d="M 115 80 L 130 80" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.5">
        <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function ContentVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={28 + col * 52}
            y={20 + row * 48}
            width={44}
            height={40}
            rx="3"
            fill="currentColor"
            opacity={0.05 + (row * 3 + col) * 0.03}
          >
            <animate
              attributeName="opacity"
              values={`${0.05 + (row * 3 + col) * 0.03};${0.2 + (row * 3 + col) * 0.03};${0.05 + (row * 3 + col) * 0.03}`}
              dur={`${1.5 + (row * 3 + col) * 0.2}s`}
              repeatCount="indefinite"
            />
          </rect>
        ))
      )}
      <rect x="28" y="20" width="44" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="80" y="20" width="44" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <rect x="132" y="20" width="44" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function TypoVisual() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full">
      <text x="20" y="60" fontSize="36" fontFamily="serif" fill="currentColor" opacity="0.9">가나다</text>
      <text x="20" y="95" fontSize="18" fontFamily="sans-serif" fill="currentColor" opacity="0.5">라마바사</text>
      <text x="20" y="120" fontSize="13" fontFamily="monospace" fill="currentColor" opacity="0.3">아자차카타파하</text>
      <line x1="20" y1="70" x2="180" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      <rect x="148" y="42" width="3" height="20" fill="currentColor" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0;0.7" dur="1s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

function AnimatedVisual({ type }: { type: string }) {
  switch (type) {
    case "photo": return <PhotoVisual />;
    case "commerce": return <CommerceVisual />;
    case "content": return <ContentVisual />;
    case "typo": return <TypoVisual />;
    default: return <PhotoVisual />;
  }
}

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-foreground/10">
        <div className="shrink-0">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>

        <div className="flex-1 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-3xl lg:text-4xl font-display mb-4 group-hover:translate-x-2 transition-transform duration-500">
              {feature.title}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-48 h-40 text-foreground">
              <AnimatedVisual type={feature.visual} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            WHAT YOU CAN MAKE
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            한 줄 아이디어를
            <br />
            <span className="text-muted-foreground">바로 이미지 기획안으로.</span>
          </h2>
        </div>

        <div>
          {features.map((feature, index) => (
            <FeatureCard key={feature.number} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
