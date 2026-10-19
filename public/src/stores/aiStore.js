/**
 * KERYX AI & Speech Intelligence Store
 * Manages streaming transcript segments, scripture detection queue, confidence scoring,
 * micro-note event stream, telemetry state, and Lane A/Lane B event coordination.
 */

import { eventBus } from '../core/eventBus.js';
import { liveStore } from './liveStore.js';
import { AuditLogger } from '../core/auditLogger.js';
import { latencyTelemetry } from '../features/ai/latencyTelemetry.js';

class AIStore {
  constructor() {
    this.isListening = false;
    this.interimTranscript = '';
    this.autopilotMode = 'Assisted'; // 'Manual' | 'Assisted' | 'Automatic' | 'Emergency'
    this.autoApproveThreshold = 95;
    this.reviewThreshold = 85;

    // Sliding memory windows to prevent unbounded growth during long sermons
    this.maxTranscriptSegments = 200;
    this.maxDetectedScriptures = 50;
    this.maxMicroNotes = 50;

    this.transcriptSegments = [
      {
        id: 'seg_1',
        text: 'Good morning saints. Turn with your Bibles this morning to the book of Romans chapter eight.',
        timestamp: '10:14:02',
        speaker: 'Senior Pastor',
        confidence: 0.98
      },
      {
        id: 'seg_2',
        text: 'We are reminded in verse twenty eight that all things work together for good to them that love God.',
        timestamp: '10:14:18',
        speaker: 'Senior Pastor',
        confidence: 0.99
      },
      {
        id: 'seg_3',
        text: 'No matter what difficulty you faced this past week, the Lord is your shepherd; you shall not lack.',
        timestamp: '10:15:05',
        speaker: 'Senior Pastor',
        confidence: 0.96
      }
    ];

    this.detectedScriptures = [
      {
        id: 'det_1',
        reference: 'Romans 8:28',
        book: 'Romans',
        chapter: 8,
        verse: 28,
        translation: 'WEB',
        text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.',
        confidence: 99.8,
        method: 'EXPLICIT_REFERENCE',
        type: 'Explicit Reference',
        status: 'confirmed',
        timestamp: '10:14:20'
      },
      {
        id: 'det_2',
        reference: 'Psalms 23:1',
        book: 'Psalms',
        chapter: 23,
        verse: 1,
        translation: 'WEB',
        text: 'The Lord is my shepherd; I shall lack nothing.',
        confidence: 97.4,
        method: 'QUOTATION_EXACT',
        type: 'Quoted Scripture',
        status: 'confirmed',
        timestamp: '10:15:07'
      }
    ];

    // Real-time micro-notes event stream (Sub-300ms Lane A events)
    this.microNoteEvents = [
      {
        id: 'note_evt_1',
        type: 'KEY_IDEA',
        category: 'Core Insight',
        text: 'Crisis reveals what secretly anchors your soul; sovereign purpose outweighs temporary pain.',
        status: 'CONFIRMED',
        timestamp: '10:14:25'
      },
      {
        id: 'note_evt_2',
        type: 'POINT',
        category: 'Sermon Outline Point',
        text: 'Faith requires believers to trust God’s sovereign purpose even when circumstances appear contrary.',
        status: 'CONFIRMED',
        timestamp: '10:15:10'
      }
    ];

    this.notes = [
      { id: 'note_1', category: 'Key Point', content: 'Faith re-anchors our perspective during crisis; difficulty reveals where our foundation is built.' },
      { id: 'note_2', category: 'Scripture Anchor', content: 'Romans 8:28 confirms that sovereign purpose outweighs temporary pain.' },
      { id: 'note_3', category: 'Action Item', content: 'Commit this week to praise before answers appear.' }
    ];

    this.summary = {
      title: 'Walking By Faith In Difficult Seasons',
      oneLiner: 'A transformative message establishing that God works all adversity together for the ultimate purpose of those who love Him.',
      detailed: 'In this powerful service, the church explored the resilience of biblical faith. Addressing seasons of uncertainty and difficulty, the sermon unpacked Romans 8:28, Hebrews 11:1, and Psalm 23:1. Believers were encouraged to look beyond temporary affliction into eternal purpose.',
      keyPoints: [
        'Crisis does not negate God\'s sovereign goodness.',
        'Faith requires active obedience prior to visible resolution.',
        'The shepherd\'s presence dispels every fear of the valley.'
      ]
    };

    this.detectedSongs = [
      {
        id: 'det_song_1',
        title: 'Way Maker',
        artist: 'Sinach',
        confidence: 98.4,
        matchedPhrase: 'Way maker, miracle worker, promise keeper',
        sectionLabel: 'Chorus'
      }
    ];

    this.targetLanguage = 'French';
    this.supportedLanguages = [
      'English', 'French', 'Portuguese', 'Spanish', 'Arabic',
      'Yoruba', 'Igbo', 'Hausa', 'Nigerian Pidgin', 'Swahili'
    ];

    this.listeners = new Set();
    this.initPresentationListener();
  }

