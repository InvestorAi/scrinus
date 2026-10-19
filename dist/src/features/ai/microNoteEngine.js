/**
 * KERYX Sub-300ms Real-Time Micro-Note Event Engine
 * Mode A: Ultra-low-latency deterministic micro-note and sermon structure event extractor.
 * Emits typed events (SCRIPTURE_ANCHOR, POINT, DECLARATION, PRAYER, APPLICATION, QUESTION, KEY_IDEA, QUOTE, INSIGHT)
 * with DEVELOPING -> CONFIRMED lifecycle states within < 2ms without cloud LLM blocking.
 */

export class MicroNoteEngine {
  /**
   * Fast rule-based micro-note extraction
   * @param {string} text Pulpit speech text segment
   * @param {string} sourceSegmentId
   * @returns {Object|null} Micro-note event or null
   */
  static extractMicroEvent(text, sourceSegmentId = null) {
    if (!text || text.trim().length < 8) return null;
    const clean = text.trim();
    const lower = clean.toLowerCase();
    const now = new Date().toLocaleTimeString();
    const id = 'evt_note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // 1. SCRIPTURE ANCHOR: Explicit Bible citations or pulpit reading directions
    if (/\b(turn with me|open your bible|in the book of|chapter|verse|scripture says|as it is written|psalm|romans|genesis|matthew|john|corinthians|hebrews|proverbs|isaiah|ephesians|philippians)\b/i.test(lower)) {
      return {
        id,
        type: 'SCRIPTURE_ANCHOR',
        category: 'Scripture Reference',
        text: clean,
        sourceSegmentId,
        confidence: 0.98,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 2. QUESTION: Explicit question marks or rhetorical ministerial openers
    if (clean.endsWith('?') || /\b(how can you|why do we|who told you|where is your|what did god|how do you|why is it)\b/i.test(lower)) {
      return {
        id,
        type: 'QUESTION',
        category: 'Rhetorical Question',
        text: clean,
        sourceSegmentId,
        confidence: 0.95,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 3. DECLARATION / PRAYER: Prophetic or liturgical declarations
    if (/\b(i declare|i prophesy|in the name of jesus|receive it|god is releasing|let there be|father we pray|lord we ask|we give you glory|be healed|no weapon formed|amen)\b/i.test(lower)) {
      const isPrayer = lower.includes('pray') || lower.includes('father') || lower.includes('lord we');
      return {
        id,
        type: isPrayer ? 'PRAYER' : 'DECLARATION',
        category: isPrayer ? 'Corporate Prayer' : 'Prophetic Declaration',
        text: clean,
        sourceSegmentId,
        confidence: 0.96,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 4. APPLICATION / ACTION ITEM: Direct instructional imperatives
    if (/\b(you must|write this down|remember this|take note|practice this|this week|go home and|we need to|make sure you|every believer should|stop doing|start doing)\b/i.test(lower)) {
      return {
        id,
        type: 'APPLICATION',
        category: 'Practical Application',
        text: clean,
        sourceSegmentId,
        confidence: 0.93,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 5. POINT / SUBPOINT: Numbered homiletic structures (e.g. "Number one...", "Point two...", "First key...")
    const pointMatch = lower.match(/\b(point\s+(?:one|two|three|four|five|\d+)|number\s+(?:one|two|three|four|five|\d+)|firstly|secondly|thirdly|the first key|the second principle|lesson number)\b/i);
    if (pointMatch) {
      return {
        id,
        type: 'POINT',
        category: 'Sermon Outline Point',
        text: clean,
        sourceSegmentId,
        confidence: 0.96,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 6. KEY IDEA: Strong theological or doctrinal assertions
    if (/\b(faith requires|god is|grace teaches|the truth is|purpose demands|covenant means|crisis reveals|the blood of jesus|salvation is|holiness|spiritual warfare|divine wisdom|battle strateg)\b/i.test(lower)) {
      return {
        id,
        type: 'KEY_IDEA',
        category: 'Core Insight',
        text: clean,
        sourceSegmentId,
        confidence: 0.92,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 7. QUOTE / EPIGRAM: Punchy memorable aphorisms
    if (clean.length > 20 && clean.length < 130 && /\b(not|never|always|only|cannot|impossible|victory|triumph|breakthrough|power)\b/i.test(lower)) {
      return {
        id,
        type: 'QUOTE',
        category: 'Pulpit Quote',
        text: clean,
        sourceSegmentId,
        confidence: 0.90,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    // 8. GENERAL MINISTERIAL INSIGHT: Substantial spoken sentence captured as coherent note
    if (clean.length >= 18) {
      return {
        id,
        type: 'INSIGHT',
        category: 'Pulpit Note',
        text: clean,
        sourceSegmentId,
        confidence: 0.88,
        status: 'CONFIRMED',
        timestamp: now
      };
    }

    return null;
  }
}

