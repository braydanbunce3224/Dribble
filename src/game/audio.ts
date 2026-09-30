type Kind = "crowd" | "swish" | "miss" | "buzzer" | "timeout" | "whistle";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;
let enabled = true;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx = new C({ latencyHint: "interactive" });
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

export function setSoundOn(on: boolean) {
  enabled = on;
  if (!on && master && ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
  else if (on && master && ctx) master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.02);
}

export function unlockAudio() {
  if (unlocked) {
    if (ctx?.state === "suspended") void ctx.resume();
    return;
  }
  const c = ac();
  if (!c) return;
  unlocked = true;
  if (c.state === "suspended") void c.resume();
}

function noise(c: AudioContext, seconds: number) {
  const n = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function beep(freq: number, dur: number, type: OscillatorType, gain: number, at = 0) {
  const c = ac();
  if (!c || !master || !enabled) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playSfx(kind: Kind) {
  if (!enabled) return;
  const c = ac();
  if (!c || !master) return;
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime;
  if (kind === "swish") {
    beep(920, 0.09, "sine", 0.18);
    beep(1380, 0.07, "sine", 0.08, 0.02);
    return;
  }
  if (kind === "miss") {
    beep(140, 0.08, "triangle", 0.12);
    return;
  }
  if (kind === "buzzer") {
    beep(180, 0.55, "sawtooth", 0.16);
    beep(90, 0.55, "square", 0.08);
    return;
  }
  if (kind === "timeout") {
    beep(740, 0.12, "square", 0.1);
    beep(520, 0.12, "square", 0.08, 0.14);
    return;
  }
  if (kind === "whistle") {
    beep(2100, 0.16, "sine", 0.1);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = noise(c, 0.55);
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(900, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + 0.55);
}

if (typeof window !== "undefined") {
  const arm = () => unlockAudio();
  window.addEventListener("pointerdown", arm, { once: true });
  window.addEventListener("keydown", arm, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
}
