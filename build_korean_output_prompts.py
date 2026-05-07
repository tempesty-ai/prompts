import csv
import json
from pathlib import Path


SOURCE = Path("youmind-gpt-image-2-ko/prompts-ko.json")
OUT_DIR = Path("youmind-gpt-image-2-ko")


def format_prompt_content(value):
    text = (value or "").strip()
    if not text:
        return ""
    if text.startswith("```") and text.endswith("```"):
        lines = text.splitlines()
        if len(lines) >= 3:
            text = "\n".join(lines[1:-1]).strip()
    try:
        return json.dumps(json.loads(text), ensure_ascii=False, indent=2)
    except json.JSONDecodeError:
        while "\n\n\n" in text:
            text = text.replace("\n\n\n", "\n\n")
        return text.strip()


def wrap_for_korean_output(prompt):
    formatted_prompt = format_prompt_content(prompt.get("prompt", ""))
    return f"""아래 원본 프롬프트로 이미지를 생성하되, 최종 이미지 안에 보이는 모든 외국어 텍스트를 자연스러운 한국어로 바꿔서 생성하세요.

결과물 한글화 규칙:
- 중국어, 일본어, 영어 등 이미지 안에 표시될 모든 문구, 간판, 버튼, UI 라벨, 주석, 표 제목, 말풍선, 포스터 카피를 한국어로 변경
- 원본 프롬프트의 구도, 스타일, 카메라, 색감, 정보 밀도, 시각적 장점은 유지
- 외국 도시명, 음식명, 브랜드명이 결과물의 핵심이 아니라면 한국 사용자가 자연스럽게 이해할 수 있는 한국어 표현으로 현지화
- 실제 브랜드 로고가 필수가 아니면 가상의 한국어 브랜드명으로 대체
- 한글은 또렷하고 맞춤법이 정확해야 하며, 깨진 글자, 가짜 한글, 의미 없는 자모 조합을 만들지 말 것
- 한국어 텍스트가 들어가는 영역은 글자가 잘리지 않게 여백과 자간을 충분히 확보
- 단, 코드/모델명/제품명처럼 고유명사로 유지해야 하는 텍스트는 그대로 두되 주변 설명은 한국어로 작성

원본 제목:
{prompt.get("title", "")}

원본 설명:
{prompt.get("description", "")}

원본 프롬프트:
{formatted_prompt}"""


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    prompts = []

    for prompt in data["prompts"]:
        next_prompt = dict(prompt)
        next_prompt["prompt"] = format_prompt_content(next_prompt.get("prompt", ""))
        next_prompt["original_prompt"] = format_prompt_content(next_prompt.get("original_prompt", ""))
        next_prompt["prompt_for_korean_output"] = wrap_for_korean_output(prompt)
        prompts.append(next_prompt)

    json_path = OUT_DIR / "prompts-korean-output.json"
    jsonl_path = OUT_DIR / "prompts-korean-output.jsonl"
    csv_path = OUT_DIR / "prompts-korean-output.csv"

    json_path.write_text(
        json.dumps(
            {
                "source": str(SOURCE),
                "count": len(prompts),
                "purpose": "Keep original prompt structure, but instruct the image result to replace visible foreign-language text with natural Korean.",
                "prompts": prompts,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    with jsonl_path.open("w", encoding="utf-8", newline="\n") as file:
        for prompt in prompts:
            file.write(json.dumps(prompt, ensure_ascii=False) + "\n")

    fields = [
        "id",
        "title",
        "description",
        "prompt",
        "prompt_for_korean_output",
        "source_link",
        "featured",
        "need_reference_images",
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for prompt in prompts:
            writer.writerow({field: prompt.get(field, "") for field in fields})

    print(
        json.dumps(
            {
                "count": len(prompts),
                "files": [str(json_path), str(jsonl_path), str(csv_path)],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
