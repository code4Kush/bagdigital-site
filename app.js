/* Security posture:
   - No innerHTML with user input
   - All status text uses textContent
   - CSP-friendly (no inline JS; no eval)
   - Minimal data handling
*/

const SETTINGS = {
  // Optional: Google Apps Script web app endpoint (expects POST JSON)
  // Example: https://script.google.com/macros/s/XXXXX/exec
  APPS_SCRIPT_ENDPOINT: "",

  // Public contact email (assembled to reduce simple scraping)
  EMAIL_USER: "hello",
  EMAIL_DOMAIN: "bagdigital.tech"
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, type = "info") {
  const el = $("formStatus");
  if (!el) return;

  el.textContent = message || "";
  el.classList.remove("text-danger", "text-success", "text-secondary");

  if (type === "error") el.classList.add("text-danger");
  else if (type === "success") el.classList.add("text-success");
  else el.classList.add("text-secondary");
}

function buildEmail() {
  return `${SETTINGS.EMAIL_USER}@${SETTINGS.EMAIL_DOMAIN}`;
}

function mailtoHref(formData) {
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

function closeOffcanvasIfOpen() {
  const offcanvasEl = document.getElementById("navOffcanvas");
  if (!offcanvasEl) return;

  // Bootstrap exposes instance getter
  const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
  if (instance) instance.hide();
}

function wireMobileNavClose() {
  document.querySelectorAll("[data-close-nav]").forEach((a) => {
    a.addEventListener("click", () => closeOffcanvasIfOpen(), { passive: true });
  });
}

function wireEmailLinks() {
  const email = buildEmail();

  const link = $("emailLink");
  if (link) {
    link.textContent = email;
    link.setAttribute("href", `mailto:${email}`);
  }

  const btn = $("emailDirectBtn");
  if (btn) {
    btn.setAttribute("href", `mailto:${email}`);
  }
}

function wireYear() {
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function validateForm(form) {
  // Bootstrap validation approach (client-side only)
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return false;
  }
  return true;
}

async function submitToEndpoint(payload) {
  const resp = await fetch(SETTINGS.APPS_SCRIPT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload),
    mode: "cors",
    credentials: "omit",
    redirect: "follow",
    referrerPolicy: "no-referrer"
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return true;
}

function wireForm() {
  const form = $("quoteForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    // basic validity
    if (!validateForm(form)) {
      setStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    const data = new FormData(form);

    // Honeypot
    const hp = (data.get("company_site") || "").toString().trim();
    if (hp.length > 0) {
      setStatus("Submission blocked.", "error");
      return;
    }

    // Endpoint submit if configured
    const endpoint = (SETTINGS.APPS_SCRIPT_ENDPOINT || "").trim();
    if (endpoint.length > 0) {
      try {
        setStatus("Sending…");
        const payload = Object.fromEntries(data.entries());
        await submitToEndpoint(payload);

        setStatus("Sent. I’ll reply with next steps.", "success");
        form.reset();
        form.classList.remove("was-validated");
        return;
      } catch (err) {
        console.error(err);
        setStatus("Couldn’t send via form endpoint. Opening an email draft instead…", "error");
        window.location.href = mailtoHref(data);
        return;
      }
    }

    // Fallback
    setStatus("Opening an email draft…", "success");
    window.location.href = mailtoHref(data);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireYear();
  wireMobileNavClose();
  wireEmailLinks();
  wireForm();
});