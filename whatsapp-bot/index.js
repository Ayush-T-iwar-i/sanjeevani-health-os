const express = require('express');
const bodyParser = require('body-parser');
const { handleSymptomCheckFlow } = require('./flows/symptomCheckFlow');
const { handleAppointmentFlow } = require('./flows/appointmentFlow');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'sanjeevani_verify_token';
const sessions = new Map(); // phone -> { flow, step, data }

// Webhook verification (Meta requirement)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming message webhook (Problem 6: low awareness, Problem 10: affordability —
// citizens without a smartphone app can still reach triage/appointments via WhatsApp)
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body?.trim().toLowerCase() ?? '';

    let session = sessions.get(from) ?? { flow: null, step: 0, data: {} };

    if (!session.flow) {
      if (text.includes('symptom') || text.includes('बीमार') || text === '1') {
        session = { flow: 'symptomCheck', step: 0, data: {} };
      } else if (text.includes('appointment') || text.includes('अपॉइंटमेंट') || text === '2') {
        session = { flow: 'appointment', step: 0, data: {} };
      } else {
        await sendMessage(from, 'Welcome to Sanjeevani Health OS 🏥\n1. Check symptoms\n2. Book appointment\nReply with 1 or 2.');
        sessions.set(from, session);
        return res.sendStatus(200);
      }
    }

    let reply;
    if (session.flow === 'symptomCheck') {
      reply = await handleSymptomCheckFlow(session, text);
    } else if (session.flow === 'appointment') {
      reply = await handleAppointmentFlow(session, text);
    }

    if (reply?.done) {
      sessions.delete(from);
    } else {
      sessions.set(from, session);
    }

    await sendMessage(from, reply.message);
    return res.sendStatus(200);
  } catch (err) {
    console.error('WhatsApp webhook error', err);
    return res.sendStatus(200); // always 200 so Meta doesn't retry-storm
  }
});

async function sendMessage(to, body) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, text: { body } }),
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`WhatsApp bot listening on port ${PORT}`));
