"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, ChevronDown, Search, ImageOff, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const DATA_URL = "/nanobanana-trending-prompts/prompts-ko.json";
const PAGE_SIZE = 40;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
const R2_IMAGE_EXTS = ["jpg", "png", "webp", "gif"];
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 1024px)";

function shouldOpenMobileSheet() {
  return typeof window !== "undefined" && !window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches;
}

const quickTags = [
  { label: "Poster", terms: ["poster", "flyer", "poster design"] },
  { label: "Product", terms: ["product", "brand", "e-commerce"] },
  { label: "UI", terms: ["ui", "app", "web", "mockup"] },
  { label: "Photo", terms: ["photo", "photography", "portrait"] },
  { label: "Character", terms: ["character", "anime", "mascot"] },
  { label: "Food", terms: ["food", "drink", "restaurant"] },
  { label: "Thumbnail", terms: ["thumbnail", "youtube"] },
  { label: "Infographic", terms: ["infographic", "diagram", "technical"] },
];

const popularPills = [
  { label: "Product poster", term: "product poster" },
  { label: "Technical infographic", term: "technical infographic" },
  { label: "UI mockup", term: "ui mockup" },
  { label: "Brand campaign", term: "brand" },
  { label: "Photography", term: "photography" },
  { label: "Food ad", term: "food" },
  { label: "YouTube thumbnail", term: "thumbnail" },
  { label: "Character design", term: "character" },
];

interface Prompt {
  id: string;
  rank?: number;
  title: string;
  description?: string;
  prompt?: string;
  original_prompt?: string;
  language?: string;
  model?: string;
  categories?: string[];
  likes?: number;
  views?: number;
  score?: number;
  featured?: boolean;
  need_reference_images?: boolean;
  media?: string[];
  media_thumbnails?: string[];
  source_link?: string;
  source_published_at?: string;
  author_name?: string;
}

