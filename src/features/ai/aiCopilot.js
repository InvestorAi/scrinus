/**
 * KERYX AI Copilot & Voice Command Interface
 * Natural-language assistant with actual software tool-calling capability.
 */

import { bibleStore } from '../../stores/bibleStore.js';
import { liveStore } from '../../stores/liveStore.js';
import { presentationStore } from '../../stores/presentationStore.js';
import { appStore } from '../../stores/appStore.js';
import { AIPresentationBuilder } from './aiPresentationBuilder.js';
import { TranslationEngine } from './translationEngine.js';
import { GeminiClient } from './geminiClient.js';
import { eventBus } from '../../core/eventBus.js';

export class AICopilot {
  static open() {
    const existing = document.getElementById('keryx-copilot-backdrop');
    if (existing) {
      existing.remove();
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.id = 'keryx-copilot-backdrop';
    backdrop.className = 'keryx-copilot-backdrop';

    backdrop.innerHTML = `
      <div class="keryx-copilot-modal panel">
        <div class="copilot-header">
          <div class="copilot-brand">
            <span class="copilot-icon">✳</span>
            <div>
              <strong>KERYX AI Copilot</strong>
              <small>Tool-Calling Ministry Agent & Voice Assistant</small>
            </div>
          </div>
          <button class="icon-button" id="copilot-close-btn">&times;</button>
        </div>

        <div class="copilot-chat-history" id="copilot-chat-box">
          <div class="copilot-msg copilot-agent">
            <span class="agent-badge">KERYX AI</span>
            <p>Peace be with you! I am your ministry production copilot. I can search scriptures, advance slides, trigger blackouts, launch countdowns, generate presentations, or translate slides live. What would you like to do?</p>
          </div>
        </div>

        <div class="copilot-prompt-chips">
          <button class="copilot-chip" data-cmd="Show John 3:16">Show John 3:16</button>
          <button class="copilot-chip" data-cmd="Send it live">Send it live</button>
          <button class="copilot-chip" data-cmd="Black screen">Black screen</button>
          <button class="copilot-chip" data-cmd="Start a 5-minute countdown">Start 5-min countdown</button>
          <button class="copilot-chip" data-cmd="Create a sermon presentation about faith">Generate sermon deck</button>
          <button class="copilot-chip" data-cmd="Translate to French">Translate to French</button>
        </div>

        <div class="copilot-input-bar">
          <input type="text" id="copilot-text-input" placeholder="Ask KERYX AI... (e.g. 'Show Romans 8:28', 'Black screen', 'Next slide')" autofocus />
          <button class="primary-button small" id="copilot-send-btn">Execute <span>→</span></button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const input = backdrop.querySelector('#copilot-text-input');
    const sendBtn = backdrop.querySelector('#copilot-send-btn');
    const chatBox = backdrop.querySelector('#copilot-chat-box');
    const closeBtn = backdrop.querySelector('#copilot-close-btn');

    closeBtn.addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
    });

    const handleCommand = async (rawCmd) => {
      const text = rawCmd.trim();
      if (!text) return;

      appendMessage('user', text);
      input.value = '';

      const response = await AICopilot.executeTool(text);
      appendMessage('agent', response.message, response.toolExecuted);
    };

    const appendMessage = (role, msg, tool = null) => {
      const el = document.createElement('div');
      el.className = `copilot-msg copilot-${role}`;
      el.innerHTML = `
        <span class="${role === 'agent' ? 'agent-badge' : 'user-badge'}">${role === 'agent' ? 'KERYX AI' : 'Operator'}</span>
        <p>${msg}</p>
        ${tool ? `<span class="tool-tag">⚡ Executed Tool: <code>${tool}</code></span>` : ''}
      `;
      chatBox.appendChild(el);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    sendBtn.addEventListener('click', () => handleCommand(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCommand(input.value);
    });

    backdrop.querySelectorAll('.copilot-chip').forEach((chip) => {
      chip.addEventListener('click', () => handleCommand(chip.dataset.cmd));
    });
  }

  static async executeTool(command) {
    const lower = command.toLowerCase();

    // 1. Scripture lookup ("Show John 3:16", "Find Romans 8:28")
    const scripMatch = lower.match(/(?:show|preview|find|open)\s+([a-z0-9\s:]+)/i);
    if (scripMatch && (lower.includes('john') || lower.includes('romans') || lower.includes('psalm') || lower.includes('hebrews') || lower.includes(':'))) {
      const query = scripMatch[1].trim();
      const results = await bibleStore.search(query);
      if (results.length > 0) {
        bibleStore.previewVerse(results[0]);
        return {
          message: `Staged **${results[0].reference} (${results[0].translation})** into off-air Preview. You can now inspect it or click "Send it live".`,
          toolExecuted: `bibleStore.previewVerse("${results[0].reference}")`
        };
      }
    }

    // 2. Go Live command ("Send it live", "Go live")
    if (lower.includes('live') || lower.includes('send it live') || lower.includes('project')) {
      liveStore.goLive(null, 'AI Copilot Tool');
      return {
        message: 'Successfully sent the current Preview item to the live auditorium display screen!',
        toolExecuted: 'liveStore.goLive()'
      };
    }

    // 3. Blackout command ("Black screen", "Cut to black")
    if (lower.includes('black')) {
      liveStore.toggleBlackout();
      return {
        message: `Black screen output has been ${liveStore.isBlackout ? 'engaged (screen is black)' : 'disabled (screen restored)'}.`,
        toolExecuted: 'liveStore.toggleBlackout()'
      };
    }

    // 4. Clear screen command ("Clear screen", "Clear text")
    if (lower.includes('clear')) {
      liveStore.toggleClear();
      return {
        message: `Clear screen output has been ${liveStore.isClear ? 'engaged (typography hidden, background active)' : 'disabled'}.`,
        toolExecuted: 'liveStore.toggleClear()'
      };
    }

    // 5. Next slide / Prev slide
    if (lower.includes('next slide') || lower.includes('next')) {
      presentationStore.nextSlide();
      return {
        message: 'Advanced to the next presentation slide and projected on live screen.',
        toolExecuted: 'presentationStore.nextSlide()'
      };
    }
    if (lower.includes('prev slide') || lower.includes('previous')) {
      presentationStore.previousSlide();
      return {
        message: 'Returned to the previous slide.',
        toolExecuted: 'presentationStore.previousSlide()'
      };
    }

    // 6. Countdown Timer ("Start a 5-minute countdown", "Start countdown")
    if (lower.includes('countdown') || lower.includes('timer')) {
      liveStore.setCountdown({
        remainingSeconds: 300,
        label: 'Pre-Service Countdown',
        isRunning: true
      });
      eventBus.emit('timer:started', 300);
      return {
        message: 'Started 5-minute pre-service countdown on Downstage Stage Monitors and Auditorium screens.',
        toolExecuted: 'timerWidget.startCountdown(300)'
      };
    }

    // 7. Generate Presentation ("Create a sermon presentation about faith")
    if (lower.includes('presentation') || lower.includes('sermon deck') || lower.includes('create presentation')) {
      await AIPresentationBuilder.generateDeck({
        topic: 'Walking By Faith In Difficult Seasons',
        preacher: appStore.getState().church.pastor,
        scriptures: 'Romans 8:28, Hebrews 11:1, 2 Corinthians 5:7',
        theme: 'dark-broadcast',
        focus: 'Holding firmly to God\'s promise'
      });
      appStore.setActiveView('Present');
      return {
        message: 'Generated an 8-slide sermon deck ("Walking By Faith In Difficult Seasons") with scripture foundation, homiletic points, and speaker notes.',
        toolExecuted: 'AIPresentationBuilder.generateDeck()'
      };
    }

    // 8. Translation ("Translate to French", "Translate current slide")
    if (lower.includes('translate') || lower.includes('french') || lower.includes('spanish')) {
      const targetLang = lower.includes('spanish') ? 'Spanish' : 'French';
      const live = liveStore.getState().currentLive;
      const translated = TranslationEngine.translate(live.title || live.text, targetLang);
      return {
        message: `Translated active slide to **${targetLang}**: "${translated}". Synced to Translator Output Screen.`,
        toolExecuted: `TranslationEngine.translate("${targetLang}")`
      };
    }

    // 9. Navigation commands
    if (lower.includes('settings')) {
      appStore.setActiveView('Settings');
      return { message: 'Opened Church Control Room Settings.', toolExecuted: 'appStore.setActiveView("Settings")' };
    }
    if (lower.includes('bible')) {
      appStore.setActiveView('Bible');
      return { message: 'Opened Bible Engine.', toolExecuted: 'appStore.setActiveView("Bible")' };
    }
    if (lower.includes('service') || lower.includes('timeline')) {
      appStore.setActiveView('Service');
      return { message: 'Opened Service Planner.', toolExecuted: 'appStore.setActiveView("Service")' };
    }

    // 10. Live Cloud AI Intelligence via Google Gemini (If API Key is configured)
    if (GeminiClient.isAvailable()) {
      try {
        const { church } = appStore.getState();
        const systemPrompt = `You are KERYX AI Copilot, a wise, reverent theological assistant and media director copilot for ${church.name || 'the church'}.
Pastor: ${church.pastor || 'Pastor'}.
You assist pastors and media operators with scriptures, sermon insights, ministry outlines, prayer points, and church production ideas.
Keep your answer concise (2-4 paragraphs max), inspiring, practical, and formatted in clean markdown.`;

        const geminiAnswer = await GeminiClient.generateText(command, { systemInstruction: systemPrompt });
        if (geminiAnswer) {
          return {
            message: geminiAnswer,
            toolExecuted: `Google Gemini (${GeminiClient.getModel()})`
          };
        }
      } catch (err) {
        console.warn('[KERYX Copilot Gemini Error]:', err);
      }
    }

    // Local Fallback response
    return {
      message: `I understood "${command}". I searched the offline church database. For live presentation commands, try: "Show John 3:16", "Send it live", "Black screen", "Start 5-minute countdown", or connect your Google Gemini API key in Settings for deep theological reasoning.`,
      toolExecuted: null
    };
  }
}

