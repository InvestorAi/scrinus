/**
 * KERYX Real-Time Speech Recognition & Dual-Pipe Audio Pipeline
 * Ultra-low-latency dual-lane architecture:
 * Lane A (Fast Brain, <=300ms P95): Interim/partial streaming, incremental parsing,
 * deterministic context resolution, micro-notes, and fanout event bus.
 * Lane B (Deep Brain, Asynchronous): Debounced background sermon synthesis & summary.
 */

import { aiStore } from '../../stores/aiStore.js';
import { ScriptureDetector } from './scriptureDetector.js';
import { SongDetector } from './songDetector.js';
import { SermonIntelligence } from './sermonIntelligence.js';
import { MicroNoteEngine } from './microNoteEngine.js';
import { latencyTelemetry } from './latencyTelemetry.js';
import { eventBus } from '../../core/eventBus.js';

class SpeechEngine {
  constructor() {
    this.recognition = null;
    this.audioContext = null;
    this.analyser = null;
    this.vuLevel = 0;
    this.simulatedTimer = null;
    this.deepLaneDebounceTimer = null;
    this.lastInterimProcessed = '';
    this.isDemoStreaming = false;
    this.demoStreamInterval = null;
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
          const asrEmitTime = performance.now();
          let interimText = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcript = res[0].transcript;
            if (res.isFinal) {
              const text = transcript.trim();
              const confidence = res[0].confidence || 0.96;
              if (text) {
                // Lane A: Critical Final Execution
                this.handleFinalTranscript(text, confidence, asrEmitTime);
              }
            } else {
              interimText += transcript;
            }
          }

