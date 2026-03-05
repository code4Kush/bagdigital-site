function $(id){ return document.getElementById(id); }

const SETTINGS = {
  EMAIL_USER: "jaime",
  EMAIL_DOMAIN: "bagdigital.tech"
};

function buildEmail(){ return `${SETTINGS.EMAIL_USER}@${SETTINGS.EMAIL_DOMAIN}`; }

function setStatus(msg){
  const el = $("formStatus");
  if (!el) return;
  el.textContent = msg || "";
}

function mailtoHref(formData){
  const subject = encodeURIComponent(`Quote request: ${formData.get("need") || "Project"}`);
  const lines = [
    `Name: ${formData.get("name") || ""}`,
    `Business: ${formData.get("business") || ""}`,
    `Email: ${formData.get("email") || ""}`,
    `Phone: ${formData.get("phone") || ""}`,
    `Need: ${formData.get("need") || ""}`,
    "",
    "Details:",
    `${formData.get("details") || ""}`
  ];
  const body = encodeURIComponent(lines.join("\n"));
  return `mailto:${encodeURIComponent(buildEmail())}?subject=${subject}&body=${body}`;
}

function closeOffcanvasIfOpen(){
  const el = document.getElementById("navOffcanvas");
  if (!el || typeof bootstrap === "undefined") return;
  const inst = bootstrap.Offcanvas.getInstance(el);
  if (inst) inst.hide();
}

/**
 * Reliability mode:
 * - default uses local /assets image
 * - if remote loads successfully, swap to remote (optional)
 * - if remote fails, local remains (your backup)
 */
function wireRemoteImages(){
  const imgs = document.querySelectorAll("img[data-remote]");
  imgs.forEach((img) => {
    const remote = (img.getAttribute("data-remote") || "").trim();
    if (!remote) return;

    const probe = new Image();
    probe.decoding = "async";
    probe.loading = "eager";
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => { img.src = remote; };
    probe.src = remote;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // year
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // email links
  const email = buildEmail();
  const emailLink = $("emailLink");
  if (emailLink){
    emailLink.textContent = email;
    emailLink.setAttribute("href", `mailto:${email}`);
  }
  const emailBtn = $("emailDirectBtn");
  if (emailBtn) emailBtn.setAttribute("href", `mailto:${email}`);

  // close nav on mobile link click
  document.querySelectorAll("[data-close-nav]").forEach(a => {
    a.addEventListener("click", () => closeOffcanvasIfOpen(), { passive:true });
  });

  // remote image swap (optional)
  wireRemoteImages();

  // form submit => mailto (no endpoint yet)
  const form = $("quoteForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus("");

    if (!form.checkValidity()){
      form.classList.add("was-validated");
      setStatus("Please fix the highlighted fields and try again.");
      return;
    }

    const data = new FormData(form);

    // honeypot
    const hp = (data.get("company_site") || "").toString().trim();
    if (hp.length > 0){
      setStatus("Submission blocked.");
      return;
    }

    setStatus("Opening an email draft…");
    window.location.href = mailtoHref(data);
  });
});