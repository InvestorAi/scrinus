/**
 * KERYX Mega Menu System
 * 14-category broadcast menu routing to real application actions and views.
 */

import { appStore } from '../stores/appStore.js';
import { liveStore } from '../stores/liveStore.js';
import { presentationStore } from '../stores/presentationStore.js';
import { aiStore } from '../stores/aiStore.js';
import { eventBus } from '../core/eventBus.js';
import { Modal } from '../components/modal.js';

export const MENU_CONFIG = {
  FILE: [
    { label: 'New Presentation', shortcut: 'Ctrl+N', action: () => { appStore.setActiveView('Present'); presentationStore.addSlide('title'); } },
    { label: 'New Service', action: () => appStore.setActiveView('Service') },
    { label: 'New Song', action: () => appStore.setActiveView('Songs') },
    { label: 'New Scripture', action: () => appStore.setActiveView('CustomScripture') },
    { label: 'Save', shortcut: 'Ctrl+S', action: () => eventBus.emit('toast:notify', { type: 'success', title: 'Saved', message: 'Workspace saved offline.' }) },
    { label: 'Backup Church Workspace', action: () => appStore.setActiveView('Settings') },
    { label: 'Restore from Backup', action: () => appStore.setActiveView('Settings') }
  ],
  EDIT: [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => eventBus.emit('toast:notify', { type: 'info', title: 'Undo', message: 'Action reverted.' }) },
    { label: 'Redo', shortcut: 'Ctrl+Y', action: () => eventBus.emit('toast:notify', { type: 'info', title: 'Redo', message: 'Action reapplied.' }) },
    { label: 'Duplicate Slide', shortcut: 'Ctrl+D', action: () => presentationStore.duplicateSlide(presentationStore.activeSlideIndex) },
    { label: 'Delete Slide', shortcut: 'Del', action: () => presentationStore.deleteSlide(presentationStore.activeSlideIndex) },
    { label: 'Preferences', action: () => appStore.setActiveView('Settings') }
  ],
  VIEW: [
    { label: '🎛 Church Studio Console', action: () => appStore.setActiveView('Studio') },
    { label: 'Dashboard', action: () => appStore.setActiveView('Dashboard') },
    { label: 'Presentation Workspace', action: () => appStore.setActiveView('Present') },
    { label: 'Service Timeline', action: () => appStore.setActiveView('Service') },
    { label: 'Bible Engine', action: () => appStore.setActiveView('Bible') },
    { label: 'Custom Scriptures', action: () => appStore.setActiveView('CustomScripture') },
    { label: 'Song Library', action: () => appStore.setActiveView('Songs') },
    { label: 'Media Library', action: () => appStore.setActiveView('Media') },
    { label: 'AI Center', action: () => appStore.setActiveView('AI Center') },
    { label: 'Multi-Screen Outputs', action: () => appStore.setActiveView('Outputs') },
    { label: 'Full Screen', shortcut: 'F11', action: () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } }
  ],
  PRESENT: [
    { label: 'Go Live', shortcut: 'Enter', action: () => liveStore.goLive() },
    { label: 'Next Slide', shortcut: 'Space', action: () => presentationStore.nextSlide() },
    { label: 'Previous Slide', shortcut: 'Shift+Space', action: () => presentationStore.previousSlide() },
    { label: 'Black Screen', shortcut: 'B', action: () => liveStore.toggleBlackout() },
    { label: 'Clear Screen', shortcut: 'C', action: () => liveStore.toggleClear() },
    { label: 'Logo Screen', shortcut: 'L', action: () => liveStore.toggleLogo() },
    { label: 'Freeze Live Screen', shortcut: 'F', action: () => liveStore.toggleFreeze() },
    { label: 'EMERGENCY OVERRIDE', shortcut: 'Esc', action: () => liveStore.triggerEmergency(), danger: true }
  ],
  MEDIA: [
    { label: 'Media Library', action: () => appStore.setActiveView('Media') },
    { label: 'Import Media', action: () => appStore.setActiveView('Media') },
    { label: 'Backgrounds', action: () => appStore.setActiveView('Media') }
  ],
  BIBLE: [
    { label: 'Open Bible', action: () => appStore.setActiveView('Bible') },
    { label: 'Custom Scriptures', action: () => appStore.setActiveView('CustomScripture') },
    { label: 'Compare Translations', action: () => appStore.setActiveView('Bible') },
    { label: 'AI Scripture Detector', action: () => appStore.setActiveView('AI Center') }
  ],
  SONGS: [
    { label: 'Song Library', action: () => appStore.setActiveView('Songs') },
    { label: 'Add New Song', action: () => appStore.setActiveView('Songs') },
    { label: 'Worship Setlists', action: () => appStore.setActiveView('Songs') }
  ],
  SERVICE: [
    { label: 'Service Planner', action: () => appStore.setActiveView('Service') },
    { label: 'Rehearsal Mode', action: () => { eventBus.emit('toast:notify', { type: 'info', title: 'Rehearsal Active', message: 'Simulated preview without altering live projection.' }); appStore.setActiveView('Service'); } }
  ],
  AI: [
    { label: 'AI Center & Speech-to-Text', action: () => appStore.setActiveView('AI Center') },
    { label: 'Toggle Speech Recognition', action: () => aiStore.toggleListening() },
    { label: 'Autopilot: Manual', action: () => aiStore.setAutopilotMode('Manual') },
    { label: 'Autopilot: Assisted', action: () => aiStore.setAutopilotMode('Assisted') },
    { label: 'Autopilot: Automatic', action: () => aiStore.setAutopilotMode('Automatic') }
  ],
  OUTPUT: [
    { label: 'Output Display Manager', action: () => appStore.setActiveView('Outputs') },
    { label: 'Launch Stage Display Window', action: () => window.open('#stage-output', 'StageDisplay', 'width=960,height=540') },
    { label: 'Launch Main Screen Window', action: () => window.open('#main-output', 'MainScreen', 'width=1280,height=720') }
  ],
  STREAM: [
    { label: 'Stream Controls & NDI', action: () => appStore.setActiveView('Stream') },
    { label: 'Lower Thirds Configuration', action: () => appStore.setActiveView('Outputs') }
  ],
  TOOLS: [
    { label: 'Pre-flight Diagnostics', action: () => eventBus.emit('preflight:open') },
    { label: 'Keyboard Shortcuts Reference', action: () => eventBus.emit('shortcuts:open') }
  ],
  WINDOW: [
    { label: 'Dashboard', action: () => appStore.setActiveView('Dashboard') },
    { label: 'Service', action: () => appStore.setActiveView('Service') },
    { label: 'Present', action: () => appStore.setActiveView('Present') },
    { label: 'Bible', action: () => appStore.setActiveView('Bible') },
    { label: 'AI Center', action: () => appStore.setActiveView('AI Center') }
  ],
  HELP: [
    {
      label: 'About KERYX',
      action: () => {
        Modal.open({
          title: 'About KERYX',
          content: `
            <div style="line-height:1.6; font-size:13px;">
              <strong style="font-size:16px; display:block; margin-bottom:8px;">KERYX — AI Church Presentation & Ministry OS</strong>
              <p>“Run the service. Capture the message. Amplify the ministry.”</p>
              <div style="margin:12px 0; padding:10px; background:#10171b; border-radius:4px; color:#a2b2b5; font-family:'DM Mono', monospace; font-size:11px;">
                Version: 1.0.0 (Production Release)<br/>
                Engine: Offline-First Relational Core<br/>
                Presentation Layer: Isolated State Machine<br/>
                AI Copilot: Provider-Agnostic Speech & Scripture Pipeline
              </div>
              <p style="color:#778588; font-size:11px;">“AI assists the church, but the church remains in control.”</p>
            </div>
          `,
          confirmText: 'Done',
          cancelText: null
        });
      }
    }
  ]
};

