// Rebuild the user-approved E cheer without changing its voice or pitch.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const directory = path.join(__dirname, 'assets/audio');
const approved = fs.readFileSync(path.join(directory, 'sources/cheer-e-approved.wav'));
const rate = approved.readUInt32LE(24);
assert.equal(approved.toString('ascii', 8, 12), 'WAVE');
assert.equal(rate, 22050); assert.equal(approved.readUInt16LE(22), 1);
assert.equal(approved.readUInt16LE(34), 16);
const count = approved.readUInt32LE(40) / 2;
assert.equal(approved.length, 44 + count * 2);
fs.copyFileSync(path.join(directory, 'sources/cheer-e-approved.wav'), path.join(directory, 'cheer.wav'));
// Six hits: the same vocal take, more body, and a warm toy-key chord.
// No pitch shift, time stretch, repeated syllable, or second voice.
const large = new Float32Array(Math.round(rate * 1.6));
for (let i = 0; i < count; i++) large[i] = approved.readInt16LE(44 + i * 2) / 32768 * 1.14;
for (const [at, hz, amp] of [[.11, 392, .055], [.20, 523.25, .065], [.20, 659.25, .04], [.20, 783.99, .035]]) {
  const start = Math.round(at * rate), length = .98;
  for (let i = 0; i < length * rate; i++) {
    const t = i / rate, phase = 2 * Math.PI * hz * t;
    const body = Math.sin(phase + .3 * Math.sin(phase * 2) * Math.exp(-20 * t));
    large[start + i] += amp * body * (1 - Math.exp(-240 * t)) * Math.exp(-5 * t) * (1 - t / length) ** 2;
  }
}
let peak = 0;
for (const v of large) { assert.ok(Number.isFinite(v)); peak = Math.max(peak, Math.abs(v)); }
const scale = Math.min(1, .92 / peak);
const wav = Buffer.alloc(44 + large.length * 2);
approved.copy(wav, 0, 0, 44);
wav.writeUInt32LE(wav.length - 8, 4); wav.writeUInt32LE(large.length * 2, 40);
for (let i = 0; i < large.length; i++) wav.writeInt16LE(Math.round(large[i] * scale * 32767), 44 + i * 2);
fs.writeFileSync(path.join(directory, 'cheer-big.wav'), wav);
console.log(JSON.stringify({ small: { seconds: count / rate, bytes: approved.length }, big: { seconds: large.length / rate, bytes: wav.length, peak: peak * scale }, voice: 'approved E, same take, playback rate 1' }));
