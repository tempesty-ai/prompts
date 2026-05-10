"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Upload, CheckCircle, Circle, Search, ImageOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const DATA_URL = "/nanobanana-trending-prompts/prompts-ko.json";
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
const PAGE_SIZE = 60;
const R2_IMAGE_EXTS = ["jpg", "png", "webp", "gif"];

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
  featured?: boolean;
  need_reference_images?: boolean;
  media?: string[];
  media_thumbnails?: string[];
  source_link?: string;
  source_published_at?: string;
  author_name?: string;
}

type FilterType = "all" | "incomplete" | "complete";

function rankAsc(a: Prompt, b: Prompt) {
  return Number(a.rank ?? 999999) - Number(b.rank ?? 999999);
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

function r2ImageUrl(id: string | number, ext = "jpg") {
  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/prompts/${id}.${ext}` : "";
}

function PromptAdminCard({
  prompt,
  isComplete,
  onUploaded,
}: {
  prompt: Prompt;
  isComplete: boolean;
  onUploaded: (id: string, url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [r2ExtIndex, setR2ExtIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(() => {
    if (isComplete) return r2ImageUrl(prompt.id, R2_IMAGE_EXTS[0]);
    return prompt.media?.[0] || prompt.media_thumbnails?.[0] || "";
  });
  const [imgFailed, setImgFailed] = useState(false);

  const originalThumb = prompt.media?.[0] || prompt.media_thumbnails?.[0] || "";

  const handleUpload = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("id", String(prompt.id));

    try {
      const res = await fetch("/api/r2/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      const newUrl = json.url || r2ImageUrl(prompt.id);
      setPreviewUrl(newUrl);
      setImgFailed(false);
      onUploaded(prompt.id, newUrl);
      toast.success(`#${prompt.rank ?? prompt.id} 업로드됨`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const copyKorean = async () => {
    await navigator.clipboard.writeText(koreanizedWrapper(prompt));
    window.open("https://chatgpt.com", "_blank");
    toast.success("프롬프트를 복사했습니다. ChatGPT에 붙여넣으세요.", { duration: 4000 });
  };

  return (
    <div className={`border transition-all duration-200 ${isComplete ? "border-foreground/30 bg-foreground/3" : "border-foreground/10 bg-background"}`}>
      <div className="relative aspect-video overflow-hidden bg-white">
        {previewUrl && !imgFailed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={prompt.title}
              loading="lazy"
              className="w-full h-full object-contain"
              onError={() => {
                const isR2Probe = isComplete && previewUrl.includes(`/prompts/${prompt.id}.`);
                if (isR2Probe && r2ExtIndex < R2_IMAGE_EXTS.length - 1) {
                  const next = r2ExtIndex + 1;
                  setR2ExtIndex(next);
                  setPreviewUrl(r2ImageUrl(prompt.id, R2_IMAGE_EXTS[next]));
                } else if (previewUrl !== originalThumb && originalThumb) {
                  setPreviewUrl(originalThumb);
                } else {
                  setImgFailed(true);
                }
              }}
            />
            {isComplete && (
              <span className="absolute top-2 left-2 text-[10px] font-mono bg-foreground text-background px-1.5 py-0.5">
                R2
              </span>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <ImageOff className="w-5 h-5 text-foreground/20" />
            <span className="text-[10px] font-mono text-foreground/30">No preview</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-xs font-mono px-3 py-1.5 flex items-center gap-1.5">
            {uploading ? (
              "업로드 중..."
            ) : (
              <>
                <Upload className="w-3 h-3" />
                이미지 업로드
              </>
            )}
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          {isComplete ? (
            <CheckCircle className="w-3.5 h-3.5 text-foreground/60 shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-foreground/20 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium line-clamp-2 leading-snug">{prompt.title}</p>
            <span className="text-[10px] font-mono text-foreground/30">
              #{prompt.rank ?? prompt.id}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button
            size="sm"
            className="flex-1 h-7 text-[11px] bg-foreground text-background hover:bg-foreground/90 gap-1"
            onClick={copyKorean}
          >
            <Copy className="w-2.5 h-2.5" />
            Copy prompt
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px] border-foreground/20"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-2.5 h-2.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("incomplete");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [todayOnly, setTodayOnly] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(20);

  useEffect(() => {
    Promise.all([
      fetch(DATA_URL).then((r) => r.json()),
      fetch("/api/r2/list").then((r) => r.json()).catch(() => ({ ids: [] })),
    ]).then(([data, r2data]) => {
      setPrompts(data.prompts || []);
      setCompletedIds(new Set((r2data.ids || []).map(String)));
      setLoading(false);
    });
  }, []);

  const handleUploaded = useCallback((id: string) => {
    setCompletedIds((prev) => new Set([...prev, id]));
  }, []);

  const filteredAll = prompts
    .filter((p) => {
      if (filter === "complete" && !completedIds.has(p.id)) return false;
      if (filter === "incomplete" && completedIds.has(p.id)) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return p.title.toLowerCase().includes(q) || String(p.rank ?? "").includes(q) || p.id.includes(q);
    })
    .sort((a, b) => {
      if (filter === "all") {
        return Number(completedIds.has(a.id)) - Number(completedIds.has(b.id)) || rankAsc(a, b);
      }

      return rankAsc(a, b);
    });

  const filtered = todayOnly && filter === "incomplete" ? filteredAll.slice(0, dailyLimit) : filteredAll;
  const visible = filtered.slice(0, visibleLimit);
  const total = prompts.length;
  const done = completedIds.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-10">
          <span className="text-xs font-mono text-muted-foreground">ADMIN</span>
          <h1 className="text-3xl font-display mt-1 mb-6">생성 이미지 대기열</h1>

          <div className="border border-foreground/10 p-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-2xl font-mono font-medium">
                  {done.toLocaleString("en-US")}
                  <span className="text-base text-muted-foreground font-normal">
                    {" / "}
                    {total.toLocaleString("en-US")}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">업로드 / 전체</p>
              </div>
              <p className="text-4xl font-display text-foreground/40">{pct}%</p>
            </div>
            <div className="w-full bg-foreground/10 h-1.5">
              <div className="bg-foreground h-1.5 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-2">
              남은 항목 {(total - done).toLocaleString("en-US")}개
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="flex items-center border border-foreground/20 flex-1 focus-within:border-foreground transition-colors">
            <Search className="w-4 h-4 ml-3 text-muted-foreground shrink-0" />
            <input
              type="search"
              placeholder="title, rank, ID 검색..."
              autoComplete="off"
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleLimit(PAGE_SIZE);
              }}
              className="flex-1 px-3 py-2.5 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex gap-0 border border-foreground/20">
            {[
              { value: "all", label: "All" },
              { value: "incomplete", label: "Incomplete" },
              { value: "complete", label: "Complete" },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => {
                  setFilter(f.value as FilterType);
                  setVisibleLimit(PAGE_SIZE);
                }}
                className={`px-4 py-2.5 text-sm font-mono transition-colors ${
                  filter === f.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filter === "incomplete" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 border border-foreground/10 p-3">
            <button
              type="button"
              onClick={() => {
                setTodayOnly((prev) => !prev);
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`px-3 py-2 text-xs font-mono border transition-colors ${
                todayOnly ? "bg-foreground text-background border-foreground" : "border-foreground/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily queue only
            </button>
            <label className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              Daily target
              <input
                type="number"
                min={1}
                max={200}
                value={dailyLimit}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setDailyLimit(Number.isFinite(next) ? Math.min(200, Math.max(1, next)) : 20);
                  setVisibleLimit(PAGE_SIZE);
                }}
                className="w-20 px-2 py-1.5 bg-background border border-foreground/20 text-foreground outline-none focus:border-foreground"
              />
            </label>
            <span className="text-xs font-mono text-muted-foreground">
              {todayOnly ? `처음 ${filtered.length.toLocaleString("en-US")}개 미완료 항목 표시` : "모든 미완료 항목 표시"}
            </span>
          </div>
        )}

        <p className="text-xs font-mono text-muted-foreground mb-6">
          <strong className="text-foreground">{filtered.length.toLocaleString("en-US")}</strong> items
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="border border-foreground/10 aspect-[3/4] animate-pulse bg-foreground/5" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground font-mono text-sm">
            {filter === "complete" ? "완료된 항목이 없습니다." : filter === "incomplete" ? "미완료 항목이 없습니다." : "결과가 없습니다."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {visible.map((p) => (
                <PromptAdminCard
                  key={p.id}
                  prompt={p}
                  isComplete={completedIds.has(p.id)}
                  onUploaded={handleUploaded}
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
                  더 보기 ({(filtered.length - visibleLimit).toLocaleString("en-US")}개 남음)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
