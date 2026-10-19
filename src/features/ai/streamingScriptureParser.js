/**
 * KERYX Streaming Incremental Scripture Parser & ASR Error Normalizer
 * Ultra-fast token-level streaming parser with spoken number recognition,
 * homophone phonetic recovery, relative verse detection, and candidate state machine.
 */

import { BOOK_ALIASES, BIBLE_BOOKS } from '../bible/scriptureEngine.js';

// ASR phonetic substitutions and spoken homophone mapping
const ASR_HOMOPHONES = {
  'ate': 'eight',
  'won': 'one',
  'too': 'two',
  'to': 'two', // contextually checked in chapter/verse positions
  'tree': 'three',
  'free': 'three',
  'for': 'four',
  'fore': 'four',
  'fife': 'five',
  'sex': 'six',
  'seben': 'seven',
  'nain': 'nine',
  'canada': 'canaan',
  'salm': 'psalm',
  'salms': 'psalms',
  'sams': 'psalms',
  'rev': 'revelation',
  'revelations': 'revelation'
};

// Spoken numbers and ordinals mapped to integer values
const SPOKEN_NUMBERS = {
  'zero': 0, 'one': 1, 'first': 1, '1st': 1,
  'two': 2, 'second': 2, '2nd': 2,
  'three': 3, 'third': 3, '3rd': 3,
  'four': 4, 'fourth': 4, '4th': 4,
  'five': 5, 'fifth': 5, '5th': 5,
  'six': 6, 'sixth': 6, '6th': 6,
  'seven': 7, 'seventh': 7, '7th': 7,
  'eight': 8, 'eighth': 8, '8th': 8,
  'nine': 9, 'ninth': 9, '9th': 9,
  'ten': 10, 'tenth': 10,
  'eleven': 11, 'twelfth': 12, 'twelve': 12,
  'thirteen': 13, 'thirteenth': 13,
  'fourteen': 14, 'fourteenth': 14,
  'fifteen': 15, 'fifteenth': 15,
  'sixteen': 16, 'sixteenth': 16,
  'seventeen': 17, 'seventeenth': 17,
  'eighteen': 18, 'eighteenth': 18,
  'nineteen': 19, 'nineteenth': 19,
  'twenty': 20, 'twentieth': 20,
  'thirty': 30, 'thirtieth': 30,
  'forty': 40, 'fortieth': 40,
  'fifty': 50, 'fiftieth': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'hundred': 100
};

export class StreamingScriptureParser {
  constructor() {
    this.resetStreamingState();
  }

  resetStreamingState() {
    this.streamingState = {
      bookCandidate: null,
      chapterCandidate: null,
      verseCandidate: null,
      rawTokens: [],
      lastActivityTime: Date.now()
    };
  }

