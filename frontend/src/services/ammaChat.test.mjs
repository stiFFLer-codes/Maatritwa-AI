/**
 * Self-check for the Amma chat. No test framework — run it with:
 *
 *   npm run test:amma
 *
 * The chat is the only thing a mother interacts with directly, and every reply
 * it can give is a fixed string in this repository. These assertions pin the
 * layer order, because an emergency phrase reaching the topic table instead of
 * the emergency branch is the one failure here that would actually matter.
 */

import assert from 'node:assert/strict';
import { chatWithAmma } from './ammaChat.js';

// ── Layer 1: emergencies win, whatever else the message contains ─────────────
for (const msg of ['मुझे खून आ रहा है', 'I have bleeding', 'बहुत दर्द हो रहा है', 'baby not moving']) {
  const r = chatWithAmma(msg);
  assert.equal(r.isEmergency, true, `"${msg}" must short-circuit to the emergency reply`);
  assert.match(r.message, /अस्पताल/, 'the emergency reply must say go to hospital');
}

// "बहुत दर्द" is an emergency keyword and "दर्द" is a topic keyword. Order matters.
assert.equal(chatWithAmma('बहुत दर्द').isEmergency, true, 'emergency phrase beats the topic table');
assert.equal(chatWithAmma('कमर में दर्द').isEmergency, false, 'ordinary pain is not an emergency');

// ── Layer 2: curated topics answer in Amma's voice, with a citation ──────────
const pain = chatWithAmma('कमर में दर्द');
assert.equal(pain.citations.length, 1);
assert.match(pain.citations[0].source, /WHO/);

const sleep = chatWithAmma('मुझे नींद नहीं आती');
assert.match(sleep.citations[0].source, /FOGSI/);

assert.equal(chatWithAmma('What FOOD should I take').citations[0].source.includes('ICMR'), true,
  'English topic keywords match case-insensitively');

// A routine "blood pressure" question must not trip the bleeding alarm.
for (const msg of ['my blood pressure is high', 'blood test kab karana hai', 'blood group']) {
  assert.equal(chatWithAmma(msg).isEmergency, false, `"${msg}" is a routine question, not an emergency`);
}
assert.equal(chatWithAmma('there is blood').isEmergency, true, 'actual blood still alarms');

// ── Layer 3: anything else falls to the knowledge base, still cited ──────────
const bp = chatWithAmma('मेरा blood pressure ज़्यादा है');
assert.equal(bp.isEmergency, false);
assert.equal(bp.citations.length, 1, 'a knowledge-base hit still carries its citation');

// ── Layer 4: nothing matched → defer to the ASHA worker ─────────────────────
const shrug = chatWithAmma('zzzzqqq');
assert.equal(shrug.citations.length, 0);
assert.match(shrug.message, /ASHA/);

// Every reply is a plain string with no leftover markdown or model artefacts.
for (const msg of ['कमर में दर्द', 'zzzzqqq', 'खून']) {
  const { message } = chatWithAmma(msg);
  assert.equal(typeof message, 'string');
  assert.ok(message.length > 0);
  assert.doesNotMatch(message, /\*\*|<think>/, 'replies are plain text');
}

console.log('ammaChat self-check: all assertions passed');
