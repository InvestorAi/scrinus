/**
 * KERYX AI Center View
 * Pulpit speech transcription, scripture detection queue, confidence badges,
 * real-time micro-notes, latency telemetry monitor, benchmarks, and exports.
 */

import { aiStore } from '../../stores/aiStore.js';
import { speechEngine } from './speechEngine.js';
import { SermonIntelligence } from './sermonIntelligence.js';
import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';
import { latencyTelemetry } from './latencyTelemetry.js';
import { BenchmarkSuite } from './benchmarkSuite.js';

export class AICenterView {
  static render() {
    const {
      isListening,
      autopilotMode,
      transcriptSegments,
      detectedScriptures,
      microNoteEvents = [],
      detectedSongs = [],
      notes,
      summary,
      telemetry
    } = aiStore.getState();

    const { church } = appStore.getState();
    const repurposed = SermonIntelligence.generateRepurposedContent(summary.title, church.pastor);

    return `
      <section class="page ai-center-page">
        <!-- AI Control Header -->
        <div class="page-heading">
          <div>
            <span class="eyebrow">INTELLIGENT MINISTRY COPILOT</span>
            <h1>AI Center & Speech Intelligence</h1>
            <p class="subheading">Continuous pulpit speech recognition, automated scripture detection queue, real-time notes, and sermon repurposing.</p>
          </div>
          <div class="heading-actions">
            <!-- Autopilot Mode Selector -->
            <label class="autopilot-mode-label">Autopilot:
              <select id="ai-select-autopilot">
                <option value="Manual" ${autopilotMode === 'Manual' ? 'selected' : ''}>Manual (Operator controls all)</option>
                <option value="Assisted" ${autopilotMode === 'Assisted' ? 'selected' : ''}>Assisted (AI recommends to queue)</option>
                <option value="Automatic" ${autopilotMode === 'Automatic' ? 'selected' : ''}>Automatic (Auto-approves 95%+)</option>
                <option value="Emergency" ${autopilotMode === 'Emergency' ? 'selected' : ''}>Emergency (AI disabled)</option>
              </select>
            </label>

            <!-- Main Mic Toggle Button -->
            <button class="primary-button ${isListening ? 'listening-active-btn' : ''}" id="ai-btn-listen-toggle">
              <span>${isListening ? '⏸' : '▶'}</span> ${isListening ? 'Pause AI Listening' : 'Start AI Listening'}
            </button>

            <!-- Continuous Demo Stream Button -->
            <button class="secondary-button" id="ai-btn-stream-sample-sermon" title="Stream continuous demo sermon speech to watch AI Note Taker write live">
              <span>⚡</span> Stream Sample Sermon
            </button>
          </div>
        </div>

        <!-- Live Audio VU & Realtime Telemetry Banner -->
        <div class="ai-audio-status-bar panel">
          <div class="audio-vu-meter-wrap">
            <span class="vu-label">SPEECH INPUT VU:</span>
            <div class="vu-meter-track">
              <div class="vu-meter-fill" id="ai-vu-fill" style="width: ${isListening ? '55%' : '0%'};"></div>
            </div>
            <span class="vu-db-text" id="ai-vu-db">${isListening ? '-16 dB (Active)' : 'Muted'}</span>
          </div>
          <div class="audio-mode-indicator">
            <span class="status-dot"></span>
            <strong>Mode: ${autopilotMode.toUpperCase()}</strong>

            <!-- Realtime Telemetry HUD Pill -->
            <div class="realtime-sla-pill ${telemetry && telemetry.slaBreached ? 'sla-breached' : 'sla-compliant'}" id="ai-sla-pill">
              <span class="pill-dot">●</span>
              <span class="pill-text">
                P95: <strong>${telemetry ? telemetry.p95 : 0}ms</strong> · P50: <strong>${telemetry ? telemetry.p50 : 0}ms</strong>
                <span class="sla-badge">${telemetry && telemetry.slaBreached ? 'SLA BREACH' : 'SLA &le;300ms'}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 2-Column AI Operations Grid -->
        <div class="ai-operations-grid">
          <!-- Left Column: Live Speech Transcript Stream -->
          <div class="transcript-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">LIVE PULPIT SPEECH</span>
                <h3>Streaming Transcript</h3>
              </div>
              <span class="offline-label"><i></i> Realtime Lane A (&le;300ms)</span>
            </div>

            <div class="transcript-scroll-box" id="ai-transcript-box">
              ${transcriptSegments
                .map(
                  (seg) => `
                <div class="transcript-entry">
                  <span class="transcript-time">[${seg.timestamp}]</span>
                  <strong class="transcript-speaker">${seg.speaker}:</strong>
                  <span class="transcript-text">${seg.text}</span>
                </div>
              `
                )
                .join('')}
              <div class="transcript-entry transcript-interim-entry" id="ai-transcript-interim-row" style="display:none;">
                <span class="transcript-time" id="ai-interim-time">[--:--:--]</span>
                <strong class="transcript-speaker">Live:</strong>
                <span class="transcript-text interim-live-text" id="ai-interim-text"></span>
              </div>
            </div>

            <div class="transcript-panel-footer">
              <input type="text" id="ai-test-speech-input" placeholder="Type or paste pulpit speech to test detector... (press Enter)" />
              <button class="secondary-button small" id="ai-btn-test-speech">Simulate Speech</button>
            </div>
          </div>

          <!-- Right Column: AI SCRIPTURE DETECTION QUEUE -->
          <div class="detection-queue-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">AI DETECTIONS (${detectedScriptures.length})</span>
                <h3>Scripture Confidence Queue</h3>
              </div>
              <span class="auto-approve-badge ${autopilotMode === 'Automatic' ? 'auto-active' : ''}">
                ${autopilotMode === 'Automatic' ? 'Auto-Approval 95%+' : 'Operator Approval Required'}
              </span>
            </div>

            <div class="detection-queue-list" id="ai-detection-list">
              ${
                detectedSongs.length > 0
                  ? `
                <div class="detected-songs-section">
                  <span class="eyebrow" style="color:var(--green); margin-bottom:8px; display:block;">AI SONG DETECTION (PRD §33)</span>
                  ${detectedSongs
                    .map(
                      (s) => `
                    <div class="detection-card conf-high song-match-card" data-id="${s.id}">
                      <div class="detection-top">
                        <div class="detection-ref-wrap">
                          <span class="conf-dot" style="background:#34d399; box-shadow:0 0 8px #34d399;">●</span>
                          <strong>🎵 ${s.title}</strong>
                          <span class="conf-percent">${s.confidence.toFixed(1)}% Match</span>
                        </div>
                        <span class="detection-strategy-badge">Worship Library</span>
                      </div>
                      <small style="color:var(--nav-muted); display:block; margin: 4px 0;">Matched lyric: “${s.matchedPhrase}” (${s.sectionLabel})</small>
                      <div class="detection-actions">
                        <button class="primary-button small btn-cue-song" data-id="${s.id}">Stage Lyrics <span>→</span></button>
                        <button class="icon-button btn-dismiss-song" data-id="${s.id}" title="Dismiss">✕</button>
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }

              ${detectedScriptures
                .map(
                  (item) => `
                <div class="detection-card ${item.status === 'superseded' ? 'conf-superseded' : item.confidence >= 95 ? 'conf-high' : item.confidence >= 85 ? 'conf-med' : 'conf-low'}" data-id="${item.id}">
                  <div class="detection-top">
                    <div class="detection-ref-wrap">
                      <span class="conf-dot">●</span>
                      <strong>${item.reference}</strong>
                      <span class="conf-percent">${item.confidence.toFixed(1)}%</span>
                      ${item.status === 'superseded' ? '<span class="superseded-badge">SUPERSEDED</span>' : ''}
                      ${item.status === 'live' ? '<span class="live-badge">ON AIR</span>' : ''}
                    </div>
                    <span class="detection-strategy-badge">${item.type || item.method}</span>
                    <span class="detection-time">${item.timestamp}</span>
                  </div>

                  <p class="detection-verse-body">“${item.text}”</p>

                  <div class="detection-actions">
                    <button class="secondary-button small det-btn-preview" data-id="${item.id}">Preview</button>
                    <button class="primary-button small det-btn-live" data-id="${item.id}">Go Live <span>→</span></button>
                    <button class="icon-button det-btn-reject" data-id="${item.id}" title="Reject suggestion">✕</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <!-- Lower Section: Real-Time Micro-Notes, Latency Telemetry, Notes, Summaries & Repurposing -->
        <div class="sermon-intelligence-section panel">
          <div class="sermon-tabs-header">
            <div class="intel-tabs" id="intel-tabs">
              <button class="intel-tab active" data-tab="micro-notes">⚡ Real-Time Micro-Notes (<span id="micro-notes-badge-count">${microNoteEvents.length}</span>)</button>
              <button class="intel-tab" data-tab="notes">📝 AI Sermon Notes (<span id="sermon-notes-badge-count">${notes.length}</span>)</button>
              <button class="intel-tab" data-tab="telemetry">📊 Realtime Telemetry & SLA</button>
              <button class="intel-tab" data-tab="summary">Sermon Summary</button>
              <button class="intel-tab" data-tab="repurpose">Content Repurposing</button>
            </div>
            <div class="sermon-export-actions">
              <button class="secondary-button small" id="ai-btn-export-txt">Export TXT</button>
              <button class="secondary-button small" id="ai-btn-export-md">Export Markdown</button>
              <button class="primary-button small" id="ai-btn-print-pdf">Print / PDF <span>⎙</span></button>
            </div>
          </div>

          <!-- Tab 1: Real-Time Micro-Notes (Lane A sub-300ms events) -->
          <div class="intel-tab-content active" id="tab-content-micro-notes">
            <div class="micro-notes-toolbar">
              <span class="micro-notice">Realtime Lane A micro-events extracted locally in &lt;5ms without cloud LLM blocking.</span>
              <span class="micro-count-pill">${microNoteEvents.length} Captured Events</span>
            </div>
            <div class="notes-cards-grid" id="ai-micro-notes-grid">
              ${microNoteEvents.length === 0
                ? '<div class="empty-notice">Awaiting speech... Micro-events (KEY_IDEA, POINT, QUOTE, APPLICATION, PRAYER) will stream here in realtime.</div>'
                : microNoteEvents
                    .map(
                      (e) => `
                <div class="note-card panel micro-event-card ${e.type.toLowerCase()}">
                  <div class="micro-card-top">
                    <span class="note-category">${e.type}</span>
                    <span class="micro-state-tag ${e.status.toLowerCase()}">${e.status}</span>
                    <span class="micro-timestamp">${e.timestamp}</span>
                  </div>
                  <p class="note-text">${e.text}</p>
                </div>
              `
                    )
                    .join('')}
            </div>
          </div>

          <!-- Tab 2: Latency Telemetry & SLA Monitor -->
          <div class="intel-tab-content" id="tab-content-telemetry" style="display:none;">
            <div class="telemetry-dashboard-grid">
              <!-- KPI Row -->
              <div class="telemetry-kpis">
                <div class="telemetry-kpi-card">
                  <span class="kpi-label">P50 LATENCY</span>
                  <strong class="kpi-val" id="tele-p50">${telemetry ? telemetry.p50 : 0}ms</strong>
                  <small class="kpi-sub">Target &le;100ms</small>
                </div>
                <div class="telemetry-kpi-card">
                  <span class="kpi-label">P90 LATENCY</span>
                  <strong class="kpi-val" id="tele-p90">${telemetry ? telemetry.p90 : 0}ms</strong>
                  <small class="kpi-sub">Target &le;200ms</small>
                </div>
                <div class="telemetry-kpi-card highlight">
                  <span class="kpi-label">P95 LATENCY (SLA)</span>
                  <strong class="kpi-val" id="tele-p95">${telemetry ? telemetry.p95 : 0}ms</strong>
                  <small class="kpi-sub ${telemetry && telemetry.slaBreached ? 'sub-breach' : 'sub-ok'}" id="tele-sla-label">
                    ${telemetry && telemetry.slaBreached ? '⚠️ BREACHED (>300ms)' : '✓ COMPLIANT (&le;300ms)'}
                  </small>
                </div>
                <div class="telemetry-kpi-card">
                  <span class="kpi-label">P99 LATENCY</span>
                  <strong class="kpi-val" id="tele-p99">${telemetry ? telemetry.p99 : 0}ms</strong>
                  <small class="kpi-sub">Target &le;500ms</small>
                </div>
                <div class="telemetry-kpi-card">
                  <span class="kpi-label">BOTTLENECK</span>
                  <strong class="kpi-val" id="tele-bottleneck" style="font-size:1.05rem;">${telemetry ? telemetry.bottleneck : 'None'}</strong>
                  <small class="kpi-sub">Component attribution</small>
                </div>
              </div>

              <!-- Component Splits Table & Benchmark Controls -->
              <div class="telemetry-details-split">
                <div class="panel telemetry-subpanel">
                  <h4>Component Latency Breakdown (Averaged Window)</h4>
                  <table class="telemetry-breakdown-table">
                    <thead>
                      <tr><th>Subsystem</th><th>Target</th><th>Measured Average</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ASR Partial Delivery / Jitter</td><td>0–100ms</td>
                        <td id="split-asr">${telemetry && telemetry.breakdown ? telemetry.breakdown.asrArrival : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">Normal</span></td>
                      </tr>
                      <tr>
                        <td>Incremental Token Parser</td><td>&lt;10ms</td>
                        <td id="split-parser">${telemetry && telemetry.breakdown ? telemetry.breakdown.parser : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">Optimized</span></td>
                      </tr>
                      <tr>
                        <td>Deterministic Context Resolution</td><td>&lt;5ms</td>
                        <td id="split-context">${telemetry && telemetry.breakdown ? telemetry.breakdown.context : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">Sub-ms</span></td>
                      </tr>
                      <tr>
                        <td>Local In-Memory Bible Lookup</td><td>&lt;10ms</td>
                        <td id="split-lookup">${telemetry && telemetry.breakdown ? telemetry.breakdown.lookup : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">O(1) RAM</span></td>
                      </tr>
                      <tr>
                        <td>Confidence Scoring & Safety</td><td>&lt;5ms</td>
                        <td id="split-confidence">${telemetry && telemetry.breakdown ? telemetry.breakdown.confidence : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">Instant</span></td>
                      </tr>
                      <tr>
                        <td>Event Bus Fanout (SCRIPTURE_READY)</td><td>&lt;5ms</td>
                        <td id="split-event">${telemetry && telemetry.breakdown ? telemetry.breakdown.event : 0}ms</td>
                        <td><span class="tele-status-tag tag-ok">Synchronous</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="panel telemetry-subpanel">
                  <h4>300ms SLA Acceptance Benchmark Suite</h4>
                  <p class="benchmark-desc">Execute automated test scenarios to verify compliance against the aggressive realtime latency contract.</p>

                  <div class="benchmark-btn-grid">
                    <button class="primary-button small" id="btn-run-all-benchmarks">⚡ Run All 5 Acceptance Tests</button>
                    <button class="secondary-button small" id="btn-run-bench-1">Test 1: Romans 8:28 (1,000 Runs)</button>
                    <button class="secondary-button small" id="btn-run-bench-2">Test 2: Psalm 23:1 Quotation</button>
                    <button class="secondary-button small" id="btn-run-bench-3">Test 3: Relative Verse ("verse 28")</button>
                    <button class="secondary-button small" id="btn-run-bench-4">Test 4: Next Verse Pre-Cache</button>
                    <button class="secondary-button small" id="btn-run-bench-5">Test 5: 60-Min Continuous Load</button>
                  </div>

                  <div class="benchmark-results-box" id="benchmark-results-box" style="margin-top:14px; display:none;">
                    <div class="benchmark-results-header">
                      <strong>Benchmark Execution Output:</strong>
                      <span id="benchmark-status-badge">Running...</span>
                    </div>
                    <pre id="benchmark-output-log"></pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 3: Deep AI Sermon Notes (Lane A + Lane B) -->
          <div class="intel-tab-content" id="tab-content-notes" style="display:none;">
            <div class="micro-notes-toolbar" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="status-pip pulse-emerald"></span>
                <span class="micro-notice" style="font-weight: 600; color: #34d399;" id="ai-notes-live-indicator">● AI Note Taker Active — Writing notes live from pulpit speech</span>
              </div>
              <span class="micro-count-pill" id="ai-notes-count-pill">${notes.length} Active Notes</span>
            </div>
            <div class="notes-cards-grid" id="ai-deep-notes-grid">
              ${notes
                .map(
                  (n) => `
                <div class="note-card panel" data-note-id="${n.id}">
                  <div class="note-card-top" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span class="note-category">${n.category.toUpperCase()}</span>
                    <button class="secondary-button small btn-push-note-lower-third" data-cat="${n.category}" data-content="${(n.content || '').replace(/"/g, '&quot;')}" style="font-size: 10px; padding: 2px 8px;">▤ Push to Lower-Third</button>
                  </div>
                  <p class="note-text">${n.content}</p>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Tab 4: Summary (Lane B) -->
          <div class="intel-tab-content" id="tab-content-summary" style="display:none;">
            <div class="summary-box">
              <h3>${summary.title}</h3>
              <p class="summary-oneliner"><strong>One-Liner:</strong> ${summary.oneLiner}</p>
              <div class="summary-detailed">
                <strong>Detailed Pastoral Synopsis:</strong>
                <p>${summary.detailed}</p>
              </div>
            </div>
          </div>

          <!-- Tab 5: Content Repurposing (Lane B) -->
          <div class="intel-tab-content" id="tab-content-repurpose" style="display:none;">
            <div class="repurpose-grid">
              <div class="repurpose-card panel">
                <span class="eyebrow">FACEBOOK POST</span>
                <pre class="repurpose-text">${repurposed.facebook}</pre>
                <button class="secondary-button small btn-copy-repurpose">Copy Post</button>
              </div>
              <div class="repurpose-card panel">
                <span class="eyebrow">INSTAGRAM CAPTION</span>
                <pre class="repurpose-text">${repurposed.instagram}</pre>
                <button class="secondary-button small btn-copy-repurpose">Copy Caption</button>
              </div>
              <div class="repurpose-card panel">
                <span class="eyebrow">WHATSAPP DEVOTIONAL</span>
                <pre class="repurpose-text">${repurposed.whatsapp}</pre>
                <button class="secondary-button small btn-copy-repurpose">Copy Message</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    const listenBtn = container.querySelector('#ai-btn-listen-toggle');
    const autopilotSelect = container.querySelector('#ai-select-autopilot');
    const testSpeechInput = container.querySelector('#ai-test-speech-input');
    const testSpeechBtn = container.querySelector('#ai-btn-test-speech');
    const transcriptBox = container.querySelector('#ai-transcript-box');
    const vuFill = container.querySelector('#ai-vu-fill');
    const vuDb = container.querySelector('#ai-vu-db');

    const interimRow = container.querySelector('#ai-transcript-interim-row');
    const interimText = container.querySelector('#ai-interim-text');
    const interimTime = container.querySelector('#ai-interim-time');

    // Telemetry DOM elements
    const slaPill = container.querySelector('#ai-sla-pill');
    const teleP50 = container.querySelector('#tele-p50');
    const teleP90 = container.querySelector('#tele-p90');
    const teleP95 = container.querySelector('#tele-p95');
    const teleP99 = container.querySelector('#tele-p99');
    const teleBottleneck = container.querySelector('#tele-bottleneck');
    const teleSlaLabel = container.querySelector('#tele-sla-label');

    // Scroll transcript to bottom
    if (transcriptBox) transcriptBox.scrollTop = transcriptBox.scrollHeight;

    listenBtn?.addEventListener('click', () => {
      aiStore.toggleListening();
      if (aiStore.isListening) {
        speechEngine.start();
      } else {
        speechEngine.stop();
      }
      eventBus.emit('view:refresh');
    });

    autopilotSelect?.addEventListener('change', (e) => {
      aiStore.setAutopilotMode(e.target.value);
    });

    // VU meter listener
    eventBus.on('audio:vu', (level) => {
      if (vuFill) vuFill.style.width = `${level}%`;
      if (vuDb) vuDb.textContent = level > 0 ? `-${Math.max(6, 40 - Math.round(level * 0.35))} dB` : 'Muted';
    });

    // Interim streaming transcript listener for zero-lag captions
    eventBus.on('ai:interim', (data) => {
      if (!interimRow || !interimText) return;
      if (data && data.text) {
        interimRow.style.display = 'flex';
        interimText.textContent = data.text;
        if (interimTime) interimTime.textContent = `[${data.timestamp}]`;
        if (transcriptBox) transcriptBox.scrollTop = transcriptBox.scrollHeight;
      } else {
        interimRow.style.display = 'none';
      }
    });

    // Realtime Telemetry listener (Granular DOM update without full page rerender)
    eventBus.on('telemetry:updated', (stats) => {
      if (!stats) return;

      if (slaPill) {
        slaPill.className = `realtime-sla-pill ${stats.slaBreached ? 'sla-breached' : 'sla-compliant'}`;
        const pillText = slaPill.querySelector('.pill-text');
        if (pillText) {
          pillText.innerHTML = `P95: <strong>${stats.p95}ms</strong> · P50: <strong>${stats.p50}ms</strong> <span class="sla-badge">${stats.slaBreached ? 'SLA BREACH' : 'SLA &le;300ms'}</span>`;
        }
      }

      if (teleP50) teleP50.textContent = `${stats.p50}ms`;
      if (teleP90) teleP90.textContent = `${stats.p90}ms`;
      if (teleP95) teleP95.textContent = `${stats.p95}ms`;
      if (teleP99) teleP99.textContent = `${stats.p99}ms`;
      if (teleBottleneck) teleBottleneck.textContent = stats.bottleneck;
      if (teleSlaLabel) {
        teleSlaLabel.className = `kpi-sub ${stats.slaBreached ? 'sub-breach' : 'sub-ok'}`;
        teleSlaLabel.textContent = stats.slaBreached ? '⚠️ BREACHED (>300ms)' : '✓ COMPLIANT (<=300ms)';
      }

      // Splits
      if (stats.breakdown) {
        const b = stats.breakdown;
        const sAsr = container.querySelector('#split-asr');
        const sParser = container.querySelector('#split-parser');
        const sCtx = container.querySelector('#split-context');
        const sLookup = container.querySelector('#split-lookup');
        const sConf = container.querySelector('#split-confidence');
        const sEvent = container.querySelector('#split-event');

        if (sAsr) sAsr.textContent = `${b.asrArrival}ms`;
        if (sParser) sParser.textContent = `${b.parser}ms`;
        if (sCtx) sCtx.textContent = `${b.context}ms`;
        if (sLookup) sLookup.textContent = `${b.lookup}ms`;
        if (sConf) sConf.textContent = `${b.confidence}ms`;
        if (sEvent) sEvent.textContent = `${b.event}ms`;
      }
    });

    // Realtime Micro-note event listener (Prepends directly to DOM)
    eventBus.on('ai:micro_note', (event) => {
      const grid = container.querySelector('#ai-micro-notes-grid');
      const tabBadge = container.querySelector('#micro-notes-badge-count');
      if (tabBadge) {
        const cur = parseInt(tabBadge.textContent) || 0;
        tabBadge.textContent = cur + 1;
      }
      if (!grid || !event) return;

      const empty = grid.querySelector('.empty-notice');
      if (empty) empty.remove();

      const card = document.createElement('div');
      card.className = `note-card panel micro-event-card ${event.type.toLowerCase()}`;
      card.innerHTML = `
        <div class="micro-card-top">
          <span class="note-category">${event.type}</span>
          <span class="micro-state-tag ${event.status.toLowerCase()}">${event.status}</span>
          <span class="micro-timestamp">${event.timestamp}</span>
        </div>
        <p class="note-text">${event.text}</p>
      `;
      grid.prepend(card);
    });

    // Realtime Transcript Entry listener (Appends directly to DOM)
    eventBus.on('ai:transcript_added', (seg) => {
      if (!transcriptBox || !seg) return;
      const entry = document.createElement('div');
      entry.className = 'transcript-entry';
      entry.innerHTML = `
        <span class="transcript-time">[${seg.timestamp}]</span>
        <strong class="transcript-speaker">${seg.speaker}:</strong>
        <span class="transcript-text">${seg.text}</span>
      `;
      if (interimRow) {
        transcriptBox.insertBefore(entry, interimRow);
      } else {
        transcriptBox.appendChild(entry);
      }
      transcriptBox.scrollTop = transcriptBox.scrollHeight;
    });

    // Realtime Scripture Detection listener (Prepends directly to queue)
    eventBus.on('ai:scripture_detected', (det) => {
      const list = container.querySelector('#ai-detection-list');
      if (!list || !det) return;
      const existing = list.querySelector(`[data-id="${det.id}"]`);
      if (existing) return;

      const card = document.createElement('div');
      card.className = `detection-card ${det.confidence >= 95 ? 'conf-high' : det.confidence >= 85 ? 'conf-med' : 'conf-low'}`;
      card.dataset.id = det.id;
      card.innerHTML = `
        <div class="detection-top">
          <div class="detection-ref-wrap">
            <span class="conf-dot">●</span>
            <strong>${det.reference}</strong>
            <span class="conf-percent">${det.confidence.toFixed(1)}%</span>
            ${det.status === 'live' ? '<span class="live-badge">ON AIR</span>' : ''}
          </div>
          <span class="detection-strategy-badge">${det.type || det.method}</span>
          <span class="detection-time">${det.timestamp}</span>
        </div>
        <p class="detection-verse-body">“${det.text}”</p>
        <div class="detection-actions">
          <button class="secondary-button small det-btn-preview" data-id="${det.id}">Preview</button>
          <button class="primary-button small det-btn-live" data-id="${det.id}">Go Live <span>→</span></button>
          <button class="icon-button det-btn-reject" data-id="${det.id}" title="Reject suggestion">✕</button>
        </div>
      `;

      card.querySelector('.det-btn-preview')?.addEventListener('click', () => aiStore.previewScripture(det.id));
      card.querySelector('.det-btn-live')?.addEventListener('click', () => aiStore.sendScriptureLive(det.id));
      card.querySelector('.det-btn-reject')?.addEventListener('click', () => {
        aiStore.rejectScripture(det.id);
        card.remove();
      });

      list.prepend(card);
    });

    // Realtime AI Sermon Notes listener (Updates #ai-deep-notes-grid)
    const bindNoteCardButtons = (parent) => {
      parent.querySelectorAll('.btn-push-note-lower-third').forEach((btn) => {
        btn.addEventListener('click', () => {
          const cat = btn.dataset.cat;
          const content = btn.dataset.content;
          liveStore.setPreview({
            type: 'titles',
            title: cat,
            text: content,
            subtitle: 'Pastor Godswill · Walking By Faith'
          });
          eventBus.emit('toast:notify', {
            type: 'success',
            title: 'Pushed to Stage',
            message: `Cued [${cat}] to preview stage.`
          });
        });
      });
    };

    bindNoteCardButtons(container);

    eventBus.on('ai:notes_updated', (updatedNotes) => {
      const grid = container.querySelector('#ai-deep-notes-grid');
      const countPill = container.querySelector('#ai-notes-count-pill');
      const tabBadge = container.querySelector('#sermon-notes-badge-count');
      if (!grid || !Array.isArray(updatedNotes)) return;

      if (countPill) countPill.textContent = `${updatedNotes.length} Active Notes`;
      if (tabBadge) tabBadge.textContent = updatedNotes.length;

      const liveInd = container.querySelector('#ai-notes-live-indicator');
      if (liveInd) {
        liveInd.style.color = '#6ee7b7';
        liveInd.textContent = '● AI Note Taker: Note recorded from speech!';
        setTimeout(() => {
          if (liveInd) {
            liveInd.style.color = '#34d399';
            liveInd.textContent = '● AI Note Taker Active — Writing notes live from pulpit speech';
          }
        }, 2000);
      }

      grid.innerHTML = updatedNotes.map(n => `
        <div class="note-card panel note-card-fresh" data-note-id="${n.id}">
          <div class="note-card-top" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span class="note-category">${n.category.toUpperCase()}</span>
            <button class="secondary-button small btn-push-note-lower-third" data-cat="${n.category}" data-content="${(n.content || '').replace(/"/g, '&quot;')}" style="font-size: 10px; padding: 2px 8px;">▤ Push to Lower-Third</button>
          </div>
          <p class="note-text">${n.content}</p>
        </div>
      `).join('');

      bindNoteCardButtons(grid);
    });

    // Realtime Summary listener (Updates #tab-content-summary)
    eventBus.on('ai:summary_updated', (summary) => {
      const sumTab = container.querySelector('#tab-content-summary');
      if (!sumTab || !summary) return;
      const titleEl = sumTab.querySelector('h3');
      const oneLinerEl = sumTab.querySelector('.summary-oneliner');
      const detailedEl = sumTab.querySelector('.summary-detailed p');
      if (titleEl) titleEl.textContent = summary.title || '';
      if (oneLinerEl) oneLinerEl.innerHTML = `<strong>One-Liner:</strong> ${summary.oneLiner || ''}`;
      if (detailedEl) detailedEl.textContent = summary.detailed || '';
    });

    // Simulated speech testing (no full page reload)
    const runTestSpeech = async () => {
      const text = testSpeechInput?.value?.trim();
      if (!text) return;
      testSpeechInput.value = '';
      const t0 = performance.now();
      await speechEngine.handleFinalTranscript(text, 0.98, t0);
    };

    testSpeechBtn?.addEventListener('click', runTestSpeech);
    testSpeechInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runTestSpeech();
    });

    // Stream Sample Sermon Button
    const demoStreamBtn = container.querySelector('#ai-btn-stream-sample-sermon');
    if (demoStreamBtn) {
      demoStreamBtn.addEventListener('click', () => {
        const started = speechEngine.streamDemoSermon((phrase, idx, total) => {
          eventBus.emit('toast:notify', {
            type: 'info',
            title: `Sermon Stream (${idx}/${total})`,
            message: phrase.slice(0, 50) + '...'
          });
        });
        if (started) {
          demoStreamBtn.innerHTML = '<span>⏹</span> Stop Sample Sermon';
          demoStreamBtn.classList.add('listening-active-btn');
        } else {
          demoStreamBtn.innerHTML = '<span>⚡</span> Stream Sample Sermon';
          demoStreamBtn.classList.remove('listening-active-btn');
        }
      });
    }

    // Detection queue buttons
    container.querySelectorAll('.det-btn-preview').forEach((btn) => {
      btn.addEventListener('click', () => aiStore.previewScripture(btn.dataset.id));
    });

    container.querySelectorAll('.det-btn-live').forEach((btn) => {
      btn.addEventListener('click', () => aiStore.sendScriptureLive(btn.dataset.id));
    });

    container.querySelectorAll('.det-btn-reject').forEach((btn) => {
      btn.addEventListener('click', () => {
        aiStore.rejectScripture(btn.dataset.id);
        btn.closest('.detection-card')?.remove();
      });
    });

    // Song detection cueing & dismissal
    container.querySelectorAll('.btn-cue-song').forEach((btn) => {
      btn.addEventListener('click', () => {
        aiStore.cueDetectedSong(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-dismiss-song').forEach((btn) => {
      btn.addEventListener('click', () => {
        aiStore.dismissDetectedSong(btn.dataset.id);
        btn.closest('.song-match-card')?.remove();
      });
    });

    // Tabs switching
    container.querySelectorAll('.intel-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.intel-tab').forEach((t) => t.classList.remove('active'));
        container.querySelectorAll('.intel-tab-content').forEach((c) => (c.style.display = 'none'));

        tab.classList.add('active');
        const target = container.querySelector(`#tab-content-${tab.dataset.tab}`);
        if (target) target.style.display = 'block';
      });
    });

    // Exports
    container.querySelector('#ai-btn-export-txt')?.addEventListener('click', () => {
      const content = SermonIntelligence.exportAsPlainText();
      SermonIntelligence.downloadFile('sermon-notes-keryx.txt', content, 'text/plain');
    });

    container.querySelector('#ai-btn-export-md')?.addEventListener('click', () => {
      const content = SermonIntelligence.exportAsMarkdown();
      SermonIntelligence.downloadFile('sermon-notes-keryx.md', content, 'text/markdown');
    });

    container.querySelector('#ai-btn-print-pdf')?.addEventListener('click', () => {
      SermonIntelligence.printReport();
    });

    container.querySelectorAll('.btn-copy-repurpose').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.previousElementSibling.textContent;
        navigator.clipboard.writeText(text);
        eventBus.emit('toast:notify', { type: 'success', title: 'Copied to Clipboard', message: 'Ready to paste into church social channels.' });
      });
    });

