/**
 * KERYX Preview & Live Broadcast Controller Bar
 * Real-time dual monitor strip with live broadcast toggles: Go Live, Black, Clear, Freeze, Logo, Emergency.
 */

import { liveStore } from '../../stores/liveStore.js';
import { presentationStore } from '../../stores/presentationStore.js';
import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';

export class PreviewLiveBar {
  static render() {
    const state = liveStore.getState();
    const preview = state.currentPreview || {};
    const live = state.currentLive || {};

    const previewText = preview.text || preview.title || 'No item in preview';
    const liveText = state.isEmergency
      ? 'EMERGENCY OVERRIDE ACTIVE'
      : state.isBlackout
      ? 'BLACKOUT ACTIVE (Outputs Dark)'
      : state.isClear
      ? 'CLEAR SCREEN (Text Hidden)'
      : live.text || live.title || 'Black Output';

    return `
      <div class="keryx-broadcast-bar" id="keryx-broadcast-bar">
        <!-- Preview Monitor Card -->
        <div class="broadcast-monitor-card preview-card">
          <div class="monitor-header">
            <span class="monitor-label preview-label">PREVIEW</span>
            <span class="monitor-sub">${preview.subtitle || preview.reference || 'Staged'}</span>
          </div>
          <div class="monitor-screen-preview">
            <div class="monitor-screen-inner">
              <strong class="screen-title">${preview.title || 'Ready'}</strong>
              <p class="screen-text">${previewText.slice(0, 140)}${previewText.length > 140 ? '...' : ''}</p>
            </div>
          </div>
        </div>

        <!-- Center Broadcast Transfer Controls -->
        <div class="broadcast-transfer-controls">
          <button class="broadcast-action-btn go-live-btn" id="bar-btn-golive" title="Send Preview to Live Screen (Enter)">
            <span class="btn-main-label">GO LIVE</span>
            <kbd>↵ Enter</kbd>
          </button>
          <div class="step-nav-buttons">
            <button class="step-btn" id="bar-btn-prev" title="Previous Slide (Shift+Space)">◀ Prev</button>
            <button class="step-btn" id="bar-btn-next" title="Next Slide (Space)">Next ▶</button>
          </div>
        </div>

        <!-- Live On-Air Monitor Card -->
        <div class="broadcast-monitor-card live-card ${state.isBlackout ? 'is-blackout' : ''} ${state.isEmergency ? 'is-emergency' : ''}">
          <div class="monitor-header">
            <span class="monitor-label live-label"><i></i> LIVE ON-AIR</span>
            <span class="monitor-sub">${state.isEmergency ? 'OVERRIDE' : live.subtitle || live.reference || 'Auditorium'}</span>
          </div>
          <div class="monitor-screen-preview ${state.isFrozen ? 'frozen-glow' : ''}">
            <div class="monitor-screen-inner">
              <strong class="screen-title">${state.isEmergency ? 'Emergency Backup' : state.isBlackout ? 'Screen Black' : live.title || 'Live'}</strong>
              <p class="screen-text">${liveText.slice(0, 140)}${liveText.length > 140 ? '...' : ''}</p>
            </div>
          </div>
        </div>

        <!-- Broadcast Overrides & Toggles -->
        <div class="broadcast-toggles-strip">
          <button class="toggle-btn ${state.isBlackout ? 'active-black' : ''}" id="bar-btn-black" title="Black Screen (B)">
            <span class="toggle-icon">■</span>
            <span>Black</span>
            <kbd>B</kbd>
          </button>
          <button class="toggle-btn ${state.isClear ? 'active-clear' : ''}" id="bar-btn-clear" title="Clear Screen (C)">
            <span class="toggle-icon">□</span>
            <span>Clear</span>
            <kbd>C</kbd>
          </button>
          <button class="toggle-btn ${state.isFreeze ? 'active-freeze' : ''}" id="bar-btn-freeze" title="Freeze Screen (F)">
            <span class="toggle-icon">❄</span>
            <span>Freeze</span>
            <kbd>F</kbd>
          </button>
          <button class="toggle-btn ${state.isLogo ? 'active-logo' : ''}" id="bar-btn-logo" title="Logo Screen (L)">
            <span class="toggle-icon">✦</span>
            <span>Logo</span>
            <kbd>L</kbd>
          </button>
          <button class="toggle-btn emergency-btn ${state.isEmergency ? 'active-emergency' : ''}" id="bar-btn-emergency" title="Emergency Override (Esc)">
            <span class="toggle-icon">⚠</span>
            <span>${state.isEmergency ? 'CLEAR EMER' : 'EMERGENCY'}</span>
            <kbd>ESC</kbd>
          </button>
          <button class="bshow-footer-launcher-btn" id="bar-btn-aisuite" title="Open AI Broadcast Intelligence Suite" style="padding: 4px 10px; margin-left: 4px; border-color: rgba(139, 92, 246, 0.4); color: #c4b5fd; background: rgba(139, 92, 246, 0.1);">
            <span style="color:#a855f7;">✳</span> AI Suite
          </button>
        </div>
      </div>
    `;
  }

  static attachEvents(container) {
    container.querySelector('#bar-btn-golive')?.addEventListener('click', () => liveStore.goLive());
    container.querySelector('#bar-btn-prev')?.addEventListener('click', () => presentationStore.previousSlide());
    container.querySelector('#bar-btn-next')?.addEventListener('click', () => presentationStore.nextSlide());
    container.querySelector('#bar-btn-black')?.addEventListener('click', () => liveStore.toggleBlackout());
    container.querySelector('#bar-btn-clear')?.addEventListener('click', () => liveStore.toggleClear());
    container.querySelector('#bar-btn-freeze')?.addEventListener('click', () => liveStore.toggleFreeze());
    container.querySelector('#bar-btn-logo')?.addEventListener('click', () => liveStore.toggleLogo());
    container.querySelector('#bar-btn-emergency')?.addEventListener('click', () => {
      if (liveStore.isEmergency) {
        liveStore.clearEmergency();
      } else {
        liveStore.triggerEmergency();
      }
    });
    container.querySelector('#bar-btn-aisuite')?.addEventListener('click', () => {
      if (appStore.getState().activeView !== 'Studio') {
        appStore.setActiveView('Studio');
      }
      setTimeout(() => {
        eventBus.emit('studio:open_ai_suite');
      }, 80);
    });
  }
}

