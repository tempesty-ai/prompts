import fs from "node:fs";
import path from "node:path";

const SOURCE_URL =
  "https://raw.githubusercontent.com/jau123/nanobanana-trending-prompts/main/prompts/prompts.json";
const OUTPUT_DIR = path.resolve("public/nanobanana-trending-prompts");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "prompts-ko.json");

function truncate(value, max) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trim()}...`;
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/\?+\s+/g, "")
    .replace(/\s+\?+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();
}

function titleFromPrompt(item) {
  const categories = Array.isArray(item.categories) ? item.categories.join(" / ") : "";
  const model = item.model === "gptimage" ? "GPT Image" : "NanoBanana";
  const prefix = categories || model;
  return `${prefix} trending prompt #${item.rank}`;
}

function descriptionFromPrompt(item) {
  const bits = [];
  if (item.likes) bits.push(`${Number(item.likes).toLocaleString("en-US")} likes`);
  if (item.views) bits.push(`${Number(item.views).toLocaleString("en-US")} views`);
  if (item.date) bits.push(item.date);
  return bits.join(" | ");
}

function normalize(item) {
  const id = String(item.id || "").trim();
  const images = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
  const prompt = sanitizeText(item.prompt || "");

  return {
    id,
    rank: item.rank,
    title: titleFromPrompt(item),
    description: descriptionFromPrompt(item),
    prompt,
    original_prompt: prompt,
    language: "mixed",
    featured: Number(item.rank) <= 100 || Number(item.rating) >= 3,
    need_reference_images: /\[INPUT IMAGE|USER_PHOTO|REFERENCE/i.test(item.prompt || ""),
    media: images,
    media_thumbnails: images,
    source_link: item.source_url || "",
    source_published_at: item.date ? `${item.date}T00:00:00.000Z` : "",
    author_name: sanitizeText(item.author_name || item.author || ""),
    author_link: item.author ? `https://x.com/${item.author}` : "",
    model: item.model || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    likes: item.likes || 0,
    views: item.views || 0,
    score: item.score || 0,
    image: item.image || images[0] || "",
    slug: `nanobanana-${item.rank}-${id}`,
    search_text: truncate(`${prompt} ${item.author_name || ""} ${item.categories?.join(" ") || ""}`, 300),
  };
}

async function main() {
  console.log(`Fetching ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch prompts: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const safeText = text.replace(/("id"\s*:\s*)(\d{16,})/g, '$1"$2"');
  const raw = JSON.parse(safeText);
  if (!Array.isArray(raw)) {
    throw new Error("Expected upstream prompts JSON to be an array");
  }

  const prompts = raw.map(normalize).filter((item) => item.id);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    OUTPUT_FILE,
    `${JSON.stringify(
      {
        source: {
          name: "jau123/nanobanana-trending-prompts",
          url: "https://github.com/jau123/nanobanana-trending-prompts",
          data_url: SOURCE_URL,
          license: "CC BY 4.0",
        },
        total: prompts.length,
        count: prompts.length,
        prompts,
      },
      null,
      2
    )}\n`
  );

  console.log(`Wrote ${prompts.length} prompts to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
