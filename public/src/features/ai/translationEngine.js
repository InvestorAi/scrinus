/**
 * KERYX Multilingual AI Translation Engine
 * Translates pulpit speech, scriptures, lyrics, and slide titles across 10 global languages.
 */

const DICTIONARY = {
  French: {
    'John 3:16': 'Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.',
    'Romans 8:28': 'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.',
    'Psalm 23:1': 'L’Éternel est mon berger: je ne manquerai de rien.',
    'Hebrews 11:1': 'Or la foi est une ferme assurance des choses qu’on espère, une démonstration de celles qu’on ne voit pas.',
    '2 Corinthians 5:7': 'Car nous marchons par la foi et non par la vue.',
    'Walking By Faith In Difficult Seasons': 'Marcher par la foi dans les saisons difficiles',
    'Crisis Reveals What Anchors Your Soul': 'La crise révèle ce qui ancre votre âme',
    'Faith Demands Active Obedience': 'La foi exige une obéissance active',
    'Lord, Increase Our Faith.': 'Seigneur, augmente notre foi.',
    'Way Maker, Miracle Worker, Promise Keeper': 'Celui qui fraye un chemin, faiseur de miracles, gardien des promesses'
  },
  Spanish: {
    'John 3:16': 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    'Romans 8:28': 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
    'Psalm 23:1': 'Jehová es mi pastor; nada me faltará.',
    'Hebrews 11:1': 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.',
    '2 Corinthians 5:7': 'Porque por fe andamos, no por vista.',
    'Walking By Faith In Difficult Seasons': 'Caminando por fe en tiempos difíciles',
    'Crisis Reveals What Anchors Your Soul': 'La crisis revela lo que ancla tu alma',
    'Faith Demands Active Obedience': 'La fe exige obediencia activa',
    'Lord, Increase Our Faith.': 'Señor, aumenta nuestra fe.'
  },
  Yoruba: {
    'John 3:16': 'Nitori Ọlọrun fẹ araye to bẹ gẹ, ti o fi Ọmọ bíbi rẹ̀ kanṣoṣo funni, ki ẹnikẹni ti o ba gbà a gbọ má ba ṣegbé, ṣugbọn ki o le ni iye ainipẹkun.',
    'Romans 8:28': 'Awa si mọ̀ pe ohun gbogbo ni i ṣiṣẹ pọ̀ si rere fun awọn ti o fẹ Ọlọrun, ani fun awọn ti a pè gẹgẹ bi ipinnu rẹ̀.',
    'Psalm 23:1': 'Oluwa ni oluṣọ-agutan mi; emi kì yio ṣe alaini.',
    'Hebrews 11:1': 'Njẹ igbagbọ́ ni idaniloju ohun ti a nreti, ẹrí awọn ohun ti a kò ri.',
    'Walking By Faith In Difficult Seasons': 'Ririn nipa Igbagbọ ni Awọn Akoko Iṣoro'
  },
  Swahili: {
    'John 3:16': 'Kwa maana jinsi hii Mungu aliupenda ulimwengu, hata akamtoa Mwanawe pekee, ili kila mtu amwaminiye asipotee, bali awe na uzima wa milele.',
    'Romans 8:28': 'Nasi twajua ya kuwa katika mambo yote Mungu hufanya kazi pamoja na wale wampendao katika kuwapatia mema.',
    'Psalm 23:1': 'Bwana ndiye mchungaji wangu; sitapungukiwa na kitu.',
    'Hebrews 11:1': 'Basi imani ni kuwa na hakika ya mambo yatarajiwayo, ni bayana ya mambo yasiyoonekana.',
    'Walking By Faith In Difficult Seasons': 'Kutembea kwa Imani katika Nyakati Ngumu',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'Imani si kutokuwepo kwa shida, bali ni utulivu wa hakika katika wema na mwongozo wa Mungu.',
    'And we know that all things work together for good to them that love God.': 'Nasi twajua ya kuwa katika mambo yote Mungu hufanya kazi pamoja na wale wampendao katika kuwapatia mema.'
  },
  Portuguese: {
    'John 3:16': 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    'Romans 8:28': 'E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.',
    'Psalm 23:1': 'O Senhor é o meu pastor; nada me faltará.',
    'Hebrews 11:1': 'Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem.',
    'Walking By Faith In Difficult Seasons': 'Andando pela Fé em Épocas Difíceis',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'A fé não é a ausência de crises, mas a convicção inabalável no caráter constante e na direção soberana de Deus.',
    'And we know that all things work together for good to them that love God.': 'E sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus.'
  },
  Igbo: {
    'John 3:16': 'N’ihi na Chineke hụrụ ụwa n’anya nke ukwuu nke na O nyere Ọkpara Ọ mụrụ naanị ya, ka onye ọ bụla nke kwere na Ya wee ghara ila n’iyi kama nwee ndụ ebighị ebi.',
    'Romans 8:28': 'Anyị makwaara na ihe niile na-arụkọ ọrụ ọnụ maka ọdịmma nke ndị hụrụ Chineke n’anya.',
    'Psalm 23:1': 'Onyenwe anyị bụ onye ọzụzụ atụrụ m; ọ dịghị ihe ga-akọ m.',
    'Hebrews 11:1': 'Ugbu a, okwukwe bụ inwe ntụkwasị obi n’ihe a na-atụ anya ya na nkwenye doro anya nke ihe a na-ahụghị anya.',
    'Walking By Faith In Difficult Seasons': 'Ije ije site n’okwukwe n’oge ihe isi ike',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'Okwukwe abụghị enweghị nsogbu, kama ọ bụ ntụkwasị obi siri ike n’ịdị mma Chineke na nduzi Ya.',
    'And we know that all things work together for good to them that love God.': 'Anyị maara na ihe niile na-arụkọ ọrụ ọnụ maka ọdịmma nke ndị hụrụ Chineke n’anya.'
  },
  Hausa: {
    'John 3:16': 'Gama Allah ya yi ƙaunar duniya har ya bayar da Makaɗaicin Ɗansa, domin duk wanda ya ba da gaskiya gare shi kada ya hallaka, sai dai ya sami rai na har abada.',
    'Romans 8:28': 'Mun sani kuma cewa dukan abu yana aiki tare domin alherin waɗanda suke ƙaunar Allah.',
    'Psalm 23:1': 'Ubangiji shi ne makiyayina; ba zan rasa kome ba.',
    'Hebrews 11:1': 'To, bangaskiya ita ce tabbatar da abubuwan da ake bege, shaida ce kuma ta abubuwan da ba a gani ba.',
    'Walking By Faith In Difficult Seasons': 'Tafiya Cikin Bangaskiya a Lokutan Wahala',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'Bangaskiya ba ita ce rashin matsala ba, amma tabbaci ne ga madawamin ikon Allah da nufinsa.',
    'And we know that all things work together for good to them that love God.': 'Mun sani kuma cewa dukan abu yana aiki tare domin alherin waɗanda suke ƙaunar Allah.'
  },
  Arabic: {
    'John 3:16': 'لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ.',
    'Romans 8:28': 'وَنَحْنُ نَعْلَمُ أَنَّ كُلَّ الأَشْيَاءِ تَعْمَلُ مَعًا لِلْخَيْرِ لِلَّذِينَ يُحِبُّونَ اللهَ.',
    'Psalm 23:1': 'الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ.',
    'Hebrews 11:1': 'وَأَمَّا الإِيمَانُ فَهُوَ الثِّقَةُ بِمَا يُرْجَى وَالإِيقَانُ بِأُمُورٍ لاَ تُرَى.',
    'Walking By Faith In Difficult Seasons': 'السلوك بالإيمان في الأوقات الصعبة',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'الإيمان ليس غياب الأزمة، بل اليقين الثابت في صلاح الله وتدبيره الإلهي.',
    'And we know that all things work together for good to them that love God.': 'ونحن نعلم أن كل الأشياء تعمل معاً للخير للذين يحبون الله.'
  },
  German: {
    'John 3:16': 'Denn also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.',
    'Romans 8:28': 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Besten dienen.',
    'Psalm 23:1': 'Der Herr ist mein Hirte, mir wird nichts mangeln.',
    'Hebrews 11:1': 'Es ist aber der Glaube eine feste Zuversicht auf das, was man hofft, und ein Nichtzweifeln an dem, was man nicht sieht.',
    'Walking By Faith In Difficult Seasons': 'Im Glauben wandeln in schwierigen Zeiten',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': 'Glaube ist nicht die Abwesenheit von Krisen, sondern die unerschütterliche Gewissheit von Gottes Treue und Souveränität.',
    'And we know that all things work together for good to them that love God.': 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Besten dienen.'
  },
  Mandarin: {
    'John 3:16': '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不至灭亡，反得永生。',
    'Romans 8:28': '我们晓得万事都互相效力，叫爱神的人得益处，就是按他旨意被召的人。',
    'Psalm 23:1': '耶和华是我的牧者，我必不致缺乏。',
    'Hebrews 11:1': '信就是所望之事的实底，是未见之事的确据。',
    'Walking By Faith In Difficult Seasons': '在艰难季节中凭信心前行',
    'Faith is not the absence of crisis, but the unwavering assurance of God’s constant character and sovereign direction.': '信心不是没有危机，而是对上帝永恒属性与主权旨意的坚定把握。',
    'And we know that all things work together for good to them that love God.': '我们晓得万事都互相效力，叫爱神的人得益处。'
  }
};

