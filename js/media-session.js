/**
 * Vox Gym - Native Media Session API & Background Audio Controller
 * Integrates HTML5 navigator.mediaSession with lock-screen controls,
 * custom playlist tracks, and a built-in synth beat generator.
 */

export const WORKOUT_TRACKS = [
  {
    title: "Beast Mode Protocol",
    artist: "Vox Gym Audio",
    album: "Power Workout Vol. 1",
    bpm: 128,
    genre: "Electronic / Synthwave"
  },
  {
    title: "Heavy Iron Anthem",
    artist: "Hypertrophy Beats",
    album: "Power Workout Vol. 1",
    bpm: 135,
    genre: "Industrial Phonk"
  },
  {
    title: "Endurance Pulse",
    artist: "Vox Cardio Suite",
    album: "Velocity Rhythms",
    bpm: 140,
    genre: "High Energy Bass"
  }
];

export class MediaSessionController {
  constructor() {
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isMuted = false;
    this.audioCtx = null;
    this.beatInterval = null;
    this.listeners = [];
  }

  init() {
    this.setupMediaSession();
  }

  onStateChange(cb) {
    this.listeners.push(cb);
  }

  notifyState() {
    const track = WORKOUT_TRACKS[this.currentTrackIndex];
    for (const cb of this.listeners) {
      cb({
        isPlaying: this.isPlaying,
        isMuted: this.isMuted,
        currentTrack: track,
        index: this.currentTrackIndex,
        totalTracks: WORKOUT_TRACKS.length
      });
    }
  }

  setupMediaSession() {
    if (!("mediaSession" in navigator)) {
      console.log("navigator.mediaSession is not supported in this browser.");
      return;
    }

    this.updateMediaMetadata();

    try {
      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.prevTrack());
      navigator.mediaSession.setActionHandler("nexttrack", () => this.nextTrack());
      navigator.mediaSession.setActionHandler("stop", () => this.pause());
    } catch (e) {
      console.warn("Error registering media session handlers:", e);
    }
  }

  updateMediaMetadata() {
    if (!("mediaSession" in navigator)) return;

    const track = WORKOUT_TRACKS[this.currentTrackIndex];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: [
          { src: "assets/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "assets/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      });

      navigator.mediaSession.playbackState = this.isPlaying ? "playing" : "paused";
    } catch (e) {
      console.warn("Error updating media metadata:", e);
    }
  }

  play() {
    this.isPlaying = true;
    this.ensureAudioEngine();
    this.startBeatLoop();
    this.updateMediaMetadata();
    this.notifyState();
  }

  pause() {
    this.isPlaying = false;
    this.stopBeatLoop();
    this.updateMediaMetadata();
    this.notifyState();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.notifyState();
  }

  nextTrack() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % WORKOUT_TRACKS.length;
    this.updateMediaMetadata();
    this.notifyState();
  }

  prevTrack() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + WORKOUT_TRACKS.length) % WORKOUT_TRACKS.length;
    this.updateMediaMetadata();
    this.notifyState();
  }

  // --- Background Synth Rhythm Generator ---
  ensureAudioEngine() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  startBeatLoop() {
    this.stopBeatLoop();
    const track = WORKOUT_TRACKS[this.currentTrackIndex];
    const intervalMs = (60 / track.bpm) * 1000;
    let step = 0;

    this.beatInterval = setInterval(() => {
      if (!this.isPlaying || this.isMuted || !this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      // Synthesize rhythmic kick & hi-hat pattern
      if (step % 2 === 0) {
        // Kick
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else {
        // Snare / Hi-hat pulse
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
      step = (step + 1) % 4;
    }, intervalMs);
  }

  stopBeatLoop() {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
      this.beatInterval = null;
    }
  }
}

export const mediaSession = new MediaSessionController();
