# Korean GPT Image 2 Prompt Pack

원본 참고: https://github.com/YouMind-OpenLab/awesome-gpt-image-2

이 문서는 원본 저장소의 GPT Image 2 프롬프트 패턴을 한국형 사용 사례로 재구성한 작업용 프롬프트 팩입니다. 단순 번역보다 "한국에서 바로 써먹는 이미지 결과물"에 맞췄습니다.

## 사용법

- `{argument name="..." default="..."}` 부분만 바꿔서 반복 생성합니다.
- 한글 텍스트가 들어가는 프롬프트는 "모든 한글은 또렷하고 맞춤법이 정확해야 함"을 유지합니다.
- 브랜드, 유명인, 실제 서비스 UI를 쓸 때는 필요한 경우 가상의 이름으로 바꿔 상업적 리스크를 줄입니다.

## 1. 서울 봄 포스터

```text
2026년 봄 서울 도시 포스터를 제작하세요. 깨끗한 미색 한지 질감 배경 위에 넓은 여백을 두고, 하단 오른쪽에는 작은 한강 유람선 한 척이 잔잔한 물결 위를 지나갑니다. 배가 남긴 물결은 위쪽으로 역동적인 붓글씨 곡선을 그리며 한강의 흐름으로 변하고, 그 안에 서울의 대표 장면들이 손으로 그린 듯 겹겹이 펼쳐집니다.

포함 요소: 남산서울타워, 경복궁 근정전, 북촌 한옥 지붕선, 잠수교, 여의도 스카이라인, 석촌호수 벚꽃, 광화문 광장, 청계천, 성수동 붉은 벽돌 건물, 을지로 간판 골목의 은은한 조명.

분위기: 맑은 봄 아침, 연한 안개, 따뜻한 금빛 햇살, 담백한 축제감, 세련된 도시 관광 포스터, 과밀하지 않은 구성, 한글 제목 "서울의 봄 2026"은 상단 왼쪽에 또렷하고 우아하게 배치. 한글은 절대 깨지지 않게 렌더링.
```

## 2. 부산 미식 도보 지도

```json
{
  "type": "illustrated Korean city food map infographic",
  "style": "watercolor and ink hand-drawn illustration on lightly aged paper, cheerful but refined travel editorial look",
  "title_section": {
    "text": "부산 미식 도보 지도",
    "mascot": "cartoon seagull wearing sunglasses and holding a fish cake skewer"
  },
  "layout": {
    "background": "textured beige paper map with blue coastline, yellow walking routes, green park areas",
    "landmarks": ["해운대", "광안대교", "자갈치시장", "감천문화마을", "부산타워", "송도 케이블카"],
    "food_spots": ["돼지국밥", "밀면", "씨앗호떡", "어묵", "곰장어", "동래파전", "물떡", "회", "비빔당면", "부산식 떡볶이"],
    "legend": ["맛집", "랜드마크", "바다", "도보 루트", "사진 명소"]
  },
  "text_requirements": "모든 라벨은 한국어로 또렷하고 읽기 쉽게, 오타 없이 렌더링. 지도는 귀엽지만 관광 안내 책자처럼 실용적으로 구성."
}
```

## 3. 한국형 제품 분해도 포스터

```json
{
  "type": "exploded view product diagram poster",
  "subject": "{argument name=\"product\" default=\"프리미엄 접이식 무선 이어버드 케이스\"}",
  "style": "clean high-tech 3D render, Korean consumer electronics ad, studio lighting, precise callout labels",
  "background": "{argument name=\"background\" default=\"warm white and pale mint gradient\"}",
  "header": {
    "logo": "{argument name=\"brand\" default=\"HANEUL AUDIO\"}",
    "subtitle": "{argument name=\"catchphrase\" default=\"작지만 정교하게, 하루를 더 선명하게.\"}"
  },
  "layout": {
    "centerpiece": "vertically stacked exploded view showing outer shell, hinge, battery cell, wireless charging coil, LED indicator, magnetic earbuds dock, internal frame, silicone gasket",
    "callout_labels": [
      "초경량 알루미늄 쉘\n손에 닿는 순간 느껴지는 단단한 마감.",
      "무선 충전 코일\n책상 위에 올려두기만 해도 간편하게 충전.",
      "저전력 배터리 셀\n출퇴근과 이동 시간을 넉넉하게 지원.",
      "자석식 도킹 구조\n이어버드를 정확하고 안정적으로 고정.",
      "생활 방수 실링\n가벼운 비와 땀에도 안심."
    ],
    "footer": "모든 한글 설명은 고대비로 선명하게, 제품 광고 포스터처럼 고급스럽고 절제된 느낌."
  }
}
```

## 4. 카카오톡 스타일 조선 왕실 단체방

