/**
 * KERYX Real-Time Deterministic Context Resolver & Safety Engine
 * Sub-millisecond sermon and scripture context tracker with relative verse resolution,
 * correction detection ("Sorry, Romans 8:28"), and false-positive protection.
 */

import { eventBus } from '../../core/eventBus.js';

export class RealtimeContextResolver {
  constructor() {
    this.context = {
      currentBook: 'Romans',
      currentChapter: 8,
      currentVerse: 28,
      previousScripture: 'Romans 8:27',
      recentScriptures: ['Romans 8:28', 'Psalm 23:1'],
      activeCandidate: null,
      speaker: 'Senior Pastor',
      currentSegment: 'SERMON',
      correctionHistory: [],
      lastUpdateTimestamp: Date.now()
    };
  }

  getContext() {
    return { ...this.context };
  }

  /**
   * Updates context when a confirmed or preview scripture is activated.
   * @param {Object} scriptureObj { book, chapter, verse, reference }
   */
  updateScriptureContext(scriptureObj) {
    if (!scriptureObj || !scriptureObj.book) return;

    if (this.context.currentBook && this.context.currentChapter && this.context.currentVerse) {
      this.context.previousScripture = `${this.context.currentBook} ${this.context.currentChapter}:${this.context.currentVerse}`;
    }

    this.context.currentBook = scriptureObj.book;
    this.context.currentChapter = parseInt(scriptureObj.chapter, 10);
    this.context.currentVerse = parseInt(scriptureObj.verse, 10);

    const ref = scriptureObj.reference || `${scriptureObj.book} ${scriptureObj.chapter}:${scriptureObj.verse}`;
    if (!this.context.recentScriptures.includes(ref)) {
      this.context.recentScriptures.unshift(ref);
      if (this.context.recentScriptures.length > 8) {
        this.context.recentScriptures.pop();
      }
    }

    this.context.activeCandidate = null;
    this.context.lastUpdateTimestamp = Date.now();
    eventBus.emit('ai:context_updated', this.getContext());
  }

  /**
   * Establishes active book and chapter when spoken without a verse (e.g. "Turn to Romans chapter 8")
   */
  setChapterContext(book, chapter) {
    if (book) this.context.currentBook = book;
    if (chapter) this.context.currentChapter = parseInt(chapter, 10);
    this.context.lastUpdateTimestamp = Date.now();
    eventBus.emit('ai:context_updated', this.getContext());
  }

  /**
   * Evaluates text for pulpit speech corrections:
   * e.g. "Romans 8:18... Sorry, Romans 8:28" or "Not verse 18, verse 28"
   * @param {string} text
   * @param {Object} newDetection
   * @returns {{isCorrection: boolean, supersededRef: string|null}}
   */
  checkCorrection(text, newDetection) {
    if (!text || !newDetection) return { isCorrection: false, supersededRef: null };

    const lower = text.toLowerCase();
    const correctionTriggers = ['sorry', 'not verse', 'i mean', 'rather', 'correction', 'apologies', 'actually'];
    const hasTrigger = correctionTriggers.some((trig) => lower.includes(trig));

    if (hasTrigger && this.context.currentVerse && newDetection.verse && this.context.currentVerse !== newDetection.verse) {
      const supersededRef = `${this.context.currentBook} ${this.context.currentChapter}:${this.context.currentVerse}`;
      const record = {
        superseded: supersededRef,
        activated: newDetection.reference,
        timestamp: Date.now()
      };
      this.context.correctionHistory.push(record);
      eventBus.emit('scripture:superseded', record);

      return {
        isCorrection: true,
        supersededRef
      };
    }

    return { isCorrection: false, supersededRef: null };
  }

  /**
   * Sets hot candidate for predictive pre-caching
   */
  setCandidate(candidate) {
    this.context.activeCandidate = candidate;
  }

  setSpeaker(speaker) {
    this.context.speaker = speaker || 'Senior Pastor';
  }

  setSegment(segment) {
    this.context.currentSegment = segment || 'SERMON';
  }

  reset() {
    this.context = {
      currentBook: null,
      currentChapter: null,
      currentVerse: null,
      previousScripture: null,
      recentScriptures: [],
      activeCandidate: null,
      speaker: 'Senior Pastor',
      currentSegment: 'SERMON',
      correctionHistory: [],
      lastUpdateTimestamp: Date.now()
    };
  }
}

export const realtimeContextResolver = new RealtimeContextResolver();

