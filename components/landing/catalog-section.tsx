"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, ChevronDown, Search, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const DATA_URL = "/youmind-gpt-image-2-ko/prompts-ko.json";
const PAGE_SIZE = 40;

const quickTags = [
  { label: "포스터", terms: ["포스터", "poster", "flyer"] },
  { label: "제품", terms: ["제품", "product", "e-commerce", "이커머스"] },
  { label: "UI", terms: ["ui", "앱", "웹", "mockup", "목업"] },
  { label: "지도", terms: ["지도", "map"] },
  { label: "캐릭터", terms: ["캐릭터", "character", "anime"] },
  { label: "음식", terms: ["음식", "food", "drink"] },
  { label: "썸네일", terms: ["thumbnail", "썸네일", "youtube"] },
  { label: "인포그래픽", terms: ["인포그래픽", "infographic", "diagram"] },
];

const popularPills = [
  { label: "라이브커머스", term: "라이브" },
  { label: "제품 포스터", term: "포스터" },
  { label: "웹툰 컷", term: "웹툰" },
  { label: "앱 UI", term: "앱" },
  { label: "여행 지도", term: "지도" },
  { label: "게임 카드", term: "카드" },
  { label: "유튜브 썸네일", term: "썸네일" },
  { label: "카페 메뉴", term: "메뉴" },
];

interface Prompt {
  id: number;
  title: string;
  description?: string;
  prompt?: string;
  language?: string;
  featured?: boolean;
  need_reference_images?: boolean;
  media?: string[];
  media_thumbnails?: string[];
  source_link?: string;
  source_published_at?: string;
  author_name?: string;
}

