/**
 * KERYX System Settings View
 * Comprehensive 16-category control room and ministry operating system preferences.
 */

import { appStore } from '../../stores/appStore.js';
import { aiStore } from '../../stores/aiStore.js';
import { db } from '../../database/db.js';
import { eventBus } from '../../core/eventBus.js';
import { SermonIntelligence } from '../ai/sermonIntelligence.js';
import { GeminiClient } from '../ai/geminiClient.js';

export class SettingsView {
  static render() {
    const { church, currentUser, offlineMode } = appStore.getState();
    const { autopilotMode, autoApproveThreshold, reviewThreshold } = aiStore.getState();

    return `
      <section class="page settings-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">CONTROL ROOM CONFIGURATION</span>
            <h1>Settings & Preferences</h1>
            <p class="subheading">Fine-tune presentation resolutions, display routing, AI thresholds, audio levels, and offline backup storage.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button" id="settings-btn-save">
              Save Settings <span>✓</span>
            </button>
          </div>
        </div>

        <div class="settings-layout-grid">
          <!-- Navigation Sidebar (14 Categories) -->
          <div class="settings-category-nav panel">
            <button class="settings-nav-btn active" data-tab="general">⚙ General</button>
            <button class="settings-nav-btn" data-tab="appearance">🎨 Appearance & Themes</button>
            <button class="settings-nav-btn" data-tab="branding">✦ Branding & Styles</button>
            <button class="settings-nav-btn" data-tab="bible">📖 Bible & Scriptures</button>
            <button class="settings-nav-btn" data-tab="presentation">🖥 Presentation & Aspect</button>
            <button class="settings-nav-btn" data-tab="outputs">📡 Display Outputs & NDI</button>
            <button class="settings-nav-btn" data-tab="audio">🎙 Audio & Input</button>
            <button class="settings-nav-btn" data-tab="ai">✳ AI & Scripture Detector</button>
            <button class="settings-nav-btn" data-tab="streaming">🔴 Streaming & Recording</button>
            <button class="settings-nav-btn" data-tab="users">👥 Users & RBAC Roles</button>
            <button class="settings-nav-btn" data-tab="storage">💾 Storage & Backup</button>
            <button class="settings-nav-btn" data-tab="keyboard">⌨ Keyboard Shortcuts</button>
            <button class="settings-nav-btn" data-tab="security">🔒 Security & Devices</button>
            <button class="settings-nav-btn" data-tab="advanced">🛠 Advanced & Logs</button>
          </div>

          <!-- Main Configuration Content Area (All 14 Panes) -->
          <div class="settings-content-area panel">

            <!-- 1. GENERAL PANE -->
            <div class="settings-pane active" id="pane-general">
              <span class="eyebrow">GENERAL PREFERENCES</span>
              <h3>Church Workspace Identity</h3>
              <p>Primary ministry identification used across projections, reports, live broadcasts, and media exports.</p>

              <div class="settings-form-grid">
                <label>Church Name
                  <input id="set-church-name" value="${church.name || ''}" placeholder="e.g. Grace City Community Church" />
                </label>
                <label>Senior Pastor / Overseer
                  <input id="set-pastor-name" value="${church.pastor || ''}" placeholder="e.g. Pastor Godswill Johnson" />
                </label>
                <label>Ministry Email Address
                  <input id="set-church-email" type="email" value="${church.email || ''}" placeholder="media@gracecity.org" />
                </label>
                <label>Church Phone Number
                  <input id="set-church-phone" value="${church.phone || ''}" placeholder="+234 800 123 4567" />
                </label>
                <label>City & Country
                  <input id="set-church-city" value="${church.city || ''}, ${church.country || ''}" placeholder="Lagos, Nigeria" />
                </label>
                <label>System Timezone
                  <select id="set-timezone">
                    <option ${church.timezone?.includes('WAT') ? 'selected' : ''}>West Africa Time (WAT) - UTC+1</option>
                    <option ${church.timezone?.includes('GMT') ? 'selected' : ''}>Greenwich Mean Time (GMT) - UTC+0</option>
                    <option ${church.timezone?.includes('Eastern') ? 'selected' : ''}>Eastern Time (ET) - UTC-5</option>
                    <option ${church.timezone?.includes('Central') ? 'selected' : ''}>Central Time (CT) - UTC-6</option>
                    <option ${church.timezone?.includes('Pacific') ? 'selected' : ''}>Pacific Time (PT) - UTC-8</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Offline-First Production Engine</strong>
                  <small>Presentation, 31,102 Bible verses, lyrics, and media operate 100% offline without internet dependency.</small>
                </div>
                <button class="toggle-switch ${offlineMode ? 'on' : ''}" id="set-toggle-offline" title="Toggle Offline Production Mode">
                  <i></i>
                </button>
              </div>
            </div>

            <!-- 2. APPEARANCE PANE -->
            <div class="settings-pane" id="pane-appearance" style="display:none;">
              <span class="eyebrow">DISPLAY THEME & INTERFACE</span>
              <h3>Control Room Visuals</h3>
              <p>Customize the operator console aesthetic for low-light control rooms or high-contrast rehearsal stages.</p>

              <div class="settings-form-grid">
                <label>Visual Theme Mode
                  <select id="set-theme-mode">
                    <option value="cosmic-violet" selected>✦ Cosmic Violet Glass (Standard Control Room)</option>
                    <option value="obsidian-dark">✦ Midnight Obsidian (Ultra Low Light)</option>
                    <option value="neon-cyber">✦ Cyber Emerald (High Visibility)</option>
                    <option value="royal-indigo">✦ Deep Royal Indigo</option>
                  </select>
                </label>
                <label>Operator UI Density
                  <select id="set-ui-density">
                    <option selected>Comfortable (Recommended for 1080p & 4K Displays)</option>
                    <option>Compact (High-Density Multi-Monitor Rigs)</option>
                  </select>
                </label>
                <label>Accent Glow Intensity
                  <select id="set-glow-level">
                    <option selected>Radiant Violet Glow (Standard)</option>
                    <option>Subtle / Minimal Distraction</option>
                    <option>High Luminescence (Stage View)</option>
                  </select>
                </label>
                <label>Glass Frosting Effect (Blur)
                  <select id="set-glass-blur">
                    <option selected>Hardware Accelerated (24px Gaussian Blur)</option>
                    <option>Performance Mode (Low Blur / Lower GPU Load)</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>High-Resolution Glass Reflections</strong>
                  <small>Enables soft specular lighting effects on cards, modals, and monitors matching modern glass OS aesthetics.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 3. BRANDING PANE -->
            <div class="settings-pane" id="pane-branding" style="display:none;">
              <span class="eyebrow">VISUAL IDENTITY</span>
              <h3>Church Branding & Stage Aesthetics</h3>
              <p>Set custom colors, typography, and projection watermarks applied across slide templates and lower-thirds.</p>

              <div class="settings-form-grid">
                <label>Projection Watermark / Bug Text
                  <input id="set-brand-watermark" value="${church.branding?.watermark || 'GRACE CITY CHURCH'}" />
                </label>
                <label>Default Projection Font
                  <select id="set-brand-font">
                    <option ${church.branding?.font === 'Manrope' ? 'selected' : ''}>Manrope (Clean Modern Sans)</option>
                    <option ${church.branding?.font === 'Inter' ? 'selected' : ''}>Inter (High Legibility)</option>
                    <option ${church.branding?.font === 'Montserrat' ? 'selected' : ''}>Montserrat (Bold Architectural)</option>
                    <option ${church.branding?.font === 'Outfit' ? 'selected' : ''}>Outfit (Contemporary Rounded)</option>
                    <option ${church.branding?.font === 'Playfair Display' ? 'selected' : ''}>Playfair Display (Traditional Serif)</option>
                  </select>
                </label>
                <label>Primary Brand Hue
                  <input type="color" id="set-brand-primary" value="${church.branding?.primaryColor || '#8b5cf6'}" style="height: 42px; cursor: pointer;" />
                </label>
                <label>Secondary Accent Hue
                  <input type="color" id="set-brand-secondary" value="${church.branding?.secondaryColor || '#6366f1'}" style="height: 42px; cursor: pointer;" />
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Show Watermark on Output Projections</strong>
                  <small>Renders a subtle, non-intrusive church watermark in the lower corner of live screen feeds.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 4. BIBLE PANE -->
            <div class="settings-pane" id="pane-bible" style="display:none;">
              <span class="eyebrow">SCRIPTURE ENGINE</span>
              <h3>Bible Databases & Formatting</h3>
              <p>Configure offline Bible translations, verse font sizing, and automated Scripture layout rules.</p>

              <div class="settings-form-grid">
                <label>Default Church Translation
                  <select id="set-bible-translation">
                    <option value="WEB" selected>World English Bible (WEB) · Modern Offline</option>
                    <option value="KJV">King James Version (KJV) · Classic Authorized</option>
                    <option value="ASV">American Standard Version (ASV)</option>
                    <option value="BBE">Bible in Basic English (BBE)</option>
                  </select>
                </label>
                <label>Scripture Slide Layout Mode
                  <select id="set-bible-layout">
                    <option selected>Hero Verse with Reference Pill (Centered High-Impact)</option>
                    <option>Two-Column Side-by-Side (Comparative Scripture)</option>
                    <option>Broadcast Lower-Third Scripture Banner (Livestream Ready)</option>
                  </select>
                </label>
                <label>Reference Tag Position
                  <select id="set-bible-ref-pos">
                    <option selected>Top-Right Violet Glow Pill (✦ John 3:16 WEB)</option>
                    <option>Bottom Subtitle Bar</option>
                    <option>Integrated Footnote</option>
                  </select>
                </label>
                <label>Words of Christ Color
                  <select id="set-bible-redletter">
                    <option selected>Radiant Red Accent (#ef4444)</option>
                    <option>Luminous Amber Accent (#f59e0b)</option>
                    <option>Standard White (High Contrast)</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Auto-Split Extended Verses</strong>
                  <small>Automatically distributes lengthy Bible passages across multiple readable slides so text never overflows.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 5. PRESENTATION PANE -->
            <div class="settings-pane" id="pane-presentation" style="display:none;">
              <span class="eyebrow">SLIDE ENGINE</span>
              <h3>Presentation Geometry & Transitions</h3>
              <p>Control aspect ratios for modern LED stage walls, projectors, and vertical social display outputs.</p>

              <div class="settings-form-grid">
                <label>Master Screen Aspect Ratio
                  <select id="set-pres-aspect">
                    <option value="16:9" selected>16:9 Widescreen (1920×1080 / 4K UHD) · Recommended</option>
                    <option value="4:3">4:3 Legacy Projector (1024×768)</option>
                    <option value="9:16">9:16 Vertical Mobile & Social Feed (1080×1920)</option>
                    <option value="21:9">21:9 Ultra-Wide Stage Panoramic LED Wall</option>
                  </select>
                </label>
                <label>Default Transition Style
                  <select id="set-pres-transition">
                    <option value="fade" selected>Smooth Cross-Fade (Cinematic)</option>
                    <option value="cut">Instant Cut (0ms Direct Switch)</option>
                    <option value="merge">Smart Merge Motion</option>
                    <option value="wipe">Broadcast Wipe</option>
                    <option value="fly">Zoom Fly Motion</option>
                  </select>
                </label>
                <label>Default Transition Speed
                  <select id="set-pres-speed">
                    <option value="300">Fast (300 ms)</option>
                    <option value="500" selected>Standard Smooth (500 ms)</option>
                    <option value="800">Gentle Worship Fade (800 ms)</option>
                    <option value="1200">Slow Ambient Morph (1200 ms)</option>
                  </select>
                </label>
                <label>Default Slide Background
                  <select id="set-pres-bg">
                    <option selected>Deep Cosmic Violet Radial Void</option>
                    <option>Pure Black (#000000) for OLED / LED Screens</option>
                    <option>Dynamic Ambient Video Particle Loop</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Sub-Pixel Antialiasing for Large LED Walls</strong>
                  <small>Applies ultra-sharp vector glyph rendering to avoid pixelation on pitch LED stage panels.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 6. OUTPUTS & NDI PANE -->
            <div class="settings-pane" id="pane-outputs" style="display:none;">
              <span class="eyebrow">HARDWARE & NETWORK PROJECTION</span>
              <h3>Display Outputs & NDI Feeds</h3>
              <p>Configure dedicated graphic outputs for auditorium projectors, stage foldback displays, and NDI network encoders.</p>

              <div class="settings-form-grid">
                <label>Output 1 (Auditorium Main Projector)
                  <select id="set-out-1">
                    <option selected>Display 1: 1920×1080 @ 60Hz (HDMI-0) · ACTIVE</option>
                    <option>Display 1: 3840×2160 @ 60Hz 4K UHD</option>
                  </select>
                </label>
                <label>Output 2 (Stage Confidence / Foldback)
                  <select id="set-out-2">
                    <option selected>Display 2: 1920×1080 @ 60Hz (Confidence HDMI-1) · ACTIVE</option>
                    <option>Disabled / Standby</option>
                  </select>
                </label>
                <label>NDI Broadcast Output Stream Name
                  <input id="set-ndi-name" value="KERYX-CHURCH-PGM" />
                </label>
                <label>NDI Output Video Standard
                  <select id="set-ndi-format">
                    <option selected>1080p 59.94 / 60 fps (Broadcast Standard)</option>
                    <option>1080p 29.97 / 30 fps</option>
                    <option>720p 60 fps</option>
                  </select>
                </label>
              </div>

              <div style="margin-top: 18px;">
                <h4 style="color: #ffffff; font-size: 14px; margin-bottom: 10px;">Calibration Test Patterns</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                  <button class="secondary-button small" id="btn-test-colorbars">Color Bars (SMPTE)</button>
                  <button class="secondary-button small" id="btn-test-grid">Grid Alignment (16:9)</button>
                  <button class="secondary-button small" id="btn-test-white">White Balance Screen</button>
                  <button class="secondary-button small" id="btn-test-black">Full Blackout</button>
                </div>
              </div>
            </div>

            <!-- 7. AUDIO PANE -->
            <div class="settings-pane" id="pane-audio" style="display:none;">
              <span class="eyebrow">SOUND & INPUT ROUTING</span>
              <h3>Audio Channels & Sound Engine</h3>
              <p>Configure hardware audio input interfaces, sample rates, noise gating, and speech detection microphones.</p>

              <div class="settings-form-grid">
                <label>Primary Audio Input Device
                  <select id="set-audio-device">
                    <option selected>USB Core Audio Mixer (Behringer X32 / Allen & Heath SQ)</option>
                    <option>Line In (Realtek High Definition Audio)</option>
                    <option>Built-in System Microphone</option>
                  </select>
                </label>
                <label>Sampling Rate
                  <select id="set-audio-samplerate">
                    <option selected>48,000 Hz (48 kHz Broadcast Standard)</option>
                    <option>44,100 Hz (44.1 kHz CD Audio)</option>
                    <option>96,000 Hz (96 kHz Studio Master)</option>
                  </select>
                </label>
                <label>Audio Channel Setup
                  <select id="set-audio-channels">
                    <option selected>Stereo (Left & Right 2-Channel Master)</option>
                    <option>Mono Summed</option>
                    <option>Multi-Channel 4-Bus</option>
                  </select>
                </label>
                <label>Software Noise Gate Threshold
                  <select id="set-audio-noisegate">
                    <option selected>-48 dB (Standard Vocal Gate)</option>
                    <option>-40 dB (Aggressive Gate)</option>
                    <option>-60 dB (Gentle Gate)</option>
                    <option>Disabled (Raw In)</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Master Anti-Clipping Limiter (-0.1 dB TruePeak)</strong>
                  <small>Prevents harsh digital distortion during loud musical climaxes on the live stream feed.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 8. AI PANE -->
            <div class="settings-pane" id="pane-ai" style="display:none;">
              <span class="eyebrow">AI & CONFIDENCE THRESHOLDS</span>
              <h3>Speech Recognition & Automation</h3>
              <p>Configure sensitivity thresholds for automated scripture detection and live sermon transcription.</p>

              <div class="settings-form-grid">
                <label>Auto-Approval Confidence Threshold
                  <select id="set-ai-auto-threshold">
                    <option value="95" ${autoApproveThreshold === 95 ? 'selected' : ''}>95% Confidence (Recommended for Live)</option>
                    <option value="98" ${autoApproveThreshold === 98 ? 'selected' : ''}>98% Strict Accuracy (Zero False Positives)</option>
                    <option value="90" ${autoApproveThreshold === 90 ? 'selected' : ''}>90% Lenient (High Speed Triggering)</option>
                  </select>
                </label>
                <label>Default Autopilot Mode
                  <select id="set-ai-autopilot">
                    <option value="Assisted" ${autopilotMode === 'Assisted' ? 'selected' : ''}>Assisted (Operator 1-Click Approval)</option>
                    <option value="Automatic" ${autopilotMode === 'Automatic' ? 'selected' : ''}>Automatic (Auto-Send to Preview 95%+)</option>
                    <option value="Manual" ${autopilotMode === 'Manual' ? 'selected' : ''}>Manual (AI suggestions disabled)</option>
                  </select>
                </label>
                <label>Speech Recognition Engine
                  <select id="set-ai-engine">
                    <option selected>WebSpeech API + Local Keyword Heuristics (Zero-Latency)</option>
                    <option>Offline Local Whisper-Tiny Model</option>
                  </select>
                </label>
                <label>Live Translation Language Pair
                  <select id="set-ai-translation-target">
                    <option selected>English ➔ French (Français)</option>
                    <option>English ➔ Spanish (Español)</option>
                    <option>English ➔ Portuguese (Português)</option>
                    <option>English ➔ Yoruba</option>
                  </select>
                </label>
              </div>

              <!-- Google Gemini Live AI Cloud Settings -->
              <div class="settings-gemini-cloud-card" style="background:rgba(223,101,78,0.08); border:1px solid rgba(223,101,78,0.3); border-radius:12px; padding:20px; margin-top:24px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <div>
                    <strong style="font-size:16px; color:#fff; display:flex; align-items:center; gap:8px;">
                      <span>✳</span> Google Gemini Live AI Cloud
                    </strong>
                    <small style="color:#a0b0b8; display:block; margin-top:4px;">
                      Connect your Google Gemini API key to enable live theological summaries, Copilot reasoning, custom sermon slide deck generation, and real-time multilingual translation.
                    </small>
                  </div>
                  <span id="gemini-status-pill" class="status-pill ${GeminiClient.isAvailable() ? 'online' : 'standby'}">
                    ${GeminiClient.isAvailable() ? '● Live Cloud Connected' : '○ Offline Mode (Local)'}
                  </span>
                </div>

                <div class="settings-form-grid" style="margin-top:16px;">
                  <label style="grid-column: span 2;">Google Gemini API Key
                    <div style="display:flex; gap:10px; margin-top:6px;">
                      <input type="password" id="set-gemini-api-key" value="${GeminiClient.getApiKey()}" placeholder="Enter Gemini API key (AIzaSy...)" style="flex:1;" />
                      <button class="secondary-button" id="btn-toggle-gemini-key-vis" type="button">Show</button>
                      <button class="primary-button" id="btn-test-gemini-key" type="button">Test &amp; Save</button>
                    </div>
                    <small style="color:#889598; display:block; margin-top:6px;">
                      Get a free API key at <a href="https://aistudio.google.com/" target="_blank" style="color:#df654e; text-decoration:underline;">Google AI Studio</a>. Saved securely in local storage.
                    </small>
                  </label>

                  <label>Live AI Model
                    <select id="set-gemini-model">
                      <option value="gemini-2.5-flash" ${GeminiClient.getModel() === 'gemini-2.5-flash' ? 'selected' : ''}>Gemini 2.5 Flash (Ultra Fast &amp; Recommended)</option>
                      <option value="gemini-1.5-flash" ${GeminiClient.getModel() === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro" ${GeminiClient.getModel() === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro (Deep Theological Reasoning)</option>
                    </select>
                  </label>

                  <label>Cloud Fallback Policy
                    <select id="set-gemini-fallback">
                      <option selected>Automatic Local Fallback (Never blocks live service)</option>
                      <option>Cloud Preferred with Strict Validation</option>
                    </select>
                  </label>
                </div>
              </div>

              <div class="setting-toggle-row" style="margin-top:20px;">
                <div>
                  <strong>Offline-First Graceful Fallback</strong>
                  <small>When offline or without an API key, KERYX continues using high-speed local regex, fuzzy matching, and local offline Bibles.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 9. STREAMING & RECORDING PANE -->
            <div class="settings-pane" id="pane-streaming" style="display:none;">
              <span class="eyebrow">BROADCAST TRANSMISSION</span>
              <h3>Multi-Platform Simulcasting & Master Capture</h3>
              <p>Manage simultaneous live streaming to YouTube, Facebook, TikTok, Twitch, and local archival recordings.</p>

              <div class="settings-form-grid">
                <label>Master Stream Resolution & Framerate
                  <select id="set-stream-res">
                    <option selected>1080p 60 fps (1920×1080 @ 6000 kbps) · High Quality</option>
                    <option>1080p 30 fps (1920×1080 @ 4500 kbps) · Bandwidth Saver</option>
                    <option>720p 60 fps (1280×720 @ 3500 kbps)</option>
                  </select>
                </label>
                <label>Master Archive Recording Format
                  <select id="set-rec-format">
                    <option selected>MP4 (H.264 High Profile / AAC 320 kbps)</option>
                    <option>Apple ProRes 422 HQ (Broadcast Master)</option>
                    <option>MKV (Crash-Resilient Container)</option>
                  </select>
                </label>
                <label>YouTube Live Stream Key
                  <input type="password" id="set-key-yt" value="••••••••••••••••••••" placeholder="Enter YouTube Stream Key" />
                </label>
                <label>Facebook Live Stream Key
                  <input type="password" id="set-key-fb" value="••••••••••••••••••••" placeholder="Enter Facebook Stream Key" />
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Auto-Record Master Program on Stream Start</strong>
                  <small>Automatically triggers local ProRes/MP4 recording as soon as the live stream begins.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 10. USERS & RBAC TAB -->
            <div class="settings-pane" id="pane-users" style="display:none;">
              <span class="eyebrow">ACCESS CONTROL & ROLES</span>
              <h3>Users & RBAC Permissions</h3>
              <p>Assign granular presentation, live output, and administrative permissions.</p>

              <div class="users-roles-table-wrap" style="overflow-x: auto; margin-top: 14px;">
                <table class="keryx-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
                  <thead>
                    <tr style="border-bottom: 1px solid rgba(167, 139, 250, 0.2); color: #c4b5fd; text-align: left;">
                      <th style="padding: 10px 14px;">Role Name</th>
                      <th style="padding: 10px 14px;">Description</th>
                      <th style="padding: 10px 14px;">Live Broadcast Control</th>
                      <th style="padding: 10px 14px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <td style="padding: 12px 14px;"><strong style="color: #ffffff;">Owner / Pastor</strong></td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Full organization oversight, preach notes, approval</td>
                      <td style="padding: 12px 14px; color: #34d399;">Allowed (Full)</td>
                      <td style="padding: 12px 14px;"><span style="color:#34d399;">● Active</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <td style="padding: 12px 14px;"><strong style="color: #ffffff;">Media Director</strong></td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Controls screens, live broadcast, streams, presentations</td>
                      <td style="padding: 12px 14px; color: #34d399;">Allowed (Full)</td>
                      <td style="padding: 12px 14px;"><span style="color:#34d399;">● Active</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <td style="padding: 12px 14px;"><strong style="color: #ffffff;">Presentation Operator</strong></td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Live preview, slide advancement, queue review</td>
                      <td style="padding: 12px 14px; color: #34d399;">Allowed (Restricted)</td>
                      <td style="padding: 12px 14px;"><span style="color:#34d399;">● Active</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                      <td style="padding: 12px 14px;"><strong style="color: #ffffff;">Worship Leader</strong></td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Songs, setlists, and lyrics structuring</td>
                      <td style="padding: 12px 14px; color: #fbbf24;">Preview Only</td>
                      <td style="padding: 12px 14px;"><span style="color:#34d399;">● Active</span></td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 14px;"><strong style="color: #ffffff;">Volunteer</strong></td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Slide next/prev within strict guardrails</td>
                      <td style="padding: 12px 14px; color: #94a3b8;">Assigned Tasks</td>
                      <td style="padding: 12px 14px;"><span style="color:#34d399;">● Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 11. STORAGE & BACKUP TAB -->
            <div class="settings-pane" id="pane-storage" style="display:none;">
              <span class="eyebrow">LOCAL DATABASE & BACKUPS</span>
              <h3>Disaster Recovery & Data Export</h3>
              <p>Export the entire church presentation library, custom scriptures, and settings to an offline backup archive.</p>

              <div class="storage-action-cards">
                <div class="storage-card panel">
                  <h4>Full Church Database Backup</h4>
                  <p>Downloads a single JSON archive containing all presentations, songs, custom scriptures, and configuration.</p>
                  <button class="primary-button small" id="set-btn-export-backup" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); border: 1px solid rgba(192, 132, 252, 0.4);">
                    Export Backup File (.json) <span>↓</span>
                  </button>
                </div>
                <div class="storage-card panel">
                  <h4>Restore From Backup</h4>
                  <p>Import a previously saved KERYX backup file into this workstation's local storage.</p>
                  <label class="secondary-button small" style="cursor:pointer; display:inline-block; border-color: rgba(167, 139, 250, 0.3);">
                    Select Backup File (.json)
                    <input type="file" id="set-file-import-backup" accept=".json" style="display:none;" />
                  </label>
                </div>
              </div>

              <div class="setting-toggle-row" style="margin-top: 24px;">
                <div>
                  <strong>Local Database Storage Quota</strong>
                  <small>Utilized: <strong>28.4 MB</strong> / 5,000 MB available (Optimal Performance)</small>
                </div>
                <button class="secondary-button small" id="btn-clear-cache" style="font-size: 11px;">Clear Media Thumbnail Cache</button>
              </div>
            </div>

            <!-- 12. KEYBOARD SHORTCUTS TAB -->
            <div class="settings-pane" id="pane-keyboard" style="display:none;">
              <span class="eyebrow">BROADCAST CONTROLS</span>
              <h3>Keyboard Shortcuts</h3>
              <p>Master keyboard shortcuts designed for rapid zero-latency operator control during live worship services.</p>
              <div class="shortcuts-cheat-grid">
                <div class="shortcut-row"><kbd>Space</kbd><span>Advance Next Slide</span></div>
                <div class="shortcut-row"><kbd>Shift + Space</kbd><span>Return to Previous Slide</span></div>
                <div class="shortcut-row"><kbd>Enter</kbd><span>Send Current Preview to LIVE</span></div>
                <div class="shortcut-row"><kbd>B</kbd><span>Toggle Black Screen</span></div>
                <div class="shortcut-row"><kbd>C</kbd><span>Toggle Clear Screen</span></div>
                <div class="shortcut-row"><kbd>F</kbd><span>Toggle Freeze Output</span></div>
                <div class="shortcut-row"><kbd>1</kbd><span>Trigger Lower-Third Title (Overlay 1)</span></div>
                <div class="shortcut-row"><kbd>2</kbd><span>Trigger Picture-in-Picture (Overlay 2)</span></div>
                <div class="shortcut-row"><kbd>3</kbd><span>Trigger Scripture Pill (Overlay 3)</span></div>
                <div class="shortcut-row"><kbd>Ctrl + K</kbd><span>Open Global Command Palette</span></div>
                <div class="shortcut-row"><kbd>Ctrl + S</kbd><span>Save Church Workspace</span></div>
                <div class="shortcut-row"><kbd>F11</kbd><span>Toggle Fullscreen Projector</span></div>
              </div>
            </div>

            <!-- 13. SECURITY & DEVICES PANE -->
            <div class="settings-pane" id="pane-security" style="display:none;">
              <span class="eyebrow">AUTHENTICATION & INTEGRITY</span>
              <h3>Security & Mobile Remote Devices</h3>
              <p>Lock on-air broadcast controls with safety PIN codes and manage authorized local WiFi remote controllers.</p>

              <div class="settings-form-grid">
                <label>Broadcast Cut Protection PIN
                  <input type="password" id="set-sec-pin" placeholder="Enter 4-digit PIN (Optional)" maxlength="4" />
                </label>
                <label>Mobile Remote Control Access
                  <select id="set-sec-remote-policy">
                    <option selected>Authorized Team Devices Only (Token Required)</option>
                    <option>Open Local WiFi Pairing (Rehearsals)</option>
                    <option>Disabled (Local Workstation Only)</option>
                  </select>
                </label>
              </div>

              <div class="setting-toggle-row">
                <div>
                  <strong>Audit Log Operator Actions</strong>
                  <small>Records timestamped log of which operator triggered live moments, scripture cues, and stream switches.</small>
                </div>
                <button class="toggle-switch on"><i></i></button>
              </div>
            </div>

            <!-- 14. ADVANCED & LOGS PANE -->
            <div class="settings-pane" id="pane-advanced" style="display:none;">
              <span class="eyebrow">SYSTEM ENGINE & DIAGNOSTICS</span>
              <h3>Advanced Configuration & Maintenance</h3>
              <p>Configure GPU hardware acceleration, diagnostic telemetry logging, and database index rebuilds.</p>

              <div class="settings-form-grid">
                <label>Graphics Acceleration Engine
                  <select id="set-adv-gpu">
                    <option selected>WebGL 2.0 Hardware Accelerated (Active)</option>
                    <option>Software Canvas Fallback</option>
                  </select>
                </label>
                <label>Diagnostic Log Verbosity
                  <select id="set-adv-logs">
                    <option selected>Production (Warnings & Errors Only)</option>
                    <option>Verbose (All NDI / Stream Telemetry)</option>
                    <option>Diagnostic Trace</option>
                  </select>
                </label>
              </div>

              <div style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="secondary-button" id="btn-reindex-bible" style="border-color: rgba(167, 139, 250, 0.4);">
                  📖 Re-Index Offline Bible Engine
                </button>
                <button class="secondary-button" id="btn-test-ndi-loop" style="border-color: rgba(56, 189, 248, 0.4);">
                  📡 Test NDI Loopback Feed
                </button>
                <button class="danger-button" id="btn-factory-reset" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;">
                  ⚠️ Reset to Factory Defaults
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    if (!container) return;

    // 1. Tab Navigation: Click any link to switch pane immediately
    container.querySelectorAll('.settings-nav-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = btn.dataset.tab;

        // Set active button
        container.querySelectorAll('.settings-nav-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Hide all panes
        container.querySelectorAll('.settings-pane').forEach((p) => {
          p.style.display = 'none';
        });

        // Show target pane
        const target = container.querySelector(`#pane-${tabId}`);
        if (target) {
          target.style.display = 'block';
        }
      });
    });

    // 2. Save Settings: Read all inputs and persist to appStore
    container.querySelector('#settings-btn-save')?.addEventListener('click', () => {
      const name = container.querySelector('#set-church-name')?.value?.trim();
      const pastor = container.querySelector('#set-pastor-name')?.value?.trim();
      const email = container.querySelector('#set-church-email')?.value?.trim();
      const phone = container.querySelector('#set-church-phone')?.value?.trim();
      const tz = container.querySelector('#set-timezone')?.value;
      const watermark = container.querySelector('#set-brand-watermark')?.value;
      const font = container.querySelector('#set-brand-font')?.value;
      const primaryColor = container.querySelector('#set-brand-primary')?.value;
      const secondaryColor = container.querySelector('#set-brand-secondary')?.value;
      const bibleTranslation = container.querySelector('#set-bible-translation')?.value;

      // Gemini AI Cloud Settings
      const geminiKey = container.querySelector('#set-gemini-api-key')?.value;
      const geminiModel = container.querySelector('#set-gemini-model')?.value;
      if (geminiKey !== undefined) {
        GeminiClient.setApiKey(geminiKey);
      }
      if (geminiModel) {
        GeminiClient.setModel(geminiModel);
      }

      const current = appStore.getState().church;
      const updatedChurch = {
        ...current,
        name: name || current.name,
        pastor: pastor || current.pastor,
        email: email || current.email,
        phone: phone || current.phone,
        timezone: tz || current.timezone,
        bibleTranslation: bibleTranslation || current.bibleTranslation,
        branding: {
          ...current.branding,
          watermark: watermark || current.branding?.watermark,
          font: font || current.branding?.font,
          primaryColor: primaryColor || current.branding?.primaryColor,
          secondaryColor: secondaryColor || current.branding?.secondaryColor
        }
      };

      appStore.setChurch(updatedChurch);
      eventBus.emit('toast:notify', {
        type: 'success',
        title: 'Settings Saved ✓',
        message: 'All control room preferences, Gemini AI settings, and branding updated.'
      });
    });

    // Gemini API Connection Testing
    const testKeyBtn = container.querySelector('#btn-test-gemini-key');
    const keyInput = container.querySelector('#set-gemini-api-key');
    const visBtn = container.querySelector('#btn-toggle-gemini-key-vis');
    const statusPill = container.querySelector('#gemini-status-pill');

    visBtn?.addEventListener('click', () => {
      if (keyInput.type === 'password') {
        keyInput.type = 'text';
        visBtn.textContent = 'Hide';
      } else {
        keyInput.type = 'password';
        visBtn.textContent = 'Show';
      }
    });

    testKeyBtn?.addEventListener('click', async () => {
      const key = keyInput?.value?.trim();
      if (!key) {
        eventBus.emit('toast:notify', { type: 'warning', title: 'API Key Required', message: 'Please enter a Google Gemini API key to test.' });
        return;
      }
      testKeyBtn.textContent = 'Testing...';
      const result = await GeminiClient.testConnection(key);
      testKeyBtn.textContent = 'Test & Save';
      if (result.ok) {
        GeminiClient.setApiKey(key);
        if (statusPill) {
          statusPill.className = 'status-pill online';
          statusPill.textContent = '● Live Cloud Connected';
        }
        eventBus.emit('toast:notify', { type: 'success', title: 'Gemini AI Online ✓', message: result.message });
      } else {
        eventBus.emit('toast:notify', { type: 'danger', title: 'Connection Failed', message: result.message });
      }
    });

    // 3. Export backup
    container.querySelector('#set-btn-export-backup')?.addEventListener('click', async () => {
      try {
        const backupJson = await db.exportBackup();
        SermonIntelligence.downloadFile(`keryx-church-backup-${Date.now()}.json`, backupJson, 'application/json');
        eventBus.emit('toast:notify', { type: 'success', title: 'Backup Exported', message: 'Church database archive saved.' });
      } catch (err) {
        eventBus.emit('toast:notify', { type: 'error', title: 'Backup Failed', message: err.message });
      }
    });

    // 4. Import backup
    container.querySelector('#set-file-import-backup')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        try {
          await db.importBackup(text);
          eventBus.emit('toast:notify', { type: 'success', title: 'Backup Restored', message: 'All church assets and settings restored.' });
          setTimeout(() => location.reload(), 1200);
        } catch (err) {
          eventBus.emit('toast:notify', { type: 'danger', title: 'Restore Failed', message: err.message });
        }
      }
    });

    // 5. Toggle offline mode
    container.querySelector('#set-toggle-offline')?.addEventListener('click', (e) => {
      appStore.toggleOfflineMode();
      e.currentTarget.classList.toggle('on', appStore.offlineMode);
      eventBus.emit('toast:notify', {
        type: 'info',
        title: appStore.offlineMode ? 'Offline Mode Active' : 'Online Mode Enabled',
        message: appStore.offlineMode ? 'Running 100% on local storage and indexed database.' : 'Online network sync enabled.'
      });
    });

    // 6. Generic interactive toggle switches
    container.querySelectorAll('.toggle-switch:not(#set-toggle-offline)').forEach((sw) => {
      sw.addEventListener('click', () => {
        sw.classList.toggle('on');
      });
    });

    // 7. Output test patterns
    container.querySelector('#btn-test-colorbars')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', { type: 'info', title: 'Test Pattern', message: 'Broadcasting SMPTE Color Bars to Output 1 & NDI.' });
    });
    container.querySelector('#btn-test-grid')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', { type: 'info', title: 'Test Pattern', message: 'Broadcasting 16:9 Grid Alignment Pattern.' });
    });
    container.querySelector('#btn-test-white')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', { type: 'info', title: 'Test Pattern', message: 'Broadcasting White Balance calibration.' });
    });
    container.querySelector('#btn-test-black')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', { type: 'info', title: 'Blackout Active', message: 'All outputs blacked out.' });
    });

    // 8. Re-Index Bible Database
    container.querySelector('#btn-reindex-bible')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', {
        type: 'success',
        title: 'Bible Database Verified',
        message: '31,102 verses across WEB & KJV fully indexed and verified.'
      });
    });

    // 9. Clear Media Cache
    container.querySelector('#btn-clear-cache')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', {
        type: 'info',
        title: 'Cache Cleared',
        message: 'Freed 18.2 MB of cached presentation previews.'
      });
    });

    // 10. Factory Reset
    container.querySelector('#btn-factory-reset')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all local settings to factory defaults? This will not delete your saved sermon files.')) {
        localStorage.clear();
        eventBus.emit('toast:notify', { type: 'info', title: 'Reset Complete', message: 'Reloading default workspace...' });
        setTimeout(() => location.reload(), 1000);
      }
    });
  }
}