```text
스마트폰 메신저 화면을 조선 왕실 단체방처럼 구성한 유머러스한 역사 콘텐츠 이미지를 만드세요. 전체 화면은 한국 모바일 메신저 UI를 연상시키지만 특정 실제 앱 로고는 사용하지 않습니다.

상단 제목: "조선왕조실록 단체방"
참여자: 세종대왕, 장영실, 황희, 신숙주

대화 예시:
- 세종대왕: "백성을 위한 새 글자를 만들고 있소."
- 장영실: "측우기도 같이 테스트해보겠습니다."
- 황희: "전하, 일정은 내일 의정부 회의 후가 좋겠습니다."
- 신숙주: "발음 표기 체계 초안 정리했습니다."

UI 요구사항: 말풍선, 시간 표시, 읽음 표시, 작은 프로필 초상화, 하단 입력창. 배경은 은은한 한지 질감. 역사 교육 카드처럼 품격 있게, 너무 밈처럼 가볍지 않게. 모든 한글은 선명하고 정확해야 함.
```

## 5. 배달앱 신메뉴 상세 이미지

```text
한국 배달앱의 프리미엄 신메뉴 상세 대표 이미지를 제작하세요. 제품은 "{argument name="menu" default="들기름 묵은지 냉소바"}"입니다.

구성: 정사각형 전자상거래 메인 이미지. 중앙에는 음식이 매우 먹음직스럽게 놓이고, 주변에는 재료 클로즈업이 작게 배치됩니다. 상단에는 큰 한글 제목 "{argument name="headline" default="고소함이 먼저 오고, 시원함이 오래 남는다"}"를 넣습니다. 하단에는 3개의 짧은 배지: "국산 들기름", "묵은지 토핑", "여름 한정".

스타일: 한국 푸드 광고 사진, 자연광, 세라믹 그릇, 차가운 육수의 투명감, 절제된 소품, 과한 색보정 없이 신선하고 고급스럽게. 모든 한글 텍스트는 광고 배너처럼 또렷하고 오타 없이 렌더링.
```

## 6. 네이버 블로그 썸네일 카드

```text
한국 여행 블로그용 썸네일 이미지를 만드세요. 주제는 "{argument name="theme" default="혼자 걷기 좋은 제주 동쪽 하루 코스"}"입니다.

화면비: 16:9. 왼쪽에는 실제 여행 사진 같은 풍경: 성산일출봉이 멀리 보이는 해안 산책로, 낮은 돌담, 유채꽃, 맑은 바다. 오른쪽에는 편집된 카드형 타이포그래피 영역을 두되 카드 테두리는 과하게 만들지 않습니다.

텍스트:
큰 제목: "제주 동쪽 하루 코스"
작은 문구: "카페, 바다, 산책길까지 한 번에"
하단 태그: "#혼행 #제주여행 #뚜벅이코스"

스타일: 한국 블로그 썸네일, 밝고 깨끗한 편집 디자인, 모바일에서도 글자가 크게 읽힘. 모든 한글 정확.
```

## 7. K-뷰티 세럼 광고 컷

```text
K-뷰티 스킨케어 세럼의 프리미엄 광고 이미지를 제작하세요. 제품명은 "{argument name="product name" default="달빛 진정 세럼"}"입니다.

중앙에는 반투명 유리병 세럼이 서 있고, 주변에는 병풀 잎, 맑은 물방울, 얇은 세라믹 받침, 은은한 달빛 반사가 있습니다. 배경은 한국적 미감을 살린 옅은 청자색과 백자색의 조합. 상단 한글 카피: "피부에 내려앉는 고요한 진정". 하단 작은 문구: "민감한 날에도 편안하게".

스타일: 올리브영/백화점 뷰티 광고 수준의 상업 사진, 깨끗한 제품 조명, 과장 없는 광택, 고급스러운 여백. 제품 라벨과 한글 카피는 선명하고 정확해야 함.
```

## 8. 한국 직장인 발표 슬라이드

```text
"한국 직장인 회의 자료" 느낌의 고밀도 설명 슬라이드를 만드세요. 주제는 "{argument name="topic" default="2026년 AI 도입 로드맵"}"입니다.

스타일은 공공기관 보고서의 정보 밀도와 스타트업 피치덱의 깔끔함을 결합합니다. 배경은 흰색, 포인트 컬러는 청록과 짙은 회색. 레이아웃은 다음으로 고정:

상단: 제목 "2026년 AI 도입 로드맵"과 한 줄 요약
왼쪽: 현재 문제 3가지
중앙: 단계별 실행 계획 4단계
오른쪽: 기대 효과와 KPI
하단: 리스크와 대응 방안

아이콘은 단순하고 실무적이어야 하며, 모든 한글 텍스트는 실제 PPT처럼 읽을 수 있어야 합니다. 장식적인 포스터가 아니라 회의실에서 바로 보여줄 수 있는 슬라이드.
```

## 9. 한국 웹툰 캐릭터 설정표

