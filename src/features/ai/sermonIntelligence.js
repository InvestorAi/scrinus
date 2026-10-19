/**
 * KERYX Sermon Intelligence Engine
 * Automated notes, summaries, content repurposing (social, devotional), and multi-format exports.
 */

import { aiStore } from '../../stores/aiStore.js';
import { appStore } from '../../stores/appStore.js';
import { eventBus } from '../../core/eventBus.js';
import { GeminiClient } from './geminiClient.js';

export class SermonIntelligence {
  static generateNotes(transcriptSegments) {
    const texts = (transcriptSegments || [])
      .map((s) => (s.text || '').trim())
      .filter(Boolean);

    if (texts.length === 0) {
      return [
        {
          id: 'note_ai_1',
          category: 'Core Thesis',
          content: 'Awaiting sermon speech... Speak into the microphone or type to generate dynamic pulpit notes in real time.'
        },
        {
          id: 'note_ai_2',
          category: 'Anchor Scriptures',
          content: 'Scriptures referenced by the preacher will be automatically detected and anchored here.'
        },
        {
          id: 'note_ai_3',
          category: 'Practical Application',
          content: 'Actionable steps and ministry applications will populate as the message develops.'
        },
        {
          id: 'note_ai_4',
          category: 'Reflection Question',
          content: 'Congregational discussion and personal reflection prompts will generate automatically.'
        }
      ];
    }

    const raw = texts.join(' ');
    const lower = raw.toLowerCase();

    // Dynamically detect spoken scriptures across the transcript
    const scriptureRegex = /\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s*Samuel|2\s*Samuel|1\s*Kings|2\s*Kings|1\s*Chronicles|2\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s*Corinthians|2\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s*Thessalonians|2\s*Thessalonians|1\s*Timothy|2\s*Timothy|Titus|Philemon|Hebrews|James|1\s*Peter|2\s*Peter|1\s*John|2\s*John|3\s*John|Jude|Revelation)\s+\d+(?::\d+)?\b/gi;
    const detectedScriptures = [...new Set(raw.match(scriptureRegex) || [])];

    // Find questions asked by preacher
    const spokenQuestion = texts.find((t) => t.includes('?') || /\b(how can|why do|who is|where are|what is|how do)\b/i.test(t));
    const leadQuote = texts[texts.length - 1] || 'Walking in divine purpose';

    // Dynamic Core Thesis from actual speech
    let coreThesis = `Preached message: "${leadQuote}" — Aligning heart and mind with God's Word brings steadfast faith and supernatural breakthrough.`;
    if (texts.length > 2) {
      coreThesis = `Core Thesis: "${texts[0]}" connects with "${leadQuote}". The Word of God equips the believer to stand firm in faith, cultivate spiritual maturity, and fulfill divine calling.`;
    }

    // Anchor Scriptures list
    const anchorScriptures = detectedScriptures.length > 0
      ? detectedScriptures.join('; ')
      : (aiStore.detectedScriptures?.[0]?.reference || 'Romans 8:28, Psalm 23:1');

    // 3. Dynamic Practical Application based on sermon content
    let practicalApp = 'Actively apply the preached word this week: meditate on the referenced scriptures, align daily choices with biblical truth, and pray for wisdom to walk in victory.';
    if (lower.includes('pray') || lower.includes('intercession')) {
      practicalApp = 'Establish an intentional daily rhythm of prayer and communion with the Holy Spirit.';
    } else if (lower.includes('love') || lower.includes('forgive')) {
      practicalApp = 'Extend Christlike grace and forgiveness to those in your sphere of influence this week.';
    } else if (lower.includes('give') || lower.includes('steward')) {
      practicalApp = 'Practice faithful financial stewardship and covenant giving with a cheerful heart.';
    }

    // 4. Reflection Question
    let reflectionQuestion = spokenQuestion
      ? `Pulpit Question: "${spokenQuestion.trim()}" — How is the Holy Spirit prompting you to respond to this truth?`
      : 'What specific area of your life is God calling you to surrender to His Word today?';

    const notes = [
      { id: 'note_ai_thesis', category: 'Core Thesis', content: coreThesis },
      { id: 'note_ai_anchors', category: 'Anchor Scriptures', content: anchorScriptures }
    ];

    // Extract outline points & specific ministerial declarations from spoken segments
    const extractedPoints = [];
    texts.forEach((t, idx) => {
      const tLower = t.toLowerCase();
      // Numbered or designated outline points
      if (/\b(point\s+(?:one|two|three|four|five|\d+)|number\s+(?:one|two|three|four|five|\d+)|firstly|secondly|thirdly|first key|second key|third key|principle is|remember that|lesson is)\b/i.test(tLower)) {
        extractedPoints.push({
          id: `note_pt_${idx}`,
          category: 'Key Sermon Point',
          content: t
        });
      }
      // Prophetic declarations
      else if (/\b(i declare|i prophesy|in the name of jesus|god is releasing|let there be|no weapon formed|amen)\b/i.test(tLower)) {
        extractedPoints.push({
          id: `note_dec_${idx}`,
          category: 'Prophetic Declaration',
          content: t
        });
      }
    });

