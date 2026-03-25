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

  const messages = [
    { role: 'system', content: SYSTEM_MSG },
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
        reply = "बेटी, गर्भावस्था में हल्का कमर दर्द सामान्य होता है। आराम करो, गर्म सिकाई करो और हल्का टहलो। अगर दर्द बहुत तेज़ हो तो डॉक्टर से मिलो। 🙏";
      } else if (userMessage.includes('खा') || userMessage.includes('food') || userMessage.includes('diet')) {
        reply = "बेटी, आज दाल-चावल, हरी सब्ज़ी और दूध ज़रूर लो। आयरन और फोलिक एसिड की गोली खाना मत भूलना। फल में केला या सेब खाओ। 🍎";
      } else if (userMessage.includes('चिंता') || userMessage.includes('worry') || userMessage.includes('tension') || userMessage.includes('डर')) {
        reply = "बेटी, चिंता मत करो। तुम्हारी सेहत अच्छी है। गहरी सांस लो, टहलो, और अच्छा संगीत सुनो। तुम बहुत अच्छी माँ बनोगी। ❤️";
      } else if (userMessage.includes('बच्चा') || userMessage.includes('baby') || userMessage.includes('बढ़')) {
        reply = "बेटी, तुम्हारा बच्चा बहुत अच्छे से बढ़ रहा है! वो अब तुम्हारी आवाज़ सुन सकता है। उससे बात करो, गाना गाओ! 😊";
      } else if (userMessage.includes('विज़िट') || userMessage.includes('visit') || userMessage.includes('checkup')) {
        reply = "बेटी, तुम्हारी अगली विज़िट 2 हफ़्ते बाद है। ASHA दीदी तुमसे मिलने आएंगी। BP और वज़न की जाँच होगी। 🙏";
      } else if (userMessage.includes('सामान्य') || userMessage.includes('normal')) {
        reply = "बेटी, गर्भावस्था में थकान, हल्का दर्द और मूड बदलना सामान्य है। आराम करो, पानी पीती रहो, और कोई चिंता हो तो ASHA दीदी से बात करो। 💚";
      } else if (userMessage.includes('दवा') || userMessage.includes('medicine') || userMessage.includes('गोली')) {
        reply = "बेटी, रोज़ आयरन + फोलिक एसिड की गोली खाना के बाद लो। कैल्शियम रात को दूध के साथ। कोई नई दवाई बिना डॉक्टर की सलाह के न लो। 🙏";
      } else if (userMessage.includes('नींद') || userMessage.includes('sleep') || userMessage.includes('सो')) {
        reply = "बेटी, बाईं करवट सोना सबसे अच्छा है। सोने से पहले गर्म दूध पीओ और फ़ोन दूर रखो। 7-8 घंटे की नींद ज़रूरी है। 😴";
      } else {
        reply = "बेटी, तुम्हारा सवाल अच्छा है। अगली बार जब ASHA दीदी या डॉक्टर से मिलो तो यह ज़रूर पूछना। अभी आराम करो और पानी पीती रहो। 🙏";
      }
    }

    if (reply.includes('</think>')) reply = reply.split('</think>').pop().trim();
    reply = reply.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    console.log('Final Amma reply:', reply);
    return { message: reply, isEmergency: false };

  } catch (error) {
    console.error('Sarvam error:', error.message);
    return {
      message: "बेटी, अभी मुझे जवाब देने में थोड़ी दिक्कत हो रही है। कृपया थोड़ी देर बाद फिर पूछो। 🙏",
      isEmergency: false,
    };
  }
}