  initPresentationListener() {
    // Listen for SCRIPTURE_READY event to trigger presentation recommendations
    eventBus.on('scripture:ready', (payload) => {
      if (!payload || !payload.reference) return;

      if (payload.action === 'LIVE') {
        liveStore.goLive({
          type: 'scripture',
          title: `${payload.reference} (${payload.translation || 'WEB'})`,
          reference: payload.reference,
          text: payload.text,
          subtitle: `AI Autopilot Live (${(payload.confidence * 100).toFixed(1)}%)`,
          speakerNotes: `AI Live trigger. Latency: ${payload.latencyMs || 0}ms`
        }, 'AI Autopilot');
      } else if (payload.action === 'PREVIEW') {
        liveStore.setPreview({
          type: 'scripture',
          title: `${payload.reference} (${payload.translation || 'WEB'})`,
          reference: payload.reference,
          text: payload.text,
          subtitle: `AI Recommended (${(payload.confidence * 100).toFixed(1)}%)`,
          speakerNotes: `AI Staged recommendation. Latency: ${payload.latencyMs || 0}ms`
        }, 'AI Recommendation');
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[KERYX AIStore] Listener notification error:', e);
      }
    });
    eventBus.emit('ai:changed', state);
  }

  getState() {
    return {
      isListening: this.isListening,
      interimTranscript: this.interimTranscript || '',
      autopilotMode: this.autopilotMode,
      transcriptSegments: this.transcriptSegments,
      detectedScriptures: this.detectedScriptures,
      microNoteEvents: this.microNoteEvents,
      detectedSongs: this.detectedSongs,
      notes: this.notes,
      summary: this.summary,
      targetLanguage: this.targetLanguage,
      supportedLanguages: this.supportedLanguages,
      telemetry: latencyTelemetry.getStats()
    };
  }

  setListening(val) {
    const newState = !!val;
    if (this.isListening === newState) return;
    this.isListening = newState;
    if (!this.isListening) {
      this.interimTranscript = '';
    }

    // Decoupled async audit logging
    setTimeout(() => {
      AuditLogger.log({
        action: this.isListening ? 'AI_LISTENING_STARTED' : 'AI_LISTENING_PAUSED',
        resource: 'Speech-to-Text Pipeline'
      }).catch(() => {});
    }, 0);

    this.notify();
  }

