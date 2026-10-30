// Demo mode only: the stand-in people play their Talking animation while their words are
// appearing on their card, and stand still otherwise. Subspecs itself never needs this:
// on real glasses the people are real.

// Mixamo names the animation in every downloaded FBX "mixamo.com".
const TALKING_CLIP = "mixamo.com"

function findAnimationPlayer(so: SceneObject): AnimationPlayer | null {
  const own = so.getComponent("Component.AnimationPlayer") as AnimationPlayer
  if (own) return own
  for (let i = 0; i < so.getChildrenCount(); i++) {
    const found = findAnimationPlayer(so.getChild(i))
    if (found) return found
  }
  return null
}

export class SpeakerFigures {
  private players: (AnimationPlayer | null)[]
  private talking: boolean[]

  // figures[i] is the person for speaker i + 1; missing entries are skipped.
  constructor(figures: SceneObject[]) {
    this.players = figures.map((f) => (f ? findAnimationPlayer(f) : null))
    this.talking = this.players.map(() => false)
    for (const player of this.players) {
      if (!player) continue
      player.stopAll()
      const clip = player.getClip(TALKING_CLIP)
      // The clip is 5.17 s; longer lines keep the person talking.
      if (clip) clip.playbackMode = PlaybackMode.Loop
      else print("[Subspecs] no '" + TALKING_CLIP + "' clip on " + player.getSceneObject().name)
      player.playClipAt(TALKING_CLIP, 0)
    }
  }

  // speaking[i] is true while speaker i + 1's words are appearing.
  // Stopping the clip would drop a quiet person into the rig's T-pose, so they hold the
  // Talking clip's first frame instead. A clip paused in the frame it starts never applies
  // its pose, so it is restarted when they go quiet and paused on the next update.
  update(speaking: boolean[]): void {
    this.players.forEach((player, i) => {
      if (!player) return
      const now = speaking[i] === true
      if (now !== this.talking[i]) {
        this.talking[i] = now
        player.playClipAt(TALKING_CLIP, 0)
      } else if (!now && player.getClipIsPlaying(TALKING_CLIP)) {
        player.pauseClip(TALKING_CLIP)
      }
    })
  }

  isTalking(speaker: number): boolean {
    return this.talking[speaker - 1] === true
  }
}