          if (interimText.trim()) {
            // Lane A: Realtime Interim Streaming (<300ms)
            this.handleInterimTranscript(interimText.trim(), asrEmitTime);
          }
        };

        // Auto-restart recognition continuously when silence/pause occurs
        this.recognition.onend = () => {
          if (aiStore.isListening) {
            try {
              this.recognition.start();
            } catch (e) {}
          }
        };

        this.recognition.onerror = (err) => {
          if (err.error !== 'no-speech') {
            console.warn('[KERYX Speech] Web Speech notice:', err.error);
          }
          if (aiStore.isListening && err.error !== 'not-allowed') {
            setTimeout(() => {
              if (aiStore.isListening) {
                try {
                  this.recognition.start();
                } catch (e) {}
              }
            }, 300);
          }
        };
      } catch (e) {
        console.warn('[KERYX Speech] SpeechRecognition initialization notice:', e);
      }
    }
  }

  /**
   * LANE A: Ultra-low-latency interim token handling.
   * Feeds partial tokens into ScriptureDetector without waiting for sentence completion.
   * @param {string} text
   * @param {number} [asrEmitTimestamp]
   */
  async handleInterimTranscript(text, asrEmitTimestamp = null) {
    if (!text) return;
    aiStore.setInterimTranscript(text);

    // Fast deduplication & incremental length guard
    if (text === this.lastInterimProcessed) return;
    this.lastInterimProcessed = text;

    if (text.length >= 6) {
      try {
        const detected = await ScriptureDetector.analyzeText(text, null, asrEmitTimestamp);
        if (detected && detected.confidence >= 85) {
          aiStore.addDetectedScripture(detected);
        }
      } catch (e) {
        console.warn('[KERYX Speech] Interim detector notice:', e);
      }
    }
  }

  /**
   * LANE A: Real-time final transcript handler (<300ms P95 SLA).
   * Fans out concurrently to ScriptureDetector, MicroNoteEngine, Immediate Notes, and Presentation event.
   * Then schedules Lane B in the background.
   * @param {string} text
   * @param {number} confidence
   * @param {number} [asrEmitTimestamp]
   */
  async handleFinalTranscript(text, confidence, asrEmitTimestamp = null) {
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    this.lastInterimProcessed = '';
    aiStore.setInterimTranscript('');

    const timestamp = new Date().toLocaleTimeString();
    const segment = {
      id: 'seg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      text: cleanText,
      timestamp,
      speaker: 'Senior Pastor',
      confidence: confidence || 0.96
    };

    // 1. Immediate UI Transcript Delivery
    aiStore.addTranscriptSegment(segment);

    // 2. LANE A Fan-Out (Concurrent Non-blocking Execution)
    const laneAPromises = [
      // Fanout A: Scripture Detection & Presentation Event
      ScriptureDetector.analyzeText(cleanText, segment.id, asrEmitTimestamp).then((detected) => {
        if (detected) {
          aiStore.addDetectedScripture(detected);
        }
      }).catch((e) => console.warn('[KERYX Speech] Scripture detector error:', e)),

      // Fanout B: Sub-300ms Micro-Note Extraction
      Promise.resolve().then(() => {
        const microEvent = MicroNoteEngine.extractMicroEvent(cleanText, segment.id);
        if (microEvent) {
          aiStore.addMicroNoteEvent(microEvent);
        }
      }),

      // Fanout C: Immediate Lane A Sermon Notes (<1ms in-memory update)
      Promise.resolve().then(() => {
        const updatedNotes = SermonIntelligence.generateNotes(aiStore.transcriptSegments);
        aiStore.setNotes(updatedNotes);
      }),

      // Fanout D: Song Detector (In-memory scan)
      SongDetector.detectSongFromText(cleanText).then((detectedSong) => {
        if (detectedSong) {
          aiStore.addDetectedSong(detectedSong);
        }
      }).catch(() => {})
    ];

    await Promise.all(laneAPromises);

    // 3. LANE B: Asynchronous Background Intelligence (Never blocks Lane A)
    this.scheduleLaneBProcessing();
  }

  /**
   * LANE B: Debounced asynchronous sermon intelligence pipeline.
   * Executes deep notes generation, rolling sermon summary, and structural analysis.
   */
  scheduleLaneBProcessing() {
    if (this.deepLaneDebounceTimer) {
      clearTimeout(this.deepLaneDebounceTimer);
    }

    this.deepLaneDebounceTimer = setTimeout(() => {
      try {
        const allSegments = aiStore.transcriptSegments;
        if (allSegments.length > 0) {
          const updatedNotes = SermonIntelligence.generateNotes(allSegments);
          aiStore.setNotes(updatedNotes);

          const updatedSummary = SermonIntelligence.generateSummary(allSegments);
          aiStore.setSummary(updatedSummary);
        }
      } catch (e) {
        console.warn('[KERYX Speech] Lane B intelligence update error:', e);
      }
    }, 1200); // 1.2s debounce to preserve UI responsiveness
  }

  async start() {
    let hasNativeRecognition = false;
    if (this.recognition) {
      try {
        this.recognition.start();
        hasNativeRecognition = true;
      } catch (e) {
        hasNativeRecognition = true;
      }
    }

    // Initialize real microphone audio analyser for live VU visualizer
    let hasMicStream = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
        this.startVUPolling();
        hasMicStream = true;
      }
    } catch (e) {
      console.warn('[KERYX Speech] Microphone stream permission notice:', e.message);
    }

    if (!hasMicStream) {
      this.vuLevel = 0;
      eventBus.emit('audio:vu', 0);
    }

    if (!hasNativeRecognition && !this.recognition) {
      eventBus.emit('toast:notify', {
        type: 'warning',
        title: 'Microphone / Web Speech Notice',
        message: 'Web Speech API is supported on Google Chrome, Edge, and Chromium browsers. Ensure microphone permissions are allowed.'
      });
    }
  }

  stop() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    if (this.simulatedTimer) {
      clearInterval(this.simulatedTimer);
      this.simulatedTimer = null;
    }
    if (this.deepLaneDebounceTimer) {
      clearTimeout(this.deepLaneDebounceTimer);
      this.deepLaneDebounceTimer = null;
    }
    this.stopDemoSermon();
    this.vuLevel = 0;
    eventBus.emit('audio:vu', 0);
  }

  startVUPolling() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    const update = () => {
      if (!aiStore.isListening) return;
      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
      this.vuLevel = Math.min(100, Math.round((avg / 128) * 100));
      eventBus.emit('audio:vu', this.vuLevel);
      requestAnimationFrame(update);
    };
    update();
  }

  startSimulatedVU() {
    const interval = setInterval(() => {
      if (!aiStore.isListening) {
        clearInterval(interval);
        return;
      }
      this.vuLevel = Math.round(35 + Math.random() * 45);
      eventBus.emit('audio:vu', this.vuLevel);
    }, 150);
  }

  startSimulatedSpeechStream() {
    const demoPhrases = [
      'Turn with me to Romans chapter eight verse twenty-eight.',
      'Now look at the next verse.',
      'The Lord is my shepherd, I shall not want.',
      'For by wise counsel thou shalt make thy war: and in multitude of counsellors there is safety.',
      'Remember the Lord your God, for it is He that gives you the ability to produce wealth.'
    ];

    let idx = 0;
    this.simulatedTimer = setInterval(async () => {
      if (!aiStore.isListening) return;

      const phrase = demoPhrases[idx % demoPhrases.length];
      idx++;
      await this.handleFinalTranscript(phrase, 0.98, performance.now());
    }, 8000);
  }

  /**
   * Continuous Demo Sermon Stream
   * Emits a sequence of realistic pulpit sermon sentences every 2.5s
   * allowing users, operators, and benchmarks to test the live Note Taker in action.
   */
  streamDemoSermon(onStep = null) {
    if (this.isDemoStreaming) {
      this.stopDemoSermon();
      return false;
    }

    const demoSermonPhrases = [
      'Good morning saints. Turn with your Bibles to the book of Romans chapter eight verse twenty-eight.',
      'How can you want to be rich and you do not know battle strategies? God leaves the battles of Canaan to train subsequent generations.',
      'Point one: Faith is not the absence of crisis, but the unwavering assurance of God’s sovereign purpose.',
      'Proverbs twenty-four verse six says by wise counsel thou shalt make thy war.',
      'Write this down: Kingdom wealth demands divine wisdom and spiritual discipline before territory can be sustained.',
      'The Lord is my shepherd; I shall not lack.',
      'I declare over your family that no weapon formed against you this season shall prosper.',
      'Point two: Spiritual maturity is unlocked through battle preparedness and covenant faithfulness.',
      'Father we pray for every home represented here today to experience supernatural breakthrough.'
    ];

    this.isDemoStreaming = true;
    let idx = 0;

    const pushNext = async () => {
      if (!this.isDemoStreaming) return;
      if (idx >= demoSermonPhrases.length) idx = 0;
      const phrase = demoSermonPhrases[idx++];
      const t0 = performance.now();
      await this.handleFinalTranscript(phrase, 0.98, t0);
      if (onStep) onStep(phrase, idx, demoSermonPhrases.length);
    };

    pushNext();
    this.demoStreamInterval = setInterval(pushNext, 2500);
    return true;
  }

  stopDemoSermon() {
    this.isDemoStreaming = false;
    if (this.demoStreamInterval) {
      clearInterval(this.demoStreamInterval);
      this.demoStreamInterval = null;
    }
  }
}

export const speechEngine = new SpeechEngine();
