/**
 * KERYX Toast Notification System
 * Non-blocking status updates and operator feedback.
 */

import { eventBus } from '../core/eventBus.js';

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!document.getElementById('keryx-toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'keryx-toast-container';
      this.container.className = 'keryx-toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('keryx-toast-container');
    }

    eventBus.on('toast:notify', (payload) => this.show(payload));
  }

  show({ type = 'info', title = '', message = '', duration = 3500 }) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `keryx-toast keryx-toast-${type}`;

    const icon = type === 'success' ? '✓' : type === 'danger' ? '⚠' : type === 'warning' ? '▲' : 'ℹ';

    toast.innerHTML = `
      <div class="keryx-toast-icon">${icon}</div>
      <div class="keryx-toast-content">
        ${title ? `<strong>${title}</strong>` : ''}
        <span>${message}</span>
      </div>
      <button class="keryx-toast-close">&times;</button>
    `;

    toast.querySelector('.keryx-toast-close').addEventListener('click', () => {
      toast.remove();
    });

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fading');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }
}

export const toastManager = new ToastManager();