```json
{
  "type": "Korean webtoon character reference sheet",
  "character": "{argument name=\"character\" default=\"밤마다 편의점에서 일하는 초능력 신입 알바생\"}",
  "style": "clean Korean webtoon production sheet, polished line art, soft cel shading, readable Korean annotations",
  "layout": {
    "center": "full-body front pose of the main character wearing convenience store uniform jacket, sneakers, name tag, slightly tired but determined expression",
    "left": "three facial expressions: sleepy, surprised, focused",
    "right": "detail callouts for uniform patch, mysterious glowing bracelet, phone screen, name tag",
    "bottom": "color palette, height, personality keywords, story hook"
  },
  "korean_text": ["이름: 한도윤", "키: 174cm", "성격: 무심하지만 책임감 있음", "능력: 손끝으로 작은 전자기기를 멈춘다"],
  "requirements": "한글 주석은 또렷하고 정확하게. 캐릭터 설정표처럼 실용적이고 웹툰 제작자가 바로 참고할 수 있게."
}
```

## 10. 한국 사극 의상 인포그래픽

```text
한국 사극 의상 정보 그래픽을 제작하세요. 주제는 "{argument name="costume" default="조선 후기 양반가 여성의 외출복"}"입니다.

전체 스타일: 국립박물관 전시 패널과 복식 도감의 중간 느낌. 배경은 미색 한지, 포인트는 먹색, 연지색, 옅은 금색. 중앙에는 실제 인물 전신 정면 포즈를 배치하고, 주변에 구성 요소를 선으로 연결해 설명합니다.

필수 섹션:
- 상단: 제목과 시대 설명
- 왼쪽: 저고리, 치마, 장신구 구조
- 오른쪽: 소재, 색, 문양의 의미
- 하단: 착용 순서와 핵심 특징 요약

텍스트는 모두 한국어. "저고리", "치마", "노리개", "비녀", "당의", "한삼" 같은 용어는 정확히 표기. 코스프레나 판타지풍이 아니라 고증 자료 같은 차분한 정보 디자인.
```

## 11. 한국형 라이브커머스 화면

```json
{
  "type": "Korean live commerce UI mockup",
  "subject": {
    "description": "friendly host presenting premium stainless kimchi container set in a bright kitchen studio",
    "background": "clean Korean home shopping set, warm kitchen lights, neatly arranged side dishes"
  },
  "ui_overlay": {
    "top_header": "host avatar, name '살림연구소', viewer count '12.8만 시청 중', red follow button '팔로우'",
    "chat_messages": [
      "김민지: 김치 냄새 진짜 안 배나요?",
      "살림초보: 4개 세트 구성 좋아요",
      "오늘살게요: 지금 쿠폰 적용되나요?"
    ],
    "product_card": "오늘 특가 39,900원, 무료배송, 남은 수량 128개",
    "buttons": ["구매하기", "쿠폰받기", "공유"]
  },
  "style": "realistic Korean mobile live shopping screenshot, polished UI, high contrast readable Korean text, product clearly visible, no actual brand logos"
}
```

## 12. 한국 앱 홈 화면 목업

```text
한국 사용자를 위한 개인 예산 관리 앱의 모바일 홈 화면 UI 목업을 제작하세요. 앱 이름은 "{argument name="app name" default="머니온도"}"입니다.

화면: iPhone 세로 스크린샷. 상단에는 오늘 날짜와 사용자 인사말 "지민님, 이번 달 지출 온도는 안정적이에요". 중앙에는 월 예산 진행률 링 차트, 이번 달 지출액 "842,500원", 남은 예산 "357,500원". 아래에는 카테고리별 지출 카드 4개: 식비, 교통, 쇼핑, 구독. 하단 탭은 홈, 내역, 예산, 리포트, 설정.

스타일: 한국 핀테크 앱처럼 신뢰감 있고 조용한 디자인. 흰 배경, 차콜 텍스트, 민트와 코랄 포인트, 둥글지만 과하지 않은 컴포넌트. 모든 한글과 숫자는 선명하고 실제 앱처럼 정렬.
```

## 추가 변환 규칙

1. 해외 도시 포스터는 한국 도시의 대표 장소, 계절감, 한글 제목으로 바꿉니다.
2. 중국/일본 UI 밈은 한국 메신저, 커뮤니티, 라이브커머스, 블로그, 배달앱 문법으로 바꿉니다.
3. 제품 분해도는 한국어 콜아웃과 실제 쇼핑몰/광고 문장 톤을 넣습니다.
4. 지도형 프롬프트는 지역 음식, 랜드마크, 이동 동선을 함께 넣어야 결과가 풍성합니다.
5. 한글 타이포 결과물이 목적이면 "모든 한글은 또렷하고 정확하게, 오타와 깨진 글자 금지"를 마지막에 한 번 더 씁니다.
