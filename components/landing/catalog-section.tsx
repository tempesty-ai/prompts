"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink, ChevronDown, Search, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const DATA_URL = "/nanobanana-trending-prompts/prompts-ko.json";
const PAGE_SIZE = 40;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
const R2_IMAGE_EXTS = ["jpg", "png", "webp", "gif"];

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

function PromptThumbnail({ prompt }: { prompt: Prompt }) {
  const [extIndex, setExtIndex] = useState(0);
  const [r2Failed, setR2Failed] = useState(false);
  const [sourceFailed, setSourceFailed] = useState(false);
  const r2 = r2ImageUrl(prompt.id, R2_IMAGE_EXTS[extIndex]);
  const sourceImage = prompt.media?.[0] || prompt.media_thumbnails?.[0] || "";

  if (r2 && !r2Failed) {
    return (
      <div className="relative aspect-video overflow-hidden bg-foreground/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={r2}
          alt={`${prompt.title} generated thumbnail`}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => {
            if (extIndex < R2_IMAGE_EXTS.length - 1) {
              setExtIndex((prev) => prev + 1);
            } else {
              setR2Failed(true);
            }
          }}
        />
        <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-background/80 px-1.5 py-0.5">
          R2
        </span>
      </div>
    );
  }

  if (sourceImage && !sourceFailed) {
    return (
      <div className="relative aspect-video overflow-hidden bg-foreground/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceImage}
          alt={`${prompt.title} source thumbnail`}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setSourceFailed(true)}
        />
        <span className="absolute bottom-2 right-2 text-[10px] font-mono bg-background/80 px-1.5 py-0.5">
          Source
        </span>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-foreground/5 flex flex-col items-center justify-center gap-1 px-4">
      <ImageOff className="w-6 h-6 text-foreground/20" />
      <span className="text-[10px] font-mono text-foreground/30 text-center line-clamp-2">
        {prompt.title}
      </span>
    </div>
  );
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border transition-all duration-200 hover:border-foreground/30 ${
        isSelected ? "border-foreground bg-foreground/5" : "border-foreground/10 bg-background"
      }`}
    >
      <PromptThumbnail prompt={prompt} />
      <div className="p-4">
        <h3 className="font-medium text-sm mb-1 line-clamp-2">{prompt.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{prompt.description}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {prompt.featured && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-foreground text-background">
              Featured
            </span>
          )}
          {prompt.need_reference_images && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/30">
              Reference
            </span>
          )}
          {(prompt.media?.length ?? 0) > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10">
              Source {prompt.media!.length}
            </span>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
            #{prompt.rank ?? prompt.id}
          </span>
        </div>
      </div>
    </button>
  );
}

function DetailView({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [showImages, setShowImages] = useState(false);
  const formattedPrompt = formatPromptContent(prompt.prompt || prompt.original_prompt || "");

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(formattedPrompt);
    toast.success("Source prompt copied");
  };

  const copyKoreanized = async () => {
    await navigator.clipboard.writeText(koreanizedWrapper(prompt));
    window.open("https://chatgpt.com", "_blank");
    toast.success("Korean-ready prompt copied. Paste it into ChatGPT.", { duration: 5000 });
  };

  return (
    <div className="border border-foreground/10 bg-background h-full flex flex-col">
      <div className="px-6 py-5 border-b border-foreground/10 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1 mb-2">
            {prompt.featured && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-foreground text-background">
                Featured
              </span>
            )}
            {prompt.need_reference_images && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/30">
                Reference needed
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
              #{prompt.id}
            </span>
            {prompt.model && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 border border-foreground/10 text-foreground/40">
                {prompt.model}
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
          Close
        </button>
      </div>

      <div className="px-6 py-4 border-b border-foreground/10 flex flex-wrap gap-2">
        <Button
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-xs h-8 gap-1.5"
          onClick={copyKoreanized}
        >
          <Copy className="w-3 h-3" />
          Copy Korean-ready prompt
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-xs h-8 gap-1.5 border-foreground/20"
          onClick={copyPrompt}
        >
          <Copy className="w-3 h-3" />
          Copy source prompt
        </Button>
        {(prompt.media?.length ?? 0) > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs h-8 border-foreground/20"
            onClick={() => setShowImages(!showImages)}
          >
            Source images {showImages ? "Hide" : "Show"}
          </Button>
        )}
        {prompt.source_link && (
          <a
            href={prompt.source_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono h-8 px-3 border border-foreground/10 rounded-full"
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {prompt.need_reference_images && (
        <div className="px-6 py-3 bg-foreground/5 border-b border-foreground/10 text-xs text-muted-foreground leading-relaxed">
          This prompt expects a reference image. Use the copied Korean-ready prompt with an appropriate input image.
        </div>
      )}

      {showImages && (prompt.media?.length ?? 0) > 0 && (
        <div className="px-6 py-4 border-b border-foreground/10 flex gap-2 overflow-x-auto">
          {prompt.media!.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`${prompt.title} source image ${i + 1}`}
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

function dateDesc(a: Prompt, b: Prompt) {
  return new Date(b.source_published_at ?? 0).getTime() - new Date(a.source_published_at ?? 0).getTime();
}

export function CatalogSection() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filtered, setFiltered] = useState<Prompt[]>([]);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTag, setActiveTag] = useState<(typeof quickTags)[0] | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const applyFilter = useCallback(
    (allPrompts: Prompt[], q: string, filter: string, tag: (typeof quickTags)[0] | null, sortKey: string) => {
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
        featured: (a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0) || Number(a.rank ?? 999999) - Number(b.rank ?? 999999),
        newest: dateDesc,
        oldest: (a, b) => new Date(a.source_published_at ?? 0).getTime() - new Date(b.source_published_at ?? 0).getTime(),
        title: (a, b) => a.title.localeCompare(b.title),
      };

      result.sort(sorters[sortKey] || sorters.featured);
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

  const visible = filtered.slice(0, visibleLimit);

  return (
    <section id="catalog" className="relative py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            CATALOG
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="text-4xl lg:text-6xl font-display tracking-tight">
              Trending Prompt Catalog
            </h2>
            <p className="text-muted-foreground font-mono text-sm">
              {loading ? "Loading..." : error ? "Failed to load data" : `${prompts.length.toLocaleString("en-US")} prompts`}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-mono text-muted-foreground mb-3">Quick filters</p>
          <div className="flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`text-sm px-4 py-1.5 border transition-all duration-200 font-mono ${
                  activeTag === tag ? "bg-foreground text-background border-foreground" : "border-foreground/20 hover:border-foreground/50"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <p className="text-xs font-mono text-muted-foreground mb-3">Popular searches</p>
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

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <label className="flex-1 flex items-center border border-foreground/20 focus-within:border-foreground transition-colors">
            <Search className="w-4 h-4 ml-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search poster, product, UI, photo..."
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
            <option value="featured">Featured first</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div className="flex gap-0 mb-6 border-b border-foreground/10">
          {[
            { value: "all", label: "All" },
            { value: "featured", label: "Featured" },
            { value: "reference", label: "Reference needed" },
            { value: "media", label: "Source image" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2 text-sm font-mono border-b-2 transition-all -mb-px ${
                activeFilter === f.value ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-6 mb-8 text-sm font-mono text-muted-foreground">
          <span>
            <strong className="text-foreground">{filtered.length.toLocaleString("en-US")}</strong> results
          </span>
          <span>
            <strong className="text-foreground">{prompts.length.toLocaleString("en-US")}</strong> total
          </span>
          {selected && (
            <span>
              Selected: <strong className="text-foreground">#{selected.rank ?? selected.id}</strong>
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="border border-foreground/10 aspect-[4/3] animate-pulse bg-foreground/5" />
                ))}
              </div>
            ) : error ? (
              <div className="py-24 text-center text-muted-foreground font-mono text-sm">
                <p>Could not load catalog data.</p>
                <p className="mt-2 text-xs opacity-60">Make sure the local dev server is running.</p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-24 text-center text-muted-foreground font-mono text-sm">
                No results.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visible.map((p) => (
                    <PromptCard
                      key={p.id}
                      prompt={p}
                      isSelected={selected?.id === p.id}
                      onClick={() => {
                        setSelected(p);
                        setMobileSheetOpen(true);
                      }}
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
                      Load more ({(filtered.length - visibleLimit).toLocaleString("en-US")} left)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="hidden lg:block lg:sticky lg:top-24">
            {selected ? (
              <DetailView prompt={selected} onClose={() => setSelected(null)} />
            ) : (
              <div className="border border-foreground/10 p-12 flex flex-col items-center justify-center text-center gap-3">
                <Search className="w-8 h-8 text-foreground/20" />
                <strong className="font-mono text-sm">Select a prompt</strong>
                <span className="text-xs text-muted-foreground">
                  Pick an item to view details and copy prompts.
                </span>
              </div>
            )}
          </div>

          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="bottom" className="lg:hidden h-[85vh] overflow-y-auto p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{selected?.title ?? "Prompt details"}</SheetTitle>
              </SheetHeader>
              {selected && <DetailView prompt={selected} onClose={() => setMobileSheetOpen(false)} />}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
}
