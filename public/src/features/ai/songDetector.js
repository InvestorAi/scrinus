/**
 * KERYX AI Song Detection Engine (PRD §33)
 * Analyzes real-time transcript stream and matches spoken or sung phrases against
 * the church worship song library, allowing immediate one-click cueing of song slides.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';

export class SongDetector {
  /**
   * Scans a text snippet against the song library.
   * @param {string} text
   * @returns {Promise<Object|null>} Detected song match or null
   */
  static async detectSongFromText(text) {
    if (!text || text.trim().length < 8) return null;

    const lower = text.toLowerCase();
    const songs = await db.getAll(TABLE_NAMES.SONGS);
    if (!songs || songs.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;

    for (const song of songs) {
      // 1. Direct title match
      if (lower.includes(song.title.toLowerCase())) {
        return {
          song,
          confidence: 99.2,
          matchedPhrase: song.title,
          matchedSection: song.sections[0] || null
        };
      }

      // 2. Lyrics stanzas scanning
      if (song.sections && Array.isArray(song.sections)) {
        for (const sec of song.sections) {
          const lines = sec.lines.map((l) => l.toLowerCase());
          for (const line of lines) {
            if (line.length >= 10 && (lower.includes(line) || this.calculateSimilarity(lower, line) > 0.75)) {
              const score = lower.includes(line) ? 97.8 : 88.5;
              if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                  song,
                  confidence: score,
                  matchedPhrase: line,
                  matchedSection: sec
                };
              }
            }
          }
        }
      }
    }

    return bestMatch;
  }

  static calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    let intersection = 0;
    for (const w of words2) {
      if (words1.has(w)) intersection++;
    }

    return (2 * intersection) / (words1.size + words2.size || 1);
  }

  /**
   * Cues the detected song directly into the Preview broadcast stage.
   * @param {Object} songMatch
   */
  static cueSong(songMatch) {
    if (!songMatch || !songMatch.song) return;

    const s = songMatch.song;
    const sec = songMatch.matchedSection || s.sections[0] || { label: 'Lyrics', lines: [] };

    liveStore.setPreview({
      type: 'song',
      title: s.title,
      subtitle: `${s.artist || 'Worship'} · ${sec.label}`,
      content: sec.lines.join('\n'),
      reference: `${s.title} (${sec.label})`,
      songId: s.id,
      sectionIndex: 0
    });

    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'Worship Song Cued',
      message: `Cued "${s.title}" (${sec.label}) in Preview Stage.`
    });
  }
}

