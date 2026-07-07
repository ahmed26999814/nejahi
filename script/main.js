"use strict";

const PAGE_SIZE = 1000;
const SUPABASE = window.SUPABASE_CONFIG || {};

const state = {
  students: [],
  selectedStudent: null,
  selectedTrack: "all",
  statsReady: false,
};

const dom = {
  html: document.documentElement,
  form: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  formMessage: document.getElementById("formMessage"),
  loader: document.getElementById("loader"),
  resultArea: document.getElementById("resultArea"),
  globalStats: document.getElementById("globalStats"),
  trackSelect: document.getElementById("trackSelect"),
  trackStats: document.getElementById("trackStats"),
  toppersList: document.getElementById("toppersList"),
  themeToggle: document.getElementById("themeToggle"),
};

document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  applySavedTheme();
  bindEvents();
  renderStatsLoading();
  loadDashboardData();
}

function bindEvents() {
  dom.form.addEventListener("submit", handleSearch);
  dom.trackSelect.addEventListener("change", (event) => {
    state.selectedTrack = event.target.value;
    renderTrackDashboard();
  });
  dom.themeToggle.addEventListener("click", toggleTheme);
}

async function loadDashboardData() {
  try {
    await renderGlobalStatsFast();

    state.students = await fetchAllResults();
    state.statsReady = true;

    renderGlobalStats();
    renderTrackOptions();
    renderTrackDashboard();
  } catch (error) {
    console.error(error);
    dom.globalStats.innerHTML = statCard("حالة البيانات", "تعذر التحميل");
    dom.toppersList.innerHTML =
      `<p class="form-message error">تعذر تحميل الإحصائيات من Supabase.</p>`;
  }
}

async function fetchAllResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({
      select: "Numero,NOM,TS,MOD,KR,WL,MS",
      limit: PAGE_SIZE,
      offset: from,
    });

    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareStudents(rows);
}

async function handleSearch(event) {
  event.preventDefault();
  clearMessage();

  const query = dom.searchInput.value.trim();
  if (!query) {
    showMessage("يرجى إدخال رقم المترشح أو الاسم.", "error");
    dom.searchInput.focus();
    return;
  }

  if (query.length < 2) {
    showMessage("أدخل رقمًا أو اسمًا من حرفين على الأقل.", "error");
    dom.searchInput.focus();
    return;
  }

  showLoader(true);

  try {
    const rows = await searchResults(query);
    showLoader(false);

    if (!rows.length) {
      state.selectedStudent = null;
      renderNotFound(query);
      showMessage("لم يتم العثور على نتيجة بهذا الرقم أو الاسم.", "error");
      return;
    }

    const students = prepareStudents(rows);
    if (students.length === 1) {
      state.selectedStudent = withKnownRank(students[0]);
      renderResult(state.selectedStudent);
    } else {
      renderSearchMatches(students.map(withKnownRank), query);
    }

    dom.resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error(error);
    showLoader(false);
    showMessage("حدث خطأ أثناء الاتصال بقاعدة البيانات.", "error");
  }
}

async function searchResults(query) {
  const value = escapePostgrestValue(query);
  const isNumeroSearch = /^[0-9A-Za-z-]+$/.test(query);

  return supabaseRequest({
    select: "Numero,NOM,TS,MOD,KR,WL,MS",
    or: isNumeroSearch ? `(Numero.eq.${value},NOM.ilike.*${value}*)` : "",
    NOM: isNumeroSearch ? "" : `ilike.*${value}*`,
    limit: 20,
  });
}

async function supabaseRequest(params) {
  if (!SUPABASE.url || !SUPABASE.anonKey || !SUPABASE.table) {
    throw new Error("Missing Supabase configuration.");
  }

  const url = new URL(`${SUPABASE.url}/rest/v1/${SUPABASE.table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${details}`);
  }

  return response.json();
}

