/**
 * KERYX Seed Data
 * Authentic public-domain Bibles, structured worship songs, service templates, and output configurations.
 */

export const SEED_BIBLES = [
  {
    code: 'WEB',
    name: 'World English Bible',
    language: 'English',
    isDefault: true,
    copyright: 'Public Domain'
  },
  {
    code: 'KJV',
    name: 'King James Version',
    language: 'English',
    isDefault: false,
    copyright: 'Public Domain'
  }
];

export const SEED_VERSES = [
  // John
  {
    id: 'v_john_3_16',
    book: 'John',
    chapter: 3,
    verse: 16,
    reference: 'John 3:16',
    translation: 'WEB',
    text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.'
  },
  {
    id: 'v_john_3_17',
    book: 'John',
    chapter: 3,
    verse: 17,
    reference: 'John 3:17',
    translation: 'WEB',
    text: 'For God didn’t send his Son into the world to judge the world, but that the world should be saved through him.'
  },
  {
    id: 'v_john_1_1',
    book: 'John',
    chapter: 1,
    verse: 1,
    reference: 'John 1:1',
    translation: 'WEB',
    text: 'In the beginning was the Word, and the Word was with God, and the Word was God.'
  },
  {
    id: 'v_john_14_6',
    book: 'John',
    chapter: 14,
    verse: 6,
    reference: 'John 14:6',
    translation: 'WEB',
    text: 'Jesus said to him, "I am the way, the truth, and the life. No one comes to the Father, except through me."'
  },
  {
    id: 'v_john_10_10',
    book: 'John',
    chapter: 10,
    verse: 10,
    reference: 'John 10:10',
    translation: 'WEB',
    text: 'The thief only comes to steal, kill, and destroy. I came that they may have life, and may have it abundantly.'
  },

  // Romans
  {
    id: 'v_rom_8_28',
    book: 'Romans',
    chapter: 8,
    verse: 28,
    reference: 'Romans 8:28',
    translation: 'WEB',
    text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.'
  },
  {
    id: 'v_rom_8_31',
    book: 'Romans',
    chapter: 8,
    verse: 31,
    reference: 'Romans 8:31',
    translation: 'WEB',
    text: 'What then shall we say about these things? If God is for us, who can be against us?'
  },
  {
    id: 'v_rom_10_17',
    book: 'Romans',
    chapter: 10,
    verse: 17,
    reference: 'Romans 10:17',
    translation: 'WEB',
    text: 'So faith comes by hearing, and hearing by the word of God.'
  },
  {
    id: 'v_rom_12_1',
    book: 'Romans',
    chapter: 12,
    verse: 1,
    reference: 'Romans 12:1',
    translation: 'WEB',
    text: 'Therefore I urge you, brothers, by the mercies of God, to present your bodies a living sacrifice, holy, acceptable to God, which is your spiritual service.'
  },
  {
    id: 'v_rom_12_2',
    book: 'Romans',
    chapter: 12,
    verse: 2,
    reference: 'Romans 12:2',
    translation: 'WEB',
    text: 'Don’t be conformed to this world, but be transformed by the renewing of your mind, so that you may prove what is the good, well-pleasing, and perfect will of God.'
  },

  // Psalms
  {
    id: 'v_ps_23_1',
    book: 'Psalms',
    chapter: 23,
    verse: 1,
    reference: 'Psalm 23:1',
    translation: 'WEB',
    text: 'The Lord is my shepherd; I shall lack nothing.'
  },
  {
    id: 'v_ps_23_2',
    book: 'Psalms',
    chapter: 23,
    verse: 2,
    reference: 'Psalm 23:2',
    translation: 'WEB',
    text: 'He makes me lie down in green pastures. He leads me beside still waters.'
  },
  {
    id: 'v_ps_23_3',
    book: 'Psalms',
    chapter: 23,
    verse: 3,
    reference: 'Psalm 23:3',
    translation: 'WEB',
    text: 'He restores my soul. He guides me in the paths of righteousness for his name’s sake.'
  },
  {
    id: 'v_ps_23_4',
    book: 'Psalms',
    chapter: 23,
    verse: 4,
    reference: 'Psalm 23:4',
    translation: 'WEB',
    text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.'
  },
  {
    id: 'v_ps_91_1',
    book: 'Psalms',
    chapter: 91,
    verse: 1,
    reference: 'Psalm 91:1',
    translation: 'WEB',
    text: 'He who dwells in the secret place of the Most High will rest in the shadow of the Almighty.'
  },
  {
    id: 'v_ps_100_1',
    book: 'Psalms',
    chapter: 100,
    verse: 1,
    reference: 'Psalm 100:1',
    translation: 'WEB',
    text: 'Shout for joy to the Lord, all you lands!'
  },
  {
    id: 'v_ps_119_105',
    book: 'Psalms',
    chapter: 119,
    verse: 105,
    reference: 'Psalm 119:105',
    translation: 'WEB',
    text: 'Your word is a lamp to my feet, and a light for my path.'
  },

  // Isaiah
  {
    id: 'v_isa_40_31',
    book: 'Isaiah',
    chapter: 40,
    verse: 31,
    reference: 'Isaiah 40:31',
    translation: 'WEB',
    text: 'But those who wait for the Lord will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.'
  },
  {
    id: 'v_isa_41_10',
    book: 'Isaiah',
    chapter: 41,
    verse: 10,
    reference: 'Isaiah 41:10',
    translation: 'WEB',
    text: 'Don’t you be afraid, for I am with you. Don’t be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.'
  },

  // Hebrews
  {
    id: 'v_heb_11_1',
    book: 'Hebrews',
    chapter: 11,
    verse: 1,
    reference: 'Hebrews 11:1',
    translation: 'WEB',
    text: 'Now faith is the assurance of things hoped for, proof of things not seen.'
  },
  {
    id: 'v_heb_11_6',
    book: 'Hebrews',
    chapter: 11,
    verse: 6,
    reference: 'Hebrews 11:6',
    translation: 'WEB',
    text: 'Without faith it is impossible to be well pleasing to him, for he who comes to God must believe that he exists, and that he is a rewarder of those who seek him.'
  },
  {
    id: 'v_heb_12_2',
    book: 'Hebrews',
    chapter: 12,
    verse: 2,
    reference: 'Hebrews 12:2',
    translation: 'WEB',
    text: 'Looking to Jesus, the author and perfecter of faith, who for the joy that was set before him endured the cross, despising its shame, and has sat down at the right hand of the throne of God.'
  },

  // Philippians
  {
    id: 'v_phil_4_13',
    book: 'Philippians',
    chapter: 4,
    verse: 13,
    reference: 'Philippians 4:13',
    translation: 'WEB',
    text: 'I can do all things through Christ, who strengthens me.'
  },
  {
    id: 'v_phil_4_6',
    book: 'Philippians',
    chapter: 4,
    verse: 6,
    reference: 'Philippians 4:6',
    translation: 'WEB',
    text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.'
  },
  {
    id: 'v_phil_4_7',
    book: 'Philippians',
    chapter: 4,
    verse: 7,
    reference: 'Philippians 4:7',
    translation: 'WEB',
    text: 'And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.'
  },

  // 2 Corinthians
  {
    id: 'v_2cor_5_7',
    book: '2 Corinthians',
    chapter: 5,
    verse: 7,
    reference: '2 Corinthians 5:7',
    translation: 'WEB',
    text: 'For we walk by faith, not by sight.'
  },
  {
    id: 'v_2cor_12_9',
    book: '2 Corinthians',
    chapter: 12,
    verse: 9,
    reference: '2 Corinthians 12:9',
    translation: 'WEB',
    text: 'He has said to me, "My grace is sufficient for you, for my power is made perfect in weakness."'
  },

  // Proverbs
  {
    id: 'v_prov_3_5',
    book: 'Proverbs',
    chapter: 3,
    verse: 5,
    reference: 'Proverbs 3:5',
    translation: 'WEB',
    text: 'Trust in the Lord with all your heart, and don’t lean on your own understanding.'
  },
  {
    id: 'v_prov_3_6',
    book: 'Proverbs',
    chapter: 3,
    verse: 6,
    reference: 'Proverbs 3:6',
    translation: 'WEB',
    text: 'In all your ways acknowledge him, and he will make your paths straight.'
  },

  // Genesis
  {
    id: 'v_gen_1_1',
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    reference: 'Genesis 1:1',
    translation: 'WEB',
    text: 'In the beginning, God created the heavens and the earth.'
  },
  {
    id: 'v_gen_1_3',
    book: 'Genesis',
    chapter: 1,
    verse: 3,
    reference: 'Genesis 1:3',
    translation: 'WEB',
    text: 'God said, "Let there be light," and there was light.'
  },

  // Matthew
  {
    id: 'v_matt_6_33',
    book: 'Matthew',
    chapter: 6,
    verse: 33,
    reference: 'Matthew 6:33',
    translation: 'WEB',
    text: 'But seek first God’s Kingdom and his righteousness; and all these things will be given to you as well.'
  },
  {
    id: 'v_matt_28_19',
    book: 'Matthew',
    chapter: 28,
    verse: 19,
    reference: 'Matthew 28:19',
    translation: 'WEB',
    text: 'Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.'
  }
];