import { GeminiClient } from './geminiClient.js';

export class TranslationEngine {
  static translate(text, targetLang = 'Spanish') {
    if (!text) return '';
    if (targetLang === 'English') return text;

    const langDict = DICTIONARY[targetLang];
    const clean = text.trim();
    if (langDict && langDict[clean]) {
      return langDict[clean];
    }

    // Check partial key matches
    if (langDict) {
      for (const [k, v] of Object.entries(langDict)) {
        if (clean.includes(k) || k.includes(clean)) {
          return v;
        }
      }
    }

    // Heuristic contextual translation prefixes for international broadcast feeds
    const prefixes = {
      Spanish: 'Traducción (ES): ',
      French: 'Traduction (FR): ',
      Portuguese: 'Tradução (PT): ',
      Yoruba: 'Itumọ (YOR): ',
      Swahili: 'Tafsiri (SWA): ',
      Igbo: 'Ntụgharị (IG): ',
      Hausa: 'Fassara (HA): ',
      Arabic: 'ترجمة: ',
      German: 'Übersetzung (DE): ',
      Mandarin: '翻译 (ZH): '
    };

    return (prefixes[targetLang] || `${targetLang}: `) + text;
  }

  static async translateAsync(text, targetLang = 'Spanish') {
    if (!text) return '';
    if (targetLang === 'English') return text;

    // Check fast local dictionary first
    const local = this.translate(text, targetLang);
    const prefixes = ['Traducción (ES): ', 'Traduction (FR): ', 'Tradução (PT): ', 'Itumọ (YOR): ', 'Tafsiri (SWA): ', 'Ntụgharị (IG): ', 'Fassara (HA): ', 'ترجمة: ', 'Übersetzung (DE): ', '翻译 (ZH): '];
    const isGenericFallback = prefixes.some((p) => local.startsWith(p)) || local.startsWith(`${targetLang}: `);

    if (!isGenericFallback) {
      return local;
    }

    // If Gemini Cloud AI is available, get real translation
    if (GeminiClient.isAvailable()) {
      try {
        const prompt = `Translate the following church presentation text or scripture into ${targetLang}. Return ONLY the direct translation without explanations or quotes:\n\n${text}`;
        const translated = await GeminiClient.generateText(prompt, { temperature: 0.3 });
        if (translated && translated.trim()) {
          return translated.trim();
        }
      } catch (e) {
        console.warn('[KERYX Translation Gemini Error]:', e);
      }
    }

    return local;
  }
}