    // If no explicit numbered points were detected, pick the most recent substantive speech segments as pulpit notes
    if (extractedPoints.length === 0 && texts.length > 0) {
      texts.slice(-3).forEach((t, idx) => {
        if (t.length >= 20 && !t.includes('?')) {
          extractedPoints.push({
            id: `note_insight_${idx}`,
            category: `Pulpit Note ${idx + 1}`,
            content: t
          });
        }
      });
    }

    // Add extracted points (up to 4 items)
    extractedPoints.slice(0, 4).forEach((pt) => notes.push(pt));

    // Add Application & Reflection Question
    notes.push({ id: 'note_ai_app', category: 'Practical Application', content: practicalApp });
    notes.push({ id: 'note_ai_question', category: 'Reflection Question', content: reflectionQuestion });

    return notes;
  }

  static generateSummary(transcriptSegments) {
    const texts = (transcriptSegments || [])
      .map((s) => (s.text || '').trim())
      .filter(Boolean);

    if (texts.length === 0) {
      return {
        title: 'Sunday Worship Service',
        oneLiner: 'Live pulpit audio stream active. Summary will generate dynamically as the preacher ministers.',
        detailed: 'Awaiting sermon audio. The AI intelligence engine automatically synthesizes themes, scripture references, and key pulpit points in real time.',
        keyPoints: [
          'Microphone stream connected to AI intelligence engine.',
          'Pulpit speech is analyzed continuously in real time.',
          'Notes, takeaways, and scripture anchors generate dynamically.'
        ]
      };
    }

    const raw = texts.join(' ');
    const firstSentence = texts[0] || 'Walking in Divine Purpose';
    const lastQuote = texts[texts.length - 1];

    // Dynamic title from spoken topic
    let title = 'Walking in Divine Purpose & Covenant Victory';
    if (texts.length > 0 && texts[0].length < 70) {
      title = texts[0].replace(/[.!?]+$/, '');
    }

    // Dynamic one-liner
    const oneLiner = lastQuote
      ? `"${lastQuote}" — A timely message anchoring the congregation in biblical truth and active faith.`
      : 'A transformative message establishing that God works all things together for the eternal purpose of His people.';

    // Detailed synthesis
    const detailed = `In this message, the preacher ministered from the Word of God, highlighting biblical principles and practical applications for daily Christian living. Drawing upon scripture, the congregation was encouraged to stand firm in faith, trust God's sovereign leading, and walk in covenant obedience.`;

    // Key points extracted from transcript
    const keyPoints = texts.slice(0, 4).map((t, i) => `${i + 1}. ${t}`);
    if (keyPoints.length < 3) {
      keyPoints.push('Faith requires active trust and obedience to God’s calling.');
      keyPoints.push('God orchestrates every season of life for His glory and our growth.');
    }

    return {
      title,
      oneLiner,
      detailed,
      keyPoints
    };
  }

  /**
   * Asynchronous Cloud AI Sermon Synthesis via Google Gemini
   */
  static async generateSummaryWithGemini(transcriptSegments) {
    const texts = (transcriptSegments || []).map((s) => s.text?.trim()).filter(Boolean);
    if (texts.length === 0) return this.generateSummary([]);

    if (!GeminiClient.isAvailable()) {
      return this.generateSummary(transcriptSegments);
    }

    const raw = texts.join('\n');
    const prompt = `You are a professional Christian theological research assistant and church media director.
Analyze this live sermon transcript:

---
${raw.slice(-4000)}
---

Generate a JSON object with:
{
  "title": "Inspiring, theological 3-6 word sermon title",
  "oneLiner": "One powerful summary quote or thesis (under 25 words)",
  "detailed": "3-4 sentence pastoral synthesis of what was taught and how it applies",
  "keyPoints": ["3-5 clear, impactful homiletical bullet points"]
}
Return ONLY valid JSON.`;

    try {
      const responseText = await GeminiClient.generateText(prompt, { temperature: 0.4 });
      if (responseText) {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.title && parsed.keyPoints) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[KERYX Sermon Intelligence Gemini Warning]:', e);
    }

    return this.generateSummary(transcriptSegments);
  }

  static generateRepurposedContent(sermonTitle, pastorName) {
    return {
      facebook: `📖 "We know that all things work together for good for those who love God." (Romans 8:28)\n\nIn this Sunday's message, ${pastorName} reminded us that God never wastes a season of hardship. Whatever bridge you are walking across, take comfort knowing your steps are established in His love.\n\nCatch the full teaching at church this week or on the KERYX broadcast replay! #WalkingByFaith #SundaySermon #GraceCityChurch`,

      instagram: `When the circumstance shakes, the Cornerstone remains fixed. ⚓️\n\n3 Truths from Sunday’s Word:\n1️⃣ Crisis does not negate God’s goodness.\n2️⃣ Faith is assurance, not wishful thinking.\n3️⃣ The Shepherd leads you through, not around, the valley.\n\nDrop a "AMEN" if you are choosing faith over fear today! ✨\n\n#FaithOverFear #ChurchOnline #Romans828 #DailyGrace`,

      carousel: [
        { slide: 1, text: 'WHAT TO REMEMBER WHEN SEASONS GET TOUGH' },
        { slide: 2, text: 'Point 1: God is working behind the scenes even when you cannot see it.' },
        { slide: 3, text: 'Point 2: Assurance is anchored in His promise, not your feelings.' },
        { slide: 4, text: 'Scripture: Romans 8:28 & Psalm 23:1' },
        { slide: 5, text: 'Save & share this reminder with someone who needs strength today.' }
      ],

      shortsScript: `[Hook: 0-3s] Did you know that difficulty in your life isn't proof that God left you?\n\n[Body: 3-30s] Pastor ${pastorName} taught this Sunday that Romans 8:28 doesn't say all things ARE good. It says God WORKS all things together FOR good. That means the painful chapters are still being woven into His master plan.\n\n[Call to Action: 30-45s] Hold on to your faith today. Like and subscribe for more daily encouragement!`,

      whatsapp: `🌿 *Weekly Pastoral Devotional — Walking By Faith*\n\nBeloved church family,\n\nAs we begin this week, remember Hebrews 11:1: "Now faith is the assurance of things hoped for, proof of things not seen."\n\n*Prayer Focus for Today:*\nLord, strengthen my heart. When things feel uncertain, teach me to walk by faith and not by sight. I declare Your goodness in my home, my work, and my family.\n\nHave a blessed week in His peace! 🙏`,

      prayerPoints: [
        'Pray for families undergoing medical or financial strain to experience supernatural peace.',
        'Pray for the Holy Spirit to illuminate Romans 8:28 in the hearts of young believers.',
        'Pray for our city and community to encounter the reality of Christ\'s love.'
      ]
    };
  }

  static exportAsMarkdown() {
    const { church } = appStore.getState();
    const { summary, notes, transcriptSegments, detectedScriptures } = aiStore.getState();

    let md = `# SERMON INTELLIGENCE REPORT\n\n`;
    md += `**Church:** ${church?.name || 'Grace City Community Church'}\n`;
    md += `**Preacher:** Pastor ${church?.pastor || 'Godswill Johnson'}\n`;
    md += `**Date:** ${new Date().toLocaleDateString()}\n`;
    md += `**Sermon Title:** ${summary.title || 'Walking By Faith In Difficult Seasons'}\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary\n\n${summary.detailed || ''}\n\n`;
    if (summary.keyPoints && summary.keyPoints.length > 0) {
      md += `### Key Takeaways:\n`;
      summary.keyPoints.forEach(kp => {
        md += `- ${kp}\n`;
      });
      md += `\n`;
    }

    md += `## 2. Key Sermon Points & Action Notes\n\n`;
    const liveNotes = this.generateNotes(transcriptSegments);
    const activeNotes = liveNotes.length > 0 ? liveNotes : notes;
    activeNotes.forEach((n, i) => {
      md += `### ${i + 1}. ${n.category.toUpperCase()}\n${n.content}\n\n`;
    });

    md += `## 3. Detected Scriptures\n\n`;
    detectedScriptures.forEach((d) => {
      md += `- **${d.reference}** (${d.translation}) — *${d.type}* (${d.confidence}% confidence)\n  > "${d.text}"\n\n`;
    });

    md += `## 4. Verbatim Pulpit Transcript\n\n`;
    transcriptSegments.forEach((s) => {
      md += `**[${s.timestamp}] ${s.speaker}:** ${s.text}\n\n`;
    });

    md += `---\n*Generated by KERYX AI Ministry OS*\n`;
    return md;
  }

  static exportAsPlainText() {
    return this.exportAsMarkdown().replace(/#/g, '').replace(/\*\*/g, '').replace(/>/g, '');
  }

  static downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    eventBus.emit('toast:notify', {
      type: 'success',
      title: 'Export Downloaded',
      message: `Saved ${filename} to your device.`
    });
  }

  static printReport() {
    const win = window.open('', 'KeryxSermonPrint', 'width=800,height=900');
    if (!win) return;
    const content = this.exportAsMarkdown().replace(/\n/g, '<br/>');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sermon Notes Export - KERYX</title>
        <style>
          body { font-family: 'Georgia', serif; line-height: 1.6; padding: 40px; color: #111; }
          h1, h2, h3 { font-family: 'Helvetica Neue', sans-serif; }
          hr { border: 0; border-top: 1px solid #ccc; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div>${content}</div>
        <script>
          window.onload = () => { window.print(); };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }
}