export const SEED_SONGS = [
  {
    id: 'song_way_maker',
    title: 'Way Maker',
    artist: 'Sinach',
    author: 'Osinachi Kalu Okoro Egbu',
    ccli: '7115744',
    key: 'E',
    tempo: '68 BPM',
    copyright: '© 2016 Sinach',
    tags: ['Worship', 'Praise', 'Faith', 'Miracles'],
    sections: [
      {
        id: 'sec_wm_v1',
        name: 'Verse 1',
        type: 'verse',
        lyrics: 'You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You'
      },
      {
        id: 'sec_wm_ch',
        name: 'Chorus',
        type: 'chorus',
        lyrics: 'Way Maker, Miracle Worker, Promise Keeper\nLight in the darkness, my God\nThat is who You are'
      },
      {
        id: 'sec_wm_v2',
        name: 'Verse 2',
        type: 'verse',
        lyrics: 'You are here, touching every heart\nI worship You, I worship You\nYou are here, healing every heart\nI worship You, I worship You'
      },
      {
        id: 'sec_wm_br',
        name: 'Bridge',
        type: 'bridge',
        lyrics: 'Even when I don\'t see it, You\'re working\nEven when I don\'t feel it, You\'re working\nYou never stop, You never stop working'
      },
      {
        id: 'sec_wm_end',
        name: 'Ending',
        type: 'ending',
        lyrics: 'That is who You are\nThat is who You are\nLord, that is who You are'
      }
    ]
  },
  {
    id: 'song_goodness_of_god',
    title: 'Goodness of God',
    artist: 'Bethel Music / Jenn Johnson',
    author: 'Jenn Johnson, Ed Cash, Jason Ingram, Ben Fielding, Brian Johnson',
    ccli: '7117726',
    key: 'Ab',
    tempo: '70 BPM',
    copyright: '© 2019 Bethel Music Publishing',
    tags: ['Faithfulness', 'Goodness', 'Grace', 'Worship'],
    sections: [
      {
        id: 'sec_gog_v1',
        name: 'Verse 1',
        type: 'verse',
        lyrics: 'I love You, Lord, for Your mercy never fails me\nAll my days, I\'ve been held in Your hands\nFrom the moment that I wake up until I lay my head\nOh, I will sing of the goodness of God'
      },
      {
        id: 'sec_gog_ch',
        name: 'Chorus',
        type: 'chorus',
        lyrics: 'And all my life You have been faithful\nAnd all my life You have been so, so good\nWith every breath that I am able\nOh, I will sing of the goodness of God'
      },
      {
        id: 'sec_gog_v2',
        name: 'Verse 2',
        type: 'verse',
        lyrics: 'I love Your voice, You have led me through the fire\nIn darkest night You are close like no other\nI\'ve known You as a Father, I\'ve known You as a Friend\nAnd I have lived in the goodness of God'
      },
      {
        id: 'sec_gog_br',
        name: 'Bridge',
        type: 'bridge',
        lyrics: '\'Cause Your goodness is running after, it\'s running after me\nYour goodness is running after, it\'s running after me\nWith my life laid down, I\'m surrendered now, I give You everything'
      }
    ]
  },
  {
    id: 'song_great_are_you_lord',
    title: 'Great Are You Lord',
    artist: 'All Sons & Daughters',
    author: 'David Leonard, Jason Ingram, Leslie Jordan',
    ccli: '6460220',
    key: 'A',
    tempo: '72 BPM',
    copyright: '© 2012 Integrity\'s Praise! Music',
    tags: ['Adoration', 'Praise', 'Exaltation'],
    sections: [
      {
        id: 'sec_gayl_v1',
        name: 'Verse 1',
        type: 'verse',
        lyrics: 'You give life, You are love\nYou bring light to the darkness\nYou give hope, You restore every heart that is broken\nAnd great are You, Lord'
      },
      {
        id: 'sec_gayl_ch',
        name: 'Chorus',
        type: 'chorus',
        lyrics: 'It\'s Your breath in our lungs\nSo we pour out our praise, we pour out our praise\nIt\'s Your breath in our lungs\nSo we pour out our praise to You only'
      },
      {
        id: 'sec_gayl_br',
        name: 'Bridge',
        type: 'bridge',
        lyrics: 'And all the earth will shout Your praise\nOur hearts will cry, these bones will sing\nGreat are You, Lord'
      }
    ]
  },
  {
    id: 'song_amazing_grace',
    title: 'Amazing Grace (My Chains Are Gone)',
    artist: 'Chris Tomlin',
    author: 'John Newton, Chris Tomlin, Louie Giglio',
    ccli: '4768436',
    key: 'F',
    tempo: '64 BPM',
    copyright: '© 2006 worshipogether.com songs',
    tags: ['Hymn', 'Salvation', 'Grace', 'Redemption'],
    sections: [
      {
        id: 'sec_ag_v1',
        name: 'Verse 1',
        type: 'verse',
        lyrics: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see'
      },
      {
        id: 'sec_ag_ch',
        name: 'Chorus',
        type: 'chorus',
        lyrics: 'My chains are gone, I\'ve been set free\nMy God, my Savior has ransomed me\nAnd like a flood His mercy reigns\nUnending love, amazing grace'
      },
      {
        id: 'sec_ag_v2',
        name: 'Verse 2',
        type: 'verse',
        lyrics: '\'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed'
      }
    ]
  }
];

