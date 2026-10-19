/**
 * KERYX Media Asset Library View
 * Management of motion graphics, video loops, images, and presentation backgrounds.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';

const SEED_MEDIA = [
  { id: 'med_1', name: 'Deep Nebula Motion Background', type: 'video', category: 'Backgrounds', resolution: '3840x2160 (4K)', size: '42 MB', url: '', color: '#16222f' },
  { id: 'med_2', name: 'Golden Warm Particles Loop', type: 'video', category: 'Motion Graphics', resolution: '1920x1080 (HD)', size: '18 MB', url: '', color: '#2b2118' },
  { id: 'med_3', name: 'Grace City Official Logo High-Res', type: 'image', category: 'Logos', resolution: '2048x2048', size: '1.2 MB', url: '', color: '#11181c' },
  { id: 'med_4', name: 'Communion Bread & Cup Still', type: 'image', category: 'Backgrounds', resolution: '1920x1080', size: '3.4 MB', url: '', color: '#241a1c' },
  { id: 'med_5', name: 'Pre-Service Ambient Pad Instrumental', type: 'audio', category: 'Audio', duration: '12:45', size: '28 MB', url: '', color: '#142022' },
  { id: 'med_6', name: 'Weekly Church News Reel September', type: 'video', category: 'Videos', resolution: '1920x1080', size: '120 MB', url: '', color: '#19262b' }
];

export class MediaView {
  static render() {
    return `
      <section class="page media-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">BROADCAST ASSET REPOSITORY</span>
            <h1>Media Library</h1>
            <p class="subheading">Manage motion backgrounds, countdown videos, lower third graphics, and church branding assets.</p>
          </div>
          <div class="heading-actions">
            <label class="primary-button file-upload-button" style="cursor:pointer;">
              <span>＋</span> Import Media File
              <input type="file" id="media-file-input" multiple accept="image/*,video/*,audio/*" style="display:none;" />
            </label>
          </div>
        </div>

        <!-- Filter Category Tabs -->
        <div class="media-tabs-bar panel">
          <div class="media-category-tabs" id="media-category-tabs">
            <button class="media-tab active" data-cat="all">All Media</button>
            <button class="media-tab" data-cat="Backgrounds">Backgrounds</button>
            <button class="media-tab" data-cat="Motion Graphics">Motion Graphics</button>
            <button class="media-tab" data-cat="Videos">Videos</button>
            <button class="media-tab" data-cat="Logos">Logos</button>
            <button class="media-tab" data-cat="Audio">Audio</button>
          </div>
          <div class="media-search-wrap">
            <input type="text" id="media-search-input" placeholder="Search assets..." />
          </div>
        </div>

        <!-- Media Grid -->
        <div class="media-assets-grid" id="media-assets-container">
          <!-- Populated dynamically -->
        </div>
      </section>
    `;
  }

  static async attachEvents(container) {
    const grid = container.querySelector('#media-assets-container');
    const searchInput = container.querySelector('#media-search-input');
    const fileInput = container.querySelector('#media-file-input');

    let allMedia = await db.getAll(TABLE_NAMES.MEDIA_ASSETS);
    if (allMedia.length === 0) {
      for (const m of SEED_MEDIA) {
        await db.set(TABLE_NAMES.MEDIA_ASSETS, m);
      }
      allMedia = await db.getAll(TABLE_NAMES.MEDIA_ASSETS);
    }

    let activeCategory = 'all';

    const renderGrid = () => {
      const q = (searchInput ? searchInput.value : '').toLowerCase();
      const filtered = allMedia.filter((m) => {
        const matchesCat = activeCategory === 'all' || m.category === activeCategory;
        const matchesQ = m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q);
        return matchesCat && matchesQ;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state-notice">No media assets found in this category.</div>';
        return;
      }

      grid.innerHTML = filtered
        .map(
          (m) => `
        <div class="media-asset-card panel" data-id="${m.id}">
          <div class="media-thumbnail" style="background: ${m.color || '#1b2428'};">
            <span class="media-type-badge">${m.type.toUpperCase()}</span>
            <span class="media-icon">${m.type === 'video' ? '🎬' : m.type === 'audio' ? '🔊' : '🖼'}</span>
          </div>
          <div class="media-meta">
            <strong>${m.name}</strong>
            <small>${m.resolution || m.duration || 'Standard'} · ${m.size}</small>
          </div>
          <div class="media-card-actions">
            <button class="secondary-button small media-btn-preview">Preview</button>
            <button class="primary-button small media-btn-live">Go Live</button>
          </div>
        </div>
      `
        )
        .join('');

      grid.querySelectorAll('.media-asset-card').forEach((card) => {
        const id = card.dataset.id;
        const asset = allMedia.find((a) => a.id === id);
        if (!asset) return;

        card.querySelector('.media-btn-preview')?.addEventListener('click', () => {
          liveStore.setPreview({
            type: 'media',
            title: asset.name,
            subtitle: `${asset.category} · ${asset.type}`,
            text: `Media Asset: ${asset.name} (${asset.resolution || asset.duration})`,
            bgColor: asset.color
          }, 'Media Library');
        });

        card.querySelector('.media-btn-live')?.addEventListener('click', () => {
          liveStore.goLive({
            type: 'media',
            title: asset.name,
            subtitle: `${asset.category} · ${asset.type}`,
            text: `Media Asset: ${asset.name} (${asset.resolution || asset.duration})`,
            bgColor: asset.color
          }, 'Media Library');
        });
      });
    };

    container.querySelectorAll('.media-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.media-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.cat;
        renderGrid();
      });
    });

    searchInput?.addEventListener('input', () => renderGrid());

    fileInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      for (const file of files) {
        const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
        const newAsset = {
          id: 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          type,
          category: type === 'video' ? 'Motion Graphics' : 'Backgrounds',
          size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
          resolution: '1920x1080',
          color: '#1a272e'
        };
        await db.set(TABLE_NAMES.MEDIA_ASSETS, newAsset);
        allMedia.unshift(newAsset);
      }
      eventBus.emit('toast:notify', { type: 'success', title: 'Media Imported', message: `Imported ${files.length} asset(s) to local repository.` });
      renderGrid();
    });

    renderGrid();
  }
}

