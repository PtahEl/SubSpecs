// Demo mode's recorded voices (made with ElevenLabs): one clip per scripted line, in the order of
// ALL_DEMO_LINES. Each line starts once the voice before it has finished, so no two people talk
// over each other, and its words type out over exactly the length of its clip. Demo mode still
// uses no microphone: this only plays sound.

import {ALL_DEMO_LINES, DemoLine} from "./CaptionDemoScript"

// A short breath between one voice ending and the next starting.
export const VOICE_GAP_SECONDS = 0.4

export interface TimedLine {
  line: DemoLine
  start: number
  // How long the line takes to say: its clip's length, or the typing time when it has none.
  seconds: number
  clip: AudioTrackAsset | null
}

export class DemoVoices {
  private players: AudioComponent[] = []
  private byLine = new Map<DemoLine, AudioTrackAsset>()

  // `clips` follows ALL_DEMO_LINES; missing clips leave that line silent.
  constructor(owner: SceneObject, clips: AudioTrackAsset[], speakers: number) {
    ALL_DEMO_LINES.forEach((line, i) => {
      if (clips[i]) this.byLine.set(line, clips[i])
    })
    for (let s = 0; s < speakers; s++) {
      const so = global.scene.createSceneObject("DemoVoice_" + (s + 1))
      so.setParent(owner)
      this.players.push(so.createComponent("Component.AudioComponent") as AudioComponent)
    }
  }

  get clipCount(): number {
    return this.byLine.size
  }

  clipFor(line: DemoLine): AudioTrackAsset | null {
    return this.byLine.get(line) ?? null
  }

  // When each line starts and how long it lasts. `typedSeconds` is used for a line with no clip.
  schedule(lines: DemoLine[], typedSeconds: (line: DemoLine) => number): TimedLine[] {
    let free = 0
    return lines.map((line) => {
      const clip = this.clipFor(line)
      const seconds = clip ? clipSeconds(clip) : typedSeconds(line)
      const start = Math.max(line.at, free)
      free = start + seconds + VOICE_GAP_SECONDS
      return {line, start, seconds, clip}
    })
  }

  play(speaker: number, clip: AudioTrackAsset): void {
    const player = this.players[speaker - 1]
    if (player.isPlaying()) player.stop(false)
    player.audioTrack = clip
    player.play(1)
  }

  isPlaying(speaker: number): boolean {
    return this.players[speaker - 1].isPlaying()
  }

  stopAll(): void {
    for (const p of this.players) if (p.isPlaying()) p.stop(false)
  }
}

export function clipSeconds(clip: AudioTrackAsset): number {
  return (clip.control as FileAudioTrackProvider).duration
}