export const SEED_CUSTOM_SCRIPTURES = [
  {
    id: 'custom_scrip_1',
    reference: 'Romans 8:28',
    translation: 'The Passion (TPT-Custom)',
    language: 'English',
    text: 'So we are convinced that every detail of our lives is continually woven together for good, for we are his lovers who have been called to fulfill his designed purpose.',
    copyright: 'Authorized church translation reference',
    tags: ['Faith', 'Comfort', 'Purpose'],
    notes: 'Used often by Senior Pastor during communion and altar calls.'
  },
  {
    id: 'custom_scrip_2',
    reference: 'Psalm 23:1-3',
    translation: 'Amplified Classic (AMPC-Custom)',
    language: 'English',
    text: 'The Lord is my Shepherd [to feed, guide, and shield me], I shall not lack. He makes me lie down in [fresh, tender] green pastures; He leads me beside the still and restful waters.',
    copyright: 'Church study excerpt',
    tags: ['Comfort', 'Peace', 'Protection'],
    notes: 'Key anchor verse for Sunday evening prayer vigil.'
  }
];

export const SEED_SERVICE_ITEMS = [
  { id: 'item_1', time: '09:00', title: 'Pre-Service Countdown', type: 'Countdown', duration: '5m', status: 'Ready', notes: 'Start precisely 5 minutes before service.' },
  { id: 'item_2', time: '09:05', title: 'Opening Prayer & Welcome', type: 'Service moment', duration: '5m', status: 'Ready', notes: 'Host pastor on platform.' },
  { id: 'item_3', time: '09:10', title: 'Praise & Worship Set', type: 'Songs', duration: '25m', status: 'Ready', notes: 'Songs: Way Maker, Great Are You Lord, Goodness of God.' },
  { id: 'item_4', time: '09:35', title: 'Pastoral Prayer & Intercession', type: 'Service moment', duration: '10m', status: 'Draft', notes: 'Lower third with prayer requests.' },
  { id: 'item_5', time: '09:45', title: 'Ministry Announcements & Offering', type: 'Media', duration: '15m', status: 'Ready', notes: 'Play weekly church news video reel.' },
  { id: 'item_6', time: '10:00', title: 'Sermon: Walking By Faith', type: 'Presentation', duration: '45m', status: 'Draft', notes: 'Scriptures: Romans 8:28, Hebrews 11:1, 2 Corinthians 5:7.' },
  { id: 'item_7', time: '10:45', title: 'Altar Call & Ministry Response', type: 'Songs', duration: '15m', status: 'Draft', notes: 'Soft instrumental worship.' },
  { id: 'item_8', time: '11:00', title: 'Benediction & Closing', type: 'Production', duration: '5m', status: 'Ready', notes: 'Display fellowship lobby announcements.' }
];

