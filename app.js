(() => {
  const $ = (sel) => document.querySelector(sel);

  const state = {
    content: null,
    activeThemeId: "agency",
  };

  function safeText(el, text) {
    if (!el) return;
    el.textContent = text ?? "";
  }

  function setCssVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function setTheme(themeId) {
    const content = state.content;
    if (!content?.themes?.[themeId]) return;

    state.activeThemeId = themeId;
    const theme = content.themes[themeId];

    document.body.classList.remove(...Array.from(document.body.classList).filter(c => c.startsWith("theme-")));
    document.body.classList.add(`theme-${theme.id}`);

    setCssVar("--accent", theme.accent);
    setCssVar("--font", theme.font);
    setCssVar("--radius", theme.radius);

    const hero = $("#hero-section");
    if (hero) hero.style.backgroundImage = `url('${theme.hero_img}')`;
    safeText($("#hero-h1"), theme.hero_title);
    safeText($("#hero-p"), theme.hero_desc);

    safeText($("#scope-rule"), content?.global?.scope_rule || "");

    document.querySelectorAll("#theme-dock button").forEach((b) => {
      b.classList.toggle("active", b.dataset.themeId === themeId);
      b.setAttribute("aria-pressed", b.dataset.themeId === themeId ? "true" : "false");
    });

    try { localStorage.setItem("bagdigital_theme", themeId); } catch (_) {}
  }

  function buildThemeDock() {
    const dock = $("#theme-dock");
    if (!dock) return;

    dock.innerHTML = "";
    const themes = Object.values(state.content?.themes || {});
    themes.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.themeId = t.id;
      btn.textContent = t.label;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => setTheme(t.id));
      dock.appendChild(btn);
    });
  }

  function cardTemplate({ title, price, desc, link, img, badges }) {
    const card = document.createElement("div");
    card.className = "card";

    if (img) {
      const image = document.createElement("img");
      image.className = "card-img";
      image.loading = "lazy";
      image.alt = title;
      image.src = img;
      card.appendChild(image);
    }

    if (price) {
      const pt = document.createElement("div");
      pt.className = "price-tag";
      pt.textContent = price;
      card.appendChild(pt);
    }

    const h3 = document.createElement("h3");
    h3.textContent = title;
    card.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = desc;
    card.appendChild(p);

    if (Array.isArray(badges) && badges.length) {
      const row = document.createElement("div");
      row.className = "badge-row";
      badges.forEach((b) => {
        const chip = document.createElement("span");
        chip.className = "badge";
        chip.textContent = b;
        row.appendChild(chip);
      });
      card.appendChild(row);
    }

    const a = document.createElement("a");
    a.className = "select-link";
    a.href = link || "#contact";
    a.rel = "noopener";
    a.textContent = (link && !link.startsWith("#")) ? "Open Lab" : "Select";
    card.appendChild(a);

    return card;
  }

  function renderGrid(containerId, items, mode) {
    const grid = $(containerId);
    if (!grid) return;

    grid.innerHTML = "";
    (items || []).forEach((item) => {
      const title = item.title;
      const price = item.price;
      const desc = item.desc;

      let link = "#contact";
      let badges = [];
      let img = null;

      if (mode === "services") link = "#contact";
      if (mode === "packages") { link = "#contact"; badges = ["PACKAGE"]; }
      if (mode === "labs") { link = item.link; img = item.img; badges = item.badges || []; }

      grid.appendChild(cardTemplate({ title, price, desc, link, img, badges }));
    });
  }

  function buildServiceSelect() {
    const select = $("#service");
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Select service or package</option>';

    const services = state.content?.core_services || [];
    const packages = state.content?.packages || [];

    const addGroup = (label, list, prefix) => {
      if (!list.length) return;
      const og = document.createElement("optgroup");
      og.label = label;

      list.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = `${prefix}${item.title}`;
        opt.textContent = `${item.title} (${item.price})`;
        og.appendChild(opt);
      });

      select.appendChild(og);
    };

    addGroup("Services", services, "");
    addGroup("Packages", packages, "[Package] ");
  }

  function wireCardSelection() {
    document.addEventListener("click", (e) => {
      const a = e.target?.closest?.("a.select-link");
      if (!a) return;
      if (a.getAttribute("href") !== "#contact") return;

      const card = a.closest(".card");
      const title = card?.querySelector("h3")?.textContent?.trim();
      if (!title) return;

      const select = $("#service");
      if (!select) return;

      const options = Array.from(select.querySelectorAll("option"));
      const match = options.find(o => o.textContent.startsWith(title + " ("));
      if (match) select.value = match.value;
    });
  }

  function wireContactForm() {
    const form = $("#contact-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = $("#submit-btn");
      const gasUrl = state.content?.global?.gas_url;
      if (!gasUrl) {
        alert("Form endpoint is not configured (missing gas_url).");
        return;
      }

      const payload = {
        timestamp: new Date().toISOString(),
        page: location.href,
        theme: state.activeThemeId,
        name: $("#name")?.value?.trim() || "",
        email: $("#email")?.value?.trim() || "",
        service: $("#service")?.value || "",
        timeline: $("#timeline")?.value || "",
        message: $("#message")?.value?.trim() || "",
      };

      if (!payload.name || !payload.email || !payload.service || !payload.timeline || !payload.message) {
        alert("Please complete all fields.");
        return;
      }

      const original = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      try {
        await fetch(gasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload),
        });

        form.reset();
        alert("Submitted. You’ll receive a reply with next steps.");
      } catch (err) {
        console.error(err);
        alert("Submission failed. Please email BAG Digital directly.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = original || "Send Project Brief";
        }
      }
    });
  }

  async function loadContent() {
    const res = await fetch("content.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load content.json (${res.status})`);
    state.content = await res.json();
  }

  async function init() {
    await loadContent();

    buildThemeDock();
    buildServiceSelect();

    renderGrid("#core-grid", state.content.core_services, "services");
    renderGrid("#package-grid", state.content.packages, "packages");
    renderGrid("#lab-grid", state.content.portfolio_labs, "labs");

    wireCardSelection();
    wireContactForm();

    let saved = null;
    try { saved = localStorage.getItem("bagdigital_theme"); } catch (_) {}
    setTheme(saved || state.content?.global?.default_theme || "agency");
  }

  init().catch((err) => {
    console.error(err);
    const heroH1 = $("#hero-h1");
    if (heroH1) heroH1.textContent = "BAG DIGITAL";
    const heroP = $("#hero-p");
    if (heroP) heroP.textContent = "Site failed to load content.json. Check file paths and try again.";
  });
})();
