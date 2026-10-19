/**
 * KERYX AI Presentation Builder
 * Automatically drafts complete sermon presentation decks from topics, scriptures, and homiletic points.
 */

import { presentationStore } from '../../stores/presentationStore.js';
import { appStore } from '../../stores/appStore.js';
import { db } from '../../database/db.js';
import { TABLE_NAMES } from '../../database/schema.js';
import { Modal } from '../../components/modal.js';
import { eventBus } from '../../core/eventBus.js';

export class AIPresentationBuilder {
  static open() {
    const { church } = appStore.getState();

    const formHtml = `
      <div class="ai-pres-builder-modal">
        <div class="ai-builder-intro">
          <div class="builder-icon">✳</div>
          <div>
            <strong>AI Sermon Deck Architect</strong>
            <p>Generate an 8-slide broadcast presentation deck with scripture anchors, sermon points, and stage notes.</p>
          </div>
        </div>

        <div class="form-grid" style="margin-top:16px;">
          <label>Sermon Topic / Title
            <input id="builder-topic" placeholder="e.g. Walking By Faith In Difficult Seasons" value="Walking By Faith In Difficult Seasons" required />
          </label>
          <label>Preacher Name
            <input id="builder-preacher" placeholder="Preacher Name" value="${church.pastor}" required />
          </label>
        </div>

        <div class="form-grid">
          <label>Anchor Scripture References (Comma-separated)
            <input id="builder-scriptures" placeholder="e.g. Romans 8:28, Hebrews 11:1, 2 Corinthians 5:7" value="Romans 8:28, Hebrews 11:1, 2 Corinthians 5:7" required />
          </label>
          <label>Visual Theme Mode
            <select id="builder-theme">
              <option value="dark-broadcast" selected>Swiss Broadcast Dark (LED Wall Optimized)</option>
              <option value="radiant-gold">Radiant Amber & Charcoal</option>
              <option value="deep-sapphire">Deep Sapphire Sanctuary</option>
            </select>
          </label>
        </div>

        <label>Primary Homiletic Focus & Subtitle
          <input id="builder-focus" placeholder="e.g. Anchoring your soul when circumstances shake" value="Anchoring your soul when circumstances shake" />
        </label>
      </div>
    `;

    Modal.open({
      title: 'AI Presentation Generator',
      content: formHtml,
      confirmText: 'Generate Deck ✳',
      width: '640px',
      onConfirm: async () => {
        const topic = document.getElementById('builder-topic')?.value?.trim() || 'Walking By Faith';
        const preacher = document.getElementById('builder-preacher')?.value?.trim() || church.pastor;
        const scriptures = document.getElementById('builder-scriptures')?.value?.trim() || 'Romans 8:28, Hebrews 11:1';
        const theme = document.getElementById('builder-theme')?.value || 'dark-broadcast';
        const focus = document.getElementById('builder-focus')?.value?.trim() || 'A message of unwavering trust';

        await this.generateDeck({ topic, preacher, scriptures, theme, focus });
      }
    });
  }

