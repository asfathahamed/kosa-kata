export interface Derivation {
  prefix?: string;
  body: string;
  suffix?: string;
  fullWord: string;
  meaning: string;
}

export interface WordData {
  root: string;
  translation: string;
  derivations: Derivation[];
  sentence_id: string;
  sentence_en: string;
  _previous_words: string[];
}