export const SEED_OUTPUT_SCREENS = [
  {
    id: 'out_main',
    name: 'Main Screen',
    role: 'Auditorium Projector / LED Wall',
    resolution: '1920x1080 (16:9)',
    activeContent: 'Scripture / Lyrics / Slides',
    status: 'Online',
    isPrimary: true
  },
  {
    id: 'out_stage',
    name: 'Stage Display',
    role: 'Confidence Downstage Monitor',
    resolution: '1920x1080 (16:9)',
    activeContent: 'Speaker Notes + Service Timer + Next Slide',
    status: 'Online',
    isPrimary: false
  },
  {
    id: 'out_lobby',
    name: 'Lobby & Overflow',
    role: 'Welcome Foyer Displays',
    resolution: '1920x1080 (16:9)',
    activeContent: 'Live Feed + Welcome Notices',
    status: 'Standby',
    isPrimary: false
  },
  {
    id: 'out_stream',
    name: 'Livestream Broadcast',
    role: 'OBS / NDI / Virtual Camera Feed',
    resolution: '1920x1080 (16:9)',
    activeContent: 'Alpha Channel Lower Thirds & Scripture Overlays',
    status: 'Ready',
    isPrimary: false
  }
];

export const SEED_PRESENTATION = {
  id: 'pres_walking_by_faith',
  title: 'Walking By Faith In Difficult Seasons',
  speaker: 'Senior Pastor',
  aspectRatio: '16:9',
  theme: 'dark-broadcast',
  slides: [
    {
      id: 'slide_1',
      title: 'Title Slide',
      type: 'title',
      bgType: 'gradient',
      bgColor: '#101a1e',
      elements: [
        { type: 'eyebrow', text: 'SERMON SERIES · UNSHAKABLE' },
        { type: 'heading', text: 'Walking By Faith In Difficult Seasons' },
        { type: 'subheading', text: 'Pastor Godswill Johnson · Sunday 13 Sep 2026' }
      ],
      notes: 'Begin with church welcome, thank media & worship team.'
    },
    {
      id: 'slide_2',
      title: 'Scripture Foundation',
      type: 'scripture',
      bgType: 'color',
      bgColor: '#0f171b',
      elements: [
        { type: 'reference', text: 'Hebrews 11:1 (WEB)' },
        { type: 'quote', text: 'Now faith is the assurance of things hoped for, proof of things not seen.' }
      ],
      notes: 'Emphasize certainty over feeling. Faith is not blind optimism; it is anchored in God\'s nature.'
    },
    {
      id: 'slide_3',
      title: 'Point 1',
      type: 'point',
      bgType: 'color',
      bgColor: '#141e24',
      elements: [
        { type: 'pointNumber', text: '01' },
        { type: 'heading', text: 'Faith Changes Our Response To Crisis' },
        { type: 'body', text: 'Difficulty reveals where our security is placed. When circumstance shakes, our cornerstone remains fixed.' }
      ],
      notes: 'Share personal testimony from previous ministry challenge.'
    },
    {
      id: 'slide_4',
      title: 'Scripture Anchor',
      type: 'scripture',
      bgType: 'color',
      bgColor: '#0f171b',
      elements: [
        { type: 'reference', text: 'Romans 8:28 (WEB)' },
        { type: 'quote', text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.' }
      ],
      notes: 'Connect to congregation\'s current season.'
    },
    {
      id: 'slide_5',
      title: 'Point 2',
      type: 'point',
      bgType: 'color',
      bgColor: '#141e24',
      elements: [
        { type: 'pointNumber', text: '02' },
        { type: 'heading', text: 'Faith Requires Deliberate Obedience' },
        { type: 'body', text: 'True belief is demonstrated when we take the next step before seeing the entire bridge.' }
      ],
      notes: 'Call for reflection.'
    },
    {
      id: 'slide_6',
      title: 'Closing Prayer & Call',
      type: 'callToAction',
      bgType: 'gradient',
      bgColor: '#1b2327',
      elements: [
        { type: 'heading', text: 'Lord, Increase Our Faith.' },
        { type: 'body', text: 'Altar Ministry · Prayer Teams Ready at Downstage' }
      ],
      notes: 'Signal worship team to begin Way Maker instrumental.'
    }
  ]
};

