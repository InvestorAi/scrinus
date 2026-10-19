/**
 * KERYX Broadcast Keyboard Shortcuts
 * Global low-latency broadcast controls for live church media operators.
 */

import { liveStore } from '../stores/liveStore.js';
import { presentationStore } from '../stores/presentationStore.js';
import { CommandPalette } from './commandPalette.js';
import { Modal } from '../components/modal.js';
import { eventBus } from '../core/eventBus.js';

export class KeyboardShortcuts {
  static init() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing inside text inputs, textareas, or contenteditables
      const tag = e.target.tagName.toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

      // Global shortcuts with modifier keys (available even when focused in inputs)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        CommandPalette.open();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        eventBus.emit('toast:notify', {
          type: 'success',
          title: 'Workspace Saved',
          message: 'All local changes and presentation items are up to date.'
        });
        return;
      }

      if (isInput) return;

      // Broadcast single-key control room shortcuts
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          presentationStore.previousSlide();
        } else {
          presentationStore.nextSlide();
        }
      } else if (e.code === 'Enter') {
        e.preventDefault();
        liveStore.goLive();
      } else if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        liveStore.toggleBlackout();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        liveStore.toggleClear();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        liveStore.toggleFreeze();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        liveStore.toggleLogo();
      } else if (e.key === 'Escape') {
        // In live presentation mode, Esc is the safe emergency trigger if confirmation is held,
        // or clears blackout/clear modes
        if (liveStore.isBlackout || liveStore.isClear || liveStore.isFrozen) {
          if (liveStore.isBlackout) liveStore.toggleBlackout();
          if (liveStore.isClear) liveStore.toggleClear();
          if (liveStore.isFrozen) liveStore.toggleFreeze();
        }
      }
    });

    eventBus.on('shortcuts:open', () => this.showCheatSheet());
  }

  static showCheatSheet() {
    Modal.open({
      title: 'KERYX Broadcast Keyboard Shortcuts',
      width: '640px',
      content: `
        <div class="shortcuts-cheat-grid">
          <div class="shortcut-row"><kbd>Space</kbd><span>Advance Next Slide</span></div>
          <div class="shortcut-row"><kbd>Shift + Space</kbd><span>Return to Previous Slide</span></div>
          <div class="shortcut-row"><kbd>Enter</kbd><span>Send Current Preview to LIVE</span></div>
          <div class="shortcut-row"><kbd>B</kbd><span>Toggle Black Screen (Instant blackout)</span></div>
          <div class="shortcut-row"><kbd>C</kbd><span>Toggle Clear Screen (Hide text, keep background)</span></div>
          <div class="shortcut-row"><kbd>F</kbd><span>Toggle Freeze Output (Hold current frame)</span></div>
          <div class="shortcut-row"><kbd>L</kbd><span>Toggle Church Logo Screen</span></div>
          <div class="shortcut-row"><kbd>Ctrl + K</kbd><span>Open Global Command Palette</span></div>
          <div class="shortcut-row"><kbd>Ctrl + S</kbd><span>Save Local Church Workspace</span></div>
          <div class="shortcut-row"><kbd class="danger-key">EMERGENCY</kbd><span>Stop AI automation, display backup slide</span></div>
        </div>
      `,
      confirmText: 'Got It',
      cancelText: null
    });
  }
}

