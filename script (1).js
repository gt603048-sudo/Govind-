/* ==========================================================
   EDIT HERE: your contact details and form settings.
========================================================== */
const SITE = {
  email: "hello@yourcompany.com",
  phone: "+91 98765 43210",
  hours: "Mon to Fri, 10am to 6pm",
  // To receive form messages by email: make a free form at formspree.io,
  // then paste its URL here, e.g. "https://formspree.io/f/abcdwxyz".
  formEndpoint: ""
};

/* ---------- Everything below works without changes ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
};

/* Fill in contact details */
$$("[data-site]").forEach(el => { const v = SITE[el.dataset.site]; if (v) el.textContent = v; });
$("#year").textContent = new Date().getFullYear();

/* Toast message */
let toastTimer;
function toast(msg){
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.hidden = true, 300); }, 2600);
}

/* Theme: light / dark button */
const root = document.documentElement;
const saved = store.get("theme");
if (saved) root.dataset.theme = saved;
$("#themeBtn").addEventListener("click", () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const next = dark ? "light" : "dark";
  root.dataset.theme = next; store.set("theme", next);
});

/* Mobile menu */
const burger = $("#burger"), menu = $("#menu");
function setMenu(open){
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
$$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

/* Header line on scroll */
const header = $(".site-header");
const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

/* Highlight the menu link of the section you are viewing */
const links = $$(".menu a");
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach(s => spy.observe(s));

/* Scroll animations (items already on screen stay visible) */
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { threshold: .12 });
  $$(".reveal").forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight * .92) { el.classList.add("will-reveal"); io.observe(el); }
  });
}

/* Number counters in the hero */
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $$("[data-count]").forEach(el => {
    const end = +el.dataset.count, start = performance.now(), dur = 1400;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = "0"; requestAnimationFrame(tick);
  });
}

/* Project filter buttons */
$$(".chip").forEach(btn => btn.addEventListener("click", () => {
  $$(".chip").forEach(b => b.classList.toggle("is-on", b === btn));
  const f = btn.dataset.filter;
  $$(".project").forEach(p => {
    const show = f === "all" || p.dataset.cat === f;
    p.hidden = !show;
    if (show) { p.classList.remove("pop"); void p.offsetWidth; p.classList.add("pop"); }
  });
}));

/* FAQ: keep only one answer open */
$$(".faq details").forEach(d => d.addEventListener("toggle", () => {
  if (d.open) $$(".faq details").forEach(o => { if (o !== d) o.open = false; });
}));

/* Copy buttons */
$$(".copy").forEach(btn => btn.addEventListener("click", async () => {
  const text = SITE[btn.dataset.copy];
  try { await navigator.clipboard.writeText(text); toast("Copied: " + text); }
  catch(e){
    const r = document.createRange(); r.selectNodeContents(btn.previousElementSibling);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    toast("Press Ctrl+C (or Copy) to copy");
  }
}));

/* Pricing buttons: scroll to the form and fill in the plan */
$$("[data-plan]").forEach(btn => btn.addEventListener("click", () => {
  const plan = btn.dataset.plan;
  const msg = $("#message");
  if (!msg.value.trim()) msg.value = "Hi, I am interested in the " + plan + " plan. ";
  $("#service").value = plan === "Custom" ? "Something else" : "Website design";
  $("#contact").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => msg.focus({ preventScroll: true }), 600);
  toast(plan + " plan selected");
}));

/* Contact form */
const form = $("#contactForm"), note = $("#formNote"), sendBtn = $("#sendBtn");
function check(id, ok, msg){
  const field = $("#" + id).closest(".field");
  field.classList.toggle("bad", !ok);
  $("#err-" + id).textContent = ok ? "" : msg;
  return ok;
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  note.className = "form-note"; note.textContent = "";
  const d = Object.fromEntries(new FormData(form));
  const ok = [
    check("name", d.name.trim().length > 1, "Please enter your name."),
    check("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email), "Please enter a valid email address."),
    check("message", d.message.trim().length > 9, "Please write a few words about your project.")
  ].every(Boolean);
  if (!ok) { $(".bad input, .bad textarea", form).focus(); return; }

  if (!SITE.formEndpoint) {
    // No endpoint set yet: nothing is sent. See SITE.formEndpoint at the top of this file.
    note.textContent = "Form checked. This preview does not send messages yet. Add your form link in script.js to receive them.";
    toast("Preview mode: message not sent");
    return;
  }
  sendBtn.disabled = true; sendBtn.textContent = "Sending...";
  try {
    const res = await fetch(SITE.formEndpoint, { method:"POST", headers:{ "Accept":"application/json", "Content-Type":"application/json" }, body: JSON.stringify(d) });
    if (!res.ok) throw new Error();
    form.reset(); note.className = "form-note ok";
    note.textContent = "Thank you! Your message was sent. We will reply within one business day.";
    toast("Message sent");
  } catch(err) {
    note.textContent = "Sorry, that did not send. Please email us at " + SITE.email + ".";
  } finally { sendBtn.disabled = false; sendBtn.textContent = "Send message"; }
});
$$("input,textarea", form).forEach(i => i.addEventListener("input", () => { const f = i.closest(".field"); f.classList.remove("bad"); const er = $(".err", f); if (er) er.textContent = ""; }));
