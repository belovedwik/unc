const LANG_KEY = "unc-lang";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function getLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl === "en" || fromUrl === "uk") return fromUrl;
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "en" || saved === "uk") return saved;
  return navigator.language?.toLowerCase().startsWith("uk") ? "uk" : "uk";
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value;
}

function applyLang(lang) {
  const t = translations[lang];
  document.documentElement.lang = lang;
  document.title = t.metaTitle;
  $("meta[name='description']")?.setAttribute("content", t.metaDescription);

  $$("[data-i18n]").forEach((el) => {
    const path = el.dataset.i18n.split(".");
    let value = t;
    for (const key of path) value = value?.[key];
    if (typeof value === "string") el.textContent = value;
  });

  $$("[data-i18n-placeholder]").forEach((el) => {
    const path = el.dataset.i18nPlaceholder.split(".");
    let value = t;
    for (const key of path) value = value?.[key];
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });

  $$("[data-i18n-aria]").forEach((el) => {
    const value = t[el.dataset.i18nAria];
    if (typeof value === "string") el.setAttribute("aria-label", value);
  });

  $$("[data-thanks]").forEach((el) => {
    const i = Number(el.dataset.thanks);
    el.textContent = t.thanks.items[i] || "";
  });

  $$("[data-use]").forEach((el) => {
    const i = Number(el.dataset.use);
    el.textContent = t.project.uses[i] || "";
  });

  $$("[data-step]").forEach((el) => {
    const i = Number(el.dataset.step);
    el.textContent = t.help.steps[i] || "";
  });

  $$(".lang button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  localStorage.setItem(LANG_KEY, lang);
  updateDonatePurpose();
}

let donateMode = "once";
let donateAmount = "500";

function donatePurposeText() {
  const t = translations[document.documentElement.lang] || translations.uk;
  if (donateMode === "sub") {
    return t.donate.purposeSubAmount.replace("{amount}", donateAmount);
  }
  return t.donate.purposeOnce;
}

function updateDonatePurpose() {
  const el = $("#donate-purpose");
  if (el) el.textContent = donatePurposeText();
}

function setDonateMode(mode) {
  donateMode = mode === "sub" ? "sub" : "once";
  $("#donate-sheet")?.setAttribute("data-mode", donateMode);
  $$("[data-donate-tab]").forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.donateTab === donateMode));
  });
  $$("[data-donate-panel]").forEach((el) => {
    el.hidden = el.dataset.donatePanel !== donateMode;
  });
  $$("[data-amount]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.amount === donateAmount));
  });
  updateDonatePurpose();
}

function openDonate() {
  const sheet = $("#donate-sheet");
  if (!sheet) return;
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDonate() {
  const sheet = $("#donate-sheet");
  if (!sheet) return;
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
  if (!$("#lightbox")?.classList.contains("is-open")) {
    document.body.style.overflow = "";
  }
}

function init() {
  applyLang(getLang());
  setDonateMode("once");

  $$(".lang button").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  $(".menu-toggle")?.addEventListener("click", () => {
    const nav = $(".nav");
    const open = !nav?.classList.contains("open");
    nav?.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    $(".menu-toggle")?.setAttribute("aria-expanded", String(open));
  });

  $$(".nav a").forEach((a) => {
    a.addEventListener("click", () => {
      $(".nav")?.classList.remove("open");
      document.body.classList.remove("menu-open");
      $(".menu-toggle")?.setAttribute("aria-expanded", "false");
    });
  });

  $$("[data-open-donate]").forEach((el) => {
    el.addEventListener("click", () => {
      setDonateMode(el.dataset.openDonate || "once");
      openDonate();
    });
  });

  $$("[data-donate-tab]").forEach((btn) => {
    btn.addEventListener("click", () => setDonateMode(btn.dataset.donateTab));
  });

  $$("[data-amount]").forEach((btn) => {
    btn.addEventListener("click", () => {
      donateAmount = btn.dataset.amount;
      setDonateMode("sub");
    });
  });

  $$("[data-donate-close]").forEach((el) => {
    el.addEventListener("click", closeDonate);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#donate-sheet")?.classList.contains("is-open")) {
      closeDonate();
    }
  });

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        const label = translations[document.documentElement.lang].donate.copy;
        btn.textContent = translations[document.documentElement.lang].donate.copied;
        setTimeout(() => {
          btn.textContent = label;
        }, 1400);
      } catch {
        /* ignore */
      }
    });
  });

  $$("[data-copy-purpose]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(donatePurposeText());
        const t = translations[document.documentElement.lang].donate;
        btn.textContent = t.copied;
        setTimeout(() => {
          btn.textContent = t.copy;
        }, 1400);
      } catch {
        /* ignore */
      }
    });
  });

  initLightbox();

  $("#contact-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = translations[document.documentElement.lang];
    const data = new FormData(e.currentTarget);
    const body = encodeURIComponent(
      `${data.get("name")}\n${data.get("phone")}\n\n${data.get("message")}`
    );
    const subject = encodeURIComponent(t.contact.heading);
    $("#form-note").textContent = t.contact.sent;
    window.location.href = `mailto:info@unc.org.ua?subject=${subject}&body=${body}`;
  });
}

function initLightbox() {
  const overlay = $("#lightbox");
  const image = $("#lightbox-image");
  if (!overlay || !image) return;

  const groups = new Map();
  $$("[data-lightbox]").forEach((btn) => {
    const root = btn.closest(".photo-grid, .gallery") || document;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(btn);
  });

  let items = [];
  let index = 0;

  function show() {
    const btn = items[index];
    if (!btn) return;
    image.src = btn.dataset.lightbox;
    image.alt = btn.querySelector("img")?.alt || "";
  }

  function open(list, i) {
    items = list;
    index = i;
    show();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function step(delta) {
    if (!items.length) return;
    index = (index + delta + items.length) % items.length;
    show();
  }

  $$("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const root = btn.closest(".photo-grid, .gallery") || document;
      const list = groups.get(root) || [btn];
      open(list, list.indexOf(btn));
    });
  });

  overlay.querySelectorAll("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", close);
  });
  $("[data-lightbox-prev]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    step(-1);
  });
  $("[data-lightbox-next]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    step(1);
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}

document.addEventListener("DOMContentLoaded", init);
