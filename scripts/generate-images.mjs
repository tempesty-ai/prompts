import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_DATA = "public/nanobanana-trending-prompts/prompts-ko.json";
const DEFAULT_OUTPUT = "generated-r2-queue";
const OUTPUT_EXTS = ["png", "jpg", "jpeg", "webp"];

function parseArgs(argv) {
  const args = {
    data: DEFAULT_DATA,
    output: DEFAULT_OUTPUT,
    limit: 20,
    offset: 0,
    ids: null,
    model: "gpt-image-1-mini",
    quality: "low",
    size: "1024x1024",
    format: "png",
    concurrency: 1,
    delay: 0,
    dryRun: false,
    force: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--data") args.data = next();
    else if (arg === "--output") args.output = next();
    else if (arg === "--limit") args.limit = Number(next());
    else if (arg === "--offset") args.offset = Number(next());
    else if (arg === "--ids") args.ids = next().split(",").map((id) => id.trim()).filter(Boolean);
    else if (arg === "--model") args.model = next();
    else if (arg === "--quality") args.quality = next();
    else if (arg === "--size") args.size = next();
    else if (arg === "--format") args.format = next();
    else if (arg === "--concurrency") args.concurrency = Number(next());
    else if (arg === "--delay") args.delay = Number(next());
    else throw new Error(`Unknown argument: ${arg}`);
  }

  args.limit = clampInteger(args.limit, 1, 1000, "limit");
  args.offset = clampInteger(args.offset, 0, 1000000, "offset");
  args.concurrency = clampInteger(args.concurrency, 1, 5, "concurrency");
  args.delay = clampInteger(args.delay, 0, 600000, "delay");
  return args;
}

function clampInteger(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`--${label} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function printHelp() {
  console.log(`Generate Korean catalog thumbnails with the OpenAI Images API.

Usage:
  npm run generate:images -- --limit 20
  npm run generate:images -- --ids 14036,13983 --quality low
  npm run generate:images -- --dry-run --limit 10

Options:
  --limit <n>        Number of missing prompts to generate. Default: 20
  --offset <n>       Skip this many eligible prompts before selecting. Default: 0
  --ids <csv>        Generate specific prompt IDs, e.g. 14036,13983
  --model <name>     Image model. Default: gpt-image-1-mini
  --quality <value>  low, medium, or high. Default: low
  --size <value>     1024x1024, 1024x1536, or 1536x1024. Default: 1024x1024
  --format <value>   png, jpeg, or webp. Default: png
  --concurrency <n>  Parallel requests, max 5. Default: 1
  --delay <ms>       Delay after each request. Default: 0
  --force            Regenerate even if an image file already exists
  --dry-run          Show the queue without calling the API

Environment:
  OPENAI_API_KEY must be set in the shell or .env.local.`);
}

function loadDotEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key]) continue;
    process.env[key] = raw.trim().replace(/^['"]|['"]$/g, "");
  }
}

function readPrompts(dataPath) {
  const fullPath = path.resolve(ROOT, dataPath);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!Array.isArray(data.prompts)) {
    throw new Error(`No prompts array found in ${dataPath}`);
  }
  return data.prompts;
}

function formatPromptContent(value) {
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

function buildImagePrompt(prompt) {
  const source = formatPromptContent(prompt.prompt || prompt.original_prompt || "");
  const trimmedSource = source.length > 12000 ? `${source.slice(0, 12000)}\n...` : source;
  return [
    "Create a polished Korean catalog thumbnail image based on the design prompt below.",
    "",
    "Hard requirements:",
    "- The final image must not contain Chinese, Japanese, mojibake, or garbled text.",
    "- If visible text is needed, use natural Korean only.",
    "- If exact text is uncertain, omit text or replace it with short Korean labels.",
    "- Preserve the intended visual style, subject, composition, and use case.",
    "- Make it suitable as a clean 16:9 web catalog thumbnail.",
    "",
    `Korean title: ${prompt.title || ""}`,
    `Korean description: ${prompt.description || ""}`,
    "",
    "Source prompt:",
    trimmedSource,
  ].join("\n");
}

function outputExtension(format) {
  return format === "jpeg" ? "jpg" : format;
}

function hasExistingImage(outputDir, id) {
  return OUTPUT_EXTS.some((ext) => fs.existsSync(path.join(outputDir, `${id}.${ext}`)));
}

function selectQueue(prompts, args, outputDir) {
  const byId = new Map(prompts.map((prompt) => [String(prompt.id), prompt]));
  const candidates = args.ids
    ? args.ids.map((id) => byId.get(id)).filter(Boolean)
    : prompts;

  return candidates
    .filter((prompt) => args.force || !hasExistingImage(outputDir, prompt.id))
    .slice(args.offset, args.offset + args.limit);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImage(prompt, args, outputDir) {
  const body = {
    model: args.model,
    prompt: buildImagePrompt(prompt),
    n: 1,
    size: args.size,
    quality: args.quality,
    output_format: args.format,
  };

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("Image response did not include data[0].b64_json");
  }

  const ext = outputExtension(json.output_format || args.format);
  const filePath = path.join(outputDir, `${prompt.id}.${ext}`);
  fs.writeFileSync(filePath, Buffer.from(b64, "base64"));
  return filePath;
}

function appendLog(outputDir, entry) {
  const logPath = path.join(outputDir, "generation-log.jsonl");
  fs.appendFileSync(logPath, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}

async function runWorker(workerId, queue, args, outputDir) {
  let failures = 0;
  while (queue.length) {
    const prompt = queue.shift();
    const label = `#${prompt.id} ${prompt.title || ""}`;
    try {
      console.log(`[${workerId}] generating ${label}`);
      const filePath = await generateImage(prompt, args, outputDir);
      console.log(`[${workerId}] saved ${filePath}`);
      appendLog(outputDir, { status: "ok", id: prompt.id, file: path.relative(ROOT, filePath) });
    } catch (err) {
      failures++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${workerId}] failed ${label}: ${message}`);
      appendLog(outputDir, { status: "error", id: prompt.id, error: message });
    }
    if (args.delay > 0) await sleep(args.delay);
  }
  return failures;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  loadDotEnvLocal();

  const outputDir = path.resolve(ROOT, args.output);
  fs.mkdirSync(outputDir, { recursive: true });

  const prompts = readPrompts(args.data);
  const queue = selectQueue(prompts, args, outputDir);

  console.log(`selected ${queue.length} prompt(s)`);
  for (const [index, prompt] of queue.entries()) {
    console.log(`${index + 1}. #${prompt.id} ${prompt.title || ""}`);
  }

  if (args.dryRun || queue.length === 0) return;
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your_")) {
    throw new Error("OPENAI_API_KEY is missing. Add it to .env.local or the current shell.");
  }
  if (!/^sk-/.test(process.env.OPENAI_API_KEY)) {
    throw new Error("OPENAI_API_KEY must be an OpenAI API key that starts with sk-. The current value is not an API key.");
  }

  const workers = Array.from({ length: args.concurrency }, (_, index) =>
    runWorker(index + 1, queue, args, outputDir)
  );
  const failures = (await Promise.all(workers)).reduce((sum, count) => sum + count, 0);
  if (failures > 0) {
    throw new Error(`${failures} image generation request(s) failed. See generation-log.jsonl for details.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