  static async generateDeck({ topic, preacher, scriptures, theme, focus }) {
    const scripList = scriptures.split(',').map((s) => s.trim());
    const primaryRef = scripList[0] || 'Romans 8:28';
    const secondaryRef = scripList[1] || 'Hebrews 11:1';

    // Query local DB for authentic scripture text if available
    const allVerses = await db.getAll(TABLE_NAMES.BIBLE_VERSES);
    const v1 = allVerses.find((v) => v.reference.toLowerCase() === primaryRef.toLowerCase()) || {
      reference: primaryRef,
      text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.'
    };
    const v2 = allVerses.find((v) => v.reference.toLowerCase() === secondaryRef.toLowerCase()) || {
      reference: secondaryRef,
      text: 'Now faith is the assurance of things hoped for, proof of things not seen.'
    };

    const bgColors = {
      'dark-broadcast': { base: '#101a1e', point: '#141e24', accent: '#df654e' },
      'radiant-gold': { base: '#1b1712', point: '#261f18', accent: '#c7913e' },
      'deep-sapphire': { base: '#0e1724', point: '#142033', accent: '#3b82f6' }
    }[theme] || { base: '#101a1e', point: '#141e24', accent: '#df654e' };

    const slides = [
      {
        id: 'slide_ai_1',
        title: 'Title Slide',
        type: 'title',
        bgType: 'color',
        bgColor: bgColors.base,
        elements: [
          { type: 'eyebrow', text: 'SUNDAY SERVICE TEACHING' },
          { type: 'heading', text: topic },
          { type: 'subheading', text: `Pastor ${preacher} · ${focus}` }
        ],
        notes: `Opening welcome. Acknowledge worship and introduce the theme: ${topic}.`
      },
      {
        id: 'slide_ai_2',
        title: `${v1.reference} Foundation`,
        type: 'scripture',
        bgType: 'color',
        bgColor: bgColors.base,
        elements: [
          { type: 'reference', text: `${v1.reference} (WEB)` },
          { type: 'quote', text: v1.text }
        ],
        notes: 'Read passage slowly. Have the congregation recite aloud together.'
      },
      {
        id: 'slide_ai_3',
        title: 'Point 1',
        type: 'point',
        bgType: 'color',
        bgColor: bgColors.point,
        elements: [
          { type: 'pointNumber', text: '01' },
          { type: 'heading', text: 'Crisis Reveals What Anchors Your Soul' },
          { type: 'body', text: 'Difficulty does not create weakness; it reveals where your security has been resting.' }
        ],
        notes: 'Illustrate with personal testimony. Remind congregation that storms cannot shake what is anchored in Christ.'
      },
      {
        id: 'slide_ai_4',
        title: `${v2.reference} Anchor`,
        type: 'scripture',
        bgType: 'color',
        bgColor: bgColors.base,
        elements: [
          { type: 'reference', text: `${v2.reference} (WEB)` },
          { type: 'quote', text: v2.text }
        ],
        notes: 'Unpack the definition of biblical faith: title deed and evidence.'
      },
      {
        id: 'slide_ai_5',
        title: 'Point 2',
        type: 'point',
        bgType: 'color',
        bgColor: bgColors.point,
        elements: [
          { type: 'pointNumber', text: '02' },
          { type: 'heading', text: 'Faith Demands Active Obedience' },
          { type: 'body', text: 'Belief is never passive. Biblical trust moves forward before the Jordan waters part.' }
        ],
        notes: 'Call for deliberate spiritual commitment.'
      },
      {
        id: 'slide_ai_6',
        title: 'Point 3',
        type: 'point',
        bgType: 'color',
        bgColor: bgColors.point,
        elements: [
          { type: 'pointNumber', text: '03' },
          { type: 'heading', text: 'God Weaves Hardship Into Purpose' },
          { type: 'body', text: 'Nothing is wasted in the Father’s kingdom. Pain is transformed into ministry and endurance.' }
        ],
        notes: 'Minister to individuals going through grief, loss, or hardship.'
      },
      {
        id: 'slide_ai_7',
        title: 'Key Reflection Quote',
        type: 'quote',
        bgType: 'color',
        bgColor: bgColors.base,
        elements: [
          { type: 'eyebrow', text: 'CORE TRUTH' },
          { type: 'quote', text: 'When circumstance shakes, the Cornerstone remains eternally fixed.' }
        ],
        notes: 'Allow moments of silent prayer and reflection.'
      },
      {
        id: 'slide_ai_8',
        title: 'Altar Call & Prayer',
        type: 'callToAction',
        bgType: 'color',
        bgColor: bgColors.base,
        elements: [
          { type: 'heading', text: 'Lord, Increase Our Faith.' },
          { type: 'body', text: 'Altar Prayer Teams Ready · Step forward in faith today.' }
        ],
        notes: 'Signal worship team to begin soft altar instrumental.'
      }
    ];

    const newDeck = {
      id: 'pres_' + Date.now(),
      title: topic,
      speaker: preacher,
      aspectRatio: '16:9',
      theme,
      slides
    };

    presentationStore.currentPresentation = newDeck;
    presentationStore.activeSlideIndex = 0;
    presentationStore.notify();
    presentationStore.previewSlide(slides[0]);

    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'AI Presentation Generated',
      message: `Created 8-slide presentation deck: "${topic}" with stage notes.`
    });

    eventBus.emit('view:refresh');
  }
}

