/**
 * KERYX Bible Store
 * Instant Bible search, translation comparison, and local manual scripture queue.
 */

import { db } from '../database/db.js';
import { TABLE_NAMES } from '../database/schema.js';
import { liveStore } from './liveStore.js';
import { eventBus } from '../core/eventBus.js';
import { AuditLogger } from '../core/auditLogger.js';

class BibleStore {
  constructor() {
    this.currentTranslation = 'WEB';
    this.selectedBook = 'Romans';
    this.selectedChapter = 8;
    this.selectedVerse = 28;
    this.searchQuery = '';
    this.searchResults = [];
    this.localQueue = [
      { id: 'q_1', reference: 'Romans 8:28', translation: 'WEB', text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.' },
      { id: 'q_2', reference: 'Psalm 23:1', translation: 'WEB', text: 'The Lord is my shepherd; I shall lack nothing.' },
      { id: 'q_3', reference: 'John 3:16', translation: 'WEB', text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.' },
      { id: 'q_4', reference: 'Hebrews 11:1', translation: 'WEB', text: 'Now faith is the assurance of things hoped for, proof of things not seen.' },
      { id: 'q_5', reference: 'Philippians 4:13', translation: 'WEB', text: 'I can do all things through Christ, who strengthens me.' }
    ];
    this.favorites = ['Romans 8:28', 'Psalm 23:1', 'John 3:16', 'Hebrews 11:1'];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.getState()));
    eventBus.emit('bible:changed', this.getState());
  }

  getState() {
    return {
      currentTranslation: this.currentTranslation,
      selectedBook: this.selectedBook,
      selectedChapter: this.selectedChapter,
      selectedVerse: this.selectedVerse,
      searchQuery: this.searchQuery,
      searchResults: this.searchResults,
      localQueue: this.localQueue,
      favorites: this.favorites
    };
  }

  async search(query) {
    this.searchQuery = query.trim();
    if (!this.searchQuery) {
      this.searchResults = [];
      this.notify();
      return [];
    }

    const lower = this.searchQuery.toLowerCase();
    const allVerses = await db.getAll(TABLE_NAMES.BIBLE_VERSES);
    const custom = await db.getAll(TABLE_NAMES.CUSTOM_SCRIPTURES);

    const matches = [];

    // Search standard verses
    for (const v of allVerses) {
      if (
        v.reference.toLowerCase().includes(lower) ||
        v.text.toLowerCase().includes(lower) ||
        v.book.toLowerCase().includes(lower)
      ) {
        matches.push({
          id: v.id,
          reference: v.reference,
          translation: v.translation || 'WEB',
          text: v.text,
          isCustom: false
        });
      }
    }

    // Search custom scriptures
    for (const c of custom) {
      if (
        c.reference.toLowerCase().includes(lower) ||
        c.text.toLowerCase().includes(lower) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(lower)))
      ) {
        matches.push({
          id: c.id,
          reference: c.reference,
          translation: c.translation,
          text: c.text,
          notes: c.notes,
          isCustom: true
        });
      }
    }

    this.searchResults = matches;
    this.notify();
    return matches;
  }

  previewVerse(verseItem) {
    liveStore.setPreview({
      type: 'scripture',
      title: `${verseItem.reference} (${verseItem.translation})`,
      reference: verseItem.reference,
      text: verseItem.text,
      subtitle: `${verseItem.translation} · Scripture`,
      speakerNotes: verseItem.notes || `Reference: ${verseItem.reference}`
    }, 'Bible Engine');
  }

  sendVerseLive(verseItem) {
    liveStore.goLive({
      type: 'scripture',
      title: `${verseItem.reference} (${verseItem.translation})`,
      reference: verseItem.reference,
      text: verseItem.text,
      subtitle: `${verseItem.translation} · Scripture`,
      speakerNotes: verseItem.notes || `Reference: ${verseItem.reference}`
    }, 'Bible Engine');
  }

  addToQueue(verseItem) {
    const exists = this.localQueue.find((q) => q.reference === verseItem.reference && q.translation === verseItem.translation);
    if (!exists) {
      this.localQueue.push({
        id: 'q_' + Date.now(),
        reference: verseItem.reference,
        translation: verseItem.translation || 'WEB',
        text: verseItem.text,
        notes: verseItem.notes
      });
      eventBus.emit('toast:notify', {
        type: 'info',
        title: 'Added to Scripture Queue',
        message: `${verseItem.reference} is ready in the local queue.`
      });
      AuditLogger.log({
        action: 'SCRIPTURE_QUEUED',
        resource: verseItem.reference
      });
      this.notify();
    }
  }

  removeFromQueue(index) {
    this.localQueue.splice(index, 1);
    this.notify();
  }

  reorderQueue(fromIndex, toIndex) {
    const [moved] = this.localQueue.splice(fromIndex, 1);
    this.localQueue.splice(toIndex, 0, moved);
    this.notify();
  }
}

export const bibleStore = new BibleStore();

