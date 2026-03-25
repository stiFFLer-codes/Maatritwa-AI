// Curated clinical knowledge from WHO, ICMR, and FOGSI guidelines
// Each entry has: id, source, topic, keywords, fact_hi (in Hindi), citation

export const clinicalKnowledgeBase = [
  // === BACK PAIN & BODY PAIN ===
  {
    id: 'BP001',
    source: 'WHO Recommendations on Antenatal Care, 2016',
    topic: 'back_pain',
    keywords: ['कमर', 'दर्द', 'पीठ', 'back', 'pain', 'body ache', 'शरीर'],
    fact_hi: '50-80% गर्भवती महिलाओं को पीठ दर्द होता है, विशेषकर दूसरी और तीसरी तिमाही में। नियमित व्यायाम और सही posture से राहत मिलती है।',
    citation: 'WHO Recommendations on Antenatal Care, 2016, Section 5.1'
  },
  {
    id: 'BP002',
    source: 'FOGSI Good Clinical Practice Recommendations, 2019',
    topic: 'back_pain',
    keywords: ['कमर', 'दर्द', 'पीठ', 'back', 'pain'],
    fact_hi: 'गर्भावस्था में कमर दर्द के लिए गर्म सिकाई, प्रसव-पूर्व योग, और बाईं करवट सोना लाभदायक है। दर्दनिवारक दवाई बिना डॉक्टर की सलाह के न लें।',
    citation: 'FOGSI GCPR on Antenatal Care, 2019, Chapter 8'
  },

  // === BLOOD PRESSURE & PREECLAMPSIA ===
  {
    id: 'PE001',
    source: 'WHO Recommendations for Prevention and Treatment of Pre-eclampsia and Eclampsia, 2011',
    topic: 'blood_pressure',
    keywords: ['BP', 'blood pressure', 'रक्तचाप', 'प्रीक्लेम्पसिया', 'preeclampsia', 'high bp', 'उच्च'],
    fact_hi: 'गर्भावस्था में BP 140/90 mmHg से ऊपर होने पर प्रीक्लेम्पसिया का खतरा होता है। नियमित BP जाँच ज़रूरी है, विशेषकर 20 सप्ताह के बाद।',
    citation: 'WHO Pre-eclampsia Guidelines, 2011, Recommendation 1'
  },
  {
    id: 'PE002',
    source: 'ICMR Guidelines on Management of Hypertension in Pregnancy, 2019',
    topic: 'blood_pressure',
    keywords: ['BP', 'blood pressure', 'रक्तचाप', 'चक्कर', 'सिरदर्द', 'headache', 'dizziness'],
    fact_hi: 'गंभीर प्रीक्लेम्पसिया के लक्षण: तेज़ सिरदर्द, धुंधला दिखना, पेट के ऊपरी हिस्से में दर्द, और अचानक सूजन। ये लक्षण दिखें तो तुरंत अस्पताल जाएं।',
    citation: 'ICMR-FOGSI Guideline on Hypertensive Disorders, 2019, Table 3'
  },
  {
    id: 'PE003',
    source: 'WHO, 2011',
    topic: 'blood_pressure',
    keywords: ['calcium', 'कैल्शियम', 'prevention', 'रोकथाम'],
    fact_hi: 'जिन क्षेत्रों में कैल्शियम का सेवन कम है, वहाँ गर्भवती महिलाओं को प्रतिदिन 1.5-2g कैल्शियम सप्लीमेंट देने से प्रीक्लेम्पसिया का खतरा कम होता है।',
    citation: 'WHO Calcium Supplementation Guideline, 2013, Strong Recommendation'
  },

  // === NUTRITION & DIET ===
  {
    id: 'NUT001',
    source: 'ICMR-NIN Dietary Guidelines for Indians, 2024',
    topic: 'nutrition',
    keywords: ['खाना', 'खाऊँ', 'food', 'diet', 'आहार', 'nutrition', 'पोषण', 'क्या खाएं'],
    fact_hi: 'गर्भावस्था में प्रतिदिन 300 अतिरिक्त कैलोरी की आवश्यकता होती है। प्रोटीन (दाल, दूध, अंडा), आयरन (हरी सब्ज़ी, गुड़), और फोलिक एसिड ज़रूरी हैं।',
    citation: 'ICMR-NIN Dietary Guidelines for Indians, 2024, Chapter 14'
  },
  {
    id: 'NUT002',
    source: 'WHO Guideline on Daily Iron and Folic Acid Supplementation, 2012',
    topic: 'nutrition',
    keywords: ['आयरन', 'iron', 'फोलिक', 'folic', 'गोली', 'tablet', 'supplement', 'दवा', 'vitamin'],
    fact_hi: 'WHO के अनुसार सभी गर्भवती महिलाओं को प्रतिदिन 30-60mg आयरन और 400\u03BCg फोलिक एसिड लेना चाहिए, पूरी गर्भावस्था के दौरान।',
    citation: 'WHO Daily Iron and Folic Acid Guideline, 2012, Strong Recommendation'
  },
  {
    id: 'NUT003',
    source: 'ICMR-NIN, 2024',
    topic: 'nutrition',
    keywords: ['दूध', 'milk', 'dairy', 'calcium', 'कैल्शियम', 'हड्डी', 'bone'],
    fact_hi: 'गर्भावस्था में प्रतिदिन 1200mg कैल्शियम की आवश्यकता होती है। दूध, दही, पनीर, और रागी अच्छे स्रोत हैं।',
    citation: 'ICMR-NIN RDA Table, 2024'
  },
  {
    id: 'NUT004',
    source: 'FOGSI Nutrition Committee, 2020',
    topic: 'nutrition',
    keywords: ['पानी', 'water', 'hydration', 'fluid', 'dehydration'],
    fact_hi: 'गर्भावस्था में रोज़ 8-10 गिलास (2.5-3 लीटर) पानी पीना चाहिए। उल्टी या दस्त हो तो ORS लें।',
    citation: 'FOGSI Nutrition in Pregnancy Guidelines, 2020'
  },

  // === ANEMIA ===
  {
    id: 'ANE001',
    source: 'WHO Guideline on Haemoglobin Concentrations, 2011',
    topic: 'anemia',
    keywords: ['खून', 'anemia', 'एनीमिया', 'हीमोग्लोबिन', 'hemoglobin', 'कमज़ोरी', 'weakness', 'थकान', 'tired'],
    fact_hi: 'गर्भावस्था में हीमोग्लोबिन 11 g/dL से कम होने पर एनीमिया माना जाता है। भारत में 50% से अधिक गर्भवती महिलाएं एनीमिक हैं।',
    citation: 'WHO Haemoglobin Concentrations Guideline, 2011'
  },

  // === FETAL MOVEMENT ===
  {
    id: 'FM001',
    source: 'RCOG Green-top Guideline No. 57, 2011',
    topic: 'fetal_movement',
    keywords: ['बच्चा', 'हिलना', 'movement', 'kick', 'लात', 'बढ़', 'baby', 'शिशु', 'हलचल'],
    fact_hi: 'सप्ताह 18-24 के बीच पहली बार बच्चे की हलचल महसूस होती है। 28 सप्ताह के बाद प्रतिदिन 10 हलचल महसूस होनी चाहिए। हलचल कम हो तो डॉक्टर से मिलें।',
    citation: 'RCOG Reduced Fetal Movements Guideline, 2011, Recommendation 4.1'
  },
  {
    id: 'FM002',
    source: 'WHO Antenatal Care Recommendations, 2016',
    topic: 'fetal_movement',
    keywords: ['बच्चा', 'size', 'आकार', 'growth', 'विकास', 'weight', 'वज़न'],
    fact_hi: '24वें सप्ताह में बच्चा लगभग 600g का होता है और 30cm लंबा। इस समय बच्चे की सुनने की क्षमता विकसित हो रही होती है।',
    citation: 'WHO Fetal Growth Standards, INTERGROWTH-21st, 2016'
  },

  // === EXERCISE & REST ===
  {
    id: 'EX001',
    source: 'WHO Physical Activity Guidelines, 2020',
    topic: 'exercise',
    keywords: ['व्यायाम', 'exercise', 'टहलना', 'walk', 'yoga', 'योग', 'physical activity'],
    fact_hi: 'WHO के अनुसार गर्भवती महिलाओं को सप्ताह में कम से कम 150 मिनट मध्यम व्यायाम (जैसे तेज़ चलना) करना चाहिए, जब तक कोई चिकित्सा प्रतिबंध न हो।',
    citation: 'WHO Guidelines on Physical Activity, 2020, Recommendation for Pregnant Women'
  },
  {
    id: 'EX002',
    source: 'FOGSI, 2019',
    topic: 'sleep',
    keywords: ['नींद', 'sleep', 'सोना', 'आराम', 'rest', 'करवट', 'position'],
    fact_hi: 'तीसरी तिमाही में बाईं करवट सोना सबसे सुरक्षित है। यह गर्भाशय का रक्त प्रवाह बनाए रखता है और बच्चे को पर्याप्त ऑक्सीजन मिलती है।',
    citation: 'FOGSI Sleep Position Advisory, 2019'
  },

  // === MENTAL HEALTH ===
  {
    id: 'MH001',
    source: 'WHO Maternal Mental Health Guidelines, 2015',
    topic: 'mental_health',
    keywords: ['चिंता', 'anxiety', 'worry', 'tension', 'stress', 'तनाव', 'डर', 'fear', 'रोना', 'crying', 'mood'],
    fact_hi: 'गर्भावस्था में 10-15% महिलाएं चिंता या अवसाद का अनुभव करती हैं। यह सामान्य है और इलाज योग्य है। परिवार का सहयोग और काउंसलिंग से बहुत मदद मिलती है।',
    citation: 'WHO Thinking Healthy Programme, Maternal Mental Health, 2015'
  },
  {
    id: 'MH002',
    source: 'NIMHANS Perinatal Mental Health Guidelines, 2020',
    topic: 'mental_health',
    keywords: ['उदास', 'sad', 'depression', 'अवसाद', 'अकेला', 'lonely', 'मन'],
    fact_hi: 'गर्भावस्था में मूड बदलना हार्मोनल परिवर्तनों के कारण सामान्य है। लेकिन अगर 2 सप्ताह से अधिक उदासी रहे तो डॉक्टर से बात करें।',
    citation: 'NIMHANS Perinatal Mental Health Protocol, 2020'
  },

  // === DANGER SIGNS ===
  {
    id: 'DS001',
    source: 'WHO Pregnancy Care Guide, 2016',
    topic: 'danger_signs',
    keywords: ['खतरा', 'danger', 'warning', 'emergency', 'serious', 'गंभीर', 'तुरंत'],
    fact_hi: 'WHO के अनुसार गर्भावस्था के 5 खतरे के संकेत: (1) योनि से रक्तस्राव (2) तेज़ सिरदर्द + धुंधला दिखना (3) तेज़ बुखार (4) गंभीर पेट दर्द (5) बच्चे की हलचल में कमी।',
    citation: 'WHO Antenatal Care Model, 2016, Table 5.3 — Danger Signs'
  },

  // === ANTENATAL VISITS ===
  {
    id: 'ANC001',
    source: 'WHO ANC Model, 2016',
    topic: 'anc_visits',
    keywords: ['विज़िट', 'visit', 'checkup', 'जाँच', 'अल्ट्रासाउंड', 'ultrasound', 'scan'],
    fact_hi: 'WHO 2016 मॉडल के अनुसार गर्भावस्था में कम से कम 8 प्रसव-पूर्व जाँच (ANC) होनी चाहिए। पहली जाँच 12 सप्ताह से पहले हो।',
    citation: 'WHO ANC Recommendations, 2016, Contact Schedule'
  },
  {
    id: 'ANC002',
    source: 'Govt of India MCP Card Protocol',
    topic: 'anc_visits',
    keywords: ['ASHA', 'आशा', 'दीदी', 'card', 'कार्ड', 'registration'],
    fact_hi: 'भारत सरकार के अनुसार हर गर्भवती महिला का MCP (Mother and Child Protection) कार्ड बनवाना ज़रूरी है। ASHA कार्यकर्ता इसमें मदद करती हैं।',
    citation: 'Govt of India, MCP Card Guidelines under RMNCH+A'
  },

  // === BREASTFEEDING ===
  {
    id: 'BF001',
    source: 'WHO Breastfeeding Recommendations, 2023',
    topic: 'breastfeeding',
    keywords: ['स्तनपान', 'breastfeed', 'दूध', 'milk', 'feeding', 'breast'],
    fact_hi: 'WHO के अनुसार जन्म के 1 घंटे के भीतर स्तनपान शुरू करें। पहले 6 महीने केवल माँ का दूध दें — पानी भी नहीं।',
    citation: 'WHO Breastfeeding Recommendations, 2023, Key Recommendation 1'
  },

  // === WEIGHT GAIN ===
  {
    id: 'WG001',
    source: 'IOM/WHO Weight Gain Guidelines',
    topic: 'weight',
    keywords: ['वज़न', 'weight', 'मोटापा', 'obesity', 'BMI', 'बढ़ना', 'gain'],
    fact_hi: 'सामान्य BMI वाली महिला को गर्भावस्था में 11.5-16 kg वज़न बढ़ना चाहिए। अधिक वज़न प्रीक्लेम्पसिया और gestational diabetes का खतरा बढ़ाता है।',
    citation: 'IOM/WHO Gestational Weight Gain Guidelines, Recommendation Table'
  },

  // === DIABETES ===
  {
    id: 'DM001',
    source: 'DIPSI Guidelines on GDM, 2014',
    topic: 'diabetes',
    keywords: ['diabetes', 'मधुमेह', 'sugar', 'शुगर', 'glucose', 'GDM', 'gestational'],
    fact_hi: 'भारत में हर 5 में से 1 गर्भवती महिला को gestational diabetes होता है। 24-28 सप्ताह में glucose tolerance test ज़रूर करवाएं।',
    citation: 'DIPSI Guidelines on GDM Screening, 2014'
  },

  // === VACCINATIONS ===
  {
    id: 'VAC001',
    source: 'IAP-FOGSI Immunization Guidelines, 2020',
    topic: 'vaccination',
    keywords: ['टीका', 'vaccine', 'injection', 'इंजेक्शन', 'TT', 'tetanus'],
    fact_hi: 'गर्भावस्था में Td (Tetanus-Diphtheria) के 2 टीके ज़रूरी हैं। पहला जितनी जल्दी हो, दूसरा पहले के 4 सप्ताह बाद।',
    citation: 'IAP-FOGSI Joint Statement on Immunization in Pregnancy, 2020'
  },

  // === EDEMA / SWELLING ===
  {
    id: 'ED001',
    source: 'Williams Obstetrics / WHO ANC',
    topic: 'edema',
    keywords: ['सूजन', 'swelling', 'edema', 'पैर', 'feet', 'हाथ', 'hands', 'face', 'चेहरा'],
    fact_hi: 'पैरों में हल्की सूजन तीसरी तिमाही में सामान्य है। लेकिन चेहरे या हाथों में अचानक सूजन प्रीक्लेम्पसिया का संकेत हो सकता है — तुरंत डॉक्टर से मिलें।',
    citation: 'WHO ANC Guidelines, 2016 — Differentiation of Physiological vs Pathological Edema'
  },

  // === NAUSEA / MORNING SICKNESS ===
  {
    id: 'MS001',
    source: 'ACOG Practice Bulletin No. 189, 2018',
    topic: 'nausea',
    keywords: ['उल्टी', 'vomiting', 'nausea', 'जी मिचलाना', 'morning sickness', 'मतली'],
    fact_hi: '70-80% गर्भवती महिलाओं को पहली तिमाही में जी मिचलाना होता है। अदरक, नींबू पानी, और छोटे-छोटे भोजन से राहत मिलती है। आमतौर पर 12-14 सप्ताह तक ठीक हो जाता है।',
    citation: 'ACOG Practice Bulletin on Nausea/Vomiting in Pregnancy, 2018'
  },
];

// Search function — finds relevant knowledge entries for a query
export function searchKnowledge(query, maxResults = 3) {
  const lowerQuery = query.toLowerCase();

  // Score each entry by keyword matches
  const scored = clinicalKnowledgeBase.map(entry => {
    let score = 0;
    entry.keywords.forEach(kw => {
      if (lowerQuery.includes(kw.toLowerCase())) {
        score += kw.length; // Longer keyword matches = higher relevance
      }
    });
    return { ...entry, score };
  });

  // Return top matches with score > 0
  return scored
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
