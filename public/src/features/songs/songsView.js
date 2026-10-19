/**
 * KERYX Song Library & Lyric Advancement View
 * Worship songs, structured sections (Verse, Chorus, Bridge), and live lyric broadcast.
 */

import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { liveStore } from '../../stores/liveStore.js';
import { eventBus } from '../../core/eventBus.js';
import { Modal } from '../../components/modal.js';

export class SongsView {
  static render() {
    return `
      <section class="page songs-page">
        <div class="page-heading">
          <div>
            <span class="eyebrow">WORSHIP PRESENTATION</span>
            <h1>Song Library & Lyrics</h1>
            <p class="subheading">Manage praise and worship lyrics structured by Verse, Chorus, Bridge, and Ending. Advance lyrics live during service.</p>
          </div>
          <div class="heading-actions">
            <button class="primary-button" id="btn-create-song">
              <span>＋</span> Add New Song
            </button>
            <button class="secondary-button" id="btn-song-setlist">
              Build Worship Setlist
            </button>
          </div>
        </div>

        <div class="songs-workspace-grid">
          <!-- Left Column: Song List & Filter -->
          <div class="songs-list-panel panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">CHURCH REPERTOIRE</span>
                <h3>Songs</h3>
              </div>
              <span class="offline-label"><i></i> Cached Offline</span>
            </div>

            <div class="song-search-wrap">
              <input type="text" id="song-search-input" placeholder="Search by title, artist, or lyric phrase..." />
            </div>

            <div class="songs-catalog" id="songs-catalog-list">
              <div class="loading-state">Loading songs...</div>
            </div>
          </div>

          <!-- Right Column: Active Song Lyric Staging & Advancement -->
          <div class="song-stager-panel panel">
            <div class="panel-header" id="active-song-header">
              <div>
                <span class="eyebrow">ACTIVE WORSHIP SELECTION</span>
                <h2 id="active-song-title">Way Maker</h2>
                <small id="active-song-artist">Sinach · Key: E · 68 BPM</small>
              </div>
              <div class="heading-actions">
                <button class="secondary-button small" id="btn-active-song-preview">Preview First Verse</button>
                <button class="primary-button small" id="btn-active-song-live">Go Live <span>→</span></button>
              </div>
            </div>

            <div class="song-sections-flow" id="song-sections-container">
              <div class="loading-state">Loading sections...</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  static async attachEvents(container) {
    const catalogList = container.querySelector('#songs-catalog-list');
    const sectionsContainer = container.querySelector('#song-sections-container');
    const searchInput = container.querySelector('#song-search-input');

    let allSongs = await db.getAll(TABLE_NAMES.SONGS);
    let currentSong = allSongs[0] || null;
    let activeSectionIndex = 0;

    const renderSections = () => {
      if (!currentSong) {
        sectionsContainer.innerHTML = '<div class="empty-state-notice">Select or add a song to begin.</div>';
        return;
      }

      container.querySelector('#active-song-title').textContent = currentSong.title;
      container.querySelector('#active-song-artist').textContent = `${currentSong.artist || 'Unknown'} · Key: ${currentSong.key || 'C'} · ${currentSong.tempo || '70 BPM'}`;

      sectionsContainer.innerHTML = currentSong.sections
        .map(
          (sec, idx) => `
        <div class="lyric-section-card ${idx === activeSectionIndex ? 'active-section' : ''}" data-idx="${idx}">
          <div class="lyric-section-tag">
            <span class="section-type ${sec.type}">${sec.name}</span>
            <kbd>${idx + 1}</kbd>
          </div>
          <div class="lyric-lines">${sec.lyrics.replace(/\n/g, '<br />')}</div>
          <div class="lyric-actions">
            <button class="secondary-button small sec-btn-preview">Preview</button>
            <button class="primary-button small sec-btn-live">Go Live <span>→</span></button>
          </div>
        </div>
      `
        )
        .join('');

      sectionsContainer.querySelectorAll('.lyric-section-card').forEach((card) => {
        const idx = parseInt(card.dataset.idx, 10);
        const sec = currentSong.sections[idx];

        card.addEventListener('click', (e) => {
          if (e.target.tagName.toLowerCase() === 'button') return;
          activeSectionIndex = idx;
          renderSections();
          sendSectionToPreview(sec);
        });

        card.querySelector('.sec-btn-preview')?.addEventListener('click', () => {
          activeSectionIndex = idx;
          renderSections();
          sendSectionToPreview(sec);
        });

        card.querySelector('.sec-btn-live')?.addEventListener('click', () => {
          activeSectionIndex = idx;
          renderSections();
          sendSectionToLive(sec);
        });
      });
    };

    const sendSectionToPreview = (sec) => {
      liveStore.setPreview({
        type: 'lyrics',
        title: `${currentSong.title} — ${sec.name}`,
        subtitle: `${currentSong.artist} · Worship`,
        text: sec.lyrics,
        speakerNotes: `Section: ${sec.name} (${currentSong.key})`
      }, 'Song Stager');
    };

    const sendSectionToLive = (sec) => {
      liveStore.goLive({
        type: 'lyrics',
        title: `${currentSong.title} — ${sec.name}`,
        subtitle: `${currentSong.artist} · Worship`,
        text: sec.lyrics,
        speakerNotes: `Section: ${sec.name} (${currentSong.key})`
      }, 'Song Stager');
    };

    const renderCatalog = (filter = '') => {
      const lower = filter.toLowerCase();
      const filtered = allSongs.filter(
        (s) => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower)
      );

      if (filtered.length === 0) {
        catalogList.innerHTML = '<div class="empty-state-notice">No songs matching query.</div>';
        return;
      }

      catalogList.innerHTML = filtered
        .map(
          (s) => `
        <div class="song-item-row ${currentSong && currentSong.id === s.id ? 'selected' : ''}" data-id="${s.id}">
          <div class="song-icon">♫</div>
          <div class="song-item-info">
            <strong>${s.title}</strong>
            <small>${s.artist} · ${s.sections.length} sections</small>
          </div>
          <span class="song-key-badge">${s.key || 'C'}</span>
        </div>
      `
        )
        .join('');

      catalogList.querySelectorAll('.song-item-row').forEach((row) => {
        row.addEventListener('click', () => {
          const id = row.dataset.id;
          currentSong = allSongs.find((s) => s.id === id);
          activeSectionIndex = 0;
          renderCatalog(searchInput ? searchInput.value : '');
          renderSections();
        });
      });
    };

    searchInput?.addEventListener('input', (e) => {
      renderCatalog(e.target.value);
    });

    container.querySelector('#btn-active-song-preview')?.addEventListener('click', () => {
      if (currentSong && currentSong.sections[0]) {
        sendSectionToPreview(currentSong.sections[0]);
      }
    });

    container.querySelector('#btn-active-song-live')?.addEventListener('click', () => {
      if (currentSong && currentSong.sections[activeSectionIndex]) {
        sendSectionToLive(currentSong.sections[activeSectionIndex]);
      }
    });

    container.querySelector('#btn-create-song')?.addEventListener('click', () => {
      Modal.open({
        title: 'Add Worship Song',
        content: `
          <div class="song-create-form">
            <div class="form-grid">
              <label>Song Title
                <input id="modal-song-title" placeholder="e.g. Build My Life" required />
              </label>
              <label>Artist / Collective
                <input id="modal-song-artist" placeholder="e.g. Housefires / Pat Barrett" required />
              </label>
            </div>
            <div class="form-grid">
              <label>Musical Key
                <input id="modal-song-key" placeholder="e.g. D" value="D" />
              </label>
              <label>Tempo / BPM
                <input id="modal-song-bpm" placeholder="e.g. 68 BPM" value="68 BPM" />
              </label>
            </div>
            <label>Verse 1 Lyrics
              <textarea id="modal-song-v1" rows="3" placeholder="Worthy of every song we could ever sing..." style="width:100%; border:1px solid #d1d9d7; border-radius:4px; padding:10px; font-family:inherit;"></textarea>
            </label>
            <label>Chorus Lyrics
              <textarea id="modal-song-ch" rows="3" placeholder="Holy, there is no one like You..." style="width:100%; border:1px solid #d1d9d7; border-radius:4px; padding:10px; font-family:inherit;"></textarea>
            </label>
          </div>
        `,
        confirmText: 'Save Song',
        onConfirm: async () => {
          const title = document.getElementById('modal-song-title')?.value?.trim();
          const artist = document.getElementById('modal-song-artist')?.value?.trim();
          const key = document.getElementById('modal-song-key')?.value?.trim() || 'C';
          const tempo = document.getElementById('modal-song-bpm')?.value?.trim() || '70 BPM';
          const v1 = document.getElementById('modal-song-v1')?.value?.trim();
          const ch = document.getElementById('modal-song-ch')?.value?.trim();

          if (!title) {
            eventBus.emit('toast:notify', { type: 'warning', title: 'Title Required', message: 'Please enter a song title.' });
            return;
          }

          const sections = [];
          if (v1) sections.push({ id: 'sec_' + Date.now() + '_1', name: 'Verse 1', type: 'verse', lyrics: v1 });
          if (ch) sections.push({ id: 'sec_' + Date.now() + '_2', name: 'Chorus', type: 'chorus', lyrics: ch });
          if (sections.length === 0) {
            sections.push({ id: 'sec_' + Date.now() + '_1', name: 'Verse 1', type: 'verse', lyrics: 'Enter lyrics here...' });
          }

          const newSong = {
            id: 'song_' + Date.now(),
            title,
            artist: artist || 'Church Worship Team',
            key,
            tempo,
            tags: ['Worship'],
            sections
          };

          await db.set(TABLE_NAMES.SONGS, newSong);
          allSongs.push(newSong);
          currentSong = newSong;
          activeSectionIndex = 0;
          renderCatalog();
          renderSections();
          eventBus.emit('toast:notify', { type: 'success', title: 'Song Added', message: `${title} added to library.` });
        }
      });
    });

    renderCatalog();
    renderSections();
  }
}

