const DATA_URL = "./youmind-gpt-image-2-ko/prompts-ko.json";
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

const state = {
  prompts: [],
  filtered: [],
  selected: null,
  activeFilter: "all",
  activeTag: null,
  visibleLimit: PAGE_SIZE,
  query: "",
  sort: "featured",
};

const els = {
  quickTags: document.querySelector("#quickTags"),
  dataSummary: document.querySelector("#dataSummary"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  visibleCount: document.querySelector("#visibleCount"),
  totalCount: document.querySelector("#totalCount"),
  selectedId: document.querySelector("#selectedId"),
  promptList: document.querySelector("#promptList"),
  loadMore: document.querySelector("#loadMore"),
  detailEmpty: document.querySelector("#detailEmpty"),
  detailView: document.querySelector("#detailView"),
  copyCurrent: document.querySelector("#copyCurrent"),
  copyKoreanized: document.querySelector("#copyKoreanized"),
  heroRandom: document.querySelector("#heroRandom"),
  heroCopy: document.querySelector("#heroCopy"),
  heroPromptTitle: document.querySelector("#heroPromptTitle"),
  heroPromptDesc: document.querySelector("#heroPromptDesc"),
  heroPreviewArt: document.querySelector(".window-art"),
  toast: document.querySelector("#toast"),
};

function textOf(prompt) {
  return [
    prompt.title,
    prompt.description,
    prompt.prompt,
    prompt.author_name,
    prompt.language,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesTag(prompt, tag) {
  if (!tag) return true;
  const haystack = textOf(prompt);
  return tag.terms.some((term) => haystack.includes(term.toLowerCase()));
}

function applyFilter() {
  const query = state.query.trim().toLowerCase();

  state.filtered = state.prompts.filter((prompt) => {
    if (state.activeFilter === "featured" && !prompt.featured) return false;
    if (state.activeFilter === "reference" && !prompt.need_reference_images) return false;
    if (state.activeFilter === "media" && (!prompt.media || prompt.media.length === 0)) return false;
    if (!matchesTag(prompt, state.activeTag)) return false;
    if (!query) return true;
    return textOf(prompt).includes(query);
  });

  sortFiltered();
  state.visibleLimit = PAGE_SIZE;
  render();
}

function sortFiltered() {
  const sorters = {
    featured: (a, b) => Number(b.featured) - Number(a.featured) || dateDesc(a, b),
    newest: dateDesc,
    oldest: (a, b) => new Date(a.source_published_at) - new Date(b.source_published_at),
    title: (a, b) => a.title.localeCompare(b.title, "ko"),
  };

  state.filtered.sort(sorters[state.sort] || sorters.featured);
}

function dateDesc(a, b) {
  return new Date(b.source_published_at) - new Date(a.source_published_at);
}

function render() {
  els.totalCount.textContent = state.prompts.length.toLocaleString("ko-KR");
  els.visibleCount.textContent = state.filtered.length.toLocaleString("ko-KR");
  els.selectedId.textContent = state.selected?.id || "-";

  renderHero();
  renderList();
  renderDetail();
}

function renderHero() {
  const prompt = state.selected || state.prompts[0];
  if (!prompt || !els.heroPromptTitle || !els.heroPromptDesc) return;
  els.heroPromptTitle.textContent = prompt.title || "프롬프트";
  els.heroPromptDesc.textContent = prompt.description || "상세 설명을 확인하세요.";
  const image = getPreviewImage(prompt, "full");
  if (els.heroPreviewArt) {
    if (image) {
      els.heroPreviewArt.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.42)), url("${image}")`;
      els.heroPreviewArt.classList.add("has-image");
      els.heroPreviewArt.innerHTML = "<strong>원본 예시</strong><small>결과 한글화로 새로 생성</small>";
    } else {
      els.heroPreviewArt.style.backgroundImage = "";
      els.heroPreviewArt.classList.remove("has-image");
      els.heroPreviewArt.innerHTML = "<strong>AI IMAGE</strong><small>Korean Output Ready</small>";
    }
  }
}

function renderList() {
  const visible = state.filtered.slice(0, state.visibleLimit);
  els.promptList.innerHTML = visible.map(renderCard).join("");
  els.loadMore.hidden = state.visibleLimit >= state.filtered.length;

  els.promptList.querySelectorAll(".prompt-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.id);
      state.selected = state.prompts.find((prompt) => prompt.id === id);
      render();
    });
  });
}

function renderCard(prompt) {
  const active = state.selected?.id === prompt.id ? " active" : "";
  const image = getPreviewImage(prompt, "card");
  const thumb = image
    ? `<div class="prompt-thumb"><img src="${escapeAttr(image)}" alt="${escapeAttr(prompt.title)} 원본 예시" loading="lazy" /><span>원본 예시</span></div>`
    : `<div class="prompt-thumb empty-thumb"><strong>G2</strong><span>미리보기 없음</span></div>`;
  const badges = [
    prompt.featured ? '<span class="pill featured">추천</span>' : "",
    prompt.need_reference_images ? '<span class="pill reference">레퍼런스</span>' : "",
    prompt.media?.length ? `<span class="pill">원본 예시 ${prompt.media.length}</span>` : "",
    `<span class="pill">ID ${prompt.id}</span>`,
  ].join("");

  return `
    <button class="prompt-card${active}" type="button" data-id="${prompt.id}">
      ${thumb}
      <div class="prompt-card-body">
        <h3>${escapeHtml(prompt.title || "Untitled")}</h3>
        <p>${escapeHtml(prompt.description || "설명이 없습니다.")}</p>
        <div class="meta-row">${badges}</div>
      </div>
    </button>
  `;
}

function renderDetail() {
  const prompt = state.selected;
  if (!prompt) {
    els.detailEmpty.classList.remove("hidden");
    els.detailView.classList.add("hidden");
    els.detailView.innerHTML = "";
    return;
  }

  els.detailEmpty.classList.add("hidden");
  els.detailView.classList.remove("hidden");

  const koreanOutputPrompt = koreanizedWrapper(prompt);

  const images = (prompt.media || [])
    .map((src) => `<img src="${escapeAttr(src)}" alt="${escapeAttr(prompt.title)} 원본 예시" loading="lazy" />`)
    .join("");

  els.detailView.innerHTML = `
    <header class="detail-head">
      <div class="meta-row">
        ${prompt.featured ? '<span class="pill featured">추천</span>' : ""}
        ${prompt.need_reference_images ? '<span class="pill reference">레퍼런스 이미지 필요</span>' : ""}
        <span class="pill">ID ${prompt.id}</span>
        <span class="pill">${escapeHtml(prompt.language || "unknown")}</span>
      </div>
      <h2>${escapeHtml(prompt.title)}</h2>
      <p>${escapeHtml(prompt.description || "")}</p>
    </header>
    <div class="detail-actions">
      <button type="button" data-action="copy-k">결과 한글화 복사</button>
      <button type="button" data-action="copy">원본 복사</button>
      ${images ? '<button type="button" data-action="toggle-images">원본 예시 보기</button>' : ""}
      ${prompt.source_link ? `<a href="${escapeAttr(prompt.source_link)}" target="_blank" rel="noreferrer">출처 열기</a>` : ""}
    </div>
    <div class="hidden-source-note">
      원본 예시 이미지는 중국어/일본어/영어 등 외국어 텍스트가 포함될 수 있습니다. 한국어 결과 이미지는 아래 "결과 한글화 복사" 프롬프트로 새로 생성해야 합니다.
    </div>
    ${images ? `<div class="image-strip" data-images>${images}</div>` : ""}
    <pre class="prompt-code">${escapeHtml(koreanOutputPrompt)}</pre>
  `;

  els.detailView.querySelector('[data-action="copy"]').addEventListener("click", () => copyPrompt(prompt));
  els.detailView.querySelector('[data-action="copy-k"]').addEventListener("click", () => copyKoreanized(prompt));
  const toggleImages = els.detailView.querySelector('[data-action="toggle-images"]');
  toggleImages?.addEventListener("click", () => {
    const imageStrip = els.detailView.querySelector("[data-images]");
    const isHidden = imageStrip.classList.toggle("hidden");
    toggleImages.textContent = isHidden ? "원본 예시 보기" : "원본 예시 숨기기";
  });
}

function getPreviewImage(prompt, quality = "card") {
  const full = prompt.media?.[0] || "";
  const thumb = prompt.media_thumbnails?.[0] || "";
  if (quality === "full") return full || thumb;
  return upscaleThumbnailUrl(full || thumb);
}

function upscaleThumbnailUrl(url) {
  if (!url) return "";
  return url
    .replace(/-300x\d+(?=\.[a-zA-Z]+(?:\?|$))/, "-600x600")
    .replace(/@small(?=$|\?)/, "@medium");
}

function renderTags() {
  els.quickTags.innerHTML = quickTags
    .map((tag, index) => `<button class="tag-button" type="button" data-tag="${index}">${tag.label}</button>`)
    .join("");

  els.quickTags.querySelectorAll(".tag-button").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = quickTags[Number(button.dataset.tag)];
      state.activeTag = state.activeTag === tag ? null : tag;
      els.quickTags.querySelectorAll(".tag-button").forEach((item) => item.classList.remove("active"));
      if (state.activeTag) button.classList.add("active");
      applyFilter();
      document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function koreanizedWrapper(prompt) {
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

async function copyPrompt(prompt) {
  if (!prompt) return showToast("선택된 프롬프트가 없습니다");
  await navigator.clipboard.writeText(formatPromptContent(prompt.prompt || ""));
  showToast("프롬프트를 복사했습니다");
}

async function copyKoreanized(prompt) {
  if (!prompt) return showToast("선택된 프롬프트가 없습니다");
  await navigator.clipboard.writeText(koreanizedWrapper(prompt));
  showToast("결과 한글화 프롬프트를 복사했습니다");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 1800);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function formatPromptContent(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const fenced = text.match(/^```(?:json|text)?\s*([\s\S]*?)\s*```$/i);
  const clean = fenced ? fenced[1].trim() : text;

  try {
    return JSON.stringify(JSON.parse(clean), null, 2);
  } catch {
    return clean
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.activeFilter = button.dataset.filter;
      applyFilter();
    });
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    applyFilter();
  });

  els.sortSelect.addEventListener("change", () => {
    state.sort = els.sortSelect.value;
    applyFilter();
  });

  els.loadMore.addEventListener("click", () => {
    state.visibleLimit += PAGE_SIZE;
    renderList();
  });

  els.copyCurrent.addEventListener("click", () => copyPrompt(state.selected));
  els.copyKoreanized.addEventListener("click", () => copyKoreanized(state.selected));
  els.heroCopy?.addEventListener("click", () => copyPrompt(state.selected));
  els.heroRandom?.addEventListener("click", () => {
    if (!state.prompts.length) return;
    state.selected = state.prompts[Math.floor(Math.random() * state.prompts.length)];
    state.query = "";
    els.searchInput.value = "";
    applyFilter();
    document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll("[data-popular]").forEach((button) => {
    button.addEventListener("click", () => {
      state.query = button.dataset.popular || "";
      els.searchInput.value = state.query;
      applyFilter();
      document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const ticker = document.querySelector(".ticker-track");
  if (ticker) {
    ticker.innerHTML = ticker.innerHTML + ticker.innerHTML;
  }
}

async function init() {
  renderTags();
  bindEvents();

  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Failed to load ${DATA_URL}`);
    const data = await response.json();
    state.prompts = data.prompts || [];
    state.selected = state.prompts[0] || null;
    els.dataSummary.textContent = `${state.prompts.length.toLocaleString("ko-KR")}개 프롬프트 로드 완료`;
    applyFilter();
  } catch (error) {
    els.dataSummary.textContent = "데이터 로드 실패";
    els.promptList.innerHTML = `<p class="empty-state">데이터를 불러오지 못했습니다. 로컬 서버로 열어주세요.</p>`;
    console.error(error);
  }
}

init();