function r2ImageUrl(id: string | number, ext = "jpg") {
  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/prompts/${id}.${ext}` : "";
}

function textOf(prompt: Prompt) {
  return [
    prompt.title,
    prompt.description,
    prompt.prompt,
    prompt.original_prompt,
    prompt.author_name,
    prompt.language,
    prompt.model,
    ...(prompt.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesTag(prompt: Prompt, tag: (typeof quickTags)[0] | null) {
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
    return clean
      .replace(/\r\n/g, "\n")
      .replace(/\s+(?=(?:Include|Style|Perspective|Colors|Output|Subject|Composition|Lighting|Background|Camera|Mood|Negative Prompt|Aspect Ratio):)/gi, "\n\n")
      .replace(/([.!?])\s+(?=[A-Z가-힣])/g, "$1\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

function renderPromptContent(value: string) {
  const placeholderPattern = /(\[[^\]\n]{1,80}\]|\{[A-Z][A-Z0-9 _-]{1,80}\}|<[^>\n]{1,80}>)/g;
  const exactPlaceholderPattern = /^(\[[^\]\n]{1,80}\]|\{[A-Z][A-Z0-9 _-]{1,80}\}|<[^>\n]{1,80}>)$/;
  const parts = value.split(placeholderPattern);

  return parts.map((part, index) => {
    if (!part) return null;
    if (exactPlaceholderPattern.test(part)) {
      return (
        <span key={index} className="font-semibold text-red-600">
          {part}
        </span>
      );
    }
    return part;
  });
}

function koreanizedWrapper(prompt: Prompt) {
  const formattedPrompt = formatPromptContent(prompt.prompt || prompt.original_prompt || "");
  return `Create a polished Korean-ready image based on the source prompt below.

Hard requirements:
- Do not include Chinese, Japanese, mojibake, garbled glyphs, or unreadable pseudo-text.
- If visible text is needed, use natural Korean only.
- If exact text is uncertain, omit it or replace it with short Korean labels.
- Preserve the intended composition, subject, style, camera, colors, and information density.
- Avoid real brand logos unless they are essential to the prompt.
- Make the result suitable as a clean web catalog thumbnail.

Catalog title:
${prompt.title}

Catalog description:
${prompt.description || ""}

Source prompt:
${formattedPrompt}`;
}

function rankAsc(a: Prompt, b: Prompt) {
  return Number(a.rank ?? 999999) - Number(b.rank ?? 999999);
}

function dateDesc(a: Prompt, b: Prompt) {
  return new Date(b.source_published_at ?? 0).getTime() - new Date(a.source_published_at ?? 0).getTime();
}

function mediaCount(prompt: Prompt) {
  return prompt.media?.length ?? prompt.media_thumbnails?.length ?? 0;
}

function engagementScore(prompt: Prompt) {
  return Number(prompt.score ?? 0) || Number(prompt.likes ?? 0) * 10 + Number(prompt.views ?? 0) / 1000;
}

function termScore(prompt: Prompt, terms: string[]) {
  if (terms.length === 0) return 0;
  const title = prompt.title.toLowerCase();
  const categories = (prompt.categories ?? []).join(" ").toLowerCase();
  const body = textOf(prompt);

  return terms.reduce((score, term) => {
    const lower = term.toLowerCase();
    if (title.includes(lower)) return score + 8;
    if (categories.includes(lower)) return score + 5;
    if (body.includes(lower)) return score + 1;
    return score;
  }, 0);
}

function recommendedSort(filter: string, tag: (typeof quickTags)[0] | null, query: string) {
  const queryTerms = query.trim() ? [query.trim()] : [];
  const terms = [...(tag?.terms ?? []), ...queryTerms];

  return (a: Prompt, b: Prompt) => {
    const relevance = termScore(b, terms) - termScore(a, terms);
    if (relevance) return relevance;

    if (filter === "media") {
      return mediaCount(b) - mediaCount(a) || Number(b.featured ?? 0) - Number(a.featured ?? 0) || rankAsc(a, b);
    }

    if (filter === "reference") {
      return mediaCount(b) - mediaCount(a) || dateDesc(a, b) || rankAsc(a, b);
    }

    if (filter === "featured") {
      return engagementScore(b) - engagementScore(a) || rankAsc(a, b);
    }

    return Number(b.featured ?? 0) - Number(a.featured ?? 0) || engagementScore(b) - engagementScore(a) || rankAsc(a, b);
  };
}

function PromptThumbnail({
  prompt,
  onUnavailable,
  onPreview,
}: {
  prompt: Prompt;
  onUnavailable: () => void;
  onPreview?: (image: string) => void;
}) {
  const [extIndex, setExtIndex] = useState(0);
  const [r2Failed, setR2Failed] = useState(false);
  const [sourceFailed, setSourceFailed] = useState(false);
  const r2 = r2ImageUrl(prompt.id, R2_IMAGE_EXTS[extIndex]);
  const sourceImage = prompt.media?.[0] || prompt.media_thumbnails?.[0] || "";

  const renderOverlay = (image: string) => (
    <span className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all duration-200 group-hover/thumbnail:bg-background/20 group-hover/thumbnail:opacity-100">
      <span
        role="button"
        tabIndex={0}
        aria-label="Open large preview"
        className="inline-flex size-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-sm ring-1 ring-foreground/10 transition-transform hover:scale-105"
        onClick={(event) => {
          event.stopPropagation();
          onPreview?.(image);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onPreview?.(image);
          }
        }}
      >
        <Eye className="size-4" />
      </span>
    </span>
  );

  if (r2 && !r2Failed) {
    return (
      <div
        className="group/thumbnail relative aspect-video cursor-zoom-in overflow-hidden bg-white"
        onClick={(event) => {
          event.stopPropagation();
          onPreview?.(r2);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r2}
          alt={`${prompt.title} generated thumbnail`}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-200 group-hover/thumbnail:scale-[1.02]"
          onError={() => {
            if (extIndex < R2_IMAGE_EXTS.length - 1) {
              setExtIndex((prev) => prev + 1);
            } else {
              setR2Failed(true);
            }
          }}
        />
        <span className="absolute bottom-2 right-2 bg-background/80 px-1.5 py-0.5 font-mono text-[10px]">
          R2
        </span>
        {renderOverlay(r2)}
      </div>
    );
  }

  if (sourceImage && !sourceFailed) {
    return (
      <div
        className="group/thumbnail relative aspect-video cursor-zoom-in overflow-hidden bg-white"
        onClick={(event) => {
          event.stopPropagation();
          onPreview?.(sourceImage);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceImage}
          alt={`${prompt.title} source thumbnail`}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-200 group-hover/thumbnail:scale-[1.02]"
          onError={() => {
            setSourceFailed(true);
            onUnavailable();
          }}
        />
        <span className="absolute bottom-2 right-2 bg-background/80 px-1.5 py-0.5 font-mono text-[10px]">
          Source
        </span>
        {renderOverlay(sourceImage)}
      </div>
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-1 bg-foreground/5 px-4">
      <ImageOff className="h-6 w-6 text-foreground/20" />
      <span className="line-clamp-2 text-center font-mono text-[10px] text-foreground/30">
        {prompt.title}
      </span>
    </div>
  );
}

function PromptCard({
  prompt,
  isSelected,
  onClick,
  onUnavailable,
  onPreview,
}: {
  prompt: Prompt;
  isSelected: boolean;
  onClick: () => void;
  onUnavailable: () => void;
  onPreview: (image: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border text-left transition-all duration-200 hover:border-foreground/30 ${
        isSelected ? "border-foreground bg-foreground/5" : "border-foreground/10 bg-background"
      }`}
    >
      <PromptThumbnail prompt={prompt} onUnavailable={onUnavailable} onPreview={onPreview} />
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 text-sm font-medium">{prompt.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{prompt.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {prompt.featured && (
            <span className="bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
              Featured
            </span>
          )}
          {prompt.need_reference_images && (
            <span className="border border-foreground/30 px-1.5 py-0.5 font-mono text-[10px]">
              참조 필요
            </span>
          )}
          {(prompt.media?.length ?? 0) > 0 && (
            <span className="border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">
              Source {prompt.media!.length}
            </span>
          )}
          <span className="border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40">
            #{prompt.rank ?? prompt.id}
          </span>
        </div>
      </div>
    </button>
  );
}

