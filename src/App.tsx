import React, { useEffect, useState } from "react";
import wordData from "./data/word.json";
import { WordData, Derivation } from "./types";

function App() {
  const [config, setConfig] = useState<WordData>(wordData);

  useEffect(() => {
    const content = document.querySelector(".content");
    if (content) {
      // Reset animation
      content.classList.remove("animate");
      // Trigger animation
      void content.offsetWidth; // Trigger reflow
      content.classList.add("animate");
    }
  }, [config]);

  const { root, translation, derivations, sentence_id, sentence_en } = config;

  return (
    <div className="content">
      <div className="header-tag">KOSA KATA</div>

      <div className="hero-section">
        <h1 id="root-word">{root}</h1>
        <p id="translation">{translation}</p>
      </div>

      <ul className="derivations" id="deriv-list">
        {derivations &&
          derivations.map((deriv: Derivation, idx: number) => {
            let finalWord = "";
            if (deriv.fullWord && deriv.fullWord.trim())
              finalWord = deriv.fullWord.trim();
            else {
              if (deriv.prefix) finalWord += deriv.prefix.replace(/-/g, "");
              finalWord += deriv.body || "";
              if (deriv.suffix) finalWord += deriv.suffix.replace(/-/g, "");
            }
            return (
              <li key={idx} style={{ "--i": idx } as React.CSSProperties}>
                <span
                  dangerouslySetInnerHTML={{
                    __html: `${deriv.prefix ? `<span class='prefix'>${deriv.prefix}</span>` : ""}${deriv.body}${deriv.suffix ? `<span class='suffix'>${deriv.suffix}</span>` : ""}`,
                  }}
                />
                <small>
                  <span className="full-word-accent">{finalWord}</span> →{" "}
                  {deriv.meaning}
                </small>
              </li>
            );
          })}
      </ul>

      <div className="footer-sentence">
        <p className="id">{sentence_id}</p>
        <p className="en">{sentence_en}</p>
      </div>
    </div>
  );
}

export default App;
