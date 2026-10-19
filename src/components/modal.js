/**
 * KERYX Modal Component
 * Accessible, keyboard-navigable modal dialog system.
 */

export class Modal {
  static open({ title, content, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, width = '560px' }) {
    const existing = document.querySelector('.keryx-modal-backdrop');
    if (existing) existing.remove();

    const backdrop = document.createElement('div');
    backdrop.className = 'keryx-modal-backdrop';

    const container = document.createElement('div');
    container.className = 'keryx-modal-container';
    container.style.maxWidth = width;

    container.innerHTML = `
      <div class="keryx-modal-header">
        <h3>${title}</h3>
        <button class="keryx-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="keryx-modal-body">
        ${typeof content === 'string' ? content : ''}
      </div>
      <div class="keryx-modal-footer">
        ${cancelText ? `<button class="secondary-button keryx-modal-cancel">${cancelText}</button>` : ''}
        ${confirmText ? `<button class="primary-button keryx-modal-confirm">${confirmText}</button>` : ''}
      </div>
    `;

    if (typeof content !== 'string' && content instanceof HTMLElement) {
      container.querySelector('.keryx-modal-body').appendChild(content);
    }

    backdrop.appendChild(container);
    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.classList.add('closing');
      setTimeout(() => backdrop.remove(), 150);
    };

    container.querySelector('.keryx-modal-close')?.addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
    });

    container.querySelector('.keryx-modal-cancel')?.addEventListener('click', () => {
      if (onCancel) onCancel();
      close();
    });

    container.querySelector('.keryx-modal-confirm')?.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        if (onCancel) onCancel();
        close();
      }
    });

    const onKey = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        if (onCancel) onCancel();
        close();
      }
    };
    document.addEventListener('keydown', onKey);

    return { close };
  }
}

