import csv
import json
import math
import time
import urllib.error
import urllib.request
from pathlib import Path


API_URL = "https://youmind.com/youhome-api/prompts"
MODEL = "gpt-image-2"
LOCALE = "ko-KR"
LIMIT = 200
OUT_DIR = Path("youmind-gpt-image-2-ko")


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Origin": "https://youmind.com",
    "Referer": "https://youmind.com/ko-KR/gpt-image-2-prompts",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json; charset=utf-8",
}


def post_json(payload, retries=4):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(API_URL, data=data, headers=HEADERS, method="POST")

    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.HTTPError as exc:
            if exc.code in {429, 500, 502, 503, 504} and attempt < retries - 1:
                time.sleep(2**attempt)
                continue
            raise
        except urllib.error.URLError:
            if attempt < retries - 1:
                time.sleep(2**attempt)
                continue
            raise


def prompt_text(prompt):
    return prompt.get("translatedContent") or prompt.get("content") or ""


def normalize_prompt(prompt):
    return {
        "id": prompt.get("id"),
        "title": prompt.get("title") or "",
        "description": prompt.get("description") or "",
        "prompt": prompt_text(prompt),
        "original_prompt": prompt.get("content") or "",
        "language": prompt.get("language") or "",
        "source_link": prompt.get("sourceLink") or "",
        "source_published_at": prompt.get("sourcePublishedAt") or "",
        "author_name": (prompt.get("author") or {}).get("name") or "",
        "author_link": (prompt.get("author") or {}).get("link") or "",
        "media": prompt.get("media") or [],
        "media_thumbnails": prompt.get("mediaThumbnails") or [],
        "featured": bool(prompt.get("featured")),
        "need_reference_images": bool(prompt.get("needReferenceImages")),
        "slug": prompt.get("slug") or "",
    }


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_jsonl(path, prompts):
    with path.open("w", encoding="utf-8", newline="\n") as file:
        for prompt in prompts:
            file.write(json.dumps(prompt, ensure_ascii=False) + "\n")


def write_csv(path, prompts):
    fields = [
        "id",
        "title",
        "description",
        "prompt",
        "language",
        "source_link",
        "source_published_at",
        "author_name",
        "author_link",
        "featured",
        "need_reference_images",
        "slug",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for prompt in prompts:
            writer.writerow({field: prompt.get(field, "") for field in fields})


def write_markdown(path, prompts, total):
    lines = [
        "# YouMind GPT Image 2 Prompts - Korean",
        "",
        f"- Source: https://youmind.com/ko-KR/gpt-image-2-prompts",
        f"- Model: `{MODEL}`",
        f"- Locale: `{LOCALE}`",
        f"- Total fetched: `{len(prompts)}` / reported `{total}`",
        "",
        "## Prompts",
        "",
    ]

    for index, prompt in enumerate(prompts, start=1):
        lines.extend(
            [
                f"### {index}. {prompt['title']}",
                "",
                f"- ID: `{prompt['id']}`",
                f"- Author: {prompt['author_name']}",
                f"- Source: {prompt['source_link']}",
                f"- Published: {prompt['source_published_at']}",
                f"- Featured: `{str(prompt['featured']).lower()}`",
                f"- Need reference images: `{str(prompt['need_reference_images']).lower()}`",
                "",
                "Description:",
                "",
                prompt["description"],
                "",
                "Prompt:",
                "",
                "```text",
                prompt["prompt"].strip(),
                "```",
                "",
            ]
        )

        if prompt["media"]:
            lines.append("Images:")
            lines.append("")
            for media in prompt["media"]:
                lines.append(f"- {media}")
            lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def main():
    OUT_DIR.mkdir(exist_ok=True)

    first = post_json({"model": MODEL, "page": 1, "limit": LIMIT, "locale": LOCALE})
    total = int(first.get("total") or 0)
    total_pages = int(first.get("totalPages") or math.ceil(total / LIMIT) or 1)
    prompts = [normalize_prompt(item) for item in first.get("prompts", [])]
    seen = {prompt["id"] for prompt in prompts}

    print(f"page 1/{total_pages}: {len(prompts)} prompts, reported total {total}")

    for page in range(2, total_pages + 1):
        data = post_json({"model": MODEL, "page": page, "limit": LIMIT, "locale": LOCALE})
        page_prompts = []
        for item in data.get("prompts", []):
            normalized = normalize_prompt(item)
            if normalized["id"] not in seen:
                seen.add(normalized["id"])
                page_prompts.append(normalized)
        prompts.extend(page_prompts)
        print(f"page {page}/{total_pages}: +{len(page_prompts)} => {len(prompts)}")
        time.sleep(0.25)

    prompts.sort(key=lambda item: (not item["featured"], item["source_published_at"], item["id"]))

    write_json(OUT_DIR / "prompts-ko.json", {"total": total, "count": len(prompts), "prompts": prompts})
    write_jsonl(OUT_DIR / "prompts-ko.jsonl", prompts)
    write_csv(OUT_DIR / "prompts-ko.csv", prompts)
    write_markdown(OUT_DIR / "prompts-ko.md", prompts, total)

    summary = {
        "source": "https://youmind.com/ko-KR/gpt-image-2-prompts",
        "model": MODEL,
        "locale": LOCALE,
        "reported_total": total,
        "fetched_count": len(prompts),
        "files": [
            "prompts-ko.json",
            "prompts-ko.jsonl",
            "prompts-ko.csv",
            "prompts-ko.md",
        ],
    }
    write_json(OUT_DIR / "summary.json", summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