  /**
   * Normalizes incoming ASR text with error correction and number word translation.
   * @param {string} text
   * @returns {string}
   */
  static normalizeASR(text) {
    if (!text) return '';
    let s = text.toLowerCase();

    // 1. Remove punctuation but keep hyphens for compound numbers (twenty-eight) and colons
    s = s.replace(/[,;?!'"()[\]]/g, ' ');

    // 2. Normalize prefixes (first corinthians -> 1 corinthians)
    s = s.replace(/\bfirst\s+/g, '1 ')
         .replace(/\bsecond\s+/g, '2 ')
         .replace(/\bthird\s+/g, '3 ')
         .replace(/\b1st\s+/g, '1 ')
         .replace(/\b2nd\s+/g, '2 ')
         .replace(/\b3rd\s+/g, '3 ');

    // 3. Spoken Psalm pattern (e.g. "the twenty-third Psalm" -> "Psalm 23")
    s = s.replace(/(?:the\s+)?([a-z\-]+)\s+psalm\b/gi, (match, ordinal) => {
      const num = StreamingScriptureParser.parseSpokenNumber(ordinal);
      return num ? `psalm ${num}` : match;
    });

    // 4. Token-by-token homophone recovery
    const tokens = s.split(/\s+/).filter(Boolean);
    const corrected = [];

    for (let i = 0; i < tokens.length; i++) {
      let t = tokens[i];
      const prev = tokens[i - 1] || '';
      const next = tokens[i + 1] || '';

      // Contextual homophone replacement
      if (t === 'ate') {
        t = 'eight';
      } else if (t === 'won') {
        t = 'one';
      } else if (t === 'tree' && (prev === 'chapter' || prev === 'verse' || /\d+/.test(prev))) {
        t = 'three';
      } else if ((t === 'to' || t === 'too') && (prev === 'chapter' || prev === 'verse' || prev === 'eight' || prev === 'twenty')) {
        t = 'two';
      } else if (ASR_HOMOPHONES[t] && t !== 'to') {
        t = ASR_HOMOPHONES[t];
      }

      corrected.push(t);
    }

    return corrected.join(' ');
  }

  /**
   * Converts compound spoken numbers (e.g. "twenty eight", "twenty-eight", "one hundred nineteen") to integer
   * @param {string} str
   * @returns {number|null}
   */
  static parseSpokenNumber(str) {
    if (!str) return null;
    const clean = str.trim().toLowerCase().replace(/-/g, ' ');
    if (/^\d+$/.test(clean)) return parseInt(clean, 10);

    const parts = clean.split(/\s+/);
    let total = 0;
    let current = 0;
    let hasMatch = false;

    for (const p of parts) {
      if (/^\d+$/.test(p)) {
        current += parseInt(p, 10);
        hasMatch = true;
      } else if (SPOKEN_NUMBERS[p] !== undefined) {
        const val = SPOKEN_NUMBERS[p];
        if (val === 100) {
          current = (current === 0 ? 1 : current) * 100;
        } else if (val >= 20 && val <= 90) {
          current += val;
        } else {
          current += val;
        }
        hasMatch = true;
      }
    }

    total += current;
    return hasMatch ? total : null;
  }

  /**
   * Fast incremental token processor.
   * Parses partial streaming tokens and updates candidates within < 3ms.
   * @param {string} text Current accumulated ASR text
   * @param {Object} [activeContext] Current service/sermon context { currentBook, currentChapter, currentVerse }
   * @returns {Object} Parse result
   */
  parse(text, activeContext = {}) {
    const startTime = performance.now();
    const normalized = StreamingScriptureParser.normalizeASR(text);
    const tokens = normalized.split(/\s+/).filter(Boolean);

    // 1. Check for Relative Reference Directives (Fast-Path)
    const relativeResult = this.checkRelativeReference(normalized, activeContext);
    if (relativeResult) {
      relativeResult.latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
      return relativeResult;
    }

    // 2. Explicit colon reference: e.g. "Romans 8:28", "John 3:16", "1 Cor 13:4"
    const explicitRegex = /\b([1-3]?\s?[a-z]+)\s+(\d+)[:\s]+(\d+)\b/i;
    const expMatch = normalized.match(explicitRegex);
    if (expMatch) {
      const bookStr = expMatch[1].trim();
      const canonicalBook = BOOK_ALIASES[bookStr] || BOOK_ALIASES[bookStr.replace(/\s+/g, '')];
      if (canonicalBook) {
        const ch = parseInt(expMatch[2], 10);
        const v = parseInt(expMatch[3], 10);
        return {
          valid: true,
          type: 'EXPLICIT_REFERENCE',
          book: canonicalBook,
          chapter: ch,
          verse: v,
          reference: `${canonicalBook} ${ch}:${v}`,
          confidence: 0.998,
          isCandidate: false,
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 3. Natural Spoken Reference: e.g. "Romans chapter eight verse twenty-eight"
    // Handles prefixes like "turn with me to", "turn to", "open to", etc.
    const naturalRegex = /(?:turn\s+(?:with\s+me\s+)?to|open\s+to|read\s+in|in\s+the\s+book\s+of|look\s+at|book\s+of)?\s*([1-3]?\s?[a-z]+)\s+chapter\s+((?:(?!\bverse\b)[a-z0-9\-])+(?:\s+(?:(?!\bverse\b)[a-z0-9\-])+)?)(?:\s+(?:and\s+)?verse\s+([a-z0-9\-]+(?:\s+[a-z0-9\-]+)?))?/i;
    const natMatch = normalized.match(naturalRegex);
    if (natMatch && natMatch[1]) {
      const bookStr = natMatch[1].trim();
      const canonicalBook = BOOK_ALIASES[bookStr] || BOOK_ALIASES[bookStr.replace(/\s+/g, '')];
      if (canonicalBook) {
        const chVal = StreamingScriptureParser.parseSpokenNumber(natMatch[2]) || 1;
        const vVal = natMatch[3] ? StreamingScriptureParser.parseSpokenNumber(natMatch[3]) : null;

        this.streamingState.bookCandidate = canonicalBook;
        this.streamingState.chapterCandidate = chVal;
        if (vVal) this.streamingState.verseCandidate = vVal;

        return {
          valid: true,
          type: 'NATURAL_SPEECH',
          book: canonicalBook,
          chapter: chVal,
          verse: vVal || 1,
          reference: vVal ? `${canonicalBook} ${chVal}:${vVal}` : `${canonicalBook} ${chVal}:1`,
          confidence: vVal ? 0.992 : 0.88,
          isCandidate: !vVal, // Candidate if verse not yet spoken
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 4. Standalone "verse twenty-eight" or "verse 28" (Contextual Resolution)
    const verseOnlyRegex = /\b(?:read\s+|look\s+at\s+)?verse\s+([a-z0-9\-]+(?:\s+[a-z0-9\-]+)?)\b/i;
    const verseOnlyMatch = normalized.match(verseOnlyRegex);
    if (verseOnlyMatch && (activeContext.currentBook || this.streamingState.bookCandidate)) {
      const vNum = StreamingScriptureParser.parseSpokenNumber(verseOnlyMatch[1]);
      if (vNum) {
        const book = activeContext.currentBook || this.streamingState.bookCandidate;
        const chapter = activeContext.currentChapter || this.streamingState.chapterCandidate || 1;
        return {
          valid: true,
          type: 'CONTEXTUAL_RELATIVE',
          book,
          chapter,
          verse: vNum,
          reference: `${book} ${chapter}:${vNum}`,
          confidence: 0.96,
          isCandidate: false,
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 5. Standalone "chapter eight" or "chapter 8"
    const chapterOnlyRegex = /\bchapter\s+([a-z0-9\-]+)\b/i;
    const chOnlyMatch = normalized.match(chapterOnlyRegex);
    if (chOnlyMatch && (activeContext.currentBook || this.streamingState.bookCandidate)) {
      const chNum = StreamingScriptureParser.parseSpokenNumber(chOnlyMatch[1]);
      if (chNum) {
        const book = activeContext.currentBook || this.streamingState.bookCandidate;
        this.streamingState.chapterCandidate = chNum;
        return {
          valid: true,
          type: 'CHAPTER_CANDIDATE',
          book,
          chapter: chNum,
          verse: 1,
          reference: `${book} ${chNum}:1`,
          confidence: 0.82,
          isCandidate: true,
          latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
        };
      }
    }

    // 6. Incremental Book Candidate Tracker (e.g. "turn with me to Romans...")
    for (let i = tokens.length - 1; i >= Math.max(0, tokens.length - 4); i--) {
      const cand1 = tokens[i];
      const cand2 = i > 0 ? `${tokens[i - 1]} ${tokens[i]}` : null;

      if (cand2 && BOOK_ALIASES[cand2]) {
        this.streamingState.bookCandidate = BOOK_ALIASES[cand2];
        break;
      }
      if (cand1 && BOOK_ALIASES[cand1]) {
        this.streamingState.bookCandidate = BOOK_ALIASES[cand1];
        break;
      }
    }

    return {
      valid: false,
      bookCandidate: this.streamingState.bookCandidate,
      latencyMs: parseFloat((performance.now() - startTime).toFixed(2))
    };
  }

  /**
   * Fast resolution of relative references like "next verse", "previous verse", "that scripture"
   */
  checkRelativeReference(normalized, context) {
    if (!context || !context.currentBook || !context.currentChapter || !context.currentVerse) {
      return null;
    }

    const { currentBook, currentChapter, currentVerse } = context;

    // "the next verse", "next verse", "verse after"
    if (/\b(?:the\s+)?next\s+verse\b/i.test(normalized) || /\bverse\s+after\b/i.test(normalized)) {
      const nextV = currentVerse + 1;
      return {
        valid: true,
        type: 'RELATIVE_NEXT_VERSE',
        book: currentBook,
        chapter: currentChapter,
        verse: nextV,
        reference: `${currentBook} ${currentChapter}:${nextV}`,
        confidence: 0.99,
        isCandidate: false
      };
    }

    // "the previous verse", "previous verse", "verse before"
    if (/\b(?:the\s+)?previous\s+verse\b/i.test(normalized) || /\bverse\s+before\b/i.test(normalized)) {
      const prevV = Math.max(1, currentVerse - 1);
      return {
        valid: true,
        type: 'RELATIVE_PREV_VERSE',
        book: currentBook,
        chapter: currentChapter,
        verse: prevV,
        reference: `${currentBook} ${currentChapter}:${prevV}`,
        confidence: 0.99,
        isCandidate: false
      };
    }

    // "that scripture", "that passage", "read it again"
    if (/\b(?:that\s+(?:scripture|passage|verse)|read\s+(?:it\s+)?again)\b/i.test(normalized)) {
      return {
        valid: true,
        type: 'RELATIVE_SAME_VERSE',
        book: currentBook,
        chapter: currentChapter,
        verse: currentVerse,
        reference: `${currentBook} ${currentChapter}:${currentVerse}`,
        confidence: 0.99,
        isCandidate: false
      };
    }

    return null;
  }
}

export const streamingScriptureParser = new StreamingScriptureParser();

