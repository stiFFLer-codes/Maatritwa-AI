import { searchKnowledge } from '../data/clinicalKnowledgeBase.js';

const SARVAM_API_KEY = 'sk_xcuxz0bh_K3ovLDZUQ0OmuI049dLung4R';

const SYSTEM_MSG = 'You are Amma, a caring Indian grandmother helping pregnant women. Reply ONLY in Hindi Devanagari. Max 2-3 sentences. Be warm, use "बेटी". Never diagnose. For dangerous symptoms say go to hospital.';

export async function chatWithAmma(userMessage, conversationHistory = []) {
  const emergencyKeywords = [
    'खून', 'bleeding', 'blood', 'बेहोश', 'seizure', 'दौरा',
    'दिखाई नहीं', 'blurred vision', 'बहुत दर्द', 'not moving',
    'हिल नहीं', 'सांस नहीं', 'breathe'
  ];

  const lowerMsg = userMessage.toLowerCase();
  if (emergencyKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()))) {
    return {
      message: "🚨 बेटी, सुनो ध्यान से! 🚨\n\nये लक्षण गंभीर हो सकते हैं। अभी तुरंत अस्पताल जाओ!\n\n👉 परिवार को अभी बताओ\n👉 देर मत करो\n\nतुम अकेली नहीं हो, बेटी। 🙏",
      isEmergency: true,
    };
  }

  // Search clinical knowledge base for relevant context
  const relevantKnowledge = searchKnowledge(userMessage, 2);

  let knowledgeContext = '';
  let citations = [];

  if (relevantKnowledge.length > 0) {
    knowledgeContext = '\n\nCLINICAL CONTEXT (use this information in your reply and mention the source):\n';
    relevantKnowledge.forEach(k => {
      knowledgeContext += `- ${k.fact_hi} (Source: ${k.citation})\n`;
      citations.push({ source: k.source, citation: k.citation, fact: k.fact_hi });
    });
  }

  const systemWithContext = SYSTEM_MSG + (knowledgeContext
    ? knowledgeContext + '\nWhen using the above information, naturally mention the source like "WHO के अनुसार..." or "ICMR guidelines के अनुसार...". Do not list citations separately.'
    : '');

  const messages = [
    { role: 'system', content: systemWithContext },
    ...conversationHistory.slice(-4).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    let response;

    try {
      // Proxy first (avoids CORS issues)
      response = await fetch('/api/sarvam/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY,
          'Authorization': 'Bearer ' + SARVAM_API_KEY,
        },
        body: JSON.stringify({
          model: 'sarvam-30b',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
    } catch (proxyErr) {
      console.log('Proxy failed, trying direct...', proxyErr.message);
      response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY,
          'Authorization': 'Bearer ' + SARVAM_API_KEY,
        },
        body: JSON.stringify({
          model: 'sarvam-30b',
          messages: messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });
    }

    if (!response.ok) throw new Error('API error: ' + response.status);

    const data = await response.json();
    console.log('Sarvam status:', response.status, 'finish_reason:', data.choices?.[0]?.finish_reason);

    let reply = '';
    const msg = data.choices?.[0]?.message;

    if (msg) {
      if (msg.content && msg.content.trim()) {
        reply = msg.content.trim();
      } else if (msg.reasoning_content) {
        const rc = msg.reasoning_content;
        const blocks = rc.split(/\n{2,}/).filter(b => b.trim().length > 10);
        const hindiBlocks = blocks.filter(b => /[\u0900-\u097F]/.test(b) && b.length > 15);
        if (hindiBlocks.length > 0) {
          reply = hindiBlocks[hindiBlocks.length - 1]
            .replace(/\*\*/g, '').replace(/\*/g, '')
            .replace(/^[\d.)\s-]+/gm, '')
            .trim();
        }
      }
    }

    if (!reply) {
      if (userMessage.includes('दर्द') || userMessage.includes('pain')) {
        reply = "बेटी, WHO के अनुसार 50-80% गर्भवती महिलाओं को कमर दर्द होता है — यह सामान्य है। आराम करो, गर्म सिकाई करो और हल्का टहलो। अगर दर्द बहुत तेज़ हो तो डॉक्टर से मिलो। 🙏";
        citations = [{ source: 'WHO Recommendations on Antenatal Care, 2016', citation: 'Section 5.1', fact: '50-80% गर्भवती महिलाओं को पीठ दर्द होता है' }];
      } else if (userMessage.includes('खा') || userMessage.includes('food') || userMessage.includes('diet')) {
        reply = "बेटी, ICMR के अनुसार गर्भावस्था में प्रतिदिन 300 अतिरिक्त कैलोरी चाहिए। दाल-चावल, हरी सब्ज़ी और दूध ज़रूर लो। आयरन और फोलिक एसिड की गोली खाना मत भूलना। 🍎";
        citations = [{ source: 'ICMR-NIN Dietary Guidelines for Indians, 2024', citation: 'Chapter 14', fact: 'प्रतिदिन 300 अतिरिक्त कैलोरी की आवश्यकता' }];
      } else if (userMessage.includes('चिंता') || userMessage.includes('worry') || userMessage.includes('tension') || userMessage.includes('डर')) {
        reply = "बेटी, WHO के अनुसार 10-15% गर्भवती महिलाओं को चिंता होती है — तुम अकेली नहीं हो। गहरी सांस लो, टहलो, और परिवार से बात करो। तुम बहुत अच्छी माँ बनोगी। ❤️";
        citations = [{ source: 'WHO Maternal Mental Health Guidelines, 2015', citation: 'Thinking Healthy Programme', fact: '10-15% महिलाएं चिंता का अनुभव करती हैं' }];
      } else if (userMessage.includes('बच्चा') || userMessage.includes('baby') || userMessage.includes('बढ़')) {
        reply = "बेटी, WHO के अनुसार 24वें सप्ताह में बच्चा लगभग 600g का होता है। वो अब तुम्हारी आवाज़ सुन सकता है! उससे बात करो, गाना गाओ। 😊";
        citations = [{ source: 'WHO Antenatal Care Recommendations, 2016', citation: 'INTERGROWTH-21st Fetal Growth Standards', fact: '24वें सप्ताह में बच्चा लगभग 600g' }];
      } else if (userMessage.includes('विज़िट') || userMessage.includes('visit') || userMessage.includes('checkup')) {
        reply = "बेटी, WHO के अनुसार गर्भावस्था में कम से कम 8 जाँच होनी चाहिए। तुम्हारी अगली विज़िट 2 हफ़्ते बाद है। ASHA दीदी तुमसे मिलने आएंगी। 🙏";
        citations = [{ source: 'WHO ANC Model, 2016', citation: 'Contact Schedule', fact: 'कम से कम 8 प्रसव-पूर्व जाँच होनी चाहिए' }];
      } else if (userMessage.includes('सामान्य') || userMessage.includes('normal')) {
        reply = "बेटी, गर्भावस्था में थकान, हल्का दर्द और मूड बदलना सामान्य है। आराम करो, पानी पीती रहो, और कोई चिंता हो तो ASHA दीदी से बात करो। 💚";
        citations = [{ source: 'WHO Recommendations on Antenatal Care, 2016', citation: 'Section 5.1', fact: 'सामान्य गर्भावस्था लक्षण' }];
      } else if (userMessage.includes('दवा') || userMessage.includes('medicine') || userMessage.includes('गोली')) {
        reply = "बेटी, WHO के अनुसार रोज़ 30-60mg आयरन + 400\u03BCg फोलिक एसिड की गोली लो। कैल्शियम रात को दूध के साथ। कोई नई दवाई बिना डॉक्टर की सलाह के न लो। 🙏";
        citations = [{ source: 'WHO Guideline on Daily Iron and Folic Acid Supplementation, 2012', citation: 'Strong Recommendation', fact: '30-60mg आयरन और 400\u03BCg फोलिक एसिड' }];
      } else if (userMessage.includes('नींद') || userMessage.includes('sleep') || userMessage.includes('सो')) {
        reply = "बेटी, FOGSI के अनुसार बाईं करवट सोना सबसे सुरक्षित है — बच्चे को ज़्यादा ऑक्सीजन मिलती है। सोने से पहले गर्म दूध पीओ। 7-8 घंटे की नींद ज़रूरी है। 😴";
        citations = [{ source: 'FOGSI, 2019', citation: 'Sleep Position Advisory', fact: 'बाईं करवट सोना सबसे सुरक्षित' }];
      } else {
        reply = "बेटी, तुम्हारा सवाल अच्छा है। अगली बार जब ASHA दीदी या डॉक्टर से मिलो तो यह ज़रूर पूछना। अभी आराम करो और पानी पीती रहो। 🙏";
      }
    }

    if (reply.includes('</think>')) reply = reply.split('</think>').pop().trim();
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    console.log('Final Amma reply:', reply);
    return { message: reply, isEmergency: false, citations: citations };

  } catch (error) {
    console.error('Sarvam error:', error.message);
    return {
      message: "बेटी, अभी मुझे जवाब देने में थोड़ी दिक्कत हो रही है। कृपया थोड़ी देर बाद फिर पूछो। 🙏",
      isEmergency: false,
    };
  }
}
