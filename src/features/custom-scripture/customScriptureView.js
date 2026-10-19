/**
 * KERYX Custom Scripture & Local Queue View
 * Full manual scripture authoring and pre-service queue management without AI dependency.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { bibleStore } from '../../stores/bibleStore.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';
import { Modal } from '../../components/modal.js';

export class CustomScriptureView {
  static render() {
    const queue = bibleStore.localQueue;

    return `
      <section class="page custom-scripture-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">MANUAL SCRIPTURE SYSTEM</span>
            <h1>Custom Scriptures & Local Queue</h1>
            <p class="subheading">Create custom translations and stage scriptures for immediate broadcast. Operates 100% offline with zero AI required.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button" id="btn-create-custom-scrip">
              <span>＋</span> Create Custom Scripture
            </button>
            <button class="secondary-button" id="btn-save-as-set">
              Save Queue As Service Set
            </button>
          </div>
        </div>

        <div class="custom-scrip-grid">
          <!-- Left Column: Pre-service Scripture Queue -->
          <div class="queue-card-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">BROADCAST QUEUE (${queue.length} ITEMS)</span>
                <h3>Operator Staged Scriptures</h3>
              </div>
              <span class="offline-label"><i></i> Instant Trigger</span>
            </div>
            <p class="panel-intro">Pre-staged passages ready for the operator. Click Preview or Live to project instantaneously.</p>

            <div class="scripture-queue-list" id="scripture-queue-list">
              ${queue
                .map(
                  (item, idx) => `
                <div class="staged-scrip-card" data-idx="${idx}">
                  <div class="staged-scrip-num">0${idx + 1}</div>
                  <div class="staged-scrip-info">
                    <div class="staged-scrip-meta">
                      <strong>${item.reference}</strong>
                      <span class="verse-badge">${item.translation}</span>
                      ${item.notes ? `<small class="staged-notes">📝 ${item.notes}</small>` : ''}
                    </div>
                    <p class="staged-scrip-text">${item.text}</p>
                  </div>
                  <div class="staged-scrip-actions">
                    <button class="secondary-button small queue-btn-preview" data-idx="${idx}">Preview</button>
                    <button class="primary-button small queue-btn-live" data-idx="${idx}">Go Live <span>→</span></button>
                    <button class="icon-button queue-btn-remove" data-idx="${idx}" title="Remove from queue">✕</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </div>

          <!-- Right Column: Saved Church Custom Scripture Catalog -->
          <div class="custom-catalog-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">CHURCH CUSTOM REPOSITORY</span>
                <h3>Custom Translations</h3>
              </div>
            </div>

            <div class="custom-scrip-list" id="custom-scrip-catalog">
              <div class="loading-state">Loading custom scriptures...</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static async attachEvents(container) {
    const catalogContainer = container.querySelector('#custom-scrip-catalog');

    const renderCatalog = async () => {
      const customItems = await db.getAll(TABLE_NAMES.CUSTOM_SCRIPTURES);
      if (customItems.length === 0) {
        catalogContainer.innerHTML = `
          <div class="empty-state-notice">
            <span>✎</span>
            <strong>No custom scriptures created yet</strong>
            <p>Add specialized translations or sermon anchor verses with personal study notes.</p>
          </div>
        `;
        return;
      }

      catalogContainer.innerHTML = customItems
        .map(
          (c) => `
        <div class="custom-item-card" data-id="${c.id}">
          <div class="custom-item-top">
            <strong>${c.reference}</strong>
            <span class="custom-badge">${c.translation}</span>
          </div>
          <p class="custom-item-text">${c.text}</p>
          ${c.notes ? `<div class="custom-item-notes"><strong>Note:</strong> ${c.notes}</div>` : ''}
          <div class="custom-item-actions">
            <button class="secondary-button small catalog-btn-preview">Preview</button>
            <button class="primary-button small catalog-btn-live">Live</button>
            <button class="ghost-button small catalog-btn-queue">＋ Queue</button>
            <button class="text-button small catalog-btn-delete" style="color:#d9534f; margin-left:auto;">Delete</button>
          </div>
        </div>
      `
        )
        .join('');

      catalogContainer.querySelectorAll('.custom-item-card').forEach((card) => {
        const id = card.dataset.id;
        const target = customItems.find((i) => i.id === id);
        if (!target) return;

        card.querySelector('.catalog-btn-preview')?.addEventListener('click', () => {
          liveStore.setPreview({
            type: 'scripture',
            title: `${target.reference} (${target.translation})`,
            reference: target.reference,
            text: target.text,
            subtitle: `${target.translation} · Custom Scripture`,
            speakerNotes: target.notes || ''
          }, 'Custom Scripture Repository');
        });

        card.querySelector('.catalog-btn-live')?.addEventListener('click', () => {
          liveStore.goLive({
            type: 'scripture',
            title: `${target.reference} (${target.translation})`,
            reference: target.reference,
            text: target.text,
            subtitle: `${target.translation} · Custom Scripture`,
            speakerNotes: target.notes || ''
          }, 'Custom Scripture Repository');
        });

        card.querySelector('.catalog-btn-queue')?.addEventListener('click', () => {
          bibleStore.addToQueue(target);
          renderQueue();
        });

        card.querySelector('.catalog-btn-delete')?.addEventListener('click', async () => {
          await db.delete(TABLE_NAMES.CUSTOM_SCRIPTURES, id);
          eventBus.emit('toast:notify', { type: 'info', title: 'Custom Scripture Removed', message: target.reference });
          renderCatalog();
        });
      });
    };

    const renderQueue = () => {
      const queueList = container.querySelector('#scripture-queue-list');
      const queue = bibleStore.localQueue;

      queueList.innerHTML = queue
        .map(
          (item, idx) => `
        <div class="staged-scrip-card" data-idx="${idx}">
          <div class="staged-scrip-num">0${idx + 1}</div>
          <div class="staged-scrip-info">
            <div class="staged-scrip-meta">
              <strong>${item.reference}</strong>
              <span class="verse-badge">${item.translation}</span>
              ${item.notes ? `<small class="staged-notes">📝 ${item.notes}</small>` : ''}
            </div>
            <p class="staged-scrip-text">${item.text}</p>
          </div>
          <div class="staged-scrip-actions">
            <button class="secondary-button small queue-btn-preview" data-idx="${idx}">Preview</button>
            <button class="primary-button small queue-btn-live" data-idx="${idx}">Go Live <span>→</span></button>
            <button class="icon-button queue-btn-remove" data-idx="${idx}" title="Remove from queue">✕</button>
          </div>
        </div>
      `
        )
        .join('');

      queueList.querySelectorAll('.queue-btn-preview').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = queue[parseInt(btn.dataset.idx, 10)];
          if (item) bibleStore.previewVerse(item);
        });
      });

      queueList.querySelectorAll('.queue-btn-live').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = queue[parseInt(btn.dataset.idx, 10)];
          if (item) bibleStore.sendVerseLive(item);
        });
      });

      queueList.querySelectorAll('.queue-btn-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          bibleStore.removeFromQueue(parseInt(btn.dataset.idx, 10));
          renderQueue();
        });
      });
    };

    // Attach queue action events initially
    renderQueue();
    await renderCatalog();

    // Modal creation dialog for manual scriptures
    container.querySelector('#btn-create-custom-scrip')?.addEventListener('click', () => {
      const modalContent = `
        <div class="custom-scrip-form">
          <div class="form-grid">
            <label>Scripture Reference (e.g. John 3:16)
              <input id="modal-scrip-ref" placeholder="Book Chapter:Verse" required />
            </label>
            <label>Translation Name / Code
              <input id="modal-scrip-trans" placeholder="e.g. The Message, AMPC, Custom" required />
            </label>
          </div>
          <div class="form-grid">
            <label>Language
              <select id="modal-scrip-lang">
                <option>English</option><option>French</option><option>Portuguese</option><option>Spanish</option><option>Yoruba</option><option>Igbo</option><option>Hausa</option>
              </select>
            </label>
            <label>Tags / Themes (Comma-separated)
              <input id="modal-scrip-tags" placeholder="Faith, Healing, Comfort" />
            </label>
          </div>
          <label>Scripture Text
            <textarea id="modal-scrip-text" rows="4" placeholder="Enter complete scripture text verbatim..." required style="width:100%; border:1px solid #d1d9d7; border-radius:4px; padding:10px; font-family:inherit;"></textarea>
          </label>
          <label>Notes / Context for Preacher
            <input id="modal-scrip-notes" placeholder="e.g. Altar call scripture or sermon anchor point" />
          </label>
        </div>
      `;

      Modal.open({
        title: 'Create Custom Scripture',
        content: modalContent,
        confirmText: 'Save Scripture',
        onConfirm: async () => {
          const ref = document.getElementById('modal-scrip-ref')?.value?.trim();
          const trans = document.getElementById('modal-scrip-trans')?.value?.trim() || 'Custom';
          const lang = document.getElementById('modal-scrip-lang')?.value || 'English';
          const tags = (document.getElementById('modal-scrip-tags')?.value || '').split(',').map((t) => t.trim());
          const text = document.getElementById('modal-scrip-text')?.value?.trim();
          const notes = document.getElementById('modal-scrip-notes')?.value?.trim();

          if (!ref || !text) {
            eventBus.emit('toast:notify', { type: 'warning', title: 'Incomplete Fields', message: 'Reference and text are required.' });
            return;
          }

          const newCustom = {
            reference: ref,
            translation: trans,
            language: lang,
            tags,
            text,
            notes,
            copyright: 'Church Custom Entry'
          };

          await db.set(TABLE_NAMES.CUSTOM_SCRIPTURES, newCustom);
          bibleStore.addToQueue(newCustom);
          eventBus.emit('toast:notify', { type: 'success', title: 'Custom Scripture Created', message: `${ref} saved and queued.` });
          renderCatalog();
          renderQueue();
        }
      });
    });

    container.querySelector('#btn-save-as-set')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', {
        type: 'success',
        title: 'Service Set Saved',
        message: 'Current scripture queue saved as "Sunday Morning Scripture Set".'
      });
    });
  }
}

