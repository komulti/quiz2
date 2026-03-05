let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playTone(
  frequency: number,
  startTime: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine',
  ac: AudioContext,
) {
  const osc = ac.createOscillator();
  const gainNode = ac.createGain();
  osc.connect(gainNode);
  gainNode.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playCorrect() {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    // 밝은 3화음 상승 아르페지오
    playTone(523, t + 0.00, 0.15, 0.25, 'sine', ac); // C5
    playTone(659, t + 0.08, 0.15, 0.25, 'sine', ac); // E5
    playTone(784, t + 0.16, 0.25, 0.30, 'sine', ac); // G5
    playTone(1047, t + 0.24, 0.30, 0.20, 'sine', ac); // C6
  } catch (_) { /* 오디오 미지원 환경 무시 */ }
}

export function playWrong() {
  try {
    const ac = getCtx();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    // 코믹한 하강 "뚜뚜" 효과
    playTone(350, t + 0.00, 0.18, 0.30, 'sawtooth', ac);
    playTone(280, t + 0.16, 0.18, 0.30, 'sawtooth', ac);
    playTone(220, t + 0.32, 0.25, 0.25, 'sawtooth', ac);
  } catch (_) { /* 오디오 미지원 환경 무시 */ }
}