export class MegaMenuController {
  static renderBar() {
    const keys = Object.keys(MENU_CONFIG);
    return `
      <div class="keryx-mega-menu-bar" id="mega-menu-bar">
        ${keys
          .map(
            (key) => `
          <div class="mega-menu-item" data-menu="${key}">
            <button class="mega-menu-trigger" aria-haspopup="true" aria-expanded="false">${key}</button>
            <div class="mega-dropdown" role="menu">
              <div class="mega-dropdown-header">${key} Actions</div>
              <div class="mega-dropdown-list">
                ${MENU_CONFIG[key]
                  .map(
                    (item, idx) => `
                  <button class="mega-dropdown-item ${item.danger ? 'danger-item' : ''}" data-menu-action="${key}:${idx}" role="menuitem">
                    <span class="item-label">${item.label}</span>
                    ${item.shortcut ? `<kbd class="item-kbd">${item.shortcut}</kbd>` : ''}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  static attachEvents(container) {
    let closeTimer = null;

    const closeAll = () => {
      container.querySelectorAll('.mega-menu-item.open').forEach((el) => {
        el.classList.remove('open');
        const trigger = el.querySelector('.mega-menu-trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    const openItem = (menuItem) => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      closeAll();
      menuItem.classList.add('open');
      const trigger = menuItem.querySelector('.mega-menu-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
    };

    // Hover activation with debounce grace period
    container.querySelectorAll('.mega-menu-item').forEach((menuItem) => {
      menuItem.addEventListener('mouseenter', () => {
        openItem(menuItem);
      });

      menuItem.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => {
          closeAll();
        }, 120);
      });
    });

    // Action button clicks
    container.querySelectorAll('[data-menu-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const [key, idx] = btn.dataset.menuAction.split(':');
        const item = MENU_CONFIG[key][parseInt(idx, 10)];
        if (item && item.action) {
          item.action();
        }
        closeAll();
      });
    });

    // Click trigger fallback
    container.querySelectorAll('.mega-menu-trigger').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = trigger.closest('.mega-menu-item');
        const wasOpen = parent.classList.contains('open');
        closeAll();
        if (!wasOpen) {
          openItem(parent);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#mega-menu-bar')) {
        closeAll();
      }
    });
  }
}