function textOf(prompt: Prompt) {
  return [prompt.title, prompt.description, prompt.prompt, prompt.author_name, prompt.language]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesTag(prompt: Prompt, tag: typeof quickTags[0] | null) {
  if (!tag) return true;
  const haystack = textOf(prompt);
  return tag.terms.some((term) => haystack.includes(term.toLowerCase()));
}

function formatPromptContent(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";
  const fenced = text.match(/^```(?:json|text)?\s*([\s\S]*?)\s*```$/i);
  const clean = fenced ? fenced[1].trim() : text;
  try {
    return JSON.stringify(JSON.parse(clean), null, 2);
  } catch {
    return clean.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  }
}

function koreanizedWrapper(prompt: Prompt) {
  const formattedPrompt = formatPromptContent(prompt.prompt || "");
  return `아래 원본 프롬프트로 이미지를 생성하되, 최종 이미지 안에 보이는 모든 외국어 텍스트를 자연스러운 한국어로 바꿔서 생성하세요.

결과물 한글화 규칙:
- 중국어, 일본어, 영어 등 이미지 안에 표시될 모든 문구, 간판, 버튼, UI 라벨, 주석, 표 제목, 말풍선, 포스터 카피를 한국어로 변경
- 중국어 한자, 일본어 가나, 의미 없는 외국어 글리프가 이미지 안에 남지 않게 할 것
- 원본 이미지 예시에 중국어가 보이더라도 그대로 따라 하지 말고, 같은 위치와 역할의 한국어 문구로 바꿀 것
- 원본 프롬프트의 구도, 스타일, 카메라, 색감, 정보 밀도, 시각적 장점은 유지
- 외국 도시명, 음식명, 브랜드명이 결과물의 핵심이 아니라면 한국 사용자가 자연스럽게 이해할 수 있는 한국어 표현으로 현지화
- 실제 브랜드 로고가 필수가 아니면 가상의 한국어 브랜드명으로 대체
- 한글은 또렷하고 맞춤법이 정확해야 하며, 깨진 글자, 가짜 한글, 의미 없는 자모 조합을 만들지 말 것
- 한국어 텍스트가 들어가는 영역은 글자가 잘리지 않게 여백과 자간을 충분히 확보
- 단, 코드/모델명/제품명처럼 고유명사로 유지해야 하는 텍스트는 그대로 두되 주변 설명은 한국어로 작성

원본 제목:
${prompt.title}

원본 설명:
${prompt.description}

원본 프롬프트:
${formattedPrompt}`;
}

function PromptCard({
  prompt,
  isSelected,
  onClick,
}: {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
}) {
  const thumb = prompt.media?.[0] || prompt.media_thumbnails?.[0] || "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border transition-all duration-200 hover:border-foreground/30 ${
        isSelected
          ? "border-foreground bg-foreground/5"
          : "border-foreground/10 bg-background"
      }`}
    >
      {thumb ? (
        <div className="relative aspect-video overflow-hidden bg-foreground/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={`${prompt.title} 원본 예시`} loading="lazy" className="w-full h-full object-cover" />
          <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-background/80 px-1.5 py-0.5">
            원본 예시
          </span>
        </div>
      ) : (
        <div className="aspect-video bg-foreground/5 flex flex-col items-center justify-center gap-1">
          <ImageOff className="w-6 h-6 text-foreground/20" />
          <span className="text-[10px] font-mono text-foreground/30">미리보기 없음</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{prompt.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {prompt.featured && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-foreground text-background">추천</span>
          )}
          {prompt.need_reference_images && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/30">레퍼런스</span>
          )}
          {(prompt.media?.length ?? 0) > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10">
              예시 {prompt.media!.length}
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
            #{prompt.id}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailView({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [showImages, setShowImages] = useState(false);
  const formattedPrompt = formatPromptContent(prompt.prompt || "");

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(formattedPrompt);
    toast.success("원본 프롬프트를 복사했습니다");
  };

  const copyKoreanized = async () => {
    await navigator.clipboard.writeText(koreanizedWrapper(prompt));
    toast.success("결과 한글화 프롬프트를 복사했습니다");
  };

  return (
    <div className="border border-foreground/10 bg-background h-full flex flex-col">
      <div className="px-6 py-5 border-b border-foreground/10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-2">
            {prompt.featured && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-foreground text-background">추천</span>
            )}
            {prompt.need_reference_images && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/30">레퍼런스 필요</span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
              #{prompt.id}
            </span>
            {prompt.language && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
                {prompt.language}
              </span>
            )}
          </div>
          <h2 className="text-lg font-display leading-snug">{prompt.title}</h2>
          {prompt.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{prompt.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-xs font-mono shrink-0 mt-1"
        >
          닫기
        </button>
      </div>

      <div className="px-6 py-4 border-b border-foreground/10 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs h-8 gap-1.5"
          onClick={copyKoreanized}
        >
          <Copy className="w-3 h-3" />
          결과 한글화 복사
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs h-8 gap-1.5 border-foreground/20"
          onClick={copyPrompt}
        >
          <Copy className="w-3 h-3" />
          원본 복사
        </Button>
        {(prompt.media?.length ?? 0) > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs h-8 border-foreground/20"
            onClick={() => setShowImages(!showImages)}
          >
            원본 예시 {showImages ? "숨기기" : "보기"}
          </Button>
        )}
        {prompt.source_link && (
          <a
            href={prompt.source_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono h-8 px-3 border border-foreground/10 rounded-full"
          >
            출처 <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {prompt.need_reference_images && (
        <div className="px-6 py-3 bg-foreground/5 border-b border-foreground/10 text-xs text-muted-foreground leading-relaxed">
          원본 예시 이미지는 외국어 텍스트가 포함될 수 있습니다.
          한국어 결과 이미지는 &ldquo;결과 한글화 복사&rdquo; 프롬프트로 새로 생성해야 합니다.
        </div>
      )}

      {showImages && (prompt.media?.length ?? 0) > 0 && (
        <div className="px-6 py-4 border-b border-foreground/10 flex gap-2 overflow-x-auto">
          {prompt.media!.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${prompt.title} 원본 예시 ${i + 1}`}
              loading="lazy"
              className="h-36 w-auto rounded object-cover shrink-0"
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed">
          {formattedPrompt}
        </pre>
      </div>
    </div>
  );
}

