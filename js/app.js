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

  $$("[data-thanks]").forEach((el) => {
    const i = Number(el.dataset.thanks);
    el.textContent = t.thanks.items[i] || "";
  });

  $$("[data-use]").forEach((el) => {
    const i = Number(el.dataset.use);
    el.textContent = t.project.uses[i] || "";
  });

  $$(".lang button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === lang));
  });

  localStorage.setItem(LANG_KEY, lang);
}

function openDialog(id) {
  $(id)?.showModal();
}

function closeDialogs() {
  $$("dialog[open]").forEach((d) => d.close());
}

function init() {
  applyLang(getLang());

  $$(".lang button").forEach((btn) => {
    btn.addEventListener("click", () => applyLang(btn.dataset.lang));
  });

  $(".menu-toggle")?.addEventListener("click", () => {
    $(".nav")?.classList.toggle("open");
  });

  $$(".nav a").forEach((a) => {
    a.addEventListener("click", () => $(".nav")?.classList.remove("open"));
  });

  $$("[data-open-donate]").forEach((el) => {
    el.addEventListener("click", () => openDialog("#donate-dialog"));
  });

  $$("[data-close]").forEach((el) => {
    el.addEventListener("click", closeDialogs);
  });

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
        const t = translations[getLang()];
        btn.textContent = t.donate.copied;
        setTimeout(() => {
          btn.textContent = translations[document.documentElement.lang].donate.copy;
        }, 1400);
      } catch {
        /* ignore */
      }
    });
  });

  $$("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = $("#lightbox-image");
      img.src = btn.dataset.lightbox;
      img.alt = btn.querySelector("img")?.alt || "";
      openDialog("#lightbox");
    });
  });

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

document.addEventListener("DOMContentLoaded", init);
