/**
 * KERYX Mobile & Local Web Remote Controller (PRD §72 & §16)
 * Handheld, high-contrast touch interface for pastors on stage or operators walking the sanctuary.
 * Controls slides, live transitions, blackouts, and countdown timers.
 */

import { liveStore } from '../../stores/liveStore.js';
import { appStore } from '../../stores/appStore.js';
import { timerWidget } from '../tools/timerWidget.js';
import { eventBus } from '../../core/eventBus.js';

export class RemoteView {
  static render() {
    const liveState = liveStore.getState();
    const { church } = appStore.getState();

    return `
      <section class="page remote-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">HANDHELD OPERATOR INTERFACE · PRD §72</span>
            <h1>Mobile & Stage Remote Control</h1>
            <p class="subheading">Touch-optimized control room for pastors on stage, wireless presentation remotes, and roaming operators.</p>
          </div>
        </div>

        <div class="remote-layout-grid">
          <!-- Central Handheld Phone Simulator / Controller -->
          <div class="phone-frame-container panel">
            <div class="phone-status-strip">
              <span class="phone-clock">10:30 AM</span>
              <span class="phone-network">● WiFi Connected (Local)</span>
            </div>

            <!-- Active On-Air Monitor in Phone -->
            <div class="phone-live-box">
              <div class="phone-box-header">
                <span class="live-dot-red"><i></i> ON AIR (LIVE)</span>
                <small>${church.name}</small>
              </div>
              <strong class="phone-live-title" id="remote-live-title">${liveState.live?.title || 'Sanctuary Main Output'}</strong>
              <p class="phone-live-sub" id="remote-live-sub">${liveState.live?.subtitle || 'Live broadcast operational'}</p>
            </div>

            <!-- Staged Next Item in Phone -->
            <div class="phone-preview-box">
              <span class="phone-box-label">NEXT IN PREVIEW</span>
              <strong class="phone-prev-title" id="remote-prev-title">${liveState.preview?.title || 'Next Slide Staged'}</strong>
            </div>

            <!-- Countdown Timer in Phone -->
            <div class="phone-timer-bar">
              <span>SERVICE TIMER:</span>
              <strong id="remote-timer-val">${liveState.activeCountdown?.formatted || '05:00'}</strong>
            </div>

            <!-- Tactile Touch Buttons Grid -->
            <div class="phone-keypad-grid">
              <button class="remote-btn primary-cut-btn" id="remote-btn-cut">
                <span>↵</span>
                <strong>CUT LIVE</strong>
              </button>

              <div class="remote-nav-row">
                <button class="remote-btn nav-btn" id="remote-btn-prev">
                  <span>◄</span>
                  <strong>PREV</strong>
                </button>
                <button class="remote-btn nav-btn primary-next" id="remote-btn-next">
                  <span>►</span>
                  <strong>NEXT</strong>
                </button>
              </div>

              <div class="remote-toggles-row">
                <button class="remote-btn toggle-btn" id="remote-btn-black">
                  <span>⬛</span>
                  <small>Black</small>
                </button>
                <button class="remote-btn toggle-btn" id="remote-btn-clear">
                  <span>◻</span>
                  <small>Clear</small>
                </button>
                <button class="remote-btn toggle-btn" id="remote-btn-timer">
                  <span>⏱</span>
                  <small>5m Timer</small>
                </button>
                <button class="remote-btn toggle-btn danger-touch" id="remote-btn-emergency">
                  <span>⚠️</span>
                  <small>Override</small>
                </button>
              </div>
            </div>
          </div>

          <!-- Pairing & Wireless Info Panel -->
          <div class="remote-info-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">LOCAL ZERO-LATENCY NETWORK</span>
                <h3>Connect Any Phone or Tablet</h3>
              </div>
              <span class="offline-label"><i></i> Local LAN (No Internet Needed)</span>
            </div>

            <div class="qr-connection-mock">
              <div class="qr-box">
                <div class="qr-matrix-sim">
                  <div class="qr-corner top-left"></div>
                  <div class="qr-corner top-right"></div>
                  <div class="qr-corner bottom-left"></div>
                  <span class="qr-brand-mark">K</span>
                </div>
              </div>
              <div class="qr-instructions">
                <strong>Scan With iPhone / Android / iPad</strong>
                <p>Connect your mobile device to the church Wi-Fi and open:</p>
                <code>http://192.168.1.100:8080/remote</code>
                <small>No native app install required. Operates as an offline Progressive Web App (PWA).</small>
              </div>
            </div>

            <div class="pairing-security-notes">
              <h4>Security & Operator Guardrails</h4>
              <ul>
                <li><strong>PIN Protection:</strong> Operators enter the church PIN (Default: <code>7777</code>) to unlock live controls.</li>
                <li><strong>Role Permissions:</strong> Pastors receive a simplified "Next/Prev Only" view to prevent accidental blackouts.</li>
                <li><strong>Haptic Feedback:</strong> Supported mobile devices vibrate subtly upon slide changes for confident tactile confirmation.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    // Cut Live
    container.querySelector('#remote-btn-cut')?.addEventListener('click', () => {
      liveStore.sendPreviewToLive();
      this.refreshStatus(container);
      eventBus.emit('toast:notify', { type: 'success', title: 'Cut Live', message: 'Sent staged preview to live display.' });
    });

    // Prev / Next
    container.querySelector('#remote-btn-prev')?.addEventListener('click', () => {
      eventBus.emit('slide:prev');
      this.refreshStatus(container);
    });

    container.querySelector('#remote-btn-next')?.addEventListener('click', () => {
      eventBus.emit('slide:next');
      this.refreshStatus(container);
    });

    // Blackout
    container.querySelector('#remote-btn-black')?.addEventListener('click', () => {
      liveStore.toggleBlackout();
      eventBus.emit('toast:notify', { type: 'info', title: 'Blackout Toggled', message: 'Toggled live blackout.' });
    });

    // Clear
    container.querySelector('#remote-btn-clear')?.addEventListener('click', () => {
      liveStore.toggleClear();
    });

    // 5-min timer
    container.querySelector('#remote-btn-timer')?.addEventListener('click', () => {
      timerWidget.start(300, 'Pre-Service Countdown', 'countdown');
      eventBus.emit('toast:notify', { type: 'info', title: 'Timer Started', message: 'Started 5-minute service countdown.' });
    });

    // Emergency Override
    container.querySelector('#remote-btn-emergency')?.addEventListener('click', () => {
      liveStore.triggerEmergency();
      eventBus.emit('toast:notify', { type: 'danger', title: 'Emergency Override', message: 'Triggered emergency backup display.' });
    });
  }

  static refreshStatus(container) {
    const liveState = liveStore.getState();
    const liveTitle = container.querySelector('#remote-live-title');
    const liveSub = container.querySelector('#remote-live-sub');
    const prevTitle = container.querySelector('#remote-prev-title');

    if (liveTitle) liveTitle.textContent = liveState.live?.title || 'Sanctuary Main Output';
    if (liveSub) liveSub.textContent = liveState.live?.subtitle || 'Live broadcast operational';
    if (prevTitle) prevTitle.textContent = liveState.preview?.title || 'Next Slide Staged';
  }
}

