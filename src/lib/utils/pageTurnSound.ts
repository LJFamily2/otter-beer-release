/**
 * Synthesised beer-themed sound for the Brand Story flipbook.
 *
 * Instead of a generic paper rustle, this plays a short, satisfying
 * beer-fizz / carbonation-bubble sound — two layered noise sources:
 *   1. A low-mid "liquid body" layer (lowpass-filtered noise)
 *   2. A crisp high "carbonation fizz" layer (bandpass around 3–5 kHz)
 *
 * The result sounds like a quick pour/fizz burst that fits the beer
 * branding while still feeling snappy enough for page turns.
 *
 * Generated entirely with the Web Audio API — no audio files needed.
 *
 * Only ever call this from a user gesture — browsers create an AudioContext
 * in the "suspended" state otherwise and the sound is silently dropped.
 * Every call is wrapped defensively: audio is a flourish, and it must never
 * be able to break page navigation.
 */

type AudioContextConstructor = new () => AudioContext;

/** Browsers cap how many AudioContexts a page may create, so reuse one. */
let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

export function playPageTurn(): void {
  try {
    const context = getContext();
    if (!context) return;

    // Safari in particular hands back a suspended context on first use.
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const duration = 0.42;

    // ── Layer 1: Liquid body (low-mid rumble) ────────────────────────
    // A lowpass-filtered white noise burst that gives the "weight" of
    // liquid — the thick, muffled quality of a beer pour.
    {
      const frameCount = Math.floor(context.sampleRate * duration);
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i += 1) {
        samples[i] = Math.random() * 2 - 1;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(350, now + duration);
      filter.Q.value = 1.2;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.04, now + duration * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      source.start(now);
      source.stop(now + duration);
    }

    // ── Layer 2: Carbonation fizz (high hiss + bubble texture) ───────
    // A bandpass-filtered noise burst centred around 3–5 kHz with a
    // sweeping Q to simulate bubbles rising and popping.
    {
      const frameCount = Math.floor(context.sampleRate * duration);
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i += 1) {
        // Slight amplitude modulation at ~18 Hz gives a subtle
        // "bubbling" texture rather than a flat, static hiss.
        const bubbleModulation = 1 - 0.3 * Math.sin((i / context.sampleRate) * 2 * Math.PI * 18);
        samples[i] = (Math.random() * 2 - 1) * bubbleModulation;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;

      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 0.9;
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(5200, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(2800, now + duration);

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.13, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.06, now + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      source.start(now);
      source.stop(now + duration);
    }

    // ── Layer 3: Tiny "pop" transient ────────────────────────────────
    // A very short, punchy click at the start that sells the moment the
    // page lifts — like a bottle cap flick or a single bubble popping.
    {
      const popDuration = 0.06;
      const frameCount = Math.floor(context.sampleRate * popDuration);
      const buffer = context.createBuffer(1, frameCount, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i += 1) {
        // Decaying sine at ~900 Hz with noise — a soft, organic "pop".
        const t = i / context.sampleRate;
        const decay = Math.exp(-t * 60);
        samples[i] = (Math.sin(t * 2 * Math.PI * 900) * 0.7 + (Math.random() * 2 - 1) * 0.3) * decay;
      }

      const source = context.createBufferSource();
      source.buffer = buffer;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + popDuration);

      source.connect(gain);
      gain.connect(context.destination);

      source.start(now);
      source.stop(now + popDuration);
    }
  } catch {
    // Autoplay policy, a missing codec, a hostile embedding context — none
    // of it should stop the page from turning.
  }
}

/** Test seam: drops the memoised context so each case starts clean. */
export function resetPageTurnAudio(): void {
  sharedContext = null;
}
