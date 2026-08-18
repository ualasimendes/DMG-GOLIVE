// Web Audio sound synthesizer (completely silent by default to prevent annoying beeps)
class SoundEngine {
  private isEnabled: boolean = false;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public playJoin() {}
  public playLeave() {}
  public playMute() {}
  public playUnmute() {}
  public playGoLive() {}
  public playMessagePing() {}
}

export const soundEngine = new SoundEngine();

// Audio Analyzer for speaking activity indicator (pure passive analyser, zero audio output)
export function createAudioLevelDetector(
  stream: MediaStream,
  onSpeakingChange: (isSpeaking: boolean) => void,
  threshold: number = 15
): () => void {
  try {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return () => {};

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return () => {};
    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    // NOTICE: Never connect analyser to audioCtx.destination so it produces ZERO speaker output!

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;
    let speakingTimer: any = null;
    let isCurrentlySpeaking = false;

    const checkAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;

      if (average > threshold) {
        if (!isCurrentlySpeaking) {
          isCurrentlySpeaking = true;
          onSpeakingChange(true);
        }
        if (speakingTimer) clearTimeout(speakingTimer);
        speakingTimer = setTimeout(() => {
          isCurrentlySpeaking = false;
          onSpeakingChange(false);
        }, 400);
      }

      animationId = requestAnimationFrame(checkAudio);
    };

    checkAudio();

    return () => {
      cancelAnimationFrame(animationId);
      if (speakingTimer) clearTimeout(speakingTimer);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
    };
  } catch (err) {
    console.warn('Audio level detector notice:', err);
    return () => {};
  }
}