function prepareStudents(rows) {
  const normalized = rows
    .map((row, index) => {
      const mod = getColumn(row, "MOD", "mod");
      const track = cleanText(getColumn(row, "TS", "ts", "Serie", "serie") || "غير محددة");

      return {
        id: String(getColumn(row, "Numero", "numero", "NUMERO", "N", "id") ?? "").trim(),
        name: cleanText(getColumn(row, "NOM", "nom", "Nom", "name") || "اسم غير متوفر"),
        ts: cleanText(getColumn(row, "TS", "ts") || "غير محدد"),
        track,
        MOD: mod,
        kr: cleanText(getColumn(row, "KR", "kr") || ""),
        wl: cleanText(getColumn(row, "WL", "wl") || ""),
        ms: cleanText(getColumn(row, "MS", "ms") || ""),
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  const byId = new Map(sorted.map((student) => [student.id, student]));
  return [...byId.values()];
}

function getColumn(row, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
  }
  return "";
}

function withKnownRank(student) {
  const known = state.students.find((item) => item.id === student.id);
  return known ? { ...student, rank: known.rank } : student;
}

function parseAverage(value) {
  if (!value) return 0;
  return Number(String(value).replace(",", ".").trim()) || 0;
}

function getAverage(student) {
  return parseAverage(student.MOD);
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function renderResult(student) {
  const average = parseAverage(student.MOD);
  const officialStatus = getOfficialStatus(student.kr);
  const funMessage = getAverageMessage(average);

  dom.resultArea.innerHTML = `
    <article class="result-card" id="resultCard">
      <div class="result-banner">
        <h2>${escapeHtml(student.name)}</h2>
        <p>الحالة الرسمية: ${escapeHtml(officialStatus.label)}</p>
      </div>
      <div class="result-body">
        <div class="info-grid">
          ${infoItem(iconUser(), "الاسم الكامل", student.name)}
          ${infoItem(iconHash(), "رقم المترشح", student.id)}
          ${infoItem(iconChart(), "المعدل", parseAverage(student.MOD).toFixed(2))}
          ${infoItem(iconCheck(), "الحالة الرسمية", renderStatusBadge(officialStatus), true)}
          ${infoItem(iconBook(), "الشعبة", student.track)}
          ${infoItem(iconSchool(), "المؤسسة", student.ms || "غير متوفرة")}
          ${infoItem(iconMap(), "الولاية", student.wl || "غير متوفرة")}
          ${infoItem(iconAward(), "الترتيب", student.rank ? `#${student.rank}` : "غير متوفر")}
        </div>
        <div class="grade-message">
          <span>رسالة المعدل</span>
          <strong>${escapeHtml(funMessage)}</strong>
        </div>
        <div class="result-actions">
          <button class="action-button" type="button" data-action="print">${iconPrinter()} <span>تحميل PDF</span></button>
          <button class="action-button" type="button" data-action="share">${iconShare()} <span>مشاركة النتيجة</span></button>
        </div>
      </div>
    </article>
  `;

  dom.resultArea.querySelector("[data-action='share']").addEventListener("click", () => shareResult(student));
  dom.resultArea.querySelector("[data-action='print']").addEventListener("click", () => window.print());
}

function renderSearchMatches(students, query) {
  dom.resultArea.innerHTML = `
    <section class="result-card">
      <div class="result-banner">
        <h2>نتائج البحث عن ${escapeHtml(query)}</h2>
        <p>اختر المترشح المطلوب من النتائج المطابقة.</p>
      </div>
      <div class="result-body matches-list">
        ${students.map((student) => `
          <button class="match-card" type="button" data-id="${escapeAttribute(student.id)}">
            <strong>${escapeHtml(student.name)}</strong>
            <span>رقم ${escapeHtml(student.id)} - ${escapeHtml(student.track)} - معدل ${parseAverage(student.MOD).toFixed(2)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;

  dom.resultArea.querySelectorAll(".match-card").forEach((button) => {
    button.addEventListener("click", () => {
      const student = students.find((item) => item.id === button.dataset.id);
      if (!student) return;
      state.selectedStudent = student;
      renderResult(student);
    });
  });
}

function renderNotFound(query) {
  dom.resultArea.innerHTML = `
    <div class="empty-state">
      <span class="large-icon" aria-hidden="true">${iconSearch()}</span>
      <h2>لم نعثر على النتيجة</h2>
      <p>لا توجد نتيجة مرتبطة بالبحث عن ${escapeHtml(query)}. تأكد من رقم المترشح أو الاسم وحاول مرة أخرى.</p>
    </div>
  `;
}

function infoItem(icon, label, value, allowHtml = false) {
  const content = allowHtml ? value : escapeHtml(value);
  return `
    <div class="info-item">
      <span class="icon" aria-hidden="true">${icon}</span>
      <div>
        <span>${label}</span>
        <strong>${content}</strong>
      </div>
    </div>
  `;
}

async function countRows(filters = {}) {
  const url = new URL(`${SUPABASE.url}/rest/v1/${SUPABASE.table}`);

  url.searchParams.set("select", "id");
  url.searchParams.set("limit", "1");

  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, `eq.${value}`);
  });

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE.anonKey,
      Authorization: `Bearer ${SUPABASE.anonKey}`,
      Prefer: "count=exact",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load statistics");
  }

  const range = response.headers.get("content-range");
  return range ? Number(range.split("/")[1]) : 0;
}

async function renderGlobalStatsFast() {
  dom.globalStats.innerHTML = [
    statCard("عدد الطلاب", "..."),
    statCard("عدد الناجحين", "..."),
    statCard("عدد الراسبين", "..."),
    statCard("أعلى معدل", "..."),
    statCard("متوسط المعدلات", "...")
  ].join("");

  const [total, passed, failed] = await Promise.all([
    countRows(),
    countRows({ KR: "Admis" }),
    countRows({ KR: "Ajourné" }),
  ]);

  dom.globalStats.innerHTML = [
    statCard("عدد الطلاب", total),
    statCard("عدد الناجحين", passed),
    statCard("عدد الراسبين", failed),
    statCard("أعلى معدل", "يحسب لاحقًا"),
    statCard("متوسط المعدلات", "يحسب لاحقًا")
  ].join("");
}

function renderStatsLoading() {
  dom.globalStats.innerHTML = [
    statCard("عدد الطلاب", "..."),
    statCard("عدد الناجحين", "..."),
    statCard("عدد الراسبين", "..."),
    statCard("أعلى معدل", "..."),
    statCard("متوسط المعدلات", "..."),
  ].join("");
  dom.trackSelect.innerHTML = `<option value="all">كل الشعب</option>`;
  dom.trackStats.innerHTML = statCard("البيانات", "...");
  dom.toppersList.innerHTML = `<p class="form-message">جاري تحميل أوائل الشعب...</p>`;
}

function renderGlobalStats() {
  const stats = calculateStats(state.students);
  dom.globalStats.innerHTML = [
    statCard("عدد الطلاب", stats.total),
    statCard("عدد الناجحين", stats.passed),
    statCard("عدد الراسبين", stats.failed),
    statCard("أعلى معدل", formatAverage(stats.highest)),
    statCard("متوسط المعدلات", formatAverage(stats.average)),
  ].join("");
}

function renderTrackOptions() {
  const tracks = getTracks();
  dom.trackSelect.innerHTML = [
    `<option value="all">كل الشعب</option>`,
    ...tracks.map((track) => `<option value="${escapeAttribute(track)}">${escapeHtml(track)}</option>`),
  ].join("");
}

function renderTrackDashboard() {
  if (!state.statsReady) return;

  const students = filterByTrack(state.selectedTrack);
  const stats = calculateStats(students);
  const toppers = [...students].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex).slice(0, 3);

  dom.trackStats.innerHTML = [
    statCard("الطلاب", stats.total),
    statCard("النجاح", stats.passed),
    statCard("الأعلى", formatAverage(stats.highest)),
  ].join("");

  dom.toppersList.innerHTML = toppers.length
    ? toppers.map(renderTopper).join("")
    : `<p class="form-message">لا توجد بيانات كافية لهذه الشعبة.</p>`;
}

function renderTopper(student, index) {
  const medals = [iconTrophy(), iconMedal(), iconMedal()];
  const labels = ["المركز الأول", "المركز الثاني", "المركز الثالث"];
  return `
    <article class="topper-card">
      <div class="topper-head">
        <span class="medal">${index + 1}</span>
        <span class="icon" aria-hidden="true">${medals[index] || iconAward()}</span>
      </div>
      <strong>${escapeHtml(student.name)}</strong>
      <p>${labels[index] || "متميز"} في ${escapeHtml(student.track)} بمعدل ${parseAverage(student.MOD).toFixed(2)}. تهانينا على التفوق.</p>
    </article>
  `;
}

function calculateStats(students) {
  const total = students.length;
  const averages = students.map((student) => parseAverage(student.MOD));
  const passed = students.filter((student) => getOfficialStatus(student.kr).className === "admis").length;
  const failed = students.filter((student) => getOfficialStatus(student.kr).className === "ajourne").length;
  const highest = total ? Math.max(...averages) : 0;
  const average = total ? averages.reduce((sum, value) => sum + value, 0) / total : 0;
  return { total, passed, failed, highest, average };
}

function statCard(label, value) {
  return `
    <div class="stat-card">
      <div class="stat-icon" aria-hidden="true">${getStatIcon(label)}</div>
      <div>
        <span>${label}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </div>
    </div>
  `;
}

function getStatIcon(label) {
  if (label.includes("الطلاب") || label.includes("البيانات")) return iconUsers();
  if (label.includes("الناجح") || label.includes("النجاح")) return iconCheck();
  if (label.includes("الراسب")) return iconX();
  if (label.includes("أعلى") || label.includes("الأعلى")) return iconAward();
  if (label.includes("متوسط")) return iconChart();
  return iconChart();
}

function getTracks() {
  return [...new Set(state.students.map((student) => student.track).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

function filterByTrack(track) {
  return track === "all" ? state.students : state.students.filter((student) => student.track === track);
}

function getAverageMessage(average) {
  if (average >= 15 && average <= 20) return "انت مانك متكايس 😎🔥";
  if (average >= 13) return "انت حامي انجحت 💪🔥";
  if (average >= 10) return "نصر انجحت 🎉";
  if (average >= 9) return "انت ادكد ماتكرا انت ناجح 😅";
  if (average >= 8) return "اشتمر (ي) امع راسك لا تمشي فيه 😄";
  if (average >= 6) return "بعدنك انجحت 🙂";
  if (average >= 4) return "عادي تجبروا سنة جاي 🤝";
  if (average >= 2) return "الا حاول تكرا دور تنجح تعكب 📚";
  return "كالتك العنز 🐐";
}

function getOfficialStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized.includes("admis")) {
    return { label: "ناجح", icon: "✓", className: "admis" };
  }
  if (normalized.includes("sessionnaire")) {
    return { label: "دورة استدراكية", icon: "!", className: "sessionnaire" };
  }
  if (normalized.includes("absent")) {
    return { label: "غائب", icon: "-", className: "absent" };
  }
  if (normalized.includes("ajourn")) {
    return { label: "راسب", icon: "×", className: "ajourne" };
  }
  return { label: value ? cleanText(value) : "غير محددة", icon: "?", className: "unknown" };
}

function renderStatusBadge(status) {
  return `<span class="status-badge ${status.className}"><span aria-hidden="true">${status.icon}</span>${escapeHtml(status.label)}</span>`;
}

function shareResult(student) {
  const text = `نتيجة ${student.name}\nرقم المترشح: ${student.id}\nالشعبة: ${student.track}\nالمعدل: ${parseAverage(student.MOD).toFixed(2)}\nالترتيب: ${student.rank || "غير متوفر"}\nMauriResults`;

  if (navigator.share) {
    navigator.share({ title: "MauriResults - نتيجة الامتحان", text }).catch(() => {});
    return;
  }

  navigator.clipboard?.writeText(text);
  showMessage("تم نسخ النتيجة للمشاركة.", "");
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem("mauriresults-theme");
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const nextTheme = dom.html.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
  localStorage.setItem("mauriresults-theme", nextTheme);
}

function setTheme(theme) {
  dom.html.dataset.theme = theme;
  dom.html.classList.toggle("dark", theme === "dark");
}

function showLoader(isVisible) {
  dom.loader.hidden = !isVisible;
}

function showMessage(message, type) {
  dom.formMessage.textContent = message;
  dom.formMessage.className = `form-message ${type || ""}`.trim();
}

function clearMessage() {
  showMessage("", "");
}

function formatAverage(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

function escapePostgrestValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function iconUser() {
  return `<svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>`;
}

function iconUsers() {
  return `<svg viewBox="0 0 24 24"><path d="M16 21a6 6 0 0 0-12 0"/><circle cx="10" cy="8" r="4"/><path d="M22 21a5 5 0 0 0-5-5M17 3a4 4 0 0 1 0 8"/></svg>`;
}

function iconHash() {
  return `<svg viewBox="0 0 24 24"><path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18"/></svg>`;
}

function iconBook() {
  return `<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>`;
}

function iconSchool() {
  return `<svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/><path d="M21 10v6"/></svg>`;
}

function iconMap() {
  return `<svg viewBox="0 0 24 24"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/></svg>`;
}

function iconChart() {
  return `<svg viewBox="0 0 24 24"><path d="M4 19V5M8 17v-6M13 17V7M18 17v-9M3 19h18"/></svg>`;
}

function iconAward() {
  return `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M8.2 13 7 22l5-3 5 3-1.2-9"/></svg>`;
}

function iconCheck() {
  return `<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`;
}

function iconX() {
  return `<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
}

function iconShare() {
  return `<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>`;
}

function iconPrinter() {
  return `<svg viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>`;
}

function iconSearch() {
  return `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>`;
}

function iconTrophy() {
  return `<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4"/></svg>`;
}

function iconMedal() {
  return `<svg viewBox="0 0 24 24"><path d="m8 2 4 7 4-7M12 9l4-7M12 9 8 2"/><circle cx="12" cy="15" r="6"/></svg>`;
}
