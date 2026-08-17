const HOUSE_MEMBER_KEY = "ai41.member.email";
const HOUSE_LOOKS_KEY = "ai41.house.looks";
const FREE_LOOKS = 5;

function memberEmail() {
  return localStorage.getItem(HOUSE_MEMBER_KEY) || "";
}

function looksToday() {
  const raw = localStorage.getItem(HOUSE_LOOKS_KEY);
  const today = new Date().toISOString().slice(0, 10);
  try {
    const row = JSON.parse(raw || "{}");
    if (row.day !== today) return { day: today, n: 0 };
    return { day: today, n: Number(row.n) || 0 };
  } catch {
    return { day: today, n: 0 };
  }
}

function bumpLook() {
  if (memberEmail()) return looksToday();
  const row = looksToday();
  row.n += 1;
  localStorage.setItem(HOUSE_LOOKS_KEY, JSON.stringify(row));
  return row;
}

function gated() {
  return !memberEmail() && looksToday().n >= FREE_LOOKS;
}

let houseMap = null;
let houseLayer = null;
let catalog = null;

function setStatus(msg) {
  const el = document.getElementById("houseStatus");
  if (el) el.textContent = msg || "";
}

function officialButtons(placeLabel) {
  const o = catalog?.official || {};
  const q = encodeURIComponent(placeLabel || "서울");
  return [
    { key: "auction", href: o.auction?.url, label: "법원 경매 열기" },
    { key: "onbid", href: o.onbid?.url, label: "온비드 공매 열기" },
    { key: "moa", href: o.moa?.url, label: "모아주택 열기" },
  ]
    .map((b) => {
      if (!b.href) return "";
      return `<a class="mail-btn" href="${b.href}" target="_blank" rel="noopener noreferrer">${b.label}</a>`;
    })
    .join(" ")
    + `<p class="house-hint">공식 창에서 「${placeLabel || "서울"}」로 검색하세요. 사건 원문은 여기 없습니다.</p>`;
}

function pinColor(kind) {
  if (kind === "moa") return "#03c75a";
  if (kind === "auction") return "#c45c26";
  if (kind === "onbid") return "#5a84b8";
  return "#3d628f";
}

function renderList(items) {
  const box = document.getElementById("houseList");
  if (!box) return;
  if (!items.length) {
    box.innerHTML = "<p class='page-copy'>이 동네 안내 지점이 아직 없어요. 구를 바꾸거나 공식 사이트를 열어 보세요.</p>";
    return;
  }
  box.innerHTML = items
    .map(
      (it) => `<button type="button" class="house-hit" data-id="${it.id || it.gu}">
        <b>${it.name || it.gu}</b>
        <span>${it.gu || ""} ${it.dong || ""} · 모아주택 안내</span>
      </button>`
    )
    .join("");
  box.querySelectorAll(".house-hit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const it = items.find((x) => (x.id || x.gu) === btn.getAttribute("data-id"));
      if (it) focusPlace(it);
    });
  });
}

function clearPins() {
  if (houseLayer) {
    houseLayer.clearLayers();
    return;
  }
  houseLayer = L.layerGroup().addTo(houseMap);
}

function addPin(item, kind) {
  const m = L.circleMarker([item.lat, item.lon], {
    radius: 8,
    color: pinColor(kind),
    fillColor: pinColor(kind),
    fillOpacity: 0.85,
    weight: 1,
  });
  m.bindPopup(
    `<strong>${item.name || item.gu}</strong><br>${item.note || item.gu || ""}`
  );
  m.addTo(houseLayer);
  return m;
}

function focusPlace(item) {
  if (!houseMap || !item?.lat) return;
  houseMap.setView([item.lat, item.lon], 14);
  document.getElementById("houseOfficial").innerHTML = officialButtons(item.name || item.gu);
  setStatus(`${item.name || item.gu} · 지도와 공식 창을 같이 보세요.`);
}

async function runSearch(q) {
  const query = String(q || "").trim();
  if (!query) {
    setStatus("구·동을 적어 주세요. 예: 송파구, 화곡동");
    return;
  }
  if (gated()) {
    setStatus("오늘은 둘러보기 횟수가 끝났어요. 가입하면 계속 볼 수 있어요.");
    document.getElementById("houseGate")?.removeAttribute("hidden");
    return;
  }
  bumpLook();
  const layer = document.querySelector(".house-tab.active")?.dataset.layer || "all";
  try {
    const res = await fetch(`/api/house/search?q=${encodeURIComponent(query)}&layer=${encodeURIComponent(layer)}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "fail");
    clearPins();
    const pins = data.moa || [];
    pins.forEach((p) => addPin(p, "moa"));
    renderList(pins);
    const place = data.place;
    if (place?.lat) {
      houseMap.setView([place.lat, place.lon], 13);
      addPin({ lat: place.lat, lon: place.lon, name: place.label || query, gu: place.gu }, layer);
    } else {
      const geo = await fetch(`/api/maps/geocode?q=${encodeURIComponent(query + " 서울")}`);
      const g = await geo.json();
      if (g.ok && g.place) {
        houseMap.setView([g.place.lat, g.place.lon], 13);
      }
    }
    document.getElementById("houseOfficial").innerHTML = officialButtons(place?.label || query);
    setStatus(data.disclaimer || "");
    if (!memberEmail() && looksToday().n >= FREE_LOOKS - 1) {
      document.getElementById("houseGate")?.removeAttribute("hidden");
    }
  } catch (e) {
    setStatus("검색이 안 됐어요. 구 이름만 다시 적어 보세요.");
  }
}

function initMap(moa) {
  houseMap = L.map("houseMap").setView([37.5665, 126.9780], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 18,
  }).addTo(houseMap);
  clearPins();
  (moa || []).forEach((p) => addPin(p, "moa"));
  renderList(moa || []);
}

async function bootHouse() {
  const res = await fetch("/api/house/catalog");
  catalog = await res.json();
  initMap(catalog.moa);
  document.getElementById("houseOfficial").innerHTML = officialButtons("서울");
  setStatus(catalog.disclaimer || "");
  if (memberEmail()) {
    document.getElementById("houseGate")?.setAttribute("hidden", "");
  }
  const params = new URLSearchParams(location.search);
  const q = params.get("q");
  if (q) {
    const input = document.getElementById("houseQ");
    if (input) input.value = q;
    runSearch(q);
  }
}

document.getElementById("houseForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch(document.getElementById("houseQ")?.value);
});

document.querySelectorAll(".house-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".house-tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const layer = btn.dataset.layer;
    const q = document.getElementById("houseQ")?.value;
    if (q) runSearch(q);
    else {
      document.getElementById("houseOfficial").innerHTML = officialButtons("서울");
      setStatus(
        layer === "auction"
          ? "경매는 법원 창이 원문입니다. 동네를 고르면 그 구로 찾아보라고 안내해요."
          : layer === "onbid"
            ? "공매는 온비드가 원문입니다."
            : layer === "moa"
              ? "초록 점은 서울 모아주택·모아타운 안내 지점입니다."
              : catalog?.disclaimer || ""
      );
    }
  });
});

document.getElementById("houseWatch")?.addEventListener("click", () => {
  const area = document.getElementById("houseQ")?.value || "";
  location.href = "/join?area=" + encodeURIComponent(area);
});

bootHouse().catch(() => setStatus("지도를 불러오지 못했어요."));
