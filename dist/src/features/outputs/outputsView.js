/**
 * KERYX Multi-Output Display Engine View
 * Independent routing for Main Auditorium, Stage Confidence Monitor, Lobby, and Livestream.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';

export class OutputsView {
  static render() {
    return `
      <section class="page outputs-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">MULTI-SCREEN ENGINE</span>
            <h1>Output Routing & Displays</h1>
            <p class="subheading">Route independent content to Auditorium Projectors, Pastor's Confidence Stage Monitor, Lobby Screens, and Livestream.</p>
          </div>
          <div class="heading-actions">
            <button class="secondary-button" id="out-btn-launch-stage">
              <span>🖥</span> Open Stage Display Window
            </button>
            <button class="primary-button" id="out-btn-launch-main">
              <span>📽</span> Open Main Screen Window
            </button>
          </div>
        </div>

        <!-- Displays Routing Table Panel -->
        <div class="outputs-grid panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">PHYSICAL & VIRTUAL OUTPUTS</span>
              <h3>Active Screen Matrix</h3>
            </div>
            <span class="offline-label"><i></i> Hardware Sync Active</span>
          </div>

          <div class="screens-table-wrap">
            <table class="keryx-table">
              <thead>
                <tr>
                  <th>Display Target</th>
                  <th>Hardware Device</th>
                  <th>Resolution</th>
                  <th>Current Routing Assignment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="outputs-table-body">
                <tr data-target="main">
                  <td><strong>Auditorium Main Screen</strong><small>Center LED Wall / Projector</small></td>
                  <td>Display #1 (HDMI / DP)</td>
                  <td>1920x1080 (16:9)</td>
                  <td>
                    <select class="output-route-select" data-screen="main">
                      <option selected>Live Slide / Scripture / Lyrics</option>
                      <option>Black Screen</option>
                      <option>Church Logo Loop</option>
                    </select>
                  </td>
                  <td><span class="status-pill online">Online</span></td>
                  <td><button class="secondary-button small btn-test-screen" data-target="main">Identify</button></td>
                </tr>
                <tr data-target="stage">
                  <td><strong>Stage Display (Confidence)</strong><small>Downstage Presenter Monitor</small></td>
                  <td>Display #2 (HDMI / SDI)</td>
                  <td>1920x1080 (16:9)</td>
                  <td>
                    <select class="output-route-select" data-screen="stage">
                      <option selected>Speaker Notes + Service Clock + Next Slide</option>
                      <option>Auditorium Mirror</option>
                      <option>Sermon Outline Only</option>
                    </select>
                  </td>
                  <td><span class="status-pill online">Online</span></td>
                  <td><button class="secondary-button small btn-test-screen" data-target="stage">Identify</button></td>
                </tr>
                <tr data-target="lobby">
                  <td><strong>Lobby & Overflow Foyer</strong><small>Welcome Area TV Network</small></td>
                  <td>Display #3 (NDI Network)</td>
                  <td>1920x1080 (16:9)</td>
                  <td>
                    <select class="output-route-select" data-screen="lobby">
                      <option selected>Welcome Announcements & Countdown</option>
                      <option>Auditorium Live Feed</option>
                    </select>
                  </td>
                  <td><span class="status-pill standby">Standby</span></td>
                  <td><button class="secondary-button small btn-test-screen" data-target="lobby">Identify</button></td>
                </tr>
                <tr data-target="stream">
                  <td><strong>Livestream Video Feed</strong><small>OBS Studio / vMix / RTMP Output</small></td>
                  <td>Virtual NDI Alpha Channel</td>
                  <td>1920x1080 (60 FPS)</td>
                  <td>
                    <select class="output-route-select" data-screen="stream">
                      <option selected>Lower Thirds & Scripture Overlays (Transparent)</option>
                      <option>Full Screen Presentation</option>
                    </select>
                  </td>
                  <td><span class="status-pill online">Armed</span></td>
                  <td><button class="secondary-button small btn-test-screen" data-target="stream">Test</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Stage Confidence Monitor Preview Box -->
        <div class="stage-monitor-preview-section">
          <div class="section-header compact">
            <div>
              <span class="eyebrow">CONFIDENCE MONITOR SIMULATOR</span>
              <h3>What the Pastor Sees on Stage</h3>
            </div>
            <span class="time-clock-display" id="stage-clock-ticker">10:15:22 AM</span>
          </div>

          <div class="stage-monitor-sim panel" id="stage-monitor-sim">
            <div class="stage-sim-top">
              <div class="stage-sim-time">
                <span class="sim-label">SERVICE CLOCK</span>
                <strong id="sim-clock-val">10:15 AM</strong>
              </div>
              <div class="stage-sim-countdown">
                <span class="sim-label">REMAINING TIME</span>
                <strong class="timer-warning">32:45</strong>
              </div>
            </div>
            <div class="stage-sim-main">
              <span class="sim-label">PRESENTER NOTES</span>
              <div class="stage-notes-box" id="sim-notes-val">
                ${liveStore.getState().currentLive.speakerNotes || 'Welcome the church and online congregation.'}
              </div>
            </div>
            <div class="stage-sim-bottom">
              <div class="stage-next-preview">
                <span class="sim-label">NEXT SLIDE IN QUEUE</span>
                <p id="sim-next-val">${liveStore.getState().currentPreview.title || 'Next moment'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    container.querySelector('#out-btn-launch-stage')?.addEventListener('click', () => {
      this.openStageWindow();
    });

    container.querySelector('#out-btn-launch-main')?.addEventListener('click', () => {
      this.openMainWindow();
    });

    container.querySelectorAll('.btn-test-screen').forEach((btn) => {
      btn.addEventListener('click', () => {
        eventBus.emit('toast:notify', {
          type: 'info',
          title: 'Screen Test Pattern Sent',
          message: `Flashing test pattern to ${btn.dataset.target.toUpperCase()} display.`
        });
      });
    });

    // Clock update ticker
    const clockVal = container.querySelector('#sim-clock-val');
    const clockTicker = container.querySelector('#stage-clock-ticker');
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      if (clockVal) clockVal.textContent = timeStr;
      if (clockTicker) clockTicker.textContent = timeStr;
    };
    setInterval(updateTime, 1000);
    updateTime();
  }

  static openStageWindow() {
    const stageWindow = window.open('', 'KeryxStageDisplay', 'width=960,height=540');
    if (!stageWindow) {
      alert('Please allow popups to open the separate Stage Display.');
      return;
    }

    const state = liveStore.getState();
    const notes = state.currentLive.speakerNotes || 'No notes for current slide.';

    stageWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KERYX Stage Display (Live Foldback)</title>
        <style>
          body { background:#0a0f12; color:#fff; font-family:sans-serif; margin:0; padding:24px; box-sizing:border-box; height:100vh; display:flex; flex-direction:column; user-select:none; }
          .top { display:flex; justify-content:space-between; border-bottom:2px solid #222e33; padding-bottom:12px; }
          .clock { font-size:42px; font-weight:bold; color:#df654e; font-family:monospace; }
          .live-badge { display:inline-block; background:#df654e; color:#fff; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:4px; margin-bottom:4px; }
          .notes { flex:1; margin:24px 0; font-size:32px; line-height:1.4; color:#e0e8e7; font-weight:500; overflow-y:auto; }
          .bottom { border-top:2px solid #222e33; padding-top:12px; font-size:20px; color:#889598; display:flex; justify-content:space-between; }
        </style>
      </head>
      <body>
        <div class="top">
          <div>
            <span class="live-badge">ON-AIR STAGE CONFIDENCE</span>
            <div><strong id="stage-title" style="font-size:24px;">${state.currentLive.title || 'Live'}</strong></div>
          </div>
          <div class="clock" id="clock">--:--:--</div>
        </div>
        <div class="notes" id="notes">${notes}</div>
        <div class="bottom">
          <span id="stage-next">Next in queue: ${state.currentPreview.title || 'Next slide'}</span>
          <span style="color:#3d8a6b;">● Hardware Sync Active</span>
        </div>
        <script>
          const updateClock = () => { document.getElementById('clock').textContent = new Date().toLocaleTimeString(); };
          setInterval(updateClock, 1000);
          updateClock();

          // Real-time synchronization bus
          const bc = new BroadcastChannel('keryx_display_bus');
          bc.onmessage = (e) => {
            if (e.data && e.data.type === 'LIVE_STATE') {
              const s = e.data.payload;
              const titleEl = document.getElementById('stage-title');
              const notesEl = document.getElementById('notes');
              const nextEl = document.getElementById('stage-next');
              if (titleEl) titleEl.textContent = s.currentLive?.title || 'Live';
              if (notesEl) notesEl.textContent = s.currentLive?.speakerNotes || s.currentLive?.text || 'No speaker notes.';
              if (nextEl) nextEl.textContent = 'Next in queue: ' + (s.currentPreview?.title || 'Next slide');
            }
          };
        </script>
      </body>
      </html>
    `);
    stageWindow.document.close();
  }

  static openMainWindow() {
    const mainWindow = window.open('', 'KeryxMainAuditoriumScreen', 'width=1280,height=720');
    if (!mainWindow) {
      alert('Please allow popups to open the separate Auditorium Screen.');
      return;
    }

    const state = liveStore.getState();
    const liveText = state.isBlackout ? '' : state.currentLive.text || state.currentLive.title || '';

    mainWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>KERYX Live Output (Auditorium Projection)</title>
        <style>
          body { background:#0d1417; color:#fff; font-family:'Inter', sans-serif; margin:0; height:100vh; display:flex; align-items:center; justify-content:center; padding:6vw; box-sizing:border-box; text-align:center; overflow:hidden; user-select:none; }
          .slide-box { max-width:1400px; margin:0 auto; transition:opacity 0.25s ease; }
          h1 { font-size:4.2vw; margin:0 0 24px 0; letter-spacing:-0.03em; line-height:1.2; font-weight:800; color:#fff; }
          p { font-size:2.8vw; color:#d2dedc; line-height:1.4; margin:0; font-weight:500; }
          .blackout { opacity:0 !important; }
        </style>
      </head>
      <body>
        <div class="slide-box ${state.isBlackout ? 'blackout' : ''}" id="slide-box">
          <h1 id="screen-title">${state.isBlackout ? '' : (state.currentLive.title || '')}</h1>
          <p id="screen-text">${liveText}</p>
        </div>
        <script>
          // Real-time synchronization bus
          const bc = new BroadcastChannel('keryx_display_bus');
          bc.onmessage = (e) => {
            if (e.data && e.data.type === 'LIVE_STATE') {
              const s = e.data.payload;
              const box = document.getElementById('slide-box');
              const titleEl = document.getElementById('screen-title');
              const textEl = document.getElementById('screen-text');
              if (s.isBlackout) {
                box.classList.add('blackout');
              } else {
                box.classList.remove('blackout');
                if (titleEl) titleEl.textContent = s.currentLive?.title || '';
                if (textEl) textEl.textContent = s.currentLive?.text || '';
              }
            }
          };
        </script>
      </body>
      </html>
    `);
    mainWindow.document.close();
  }
}

