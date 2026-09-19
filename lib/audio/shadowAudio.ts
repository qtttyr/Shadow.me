"use client";

/**
 * ── SHADOW SOUND DESIGN ────────────────────────────────────────
 * Весь звук синтезируется процедурно через Web Audio API —
 * ни одного файла, ноль килобайт трафика.
 */

type Ctx = AudioContext;

class ShadowAudio {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private droneNodes: { stop: () => void } | null = null;
  private _muted = false;
  private lastHover = 0;

  get muted() {
    return this._muted;
  }

  /** Полное глобальное выключение (для демо-фильма: звук наложит монтажёр). */
  setSilent(silent: boolean) {
    this.setMuted(silent);
  }

  /** Требуется жест пользователя — вызываем на первом сабмите. */
  unlock() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.ctx && this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(m ? 0 : 0.5, t, 0.08);
    }
  }

  private noiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private thump(at: number, vol: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(120, at);
    o.frequency.exponentialRampToValueAtTime(45, at + 0.14);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + 0.2);
  }

  /** Короткий колокольчик: FM-синтез — «резонанс раны». */
  hover(critical: boolean) {
    if (!this.ctx || !this.master) return;
    const now = performance.now();
    if (now - this.lastHover < 90) return; // анти-спам
    this.lastHover = now;

    const ctx = this.ctx;
    const t = ctx.currentTime;
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const amp = ctx.createGain();

    const base = critical ? 660 : 520;
    carrier.frequency.value = base;
    mod.frequency.value = base * 1.5;
    modGain.gain.value = base * 0.6;

    mod.connect(modGain).connect(carrier.frequency);
    amp.gain.setValueAtTime(0, t);
    amp.gain.linearRampToValueAtTime(0.06, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    carrier.connect(amp).connect(this.master);
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + 0.5);
    mod.stop(t + 0.5);
  }

  /** Ныряние: мягкий воздушный свип вниз + тёплый плак. */
  dive() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // тёплый плак вместо саб-стука
    const pluck = ctx.createOscillator();
    const pluckGain = ctx.createGain();
    pluck.type = "triangle";
    pluck.frequency.setValueAtTime(330, t);
    pluck.frequency.exponentialRampToValueAtTime(165, t + 0.35);
    pluckGain.gain.setValueAtTime(0.14, t);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    pluck.connect(pluckGain).connect(this.master);
    pluck.start(t);
    pluck.stop(t + 0.6);

    // воздушный свип
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(1.2);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3600, t);
    lp.frequency.exponentialRampToValueAtTime(500, t + 1.0);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0, t);
    nGain.gain.linearRampToValueAtTime(0.09, t + 0.15);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    noise.connect(lp).connect(nGain).connect(this.master);
    noise.start(t);
    noise.stop(t + 1.2);
  }

  /** Амбиент тени: тёплый pad (мажорное добавочное 9-е) + лёгкий шелест. */
  startDrone() {
    if (!this.ctx || !this.master || this.droneNodes) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // тёплый pad: 220, 275 (3/2 × 183), 440 — мягко и светло
    const freqs = [220, 275, 440];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f + (i === 1 ? 0.6 : 0); // лёгкое биение
      return o;
    });

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0, t);
    padGain.gain.linearRampToValueAtTime(0.028, t + 2.5);

    // медленный LFO «дыхания»
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain).connect(padGain.gain);

    // лёгкий шелест-воздух
    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuffer(4);
    wind.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0, t);
    windGain.gain.linearRampToValueAtTime(0.012, t + 3);

    oscs.forEach((o) => o.connect(padGain));
    wind.connect(hp).connect(windGain).connect(padGain);
    padGain.connect(this.master);

    oscs.forEach((o) => o.start(t));
    lfo.start(t);
    wind.start(t);

    this.droneNodes = {
      stop: () => {
        const tt = ctx.currentTime;
        padGain.gain.setTargetAtTime(0, tt, 0.4);
        [...oscs, lfo, wind].forEach((n) => {
          try { n.stop(tt + 1.4); } catch { /* already stopped */ }
        });
        this.droneNodes = null;
      },
    };
  }

  stopDrone() {
    this.droneNodes?.stop();
  }

  /** Схлопывание: светлый восходящий арпеджио — «сбор в точку». */
  collapse(dur = 2.2) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // арпеджио вверх: пентатоника, ускоряется
    const notes = [220, 275, 330, 440, 550, 660];
    const step = dur / notes.length;
    notes.forEach((f, i) => {
      const at = t + i * step * 0.82; // ускорение
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.09 - i * 0.008, at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, at + step * 1.2);
      o.connect(g).connect(this.master!);
      o.start(at);
      o.stop(at + step * 1.4);
    });

    // мягкий воздушный подъём
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(dur + 0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(600, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + dur);
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.001, t);
    nGain.gain.exponentialRampToValueAtTime(0.08, t + dur);
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.2);
    noise.connect(bp).connect(nGain).connect(this.master);
    noise.start(t);
    noise.stop(t + dur + 0.3);
  }

  /** Разрешение: тёплый колокольчик + мягкий шиммер — «чисто». */
  resolve() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    // колокольчик: 440 + октава, мягко
    [440, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.08 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 1.1);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 1.4);
    });

    // мягкий шиммер: добавочный аккорд, тихо
    [1.5, 2, 2.5].forEach((r, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 440 * r;
      g.gain.setValueAtTime(0.0001, t + 0.15 + i * 0.1);
      g.gain.linearRampToValueAtTime(0.02, t + 0.4 + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6 + i * 0.1);
      o.connect(g).connect(this.master!);
      o.start(t);
      o.stop(t + 2);
    });
  }

  /** Шелест страницы при экспорте PDF. */
  print() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.5);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    noise.connect(hp).connect(g).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.5);
  }

  /** Тихий переход между сценами: высокий блип. */
  tick() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    g.gain.setValueAtTime(0.03, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.12);
  }

  /** Мягкий вход в сцену: короткий вдох шума. */
  swell() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(0.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(400, t);
    lp.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    noise.connect(lp).connect(g).connect(this.master);
    noise.start(t);
    noise.stop(t + 0.7);
  }

  /** Счётчик растёт: шаговый тик. */
  step() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 220;
    g.gain.setValueAtTime(0.015, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.08);
  }

  /** Финальный бренд: низкий гул + шиммер, короче resolve. */
  brand() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.8);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 1.1);
    // верхний отблеск
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = "sine";
    o2.frequency.value = 880;
    g2.gain.setValueAtTime(0.0, t + 0.1);
    g2.gain.linearRampToValueAtTime(0.04, t + 0.3);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    o2.connect(g2).connect(this.master);
    o2.start(t);
    o2.stop(t + 1.3);
  }
}

export const audio = new ShadowAudio();
