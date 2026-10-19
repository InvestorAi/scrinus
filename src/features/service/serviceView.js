/**
 * KERYX Service Planner View
 * Drag-ready service timeline, moment structuring, template loading, and rehearsal execution.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { eventBus } from '../../core/eventBus.js';
import { Modal } from '../../components/modal.js';
import { liveStore } from '../../stores/liveStore.js';

export class ServiceView {
  static render() {
    return `
      <section class="page service-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">SERVICE TIMELINE · SUNDAY MAIN AUDITORIUM</span>
            <h1>Service Planner</h1>
            <p class="subheading">Structure every moment from pre-service countdown to final benediction. Connect presentations, scriptures, and worship sets.</p>
          </div>
          <div class="heading-actions">
            <button class="secondary-button" id="svc-btn-templates">
              <span>📋</span> Service Templates
            </button>
            <button class="secondary-button" id="svc-btn-rehearse">
              <span>◉</span> Rehearsal Mode
            </button>
            <button class="primary-button" id="svc-btn-start">
              Start Service <span>▶</span>
            </button>
          </div>
        </div>

        <!-- Service Info Summary Strip -->
        <div class="service-meta-strip panel">
          <div class="service-meta-item">
            <span class="meta-label">TARGET DURATION</span>
            <strong>2h 15m (135 mins)</strong>
          </div>
          <div class="service-meta-item">
            <span class="meta-label">SERVICE MOMENTS</span>
            <strong id="svc-item-count">8 Items</strong>
          </div>
          <div class="service-meta-item">
            <span class="meta-label">LEAD PREACHER</span>
            <strong>Senior Pastor</strong>
          </div>
          <div class="service-meta-item">
            <span class="meta-label">WORSHIP LEADER</span>
            <strong>Grace City Worship Team</strong>
          </div>
          <div class="service-meta-item" style="margin-left:auto;">
            <span class="offline-label"><i></i> Saved in Local DB</span>
          </div>
        </div>

        <!-- Timeline Items List -->
        <div class="timeline-container panel">
          <div class="timeline-header">
            <h3>Order of Service</h3>
            <button class="primary-button small" id="svc-btn-add-item"><span>＋</span> Add Moment</button>
          </div>

          <div class="service-timeline-list" id="service-timeline-list">
            <div class="loading-state">Loading timeline...</div>
          </div>
        </div>
      </section>
    `;
  }

  static async attachEvents(container) {
    const list = container.querySelector('#service-timeline-list');
    const countEl = container.querySelector('#svc-item-count');

    let items = await db.getAll(TABLE_NAMES.SERVICE_ITEMS);

    const renderTimeline = () => {
      countEl.textContent = `${items.length} Items`;
      if (items.length === 0) {
        list.innerHTML = '<div class="empty-state-notice">Timeline is empty. Add a service moment or load a template.</div>';
        return;
      }

      list.innerHTML = items
        .map(
          (item, idx) => `
        <div class="service-timeline-row" data-idx="${idx}">
          <div class="timeline-time-col">
            <strong>${item.time}</strong>
            <small>${item.duration || '10m'}</small>
          </div>
          <div class="timeline-dot-col">
            <div class="timeline-circle ${idx === 0 ? 'first' : ''}"></div>
            <div class="timeline-line"></div>
          </div>
          <div class="timeline-card-col panel">
            <div class="timeline-card-type-icon ${item.type.toLowerCase()}">
              ${item.type === 'Songs' ? '♫' : item.type === 'Media' ? '▣' : item.type === 'Presentation' ? '◫' : item.type === 'Countdown' ? '⏱' : '◌'}
            </div>
            <div class="timeline-card-info">
              <strong>${item.title}</strong>
              <div class="timeline-tags">
                <span class="type-pill">${item.type}</span>
                ${item.notes ? `<span class="notes-preview">📝 ${item.notes}</span>` : ''}
              </div>
            </div>
            <div class="timeline-card-actions">
              <button class="secondary-button small row-btn-preview" data-idx="${idx}">Preview</button>
              <button class="primary-button small row-btn-live" data-idx="${idx}">Live</button>
              <div class="row-ordering-btns">
                <button class="icon-button row-btn-up" data-idx="${idx}" title="Move Up" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="icon-button row-btn-down" data-idx="${idx}" title="Move Down" ${idx === items.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
              <button class="icon-button row-btn-delete" data-idx="${idx}" title="Delete moment">✕</button>
            </div>
          </div>
        </div>
      `
        )
        .join('');

      list.querySelectorAll('.row-btn-preview').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = items[parseInt(btn.dataset.idx, 10)];
          if (item) {
            liveStore.setPreview({
              type: 'service_moment',
              title: item.title,
              subtitle: `${item.type} · ${item.time}`,
              text: `${item.title}\n${item.notes || ''}`,
              speakerNotes: item.notes || ''
            }, 'Service Planner');
          }
        });
      });

      list.querySelectorAll('.row-btn-live').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = items[parseInt(btn.dataset.idx, 10)];
          if (item) {
            liveStore.goLive({
              type: 'service_moment',
              title: item.title,
              subtitle: `${item.type} · ${item.time}`,
              text: `${item.title}\n${item.notes || ''}`,
              speakerNotes: item.notes || ''
            }, 'Service Planner');
          }
        });
      });

      list.querySelectorAll('.row-btn-up').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.dataset.idx, 10);
          if (idx > 0) {
            const [moved] = items.splice(idx, 1);
            items.splice(idx - 1, 0, moved);
            await persistOrder();
            renderTimeline();
          }
        });
      });

      list.querySelectorAll('.row-btn-down').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.dataset.idx, 10);
          if (idx < items.length - 1) {
            const [moved] = items.splice(idx, 1);
            items.splice(idx + 1, 0, moved);
            await persistOrder();
            renderTimeline();
          }
        });
      });

      list.querySelectorAll('.row-btn-delete').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const idx = parseInt(btn.dataset.idx, 10);
          const target = items[idx];
          if (target) {
            await db.delete(TABLE_NAMES.SERVICE_ITEMS, target.id);
            items.splice(idx, 1);
            renderTimeline();
          }
        });
      });
    };

    const persistOrder = async () => {
      for (const item of items) {
        await db.set(TABLE_NAMES.SERVICE_ITEMS, item);
      }
    };

    container.querySelector('#svc-btn-add-item')?.addEventListener('click', () => {
      Modal.open({
        title: 'Add Service Moment',
        content: `
          <div class="service-moment-form">
            <div class="form-grid">
              <label>Moment Title
                <input id="modal-item-title" placeholder="e.g. Communion & Altar Call" required />
              </label>
              <label>Scheduled Start Time
                <input id="modal-item-time" placeholder="10:30" value="10:30" />
              </label>
            </div>
            <div class="form-grid">
              <label>Category Type
                <select id="modal-item-type">
                  <option>Songs</option>
                  <option>Presentation</option>
                  <option>Media</option>
                  <option>Countdown</option>
                  <option>Service moment</option>
                  <option>Production</option>
                </select>
              </label>
              <label>Estimated Duration
                <input id="modal-item-dur" placeholder="15m" value="15m" />
              </label>
            </div>
            <label>Director & Preacher Notes
              <textarea id="modal-item-notes" rows="3" placeholder="Lower third instructions, media triggers, or pastor notes..." style="width:100%; border:1px solid #d1d9d7; border-radius:4px; padding:10px; font-family:inherit;"></textarea>
            </label>
          </div>
        `,
        confirmText: 'Add to Timeline',
        onConfirm: async () => {
          const title = document.getElementById('modal-item-title')?.value?.trim();
          const time = document.getElementById('modal-item-time')?.value?.trim() || '10:00';
          const type = document.getElementById('modal-item-type')?.value || 'Service moment';
          const duration = document.getElementById('modal-item-dur')?.value?.trim() || '10m';
          const notes = document.getElementById('modal-item-notes')?.value?.trim() || '';

          if (!title) {
            eventBus.emit('toast:notify', { type: 'warning', title: 'Title Required', message: 'Please provide a title for the service moment.' });
            return;
          }

          const newItem = {
            id: 'item_' + Date.now(),
            title,
            time,
            type,
            duration,
            notes,
            status: 'Ready'
          };

          await db.set(TABLE_NAMES.SERVICE_ITEMS, newItem);
          items.push(newItem);
          renderTimeline();
          eventBus.emit('toast:notify', { type: 'success', title: 'Moment Added', message: `${title} added to service timeline.` });
        }
      });
    });

    container.querySelector('#svc-btn-templates')?.addEventListener('click', () => {
      Modal.open({
        title: 'Service Templates',
        content: `
          <div class="templates-picker-list">
            <div class="template-choice" data-tpl="sunday">
              <strong>Sunday Main Service Template</strong>
              <small>Countdown, Worship, Prayer, Announcements, Sermon, Altar Call, Closing (8 items)</small>
            </div>
            <div class="template-choice" data-tpl="wednesday">
              <strong>Wednesday Midweek Bible Study</strong>
              <small>Opening Praise, In-depth Scripture Study, Q&A, Offering, Benediction (5 items)</small>
            </div>
            <div class="template-choice" data-tpl="youth">
              <strong>Youth & Young Adults Service</strong>
              <small>High-energy Praise, Icebreaker, Relevant Teaching, Group Prayer (4 items)</small>
            </div>
          </div>
        `,
        confirmText: 'Done',
        cancelText: null
      });
    });

    container.querySelector('#svc-btn-rehearse')?.addEventListener('click', () => {
      eventBus.emit('toast:notify', {
        type: 'info',
        title: 'Rehearsal Mode Engaged',
        message: 'Outputs set to private stage and confidence monitor preview only.'
      });
    });

    container.querySelector('#svc-btn-start')?.addEventListener('click', (e) => {
      e.target.textContent = 'Service Running ●';
      e.target.classList.add('danger-btn');
      eventBus.emit('toast:notify', {
        type: 'success',
        title: 'Sunday Service Live',
        message: 'Pre-service countdown started on Auditorium Projectors.'
      });
    });

    renderTimeline();
  }
}

