let ctx: AudioContext | null = null

/** Call from a user gesture so the browser allows sound later. */
export function primeAudio() {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!ctx && AC) ctx = new AC()
    void ctx?.resume()
  } catch {
    /* audio unavailable */
  }
}

export function restOverAlert() {
  try {
    navigator.vibrate?.([300, 150, 300, 150, 600])
  } catch {
    /* vibration unsupported */
  }
  try {
    if (!ctx) return
    const now = ctx.currentTime
    ;[0, 0.3, 0.6].forEach((t) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.4, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22)
      o.connect(g).connect(ctx!.destination)
      o.start(now + t)
      o.stop(now + t + 0.25)
    })
  } catch {
    /* ignore */
  }
}