function PromptPreviewOverlay({
  prompt,
  image,
  onClose,
}: {
  prompt: Prompt;
  image: string;
  onClose: () => void;
}) {
  const formattedPrompt = formatPromptContent(prompt.prompt || prompt.original_prompt || "");

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(formattedPrompt);
    toast.success("Source prompt copied");
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-background/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[90] inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 bg-background/90 text-foreground hover:bg-foreground hover:text-background"
        aria-label="Close large preview"
      >
        <X className="size-4" />
      </button>
      <div
        className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-md border border-foreground/10 bg-background shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
          <div className="min-w-0">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Large preview
            </span>
            <h3 className="mt-1 line-clamp-2 text-base font-medium">{prompt.title}</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 shrink-0 rounded-full border-foreground/20 text-xs"
            onClick={copyPrompt}
          >
            <Copy className="h-3 w-3" />
            Copy prompt
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex min-h-full flex-col">
            <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-white p-4 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${prompt.title} large preview`}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>

            <div className="border-t border-foreground/10 bg-background p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Source prompt
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formattedPrompt.split("\n").length.toLocaleString("en-US")} lines
                </span>
              </div>
              <pre className="max-h-[34vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-foreground/10 bg-foreground/[0.025] p-4 font-mono text-xs leading-6 text-foreground/75 tabular-nums">
                {renderPromptContent(formattedPrompt)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailView({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const sourceImages = (prompt.media?.length ? prompt.media : prompt.media_thumbnails) ?? [];
  const [selectedSourceImage, setSelectedSourceImage] = useState(sourceImages[0] ?? "");
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const formattedPrompt = formatPromptContent(prompt.prompt || prompt.original_prompt || "");

  useEffect(() => {
    setSelectedSourceImage(sourceImages[0] ?? "");
  }, [prompt.id]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(formattedPrompt);
    toast.success("소스 프롬프트를 복사했습니다.");
  };

  const copyKoreanized = async () => {
    await navigator.clipboard.writeText(koreanizedWrapper(prompt));
    window.open("https://chatgpt.com", "_blank");
    toast.success("한국어용 프롬프트를 복사했습니다. ChatGPT에 붙여넣으세요.", { duration: 5000 });
  };

  return (
    <div className="flex h-full flex-col border border-foreground/10 bg-background">
      <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap gap-1">
            {prompt.featured && (
              <span className="bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                Featured
              </span>
            )}
            {prompt.need_reference_images && (
              <span className="border border-foreground/30 px-1.5 py-0.5 font-mono text-[10px]">
                참조 필요
              </span>
            )}
            <span className="border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40">
              #{prompt.id}
            </span>
            {prompt.model && (
              <span className="border border-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/40">
                {prompt.model}
              </span>
            )}
          </div>
          <h2 className="font-display text-lg leading-snug">{prompt.title}</h2>
          {prompt.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{prompt.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-1 shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground"
        >
          닫기
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-foreground/10 px-6 py-4">
        <Button
          size="sm"
          className="h-8 gap-1.5 rounded-full bg-foreground text-xs text-background hover:bg-foreground/90"
          onClick={copyKoreanized}
        >
          <Copy className="h-3 w-3" />
          한국어용 복사
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full border-foreground/20 text-xs"
          onClick={copyPrompt}
        >
          <Copy className="h-3 w-3" />
          소스 복사
        </Button>
        {prompt.source_link && (
          <a
            href={prompt.source_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-foreground/10 px-3 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            원본 <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {prompt.need_reference_images && (
        <div className="border-b border-foreground/10 bg-foreground/5 px-6 py-3 text-xs leading-relaxed text-muted-foreground">
          이 프롬프트는 참조 이미지가 필요합니다. 복사한 한국어용 프롬프트와 적절한 입력 이미지를 함께 사용하세요.
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {selectedSourceImage && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                소스 이미지
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {sourceImages.length.toLocaleString("en-US")}장
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveImage(selectedSourceImage)}
              className="group relative flex h-[min(42vh,360px)] min-h-56 w-full items-center justify-center overflow-hidden rounded-md border border-foreground/10 bg-white"
              aria-label="소스 이미지 크게 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedSourceImage}
                alt={`${prompt.title} 소스 이미지`}
                loading="lazy"
                className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <span className="absolute bottom-3 right-3 bg-background/90 px-2.5 py-1 font-mono text-[10px] text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                크게 보기
              </span>
            </button>
            {sourceImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {sourceImages.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedSourceImage(src)}
                    className={`h-16 w-20 shrink-0 overflow-hidden rounded border bg-white ${
                      selectedSourceImage === src ? "border-foreground" : "border-foreground/10 hover:border-foreground/30"
                    }`}
                    aria-label={`소스 이미지 ${i + 1} 선택`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${prompt.title} 소스 썸네일 ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              소스 프롬프트
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] text-red-700">
              빨간 텍스트는 직접 바꿔서 사용하세요
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {formattedPrompt.split("\n").length.toLocaleString("en-US")} lines
          </span>
        </div>
        <pre className="whitespace-pre-wrap break-words rounded-md border border-foreground/10 bg-foreground/[0.025] p-4 font-mono text-xs leading-6 text-foreground/75 tabular-nums">
          {renderPromptContent(formattedPrompt)}
        </pre>
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-[80] bg-background/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveImage(null)}
        >
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="absolute right-4 top-4 z-[90] inline-flex size-10 items-center justify-center rounded-full border border-foreground/15 bg-background/90 text-foreground hover:bg-foreground hover:text-background"
            aria-label="소스 이미지 미리보기 닫기"
          >
            <X className="size-4" />
          </button>
          <div
            className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-md border border-foreground/10 bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4">
              <div className="min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Preview
                </span>
                <h3 className="mt-1 line-clamp-2 text-base font-medium">{prompt.title}</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-full border-foreground/20 text-xs"
                onClick={copyPrompt}
              >
                <Copy className="h-3 w-3" />
                Copy prompt
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="flex min-h-full flex-col">
                <div className="flex min-h-[45vh] flex-1 items-center justify-center bg-white p-4 sm:p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImage}
                    alt={`${prompt.title} preview image`}
                    className="max-h-[68vh] w-full object-contain"
                  />
                </div>

                <div className="border-t border-foreground/10 bg-background p-5 sm:p-6">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      Source prompt
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formattedPrompt.split("\n").length.toLocaleString("en-US")} lines
                    </span>
                  </div>
                  <pre className="max-h-[34vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-foreground/10 bg-foreground/[0.025] p-4 font-mono text-xs leading-6 text-foreground/75 tabular-nums">
                    {renderPromptContent(formattedPrompt)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CatalogSection() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filtered, setFiltered] = useState<Prompt[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTag, setActiveTag] = useState<(typeof quickTags)[0] | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [preview, setPreview] = useState<{ prompt: Prompt; image: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const applyFilter = useCallback(
    (allPrompts: Prompt[], q: string, filter: string, tag: (typeof quickTags)[0] | null, sortKey: string) => {
      const lower = q.trim().toLowerCase();
      const result = allPrompts.filter((p) => {
        if (filter === "featured" && !p.featured) return false;
        if (filter === "reference" && !p.need_reference_images) return false;
        if (filter === "media" && mediaCount(p) === 0) return false;
        if (!matchesTag(p, tag)) return false;
        if (!lower) return true;
        return textOf(p).includes(lower);
      });

      const sorters: Record<string, (a: Prompt, b: Prompt) => number> = {
        recommended: recommendedSort(filter, tag, q),
        featured: (a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0) || rankAsc(a, b),
        popular: (a, b) => engagementScore(b) - engagementScore(a) || rankAsc(a, b),
        newest: dateDesc,
        oldest: (a, b) => new Date(a.source_published_at ?? 0).getTime() - new Date(b.source_published_at ?? 0).getTime(),
        title: (a, b) => a.title.localeCompare(b.title),
      };

      result.sort(sorters[sortKey] || sorters.recommended);
      setFiltered(result);
      setVisibleLimit(PAGE_SIZE);
    },
    []
  );

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
        applyFilter(list, "", "all", null, "recommended");
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
    const desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT_QUERY);
    const closeSheetOnDesktop = () => {
      if (desktopQuery.matches) setMobileSheetOpen(false);
    };

    closeSheetOnDesktop();
    desktopQuery.addEventListener("change", closeSheetOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeSheetOnDesktop);
  }, []);

  useEffect(() => {
    const handleRandom = () => {
      const pool = filtered.filter((p) => !unavailableIds.has(p.id));
      const randomPrompt = pool[Math.floor(Math.random() * pool.length)];
      if (randomPrompt) {
        setSelected(randomPrompt);
        setMobileSheetOpen(shouldOpenMobileSheet());
      }
    };

    window.addEventListener("catalog:random", handleRandom);
    return () => window.removeEventListener("catalog:random", handleRandom);
  }, [filtered, unavailableIds]);

  const availableFiltered = filtered.filter((p) => !unavailableIds.has(p.id));
  const visible = availableFiltered.slice(0, visibleLimit);

  return (
    <section id="catalog" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="mb-10">
          <span className="mb-6 inline-flex items-center gap-3 font-mono text-sm text-muted-foreground">
            <span className="h-px w-8 bg-foreground/30" />
            CATALOG
          </span>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="font-display text-4xl tracking-tight lg:text-6xl">Prompt Catalog</h2>
            <p className="font-mono text-sm text-muted-foreground">
              {loading ? "로딩 중..." : error ? "데이터 로드 실패" : `${prompts.length.toLocaleString("en-US")} prompts`}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-3 font-mono text-xs text-muted-foreground">빠른 필터</p>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`px-4 py-1.5 font-mono text-sm transition-all duration-200 ${
                  activeTag === tag ? "bg-foreground text-background" : "border border-foreground/20 hover:border-foreground/50"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <p className="mb-3 font-mono text-xs text-muted-foreground">추천 검색어</p>
          <div className="flex flex-wrap gap-2">
            {popularPills.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setQuery(pill.term);
                  if (searchRef.current) searchRef.current.value = pill.term;
                }}
                className="border border-foreground/10 px-3 py-1 font-mono text-xs text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center border border-foreground/20 transition-colors focus-within:border-foreground">
            <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="search"
              placeholder="poster, product, UI, photo..."
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="cursor-pointer border border-foreground/20 bg-background px-4 py-3 font-mono text-sm outline-none transition-colors hover:border-foreground/40"
          >
            <option value="recommended">추천순</option>
            <option value="featured">Featured 먼저</option>
            <option value="popular">인기순</option>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </select>
        </div>

        <div className="mb-6 flex border-b border-foreground/10">
          {[
            { value: "all", label: "전체" },
            { value: "featured", label: "Featured" },
            { value: "reference", label: "참조 필요" },
            { value: "media", label: "소스 이미지" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`-mb-px border-b-2 px-4 py-2 font-mono text-sm transition-all ${
                activeFilter === f.value ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mb-8 flex gap-6 font-mono text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{availableFiltered.length.toLocaleString("en-US")}</strong> results
          </span>
          <span>
            <strong className="text-foreground">{prompts.length.toLocaleString("en-US")}</strong> total
          </span>
          {selected && (
            <span>
              선택됨: <strong className="text-foreground">#{selected.rank ?? selected.id}</strong>
            </span>
          )}
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse border border-foreground/10 bg-foreground/5" />
                ))}
              </div>
            ) : error ? (
              <div className="py-24 text-center font-mono text-sm text-muted-foreground">
                <p>카탈로그 데이터를 불러오지 못했습니다.</p>
                <p className="mt-2 text-xs opacity-60">로컬 개발 서버가 실행 중인지 확인하세요.</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-24 text-center font-mono text-sm text-muted-foreground">결과가 없습니다.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visible.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      isSelected={selected?.id === p.id}
                      onClick={() => {
                        setSelected(p);
                        setMobileSheetOpen(shouldOpenMobileSheet());
                      }}
                      onUnavailable={() => {
                        setUnavailableIds((prev) => new Set(prev).add(p.id));
                        if (selected?.id === p.id) setSelected(null);
                      }}
                      onPreview={(image) => {
                        setSelected(p);
                        setMobileSheetOpen(false);
                        setPreview({ prompt: p, image });
                      }}
                    />
                  ))}
                </div>

                {visibleLimit < availableFiltered.length && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      className="gap-2 rounded-full border-foreground/20"
                      onClick={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                    >
                      <ChevronDown className="h-4 w-4" />더 보기 ({(availableFiltered.length - visibleLimit).toLocaleString("en-US")}개 남음)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:sticky lg:top-24 lg:block">
            {selected ? (
              <DetailView prompt={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 border border-foreground/10 p-12 text-center">
                <Search className="h-8 w-8 text-foreground/20" />
                <strong className="font-mono text-sm">프롬프트를 선택하세요</strong>
                <span className="text-xs text-muted-foreground">
                  아이템을 선택하면 이미지와 소스 프롬프트를 볼 수 있습니다.
                </span>
              </div>
            )}
          </div>

          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="bottom" className="h-[85vh] overflow-y-auto p-0 lg:hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>{selected?.title ?? "프롬프트 상세"}</SheetTitle>
              </SheetHeader>
              {selected && <DetailView prompt={selected} onClose={() => setMobileSheetOpen(false)} />}
            </SheetContent>
          </Sheet>
          {preview && (
            <PromptPreviewOverlay
              prompt={preview.prompt}
              image={preview.image}
              onClose={() => setPreview(null)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