export function CatalogSection() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filtered, setFiltered] = useState<Prompt[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTag, setActiveTag] = useState<typeof quickTags[0] | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const applyFilter = useCallback(
    (
      allPrompts: Prompt[],
      q: string,
      filter: string,
      tag: typeof quickTags[0] | null,
      sortKey: string
    ) => {
      const lower = q.trim().toLowerCase();
      let result = allPrompts.filter((p) => {
        if (filter === "featured" && !p.featured) return false;
        if (filter === "reference" && !p.need_reference_images) return false;
        if (filter === "media" && (!p.media || p.media.length === 0)) return false;
        if (!matchesTag(p, tag)) return false;
        if (!lower) return true;
        return textOf(p).includes(lower);
      });

      const sorters: Record<string, (a: Prompt, b: Prompt) => number> = {
        featured: (a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0) || dateDesc(a, b),
        newest: dateDesc,
        oldest: (a, b) =>
          new Date(a.source_published_at ?? 0).getTime() - new Date(b.source_published_at ?? 0).getTime(),
        title: (a, b) => a.title.localeCompare(b.title, "ko"),
      };

      result.sort(sorters[sortKey] || sorters.featured);
      setFiltered(result);
      setVisibleLimit(PAGE_SIZE);
    },
    []
  );

  function dateDesc(a: Prompt, b: Prompt) {
    return (
      new Date(b.source_published_at ?? 0).getTime() -
      new Date(a.source_published_at ?? 0).getTime()
    );
  }

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((data) => {
        const list: Prompt[] = data.prompts || [];
        setPrompts(list);
        setSelected(list[0] || null);
        applyFilter(list, "", "all", null, "featured");
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [applyFilter]);

  useEffect(() => {
    applyFilter(prompts, query, activeFilter, activeTag, sort);
  }, [prompts, query, activeFilter, activeTag, sort, applyFilter]);

  useEffect(() => {
    const handler = () => {
      if (!prompts.length) return;
      const random = prompts[Math.floor(Math.random() * prompts.length)];
      setSelected(random);
      setQuery("");
      if (searchRef.current) searchRef.current.value = "";
      applyFilter(prompts, "", activeFilter, activeTag, sort);
    };
    window.addEventListener("catalog:random", handler);
    return () => window.removeEventListener("catalog:random", handler);
  }, [prompts, activeFilter, activeTag, sort, applyFilter]);

  const visible = filtered.slice(0, visibleLimit);

  return (
    <section id="catalog" className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            CATALOG
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight">
              전체 프롬프트 카탈로그
            </h2>
            <p className="text-muted-foreground font-mono text-sm">
              {loading ? "로딩 중..." : error ? "데이터 로드 실패" : `${prompts.length.toLocaleString("ko-KR")}개 프롬프트`}
            </p>
          </div>
        </div>

        {/* Category quick tags */}
        <div className="mb-8">
          <p className="text-xs font-mono text-muted-foreground mb-3">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => {
                  const next = activeTag === tag ? null : tag;
                  setActiveTag(next);
                }}
                className={`text-sm px-4 py-1.5 border transition-all duration-200 font-mono ${
                  activeTag === tag
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground/20 hover:border-foreground/50"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Popular pills */}
        <div className="mb-10">
          <p className="text-xs font-mono text-muted-foreground mb-3">인기 검색</p>
          <div className="flex flex-wrap gap-2">
            {popularPills.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setQuery(pill.term);
                  if (searchRef.current) searchRef.current.value = pill.term;
                }}
                className="text-xs px-3 py-1 border border-foreground/10 hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-all font-mono"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="flex-1 flex items-center border border-foreground/20 focus-within:border-foreground transition-colors">
            <Search className="w-4 h-4 ml-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="search"
              placeholder="예: 포스터, 라이브, 제품, 웹툰, 서울"
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-3 border border-foreground/20 bg-background text-sm font-mono outline-none hover:border-foreground/40 transition-colors cursor-pointer"
          >
            <option value="featured">추천 먼저</option>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </select>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-0 mb-6 border-b border-foreground/10">
          {[
            { value: "all", label: "전체" },
            { value: "featured", label: "추천" },
            { value: "reference", label: "레퍼런스 필요" },
            { value: "media", label: "원본 예시 있음" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 text-sm font-mono border-b-2 transition-all -mb-px ${
                activeFilter === f.value
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-8 text-sm font-mono text-muted-foreground">
          <span>
            <strong className="text-foreground">{filtered.length.toLocaleString("ko-KR")}</strong> 검색 결과
          </span>
          <span>
            <strong className="text-foreground">{prompts.length.toLocaleString("ko-KR")}</strong> 전체
          </span>
          {selected && (
            <span>
              선택: <strong className="text-foreground">#{selected.id}</strong>
            </span>
          )}
        </div>

        {/* Layout: list + detail */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* Prompt list */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border border-foreground/10 aspect-[4/3] animate-pulse bg-foreground/5" />
                ))}
              </div>
            ) : error ? (
              <div className="py-24 text-center text-muted-foreground font-mono text-sm">
                <p>데이터를 불러오지 못했습니다.</p>
                <p className="mt-2 text-xs opacity-60">로컬 서버로 실행해 주세요: pnpm dev</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-24 text-center text-muted-foreground font-mono text-sm">
                검색 결과가 없습니다.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visible.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      isSelected={selected?.id === p.id}
                      onClick={() => setSelected(p)}
                    />
                  ))}
                </div>

                {visibleLimit < filtered.length && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full border-foreground/20 gap-2"
                      onClick={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                    >
                      <ChevronDown className="w-4 h-4" />
                      더 보기 ({(filtered.length - visibleLimit).toLocaleString("ko-KR")}개 남음)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-24">
            {selected ? (
              <DetailView prompt={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="border border-foreground/10 p-12 flex flex-col items-center justify-center text-center gap-3">
                <Search className="w-8 h-8 text-foreground/20" />
                <strong className="font-mono text-sm">프롬프트를 선택하세요</strong>
                <span className="text-xs text-muted-foreground">
                  목록에서 항목을 누르면 상세와 복사 버튼이 열립니다.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