  setInterimTranscript(text) {
    this.interimTranscript = text || '';
    eventBus.emit('ai:interim', {
      text: this.interimTranscript,
      speaker: 'Senior Pastor',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  addTranscriptSegment(segment) {
    this.interimTranscript = '';
    this.transcriptSegments.push(segment);

    // Sliding window cap to prevent memory bloat over multi-hour sermons
    if (this.transcriptSegments.length > this.maxTranscriptSegments) {
      this.transcriptSegments.shift();
    }

    eventBus.emit('ai:transcript_added', segment);
    this.notify();
  }

  addDetectedScripture(detection) {
    if (!detection || !detection.reference) return;

    // Handle correction / supersede logic
    if (detection.isCorrection && detection.supersededRef) {
      this.detectedScriptures.forEach((item) => {
        if (item.reference.toLowerCase() === detection.supersededRef.toLowerCase()) {
          item.status = 'superseded';
        }
      });
    }

    // Avoid duplicate insertions
    const exists = this.detectedScriptures.find(
      (d) => d.reference.toLowerCase() === detection.reference.toLowerCase() && d.status !== 'superseded'
    );

    if (exists) {
      exists.confidence = Math.max(exists.confidence, detection.confidence);
      exists.timestamp = detection.timestamp;
      this.notify();
      return;
    }

    this.detectedScriptures.unshift(detection);
    if (this.detectedScriptures.length > this.maxDetectedScriptures) {
      this.detectedScriptures.pop();
    }

    eventBus.emit('ai:scripture_detected', detection);

    // Emit formal SCRIPTURE_READY event to presentation system
    const action = (this.autopilotMode === 'Automatic' && detection.confidence >= this.autoApproveThreshold)
      ? 'LIVE'
      : (this.autopilotMode === 'Assisted' || this.autopilotMode === 'Automatic')
      ? 'PREVIEW'
      : 'NONE';

    eventBus.emit('scripture:ready', {
      event: 'SCRIPTURE_READY',
      reference: detection.reference,
      translation: detection.translation || 'WEB',
      text: detection.text,
      confidence: detection.confidence / 100,
      action,
      latencyMs: detection.telemetry?.totalProcessingMs || 0
    });

    if (action === 'LIVE') {
      detection.status = 'live';
      setTimeout(() => {
        AuditLogger.log({
          action: 'AI_SCRIPTURE_SENT_LIVE',
          resource: detection.reference,
          details: `Confidence: ${detection.confidence}%, Mode: ${this.autopilotMode}`
        }).catch(() => {});
      }, 0);
    } else {
      eventBus.emit('toast:notify', {
        type: 'info',
        title: 'Scripture Detected',
        message: `${detection.reference} (${detection.confidence.toFixed(1)}% confidence)`
      });
    }

    this.notify();
  }

  addMicroNoteEvent(event) {
    if (!event) return;
    this.microNoteEvents.unshift(event);
    if (this.microNoteEvents.length > this.maxMicroNotes) {
      this.microNoteEvents.pop();
    }
    eventBus.emit('ai:micro_note', event);
    this.notify();
  }

  setNotes(newNotes) {
    if (Array.isArray(newNotes) && newNotes.length > 0) {
      this.notes = newNotes;
      eventBus.emit('ai:notes_updated', this.notes);
      this.notify();
    }
  }

  setSummary(newSummary) {
    if (newSummary && typeof newSummary === 'object') {
      this.summary = { ...this.summary, ...newSummary };
      eventBus.emit('ai:summary_updated', this.summary);
      this.notify();
    }
  }

  setTargetLanguage(lang) {
    if (lang && this.supportedLanguages.includes(lang)) {
      this.targetLanguage = lang;
      this.notify();
    }
  }

  clearTranscript() {
    this.transcriptSegments = [];
    this.interimTranscript = '';
    this.notify();
  }

  clearDetections() {
    this.detectedScriptures = [];
    this.notify();
  }

  toggleListening() {
    this.setListening(!this.isListening);
    eventBus.emit('toast:notify', {
      type: this.isListening ? 'success' : 'info',
      title: this.isListening ? 'AI Listening Active' : 'AI Listening Paused',
      message: this.isListening ? 'Real-time audio processing active (<=300ms SLA).' : 'AI audio capture paused.'
    });
  }

  setAutopilotMode(mode) {
    this.autopilotMode = mode;
    if (mode === 'Emergency') {
      liveStore.triggerEmergency();
    }
    setTimeout(() => {
      AuditLogger.log({
        action: 'AUTOPILOT_MODE_CHANGED',
        resource: mode
      }).catch(() => {});
    }, 0);
    this.notify();
  }

  previewScripture(detectionId) {
    const item = this.detectedScriptures.find((d) => d.id === detectionId);
    if (!item) return;

    liveStore.setPreview({
      type: 'scripture',
      title: `${item.reference} (${item.translation || 'WEB'})`,
      reference: item.reference,
      text: item.text,
      subtitle: `AI Detected (${item.confidence}% · ${item.type || item.method})`,
      speakerNotes: `Detected from speech at ${item.timestamp}. Match strategy: ${item.type || item.method}`
    }, 'AI Detection Queue');
  }

  sendScriptureLive(detectionId, source = 'Operator Approval') {
    const item = this.detectedScriptures.find((d) => d.id === detectionId);
    if (!item) return;

    item.status = 'live';

    liveStore.goLive({
      type: 'scripture',
      title: `${item.reference} (${item.translation || 'WEB'})`,
      reference: item.reference,
      text: item.text,
      subtitle: `AI Detected (${item.confidence}% · ${item.type || item.method})`,
      speakerNotes: `Detected from speech at ${item.timestamp}. Approved by ${source}`
    }, 'AI Detection Queue');

    setTimeout(() => {
      AuditLogger.log({
        action: 'AI_SCRIPTURE_SENT_LIVE',
        resource: item.reference,
        details: `Confidence: ${item.confidence}%, Mode: ${this.autopilotMode}`
      }).catch(() => {});
    }, 0);

    this.notify();
  }

  rejectScripture(detectionId) {
    const index = this.detectedScriptures.findIndex((d) => d.id === detectionId);
    if (index >= 0) {
      const [rejected] = this.detectedScriptures.splice(index, 1);
      setTimeout(() => {
        AuditLogger.log({
          action: 'AI_SCRIPTURE_REJECTED',
          resource: rejected.reference
        }).catch(() => {});
      }, 0);
      this.notify();
    }
  }

  addDetectedSong(songMatch) {
    if (!songMatch) return;
    const exists = this.detectedSongs.some((s) => s.title.toLowerCase() === songMatch.song.title.toLowerCase());
    if (!exists) {
      this.detectedSongs.unshift({
        id: 'det_song_' + Date.now(),
        title: songMatch.song.title,
        artist: songMatch.song.artist,
        confidence: songMatch.confidence,
        matchedPhrase: songMatch.matchedPhrase,
        sectionLabel: songMatch.matchedSection?.label || 'Lyrics',
        rawMatch: songMatch
      });
      eventBus.emit('toast:notify', {
        type: 'info',
        title: 'Worship Song Detected',
        message: `Matched "${songMatch.song.title}" (${songMatch.confidence.toFixed(1)}% confidence)`
      });
      this.notify();
    }
  }

  cueDetectedSong(songId) {
    const item = this.detectedSongs.find((s) => s.id === songId);
    if (!item) return;

    liveStore.setPreview({
      type: 'song',
      title: item.title,
      subtitle: `${item.artist || 'Worship'} · ${item.sectionLabel}`,
      content: `[${item.sectionLabel}]\n${item.matchedPhrase}`,
      reference: `${item.title} (${item.sectionLabel})`
    });

    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'Song Staged',
      message: `Cued "${item.title}" into Preview Stage.`
    });
  }

  dismissDetectedSong(songId) {
    this.detectedSongs = this.detectedSongs.filter((s) => s.id !== songId);
    this.notify();
  }
}

export const aiStore = new AIStore();
