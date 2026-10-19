/**
 * KERYX Command Palette
 * Global interactive search and command execution (Ctrl+K).
 */

import { appStore } from '../stores/appStore.js';
import { liveStore } from '../stores/liveStore.js';
import { bibleStore } from '../stores/bibleStore.js';
import { aiStore } from '../stores/aiStore.js';
import { eventBus } from '../core/eventBus.js';

export class CommandPalette {
  static open() {
    const existing = document.getElementById('keryx-command-palette-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'keryx-command-palette-backdrop';
    backdrop.className = 'keryx-palette-backdrop';

    backdrop.innerHTML = `
      <div class="keryx-palette-modal">
        <div class="keryx-palette-input-wrap">
          <span class="palette-icon">⌘</span>
          <input type="text" id="palette-search-input" placeholder="Type a scripture, command, or feature... (e.g. 'John 3:16', 'Black', 'Service')" autofocus />
          <kbd>ESC</kbd>
        </div>
        <div class="keryx-palette-results" id="palette-results"></div>
        <div class="keryx-palette-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
          <span><kbd>ESC</kbd> to dismiss</span>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#palette-search-input');
    const resultsContainer = backdrop.querySelector('#palette-results');
    let selectedIndex = 0;
    let currentResults = [];

    const commands = [
      { type: 'action', title: 'Go Live', desc: 'Send current preview to live auditorium screen', action: () => liveStore.goLive(), badge: 'Enter' },
      { type: 'action', title: 'Black Screen', desc: 'Cut all projection outputs to black', action: () => liveStore.toggleBlackout(), badge: 'B' },
      { type: 'action', title: 'Clear Screen', desc: 'Clear text overlay while keeping background', action: () => liveStore.toggleClear(), badge: 'C' },
      { type: 'action', title: 'Freeze Output', desc: 'Freeze live screen on current frame', action: () => liveStore.toggleFreeze(), badge: 'F' },
      { type: 'action', title: 'Logo Screen', desc: 'Display church logo presentation slide', action: () => liveStore.toggleLogo(), badge: 'L' },
      { type: 'danger', title: 'EMERGENCY OVERRIDE', desc: 'Halt all AI automation and project safe backup slide', action: () => liveStore.triggerEmergency(), badge: 'Esc' },
      { type: 'view', title: 'Open Service Planner', desc: 'Manage Sunday service timeline and moments', action: () => appStore.setActiveView('Service') },
      { type: 'view', title: 'Open Presentation Editor', desc: 'Edit slide decks, text, backgrounds, and themes', action: () => appStore.setActiveView('Present') },
      { type: 'view', title: 'Open Bible Engine', desc: 'Browse 66 books, compare translations, search offline', action: () => appStore.setActiveView('Bible') },
      { type: 'view', title: 'Manage Custom Scriptures', desc: 'Create manual scripture entries & manage local queue', action: () => appStore.setActiveView('CustomScripture') },
      { type: 'view', title: 'Open Song Library', desc: 'Manage worship lyrics, verse, chorus, bridge', action: () => appStore.setActiveView('Songs') },
      { type: 'view', title: 'Open Media Library', desc: 'Manage images, videos, audio, and motion backgrounds', action: () => appStore.setActiveView('Media') },
      { type: 'view', title: 'Open AI Center', desc: 'Live speech transcription and scripture detection', action: () => appStore.setActiveView('AI Center') },
      { type: 'view', title: 'Multi-Screen Output Routing', desc: 'Configure Main, Stage, Confidence, and Lobby displays', action: () => appStore.setActiveView('Outputs') },
      { type: 'view', title: 'Control Room Settings', desc: 'Church profile, branding, audio, AI, and shortcuts', action: () => appStore.setActiveView('Settings') },
      { type: 'ai', title: 'Toggle AI Listening', desc: 'Start or pause real-time microphone audio processing', action: () => aiStore.toggleListening() },
      { type: 'ai', title: 'Set Autopilot: Automatic', desc: 'Auto-display scripture detections with 95%+ confidence', action: () => aiStore.setAutopilotMode('Automatic') },
      { type: 'ai', title: 'Set Autopilot: Assisted', desc: 'Recommend scriptures in queue for operator review', action: () => aiStore.setAutopilotMode('Assisted') },
      { type: 'tool', title: 'Run Pre-Flight Check', desc: 'Verify displays, audio, Bible, streaming, and AI', action: () => eventBus.emit('preflight:open') }
    ];

    const renderResults = async () => {
      const q = input.value.trim().toLowerCase();
      let matched = [];

      // Check if user is searching for a scripture reference or keyword
      if (q.length > 1) {
        const bibleMatches = await bibleStore.search(q);
        if (bibleMatches.length > 0) {
          bibleMatches.slice(0, 4).forEach((bm) => {
            matched.push({
              type: 'scripture',
              title: `${bm.reference} (${bm.translation})`,
              desc: bm.text.slice(0, 90) + (bm.text.length > 90 ? '...' : ''),
              badge: 'SCRIPTURE',
              action: () => {
                bibleStore.previewVerse(bm);
                appStore.setActiveView('Bible');
              }
            });
          });
        }
      }

      // Filter commands
      const cmdMatches = q
        ? commands.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
        : commands.slice(0, 8);

      currentResults = [...matched, ...cmdMatches];
      if (selectedIndex >= currentResults.length) selectedIndex = 0;

      if (currentResults.length === 0) {
        resultsContainer.innerHTML = `<div class="palette-empty">No matching commands or scriptures found for "<strong>${q}</strong>"</div>`;
        return;
      }

      resultsContainer.innerHTML = currentResults
        .map(
          (item, idx) => `
        <div class="palette-item ${idx === selectedIndex ? 'selected' : ''} ${item.type === 'danger' ? 'danger-item' : ''}" data-idx="${idx}">
          <div class="palette-item-icon">${item.type === 'scripture' ? '✦' : item.type === 'action' ? '▶' : item.type === 'view' ? '◫' : item.type === 'danger' ? '⚠' : '⚙'}</div>
          <div class="palette-item-text">
            <strong>${item.title}</strong>
            <small>${item.desc}</small>
          </div>
          ${item.badge ? `<span class="palette-badge">${item.badge}</span>` : ''}
        </div>
      `
        )
        .join('');

      resultsContainer.querySelectorAll('.palette-item').forEach((itemEl) => {
        itemEl.addEventListener('click', () => {
          const idx = parseInt(itemEl.dataset.idx, 10);
          executeItem(idx);
        });
      });
    };

    const executeItem = (idx) => {
      const item = currentResults[idx];
      if (item && item.action) {
        close();
        item.action();
      }
    };

    const close = () => {
      backdrop.remove();
    };

    input.addEventListener('input', () => {
      selectedIndex = 0;
      renderResults();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % Math.max(1, currentResults.length);
        renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + currentResults.length) % Math.max(1, currentResults.length);
        renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeItem(selectedIndex);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    renderResults();
  }
}

