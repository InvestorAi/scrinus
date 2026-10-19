/**
 * KERYX Church Profile & Multi-Campus View
 * Church administration, branding colors, campus management, and organizational settings.
 */

import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';
import { Modal } from '../../components/modal.js';

export class ChurchView {
  static render() {
    const { church } = appStore.getState();

    return `
      <section class="page church-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">ORGANIZATION WORKSPACE</span>
            <h1>Church & Campus Management</h1>
            <p class="subheading">Configure your church identity, leadership profile, multi-campus locations, and visual branding tokens.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button" id="church-btn-save">
              Save Church Profile <span>✓</span>
            </button>
          </div>
        </div>

        <div class="church-grid">
          <!-- Left Column: Church Profile Form -->
          <div class="church-form-panel panel">
            <div class="panel-header">
              <span class="eyebrow">CHURCH PROFILE</span>
              <h3>General Information</h3>
            </div>

            <div class="church-form-content">
              <div class="form-grid">
                <label>Church Legal / Ministry Name
                  <input id="ch-name" value="${church.name}" />
                </label>
                <label>Senior Pastor / Primary Leader
                  <input id="ch-pastor" value="${church.pastor}" />
                </label>
              </div>

              <div class="form-grid">
                <label>Official Email
                  <input id="ch-email" type="email" value="${church.email}" />
                </label>
                <label>Phone Number
                  <input id="ch-phone" value="${church.phone}" />
                </label>
              </div>

              <div class="form-grid">
                <label>City & State
                  <input id="ch-city" value="${church.city}" />
                </label>
                <label>Country
                  <input id="ch-country" value="${church.country}" />
                </label>
              </div>

              <div class="form-grid">
                <label>Website
                  <input id="ch-website" value="${church.website}" />
                </label>
                <label>Default Timezone
                  <select id="ch-timezone">
                    <option selected>${church.timezone}</option>
                    <option>West Africa Time (WAT)</option>
                    <option>Greenwich Mean Time (GMT)</option>
                    <option>Eastern Time (ET)</option>
                    <option>Central Time (CT)</option>
                  </select>
                </label>
              </div>

              <div class="form-grid">
                <label>Primary Language
                  <select id="ch-language">
                    <option selected>${church.language}</option>
                    <option>English</option>
                    <option>French</option>
                    <option>Portuguese</option>
                    <option>Spanish</option>
                  </select>
                </label>
                <label>Default Bible Translation
                  <select id="ch-translation">
                    <option selected>${church.bibleTranslation}</option>
                    <option>World English Bible (WEB)</option>
                    <option>King James Version (KJV)</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <!-- Right Column: Multi-Campus & Branding Tokens -->
          <div class="church-sidebar-panel">
            <!-- Campuses Panel -->
            <div class="panel campuses-panel">
              <div class="panel-header">
                <div>
                  <span class="eyebrow">MULTI-CAMPUS SITES</span>
                  <h3>Campuses (${church.campuses.length})</h3>
                </div>
                <button class="primary-button small" id="ch-btn-add-campus"><span>＋</span> Add Campus</button>
              </div>

              <div class="campuses-list" id="campuses-list">
                ${church.campuses
                  .map(
                    (c, idx) => `
                  <div class="campus-card">
                    <div class="campus-icon">🏛</div>
                    <div class="campus-info">
                      <strong>${c.name}</strong>
                      <small>${c.address}</small>
                    </div>
                    ${idx === 0 ? '<span class="status-pill online">Primary</span>' : ''}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Branding Tokens -->
            <div class="panel branding-panel">
              <div class="panel-header">
                <span class="eyebrow">VISUAL IDENTITY</span>
                <h3>Brand Colors</h3>
              </div>
              <div class="branding-swatches">
                <label>Primary Accent
                  <div class="color-picker-row">
                    <input type="color" id="brand-color-primary" value="${church.branding.primaryColor}" />
                    <span>${church.branding.primaryColor}</span>
                  </div>
                </label>
                <label>Broadcast Dark Base
                  <div class="color-picker-row">
                    <input type="color" id="brand-color-sec" value="${church.branding.secondaryColor}" />
                    <span>${church.branding.secondaryColor}</span>
                  </div>
                </label>
                <label>Screen Watermark / Lower Third Prefix
                  <input id="brand-watermark" value="${church.branding.watermark}" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    container.querySelector('#church-btn-save')?.addEventListener('click', () => {
      const name = container.querySelector('#ch-name').value;
      const pastor = container.querySelector('#ch-pastor').value;
      const email = container.querySelector('#ch-email').value;
      const phone = container.querySelector('#ch-phone').value;
      const city = container.querySelector('#ch-city').value;
      const country = container.querySelector('#ch-country').value;
      const website = container.querySelector('#ch-website').value;
      const timezone = container.querySelector('#ch-timezone').value;
      const language = container.querySelector('#ch-language').value;
      const bibleTranslation = container.querySelector('#ch-translation').value;
      const primaryColor = container.querySelector('#brand-color-primary').value;
      const secondaryColor = container.querySelector('#brand-color-sec').value;
      const watermark = container.querySelector('#brand-watermark').value;

      appStore.setChurch({
        name,
        pastor,
        email,
        phone,
        city,
        country,
        website,
        timezone,
        language,
        bibleTranslation,
        branding: {
          primaryColor,
          secondaryColor,
          watermark
        }
      });
    });

    container.querySelector('#ch-btn-add-campus')?.addEventListener('click', () => {
      Modal.open({
        title: 'Add New Campus',
        content: `
          <div class="form-grid">
            <label>Campus Name
              <input id="modal-campus-name" placeholder="e.g. North Campus / Satellite" required />
            </label>
            <label>Location / Address
              <input id="modal-campus-addr" placeholder="City or Street Address" required />
            </label>
          </div>
        `,
        confirmText: 'Add Campus',
        onConfirm: () => {
          const cName = document.getElementById('modal-campus-name')?.value?.trim();
          const cAddr = document.getElementById('modal-campus-addr')?.value?.trim();
          if (!cName) return;

          const current = appStore.getState().church;
          const updated = [...current.campuses, { id: 'campus_' + Date.now(), name: cName, address: cAddr || 'Satellite' }];
          appStore.setChurch({ campuses: updated });
          eventBus.emit('view:refresh');
        }
      });
    });
  }
}

