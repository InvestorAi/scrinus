/**
 * KERYX Church Marketplace & Plugin Ecosystem View
 * Downloadable broadcast themes, 4K motion loops, worship set packs, and AI models.
 */

import { eventBus } from '../../core/eventBus.js';

const MARKETPLACE_PACKS = [
  {
    id: 'pack_1',
    title: 'Radiant Amber Swiss Theme',
    category: 'Themes',
    author: 'KERYX Design Lab',
    size: '14 MB',
    desc: 'High-contrast warm amber & charcoal design system optimized for high-brightness LED sanctuary walls.',
    installed: true,
    badge: 'INSTALLED'
  },
  {
    id: 'pack_2',
    title: 'Deep Sapphire Sanctuary Motion Pack',
    category: 'Motion Graphics',
    author: 'Sanctuary Media Co.',
    size: '420 MB',
    desc: 'Seamless 60 FPS looping abstract sapphire nebula and particles for worship backgrounds.',
    installed: false,
    badge: 'FREE'
  },
  {
    id: 'pack_3',
    title: 'African Languages Translation Pack',
    category: 'Language Packs',
    author: 'KERYX Global Ministry',
    size: '48 MB',
    desc: 'Theological dictionary and scripture translation packs for Yoruba, Igbo, Hausa, and Swahili.',
    installed: true,
    badge: 'INSTALLED'
  },
  {
    id: 'pack_4',
    title: 'Hymns of the Ages (1,000 Songs)',
    category: 'Worship Packs',
    author: 'Church Heritage Project',
    size: '18 MB',
    desc: 'Complete public domain hymnal with verses, choruses, authors, CCLI data, and sheet music notes.',
    installed: false,
    badge: 'FREE'
  },
  {
    id: 'pack_5',
    title: 'OBS & vMix Lower Thirds Bundle',
    category: 'Overlays',
    author: 'Broadcast Studio Pro',
    size: '64 MB',
    desc: 'Alpha-channel transparent motion graphics lower thirds for pastor names, scriptures, and sermon titles.',
    installed: false,
    badge: 'FREE'
  }
];

export class MarketplaceView {
  static render() {
    return `
      <section class="page marketplace-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">CHURCH EXTENSIONS & ASSETS</span>
            <h1>Church Marketplace & Plugin Packs</h1>
            <p class="subheading">Enhance your sanctuary productions with curated themes, 4K motion loops, language packs, and hymnals.</p>
          </div>
        </div>

        <div class="marketplace-grid">
          ${MARKETPLACE_PACKS.map(
            (p) => `
            <div class="marketplace-card panel" data-id="${p.id}">
              <div class="pack-top">
                <span class="pack-category">${p.category.toUpperCase()}</span>
                <span class="pack-badge ${p.installed ? 'installed' : ''}">${p.badge}</span>
              </div>
              <h3 class="pack-title">${p.title}</h3>
              <small class="pack-author">By ${p.author} · ${p.size}</small>
              <p class="pack-desc">${p.desc}</p>
              <div class="pack-actions">
                <button class="primary-button small btn-install-pack ${p.installed ? 'installed-btn' : ''}" data-id="${p.id}">
                  ${p.installed ? 'Installed ✓' : 'Install Pack ↓'}
                </button>
              </div>
            </div>
          `
          ).join('')}
        </div>
      </section>
    `;
  }

  static attachEvents(container) {
    container.querySelectorAll('.btn-install-pack').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const pack = MARKETPLACE_PACKS.find((p) => p.id === id);
        if (pack) {
          pack.installed = true;
          pack.badge = 'INSTALLED';
          btn.textContent = 'Installed ✓';
          btn.classList.add('installed-btn');
          eventBus.emit('toast:notify', {
            type: 'success',
            title: 'Pack Installed',
            message: `${pack.title} downloaded and added to your local library.`
          });
        }
      });
    });
  }
}

