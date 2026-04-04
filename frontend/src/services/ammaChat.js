import { searchKnowledge } from '../data/clinicalKnowledgeBase.js';

// "Amma" — the mother-facing chat companion on /mother.
//
// This runs entirely in the browser. There is no LLM and no network call.
// An earlier version proxied to the Sarvam AI chat API; that was removed when
// the project was archived, because a key shipped in a browser bundle is public
// to every visitor and the curated replies below are what actually carried the
// demo anyway. Nothing here is a diagnosis.
//
// Four layers, tried in order:
//   1. emergency keywords → fixed "go to hospital now", no lookup, no delay
//   2. curated topic      → warm Amma voice, one WHO / ICMR / FOGSI citation
//   3. knowledge base     → the guideline fact itself, cited
//   4. fallback           → defer the question to the ASHA worker or doctor

const EMERGENCY_KEYWORDS = [
  'खून', 'bleeding', 'blood', 'बेहोश', 'seizure', 'दौरा',
  'दिखाई नहीं', 'blurred vision', 'बहुत दर्द', 'not moving',
  'हिल नहीं', 'सांस नहीं', 'breathe',
];

// A bare "blood" fires on "blood pressure", "blood test" and "blood group" —
// routine questions a mother asks constantly. These phrases are stripped before
// the emergency scan so the alarm stays rare enough to still be believed.
const BENIGN_PHRASES = /blood\s+(pressure|test|group|report|sugar)/g;

const EMERGENCY_REPLY =
  "🚨 बेटी, सुनो ध्यान से! 🚨\n\nये लक्षण गंभीर हो सकते हैं। अभी तुरंत अस्पताल जाओ!\n\n👉 परिवार को अभी बताओ\n👉 देर मत करो\n\nतुम अकेली नहीं हो, बेटी। 🙏";

// Keywords are matched against the lowercased message, so keep them lowercase.
// Devanagari is unaffected by toLowerCase().
const TOPICS = [
  {
    keywords: ['दर्द', 'pain'],
    reply: "बेटी, WHO के अनुसार 50-80% गर्भवती महिलाओं को कमर दर्द होता है — यह सामान्य है। आराम करो, गर्म सिकाई करो और हल्का टहलो। अगर दर्द बहुत तेज़ हो तो डॉक्टर से मिलो। 🙏",
    citation: { source: 'WHO Recommendations on Antenatal Care, 2016', citation: 'Section 5.1', fact: '50-80% गर्भवती महिलाओं को पीठ दर्द होता है' },
  },
  {
    keywords: ['खा', 'food', 'diet'],
    reply: "बेटी, ICMR के अनुसार गर्भावस्था में प्रतिदिन 300 अतिरिक्त कैलोरी चाहिए। दाल-चावल, हरी सब्ज़ी और दूध ज़रूर लो। आयरन और फोलिक एसिड की गोली खाना मत भूलना। 🍎",
    citation: { source: 'ICMR-NIN Dietary Guidelines for Indians, 2024', citation: 'Chapter 14', fact: 'प्रतिदिन 300 अतिरिक्त कैलोरी की आवश्यकता' },
  },
  {
    keywords: ['चिंता', 'worry', 'tension', 'डर'],
    reply: "बेटी, WHO के अनुसार 10-15% गर्भवती महिलाओं को चिंता होती है — तुम अकेली नहीं हो। गहरी सांस लो, टहलो, और परिवार से बात करो। तुम बहुत अच्छी माँ बनोगी। ❤️",
    citation: { source: 'WHO Maternal Mental Health Guidelines, 2015', citation: 'Thinking Healthy Programme', fact: '10-15% महिलाएं चिंता का अनुभव करती हैं' },
  },
  {
    keywords: ['बच्चा', 'baby', 'बढ़'],
    reply: "बेटी, WHO के अनुसार 24वें सप्ताह में बच्चा लगभग 600g का होता है। वो अब तुम्हारी आवाज़ सुन सकता है! उससे बात करो, गाना गाओ। 😊",
    citation: { source: 'WHO Antenatal Care Recommendations, 2016', citation: 'INTERGROWTH-21st Fetal Growth Standards', fact: '24वें सप्ताह में बच्चा लगभग 600g' },
  },
  {
    keywords: ['विज़िट', 'visit', 'checkup'],
    reply: "बेटी, WHO के अनुसार गर्भावस्था में कम से कम 8 जाँच होनी चाहिए। तुम्हारी अगली विज़िट 2 हफ़्ते बाद है। ASHA दीदी तुमसे मिलने आएंगी। 🙏",
    citation: { source: 'WHO ANC Model, 2016', citation: 'Contact Schedule', fact: 'कम से कम 8 प्रसव-पूर्व जाँच होनी चाहिए' },
  },
  {
    keywords: ['दवा', 'medicine', 'गोली'],
    reply: "बेटी, WHO के अनुसार रोज़ 30-60mg आयरन + 400μg फोलिक एसिड की गोली लो। कैल्शियम रात को दूध के साथ। कोई नई दवाई बिना डॉक्टर की सलाह के न लो। 🙏",
    citation: { source: 'WHO Guideline on Daily Iron and Folic Acid Supplementation, 2012', citation: 'Strong Recommendation', fact: '30-60mg आयरन और 400μg फोलिक एसिड' },
  },
  {
    keywords: ['नींद', 'sleep', 'सो'],
    reply: "बेटी, FOGSI के अनुसार बाईं करवट सोना सबसे सुरक्षित है — बच्चे को ज़्यादा ऑक्सीजन मिलती है। सोने से पहले गर्म दूध पीओ। 7-8 घंटे की नींद ज़रूरी है। 😴",
    citation: { source: 'FOGSI, 2019', citation: 'Sleep Position Advisory', fact: 'बाईं करवट सोना सबसे सुरक्षित' },
  },
  {
    keywords: ['सामान्य', 'normal'],
    reply: "बेटी, गर्भावस्था में थकान, हल्का दर्द और मूड बदलना सामान्य है। आराम करो, पानी पीती रहो, और कोई चिंता हो तो ASHA दीदी से बात करो। 💚",
    citation: { source: 'WHO Recommendations on Antenatal Care, 2016', citation: 'Section 5.1', fact: 'सामान्य गर्भावस्था लक्षण' },
  },
];

const FALLBACK_REPLY =
  "बेटी, तुम्हारा सवाल अच्छा है। अगली बार जब ASHA दीदी या डॉक्टर से मिलो तो यह ज़रूर पूछना। अभी आराम करो और पानी पीती रहो। 🙏";

export function chatWithAmma(userMessage) {
  const lower = userMessage.toLowerCase();

  const scanned = lower.replace(BENIGN_PHRASES, '');
  if (EMERGENCY_KEYWORDS.some(kw => scanned.includes(kw.toLowerCase()))) {
    return { message: EMERGENCY_REPLY, isEmergency: true, citations: [] };
  }

  const topic = TOPICS.find(t => t.keywords.some(kw => lower.includes(kw)));
  if (topic) {
    return { message: topic.reply, isEmergency: false, citations: [topic.citation] };
  }

  const [known] = searchKnowledge(userMessage, 1);
  if (known) {
    return {
      message: `बेटी, ${known.fact_hi}\n\nकोई भी शंका हो तो ASHA दीदी या डॉक्टर से ज़रूर पूछना। 🙏`,
      isEmergency: false,
      citations: [{ source: known.source, citation: known.citation, fact: known.fact_hi }],
    };
  }

  return { message: FALLBACK_REPLY, isEmergency: false, citations: [] };
}
