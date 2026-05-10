"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "실전 Prompt 예시",
    description: "트렌딩 공개 예시에서 가져온 이미지 prompt를 카테고리별로 정리했습니다.",
  },
  {
    number: "02",
    title: "비주얼 중심 카탈로그",
    description: "raw prompt 덤프 대신 썸네일, 카테고리, 랭크, 메트릭, 출처 정보를 한눈에 확인하세요.",
  },
  {
    number: "03",
    title: "한국어 대응 prompt",
    description: "모델에 어울리는 clean prompt wrapper를 복사해 한국어 출력에 맞게 사용할 수 있습니다.",
  },
  {
    number: "04",
    title: "R2 이미지 파이프라인",
    description: "생성된 이미지가 있으면 우선 사용하고, 없으면 소스 썸네일로 대체해 빈 카드가 없도록 합니다.",
  },
];

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.2 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group relative transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 py-12 lg:py-20 border-b border-foreground/10">
        <div className="shrink-0">
          <span className="font-mono text-sm text-muted-foreground">{feature.number}</span>
        </div>
        <div className="flex-1 grid lg:grid-cols-[1fr_220px] gap-8 items-center">
          <div>
            <h3 className="text-3xl lg:text-4xl font-display mb-4 group-hover:translate-x-2 transition-transform duration-500">
              {feature.title}
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
          <div className="hidden lg:flex justify-end">
            <div className="w-40 h-32 border border-foreground/10 bg-foreground/5 flex items-center justify-center font-mono text-4xl text-foreground/20">
              {feature.number}
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
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            무엇을 하는지
          </span>
          <h2 className={`text-4xl lg:text-6xl font-display tracking-tight transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            이미지 prompt ideas를
            <br />
            더 깔끔하게 훑어보는 방법.
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
