/**
 * KERYX Modern Dashboard View
 * Redesigned to faithfully match the frosted glass UI/UX reference:
 * - Center Column: Hero greeting, quick action pills, glass search/prompt bar, 4 feature glass cards, and operators table.
 * - Right Column: Service readiness (3D stacked visual), capabilities checklist, telemetry stats with sparkline wave, and pro suite badge.
 */

import { appStore } from '../../stores/appStore.js';
import { liveStore } from '../../stores/liveStore.js';
import { aiStore } from '../../stores/aiStore.js';
import { eventBus } from '../../core/eventBus.js';
import { AICopilot } from '../ai/aiCopilot.js';
import { CommandPalette } from '../../app/commandPalette.js';

export class DashboardView {
  static render() {
    const { church, currentUser } = appStore.getState();
    const liveState = liveStore.getState();
    const aiState = aiStore.getState();

    return `
      <section class="glass-dashboard-page">
        <!-- Main Dual-Column Grid Matching Reference -->
        <div class="glass-dash-grid">
          <!-- Major Left/Center Column (70%) -->
          <div class="glass-dash-main-col">
            <!-- 1. Hero Title Lockup -->
            <div class="chatgpt-hero-lockup">
              <h1 class="chatgpt-hero-title">What would you like to present today?</h1>
              <p class="chatgpt-hero-subtitle">Grace City Community Church · Active Worship & Broadcast Hub</p>
            </div>

            <!-- 2. Action Filter Pills Row (Create Image, Summarize Text, etc.) -->
            <div class="chatgpt-pills-row">
              <button class="chatgpt-pill-btn" data-view="Bible">
                <span class="pill-ico">📖</span> Scripture Engine
              </button>
              <button class="chatgpt-pill-btn" data-view="Songs">
                <span class="pill-ico">♫</span> Worship Setlist
              </button>
              <button class="chatgpt-pill-btn" data-view="Present">
                <span class="pill-ico">▶</span> Slide Deck
              </button>
              <button class="chatgpt-pill-btn" data-view="Studio">
                <span class="pill-ico">🎛</span> Church Studio
              </button>
              <button class="chatgpt-pill-btn" id="dash-btn-copilot-pill">
                <span class="pill-ico">✳</span> AI Copilot
              </button>
            </div>

            <!-- 3. Glass Prompt / Search Input Box (Message ChatGPT...) -->
            <div class="chatgpt-prompt-box">
              <div class="prompt-box-inner">
                <button class="prompt-icon-btn prompt-attach-btn" id="dash-prompt-attach" title="Attach Media or Notes">
                  <span>📎</span>
                </button>
                <input
                  type="text"
                  class="prompt-input-field"
                  id="dash-prompt-input"
                  placeholder="Search scripture (e.g. John 3:16), worship hymn, or service cue..."
                  autocomplete="off"
                />
                <button class="prompt-mic-btn ${aiState.isListening ? 'listening-active' : ''}" id="dash-btn-mic" title="Toggle AI Scripture Listener">
                  <span class="mic-wave-icon">🎙</span>
                </button>
              </div>
            </div>

            <!-- 4. Four Feature Glass Cards (Write an email, Analyze data, etc.) -->
            <div class="chatgpt-four-cards-grid">
              <!-- Card 1: Scripture Engine -->
              <div class="chatgpt-feature-card" data-view="Bible">
                <div class="feature-card-text">
                  <strong>Scripture Engine</strong>
                  <small>31,102 verses · KJV & WEB offline</small>
                </div>
                <div class="feature-card-bottom-icon">📖</div>
              </div>

              <!-- Card 2: Worship Setlists -->
              <div class="chatgpt-feature-card" data-view="Songs">
                <div class="feature-card-text">
                  <strong>Worship Setlists</strong>
                  <small>420+ CCLI songs, lyrics & chords</small>
                </div>
                <div class="feature-card-bottom-icon">♫</div>
              </div>

              <!-- Card 3: Service Flow -->
              <div class="chatgpt-feature-card" data-view="Service">
                <div class="feature-card-text">
                  <strong>Service Flow</strong>
                  <small>Sunday schedule, cues & sermon timer</small>
                </div>
                <div class="feature-card-bottom-icon">⏱</div>
              </div>

              <!-- Card 4: Studio Console -->
              <div class="chatgpt-feature-card" data-view="Studio">
                <div class="feature-card-text">
                  <strong>Studio Console</strong>
                  <small>60 fps NDI, 3 multi-screen outputs</small>
                </div>
                <div class="feature-card-bottom-icon">🎛</div>
              </div>
            </div>

            <!-- 5. Operators & Control Room Table -->
            <div class="chatgpt-table-card">
              <div class="chatgpt-card-header-row">
                <div class="table-title-group">
                  <h3>Live Production Team & Operators</h3>
                  <small>Active operator stations and control room assignments</small>
                </div>
                <span class="chatgpt-badge-pill">4 Stations Active</span>
              </div>

              <div class="chatgpt-table-responsive">
                <table class="chatgpt-data-table">
                  <thead>
                    <tr>
                      <th>Operator</th>
                      <th>Station</th>
                      <th>Status</th>
                      <th>Stream Protocol</th>
                      <th>Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="chatgpt-table-user">
                          <span class="user-avatar-circle">👨‍💻</span>
                          <div>
                            <strong>${currentUser.name}</strong>
                            <small>Senior Director</small>
                          </div>
                        </div>
                      </td>
                      <td>Church Studio Console</td>
                      <td><span class="glass-status-pill green"><span class="pulse-dot"></span> Active</span></td>
                      <td>NDI Core / Master</td>
                      <td>0.8 ms</td>
                    </tr>
                    <tr>
                      <td>
                        <div class="chatgpt-table-user">
                          <span class="user-avatar-circle">🎹</span>
                          <div>
                            <strong>Worship Team Lead</strong>
                            <small>Music Ministry</small>
                          </div>
                        </div>
                      </td>
                      <td>Stage Confidence Monitor</td>
                      <td><span class="glass-status-pill green"><span class="pulse-dot"></span> Active</span></td>
                      <td>HDMI Out 1</td>
                      <td>1.1 ms</td>
                    </tr>
                    <tr>
                      <td>
                        <div class="chatgpt-table-user">
                          <span class="user-avatar-circle">🎙</span>
                          <div>
                            <strong>Sound Engineer</strong>
                            <small>Audio Mixer Station</small>
                          </div>
                        </div>
                      </td>
                      <td>Pulpit & Band Channels</td>
                      <td><span class="glass-status-pill green"><span class="pulse-dot"></span> Optimal</span></td>
                      <td>USB Core Audio</td>
                      <td>2.4 ms</td>
                    </tr>
                    <tr>
                      <td>
                        <div class="chatgpt-table-user">
                          <span class="user-avatar-circle">📱</span>
                          <div>
                            <strong>Mobile Operator</strong>
                            <small>Sanctuary Floor</small>
                          </div>
                        </div>
                      </td>
                      <td>Wireless Remote Control</td>
                      <td><span class="glass-status-pill amber"><span class="pulse-dot"></span> Standby</span></td>
                      <td>WebSocket Local</td>
                      <td>4.2 ms</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Secondary Right Column (30%) Matching Reference Stack -->
          <div class="glass-dash-side-col">
            <!-- Side Card 1: Service Readiness (GPT-4o Style with 3D Crystal Graphic) -->
            <div class="chatgpt-side-card readiness-card" data-view="Studio">
              <div class="side-card-top-lockup">
                <div class="readiness-title-row">
                  <strong class="side-card-title">SERVICE READY</strong>
                  <span class="purple-sparkle">✦</span>
                </div>
                <p class="side-card-desc">60 fps NDI Core · 0 dropped frames</p>
              </div>

              <div class="crystal-3d-graphic">
                <div class="crystal-layer layer-back"></div>
                <div class="crystal-layer layer-mid"></div>
                <div class="crystal-orb"></div>
              </div>

              <div class="readiness-status-tag">100% Broadcast Ready</div>
            </div>

            <!-- Side Card 2: Output Capabilities (Capabilities Checklist) -->
            <div class="chatgpt-side-card capabilities-card" data-view="Outputs">
              <h4 class="side-card-subheading">Active Display Outputs</h4>
              <ul class="capabilities-checklist">
                <li>
                  <span class="cap-name"><span class="cap-ico">🖥</span> Auditorium Center Projector 16:9</span>
                  <span class="check-mark">✓</span>
                </li>
                <li>
                  <span class="cap-name"><span class="cap-ico">📺</span> Stage Confidence Monitor HDMI</span>
                  <span class="check-mark">✓</span>
                </li>
                <li>
                  <span class="cap-name"><span class="cap-ico">📡</span> Livestream Feed (YouTube / FB)</span>
                  <span class="check-mark">✓</span>
                </li>
                <li>
                  <span class="cap-name"><span class="cap-ico">✳</span> AI Scripture Listener Engine</span>
                  <span class="check-mark">✓</span>
                </li>
              </ul>
            </div>

            <!-- Side Card 3: Live Telemetry Activity (Your Activity with Neon Wave) -->
            <div class="chatgpt-side-card activity-card">
              <h4 class="side-card-subheading">Your Ministry Telemetry</h4>
              <div class="activity-metric-row">
                <span class="metric-label">Verses Loaded</span>
                <strong class="metric-val">31,522</strong>
              </div>
              <div class="activity-metric-row">
                <span class="metric-label">Worship Songs</span>
                <strong class="metric-val">42</strong>
              </div>
              <div class="activity-metric-row">
                <span class="metric-label">Engine Latency</span>
                <strong class="metric-val">0.8 ms</strong>
              </div>

              <!-- Neon Glowing Purple/Cyan Sparkline Wave -->
              <div class="activity-sparkline-wrap">
                <svg viewBox="0 0 240 48" class="sparkline-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveGlow" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stop-color="#8b5cf6" />
                      <stop offset="50%" stop-color="#c084fc" />
                      <stop offset="100%" stop-color="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <path d="M0,36 Q30,12 60,28 T120,18 T180,32 T240,14" fill="none" stroke="url(#waveGlow)" stroke-width="2.5" stroke-linecap="round" />
                </svg>
              </div>
            </div>

            <!-- Side Card 4: CCLI & License Badge (ChatGPT Plus Style) -->
            <div class="chatgpt-side-card plus-pill-card" data-view="Settings">
              <div class="plus-star-icon">★</div>
              <div class="plus-text-group">
                <strong>KERYX Pro Ministry Suite</strong>
                <small>100% CCLI Licensed & Offline Core</small>
              </div>
              <span class="plus-arrow">→</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    // Search / Prompt input enter key
    const input = container.querySelector('#dash-prompt-input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const query = input.value.trim();
        if (/^\d?[a-z]+\s*\d+/i.test(query)) {
          appStore.setActiveView('Bible');
        } else {
          CommandPalette.open();
        }
      }
    });

    // Copilot pill click
    container.querySelector('#dash-btn-copilot-pill')?.addEventListener('click', () => {
      AICopilot.open();
    });

    // Mic button speech recognition toggle
    container.querySelector('#dash-btn-mic')?.addEventListener('click', () => {
      aiStore.toggleListening();
      const btn = container.querySelector('#dash-btn-mic');
      if (btn) {
        btn.classList.toggle('listening-active', aiStore.getState().isListening);
      }
    });

    // Attach button click
    container.querySelector('#dash-prompt-attach')?.addEventListener('click', () => {
      appStore.setActiveView('Media');
    });
  }
}