    // Benchmark Suite Handlers
    const resultsBox = container.querySelector('#benchmark-results-box');
    const statusBadge = container.querySelector('#benchmark-status-badge');
    const outputLog = container.querySelector('#benchmark-output-log');

    const runBenchmark = async (fn, name) => {
      if (!resultsBox || !outputLog) return;
      resultsBox.style.display = 'block';
      if (statusBadge) {
        statusBadge.textContent = `Running ${name}...`;
        statusBadge.className = 'bench-running';
      }
      outputLog.textContent = `[BENCHMARK] Executing ${name}...\nPlease wait...`;

      try {
        const res = await fn();
        if (statusBadge) {
          const pass = res.allPassed !== undefined ? res.allPassed : res.passed;
          statusBadge.textContent = pass ? '✓ PASS' : '⚠️ BREACHED';
          statusBadge.className = pass ? 'bench-pass' : 'bench-fail';
        }
        outputLog.textContent = JSON.stringify(res, null, 2);
      } catch (err) {
        if (statusBadge) {
          statusBadge.textContent = 'ERROR';
          statusBadge.className = 'bench-fail';
        }
        outputLog.textContent = `Error executing benchmark:\n${err.stack || err.message}`;
      }
    };

    container.querySelector('#btn-run-all-benchmarks')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runAll(), 'Full Acceptance Benchmark Suite');
    });

    container.querySelector('#btn-run-bench-1')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runTest1_Romans828(1000), 'Test 1 (Romans 8:28 - 1,000 Runs)');
    });

    container.querySelector('#btn-run-bench-2')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runTest2_QuotationMatch(200), 'Test 2 (Psalm 23:1 Quotation)');
    });

    container.querySelector('#btn-run-bench-3')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runTest3_ContextualResolution(200), 'Test 3 (Contextual Resolution)');
    });

    container.querySelector('#btn-run-bench-4')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runTest4_PredictiveNextVerse(200), 'Test 4 (Predictive Pre-Cache)');
    });

    container.querySelector('#btn-run-bench-5')?.addEventListener('click', () => {
      runBenchmark(() => BenchmarkSuite.runTest5_ContinuousSermonLoad(5000, 50), 'Test 5 (Continuous Load)');
    });
  }
}
