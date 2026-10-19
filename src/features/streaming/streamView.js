/**
 * KERYX Livestream Studio & Lower-Thirds View
 * Scene switching, transparent overlays, lower-thirds manager, and local broadcast recording.
 */

import { liveStore } from '../../stores/liveStore.js';
import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';

export class StreamView {
  static render() {
    const { church } = appStore.getState();
    const liveState = liveStore.getState();

    return `
      <section class="page stream-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">BROADCAST PRODUCTION STUDIO</span>
            <h1>Livestream & NDI Overlays</h1>
            <p class="subheading">Manage scenes, lower-third scripture titles, alpha-channel graphics, and local MP4 recording for OBS and vMix.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button danger-btn" id="stream-btn-rec-toggle">
              <span>●</span> <strong id="stream-rec-label">Start Local Recording</strong>
            </button>
          </div>
        </div>

        <!-- Broadcast Telemetry Strip -->
        <div class="stream-telemetry-bar panel">
          <div class="telemetry-item">
            <span class="tele-label">NDI OUTPUT STATUS</span>
            <strong class="status-online"><i></i> Broadcasting Alpha (60 FPS)</strong>
          </div>
          <div class="telemetry-item">
            <span class="tele-label">RTMP BITRATE</span>
            <strong>6,000 kbps (Stable)</strong>
          </div>
          <div class="telemetry-item">
            <span class="tele-label">DROPPED FRAMES</span>
            <strong>0 (0.0%)</strong>
          </div>
          <div class="telemetry-item">
            <span class="tele-label">RECORDING TIME</span>
            <strong id="stream-rec-timer">00:00:00</strong>
          </div>
        </div>

        <div class="stream-studio-grid">
          <!-- Left Column: Scene Switcher & Preview Monitor -->
          <div class="stream-scenes-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">BROADCAST SCENES</span>
                <h3>Live Video Switcher</h3>
              </div>
              <span class="offline-label"><i></i> Hardware Ready</span>
            </div>

            <div class="stream-monitor-preview">
              <div class="stream-screen-feed" id="stream-screen-feed">
                <div class="stream-feed-content">
                  <span class="stream-scene-tag" id="stream-active-scene-tag">SCENE: PULPIT WIDE</span>
                  <div class="feed-placeholder">
                    <span>🎬</span>
                    <strong>Primary Camera 01 Feed (1080p60)</strong>
                  </div>
                </div>

                <!-- Lower Third Overlay Rendered Over Feed -->
                <div class="stream-lower-third-overlay ${liveState.activeLowerThird ? 'visible' : ''}" id="stream-live-overlay">
                  <div class="lower-third-bar">
                    <div class="lower-third-accent"></div>
                    <div class="lower-third-text">
                      <strong id="lt-title">${liveState.activeLowerThird ? liveState.activeLowerThird.title : `Pastor ${church.pastor}`}</strong>
                      <span id="lt-sub">${liveState.activeLowerThird ? liveState.activeLowerThird.subtitle : `${church.name} · Senior Pastor`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Scene Switcher Buttons -->
            <div class="scene-buttons-grid">
              <button class="scene-btn active" data-scene="Pulpit Wide">
                <span class="scene-num">01</span>
                <strong>Pulpit Wide</strong>
                <small>Main Pastor Cam</small>
              </button>
              <button class="scene-btn" data-scene="Pastor Close-Up">
                <span class="scene-num">02</span>
                <strong>Pastor Close-Up</strong>
                <small>Center Downstage</small>
              </button>
              <button class="scene-btn" data-scene="Worship Stage">
                <span class="scene-num">03</span>
                <strong>Worship Band</strong>
                <small>Wide Sanctuary</small>
              </button>
              <button class="scene-btn" data-scene="Scripture Full Screen">
                <span class="scene-num">04</span>
                <strong>Scripture Full</strong>
                <small>Presentation Layer</small>
              </button>
              <button class="scene-btn" data-scene="Split Screen (PiP)">
                <span class="scene-num">05</span>
                <strong>Split Screen</strong>
                <small>Camera + Slide</small>
              </button>
            </div>
          </div>

          <!-- Right Column: Lower Thirds Overlay Controller -->
          <div class="stream-overlays-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">BROADCAST GRAPHICS</span>
                <h3>Lower-Thirds Matrix</h3>
              </div>
              <button class="secondary-button small" id="stream-btn-clear-lt">Clear Overlays</button>
            </div>

            <div class="lower-third-cards-list">
              <!-- Speaker Lower Third Card -->
              <div class="lt-card panel">
                <div class="lt-card-top">
                  <span class="lt-badge">SPEAKER IDENTIFIER</span>
                  <button class="primary-button small btn-cue-lt" data-title="Pastor ${church.pastor}" data-sub="${church.name} · Senior Pastor">Project <span>→</span></button>
                </div>
                <strong>Pastor ${church.pastor}</strong>
                <small>${church.name} · Senior Pastor</small>
              </div>

              <!-- Scripture Lower Third Card -->
              <div class="lt-card panel">
                <div class="lt-card-top">
                  <span class="lt-badge">SCRIPTURE OVERLAY</span>
                  <button class="primary-button small btn-cue-lt" data-title="Romans 8:28 (WEB)" data-sub="All things work together for good to those who love God">Project <span>→</span></button>
                </div>
                <strong>Romans 8:28 (WEB)</strong>
                <small>“All things work together for good to those who love God...”</small>
              </div>

              <!-- Offering / Giving Lower Third Card -->
              <div class="lt-card panel">
                <div class="lt-card-top">
                  <span class="lt-badge">GIVING & FELLOWSHIP</span>
                  <button class="primary-button small btn-cue-lt" data-title="Tithes & Ministry Giving" data-sub="Give securely via church app or online at ${church.website || 'gracecity.org'}">Project <span>→</span></button>
                </div>
                <strong>Tithes & Ministry Giving</strong>
                <small>Give securely via mobile app or ${church.website || 'gracecity.org'}</small>
              </div>

              <!-- Social Lower Third Card -->
              <div class="lt-card panel">
                <div class="lt-card-top">
                  <span class="lt-badge">CONNECT & COMMUNITY</span>
                  <button class="primary-button small btn-cue-lt" data-title="Stay Connected With Us" data-sub="Follow @${church.name.replace(/\s+/g, '').toLowerCase()} on all platforms">Project <span>→</span></button>
                </div>
                <strong>Stay Connected With Us</strong>
                <small>Follow @${church.name.replace(/\s+/g, '').toLowerCase()} on all platforms</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    const recBtn = container.querySelector('#stream-btn-rec-toggle');
    const recLabel = container.querySelector('#stream-rec-label');
    const recTimer = container.querySelector('#stream-rec-timer');
    const activeSceneTag = container.querySelector('#stream-active-scene-tag');
    const overlayEl = container.querySelector('#stream-live-overlay');
    const ltTitle = container.querySelector('#lt-title');
    const ltSub = container.querySelector('#lt-sub');

    let isRecording = false;
    let recSeconds = 0;
    let recInterval = null;

    recBtn?.addEventListener('click', () => {
      isRecording = !isRecording;
      if (isRecording) {
        recLabel.textContent = 'Stop Recording ●';
        recBtn.classList.add('recording-pulsing');
        recInterval = setInterval(() => {
          recSeconds++;
          const h = Math.floor(recSeconds / 3600).toString().padStart(2, '0');
          const m = Math.floor((recSeconds % 3600) / 60).toString().padStart(2, '0');
          const s = (recSeconds % 60).toString().padStart(2, '0');
          if (recTimer) recTimer.textContent = `${h}:${m}:${s}`;
        }, 1000);
        eventBus.emit('toast:notify', { type: 'success', title: 'Recording Started', message: 'Saving local high-bitrate MP4 archive.' });
      } else {
        recLabel.textContent = 'Start Local Recording';
        recBtn.classList.remove('recording-pulsing');
        clearInterval(recInterval);
        eventBus.emit('toast:notify', { type: 'info', title: 'Recording Saved', message: `Saved ${recTimer.textContent} archive to local library.` });
      }
    });

    container.querySelectorAll('.scene-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.scene-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const sceneName = btn.dataset.scene;
        if (activeSceneTag) activeSceneTag.textContent = `SCENE: ${sceneName.toUpperCase()}`;
        eventBus.emit('toast:notify', { type: 'info', title: 'Scene Switched', message: `Cut to ${sceneName}` });
      });
    });

    container.querySelectorAll('.btn-cue-lt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const title = btn.dataset.title;
        const sub = btn.dataset.sub;
        if (ltTitle) ltTitle.textContent = title;
        if (ltSub) ltSub.textContent = sub;
        if (overlayEl) overlayEl.classList.add('visible');

        liveStore.setLowerThird({ title, subtitle: sub });
        eventBus.emit('toast:notify', { type: 'success', title: 'Lower Third Active', message: title });
      });
    });

    container.querySelector('#stream-btn-clear-lt')?.addEventListener('click', () => {
      if (overlayEl) overlayEl.classList.remove('visible');
      liveStore.clearLowerThird();
      eventBus.emit('toast:notify', { type: 'info', title: 'Lower Thirds Cleared', message: 'Broadcast overlay removed.' });
    });
  }
}

