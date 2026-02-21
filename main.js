// Default fallback configuration (used if fetching word.json fails)
const fallbackWordConfig = {
  root: "TERANG",
  translation: "Bright / Clear",
  derivations: [
    { prefix: "Me-", body: "nerangkan", meaning: "To explain / To clarify" },
    {
      prefix: "Ke-",
      body: "terang",
      suffix: "-an",
      meaning: "Information / Caption",
    },
    { prefix: "Pe-", body: "nerangan", meaning: "Lighting / Illumination" },
  ],
  sentence_id: "Terima kasih atas keterangannya.",
  sentence_en: "Thank you for the information.",
};

// Function to render word card from config
function renderWordCard(config) {
  // Populate root word and translation
  const rootEl = document.getElementById("root-word");
  rootEl.textContent = config.root;
  // If root word (letters only) is longer than 5 chars, apply smaller style
  const rootLetters = (config.root || "").replace(/\s+/g, "");
  if (rootLetters.length > 5) {
    rootEl.classList.add("small-root");
  } else {
    rootEl.classList.remove("small-root");
  }
  document.getElementById("translation").textContent = config.translation;

  // Populate derivations
  const derivList = document.getElementById("deriv-list");
  derivList.innerHTML = "";
  config.derivations.forEach((deriv, index) => {
    const li = document.createElement("li");

    // Calculate the final word (prefer explicit `full`, otherwise build it)
    let finalWord = "";
    if (deriv.fullWord && deriv.fullWord.trim()) {
      finalWord = deriv.fullWord.trim();
    } else {
      if (deriv.prefix) finalWord += deriv.prefix.replace(/-/g, "");
      finalWord += deriv.body || "";
      if (deriv.suffix) finalWord += deriv.suffix.replace(/-/g, "");
    }

    // Build word HTML with prefix and suffix (breakdown)
    let wordHTML = "";

    // Add prefix if it exists and is not empty
    if (deriv.prefix && deriv.prefix.trim()) {
      wordHTML += `<span class="prefix">${deriv.prefix}</span>`;
    }

    // Add body (always present)
    wordHTML += deriv.body;

    // Add suffix if it exists and is not empty
    if (deriv.suffix && deriv.suffix.trim()) {
      wordHTML += `<span class="suffix">${deriv.suffix}</span>`;
    }

    // Create structure: breakdown on first line, full word with meaning on second line
    li.innerHTML = `
      ${wordHTML}
      <small><span class="full-word-accent">${finalWord}</span> → ${deriv.meaning}</small>
    `;
    // set index for staggered CSS delay
    li.style.setProperty("--i", index);
    // add vibrant class so continuous effects apply
    li.classList.add("vibrant");
    derivList.appendChild(li);
  });

  // Populate sentences
  const footerSentence = document.querySelector(".footer-sentence");
  footerSentence.querySelector(".id").textContent = `"${config.sentence_id}"`;
  footerSentence.querySelector(".en").textContent = `"${config.sentence_en}"`;
}

// Fit text into a maximum width by adjusting font-size deterministically
function fitTextToWidth(el, maxWidth, minFont = 18) {
  if (!el || !maxWidth) return;
  // keep single-line measurement
  const prevWhite = el.style.whiteSpace;
  el.style.whiteSpace = "nowrap";
  const computed = window.getComputedStyle(el);
  const fontSize = parseFloat(computed.fontSize) || 48;
  const contentWidth = el.scrollWidth;
  // restore white-space
  el.style.whiteSpace = prevWhite;

  if (!contentWidth || contentWidth <= maxWidth) {
    // no change needed
    return;
  }

  const scale = maxWidth / contentWidth;
  let newSize = Math.floor(fontSize * scale);
  if (newSize < minFont) newSize = minFont;
  el.style.fontSize = newSize + "px";
}

function fitAllText() {
  // fit root word
  const rootEl = document.getElementById("root-word");
  const hero = document.querySelector(".hero-section");
  if (rootEl && hero) {
    const max = hero.clientWidth - 8; // small padding
    fitTextToWidth(rootEl, max, 28);
  }

  // fit each full-word-accent inside derivations
  const derivList = document.querySelectorAll(".full-word-accent");
  derivList.forEach((el) => {
    // allow up to deriv container width
    const container = el.closest("li") || el.parentElement;
    const max = container ? container.clientWidth - 16 : 200;
    fitTextToWidth(el, max, 14);
  });
}

// Try to load `word.json` from server root. If not found, use fallback.
async function loadAndRender() {
  try {
    const res = await fetch("/word.json");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    renderWordCard(json);
    // fit sizes then start animations
    fitAllText();
    startCssAnimations();
  } catch (err) {
    console.warn("Could not load word.json, using fallback:", err.message);
    renderWordCard(fallbackWordConfig);
    fitAllText();
    startCssAnimations();
  }
}

loadAndRender();

// Trigger CSS animations on next frame for deterministic rendering
function startCssAnimations() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // add vibrant class for continuous effects (no entry animation)
      document
        .querySelectorAll(
          ".header-tag, .hero-section, .footer-sentence, .derivations li",
        )
        .forEach((el) => {
          el.classList.add("vibrant");
        });
    });
  });
}
