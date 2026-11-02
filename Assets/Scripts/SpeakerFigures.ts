// Demo mode only: the stand-in people play their Talking animation while their words are
// appearing on their card, and stand still otherwise. SubSpecs itself never needs this:
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

// The top of a Mixamo person's head: the end joint under the Head joint (Mixamo varies the
// "mixamorig" prefix, so match the part after the colon).
function findHeadTop(so: SceneObject): SceneObject | null {
  if (so.name.endsWith(":Head") && so.getChildrenCount() > 0) return so.getChild(0)
  for (let i = 0; i < so.getChildrenCount(); i++) {
    const found = findHeadTop(so.getChild(i))
    if (found) return found
  }
  return null
}

// The demo's step aside: one person moves sideways mid-conversation (sliding smoothly; the
// people only have a Talking clip), so a card pinned to them can be seen following.
const STEP_SECONDS = 1.5

export class SpeakerFigures {
  private players: (AnimationPlayer | null)[]
  private talking: boolean[]
  private homes: (vec3 | null)[]
  private headTops: (SceneObject | null)[]
  private stepSpeaker = 0
  private stepOffset = vec3.zero()
  private stepAmount = 0

  // figures[i] is the person for speaker i + 1; missing entries are skipped.
  constructor(private figures: SceneObject[]) {
    this.homes = figures.map((f) => (f ? f.getTransform().getWorldPosition() : null))
    this.headTops = figures.map((f) => (f ? findHeadTop(f) : null))
    this.players = figures.map((f) => (f ? findAnimationPlayer(f) : null))
    this.talking = this.players.map(() => false)
    for (const player of this.players) {
      if (!player) continue
      player.stopAll()
      const clip = player.getClip(TALKING_CLIP)
      // The clip is 5.17 s; longer lines keep the person talking.
      if (clip) clip.playbackMode = PlaybackMode.Loop
      else print("[SubSpecs] no '" + TALKING_CLIP + "' clip on " + player.getSceneObject().name)
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

  // The person for `speaker` (null if there's none, like the voice outside the view).
  figure(speaker: number): SceneObject | null {
    return this.figures[speaker - 1] ?? null
  }

  // Where the top of `speaker`'s head is now.
  headTop(speaker: number): vec3 | null {
    const top = this.headTops[speaker - 1]
    return top ? top.getTransform().getWorldPosition() : null
  }

  // Which person steps aside, and by how much (world cm).
  setStep(speaker: number, offset: vec3): void {
    this.stepSpeaker = speaker
    this.stepOffset = offset
  }

  // How far the step has gone, 0 (home) to 1 (stepped aside).
  get stepProgress(): number {
    return this.stepAmount
  }

  // Moves the stepping person smoothly toward their stepped-aside spot, or back home.
  updateStep(dt: number, steppedAside: boolean): void {
    const home = this.homes[this.stepSpeaker - 1]
    const figure = this.figure(this.stepSpeaker)
    if (!home || !figure) return
    const target = steppedAside ? 1 : 0
    const change = dt / STEP_SECONDS
    this.stepAmount = target > this.stepAmount ? Math.min(target, this.stepAmount + change) : Math.max(target, this.stepAmount - change)
    // Ease in and out so it reads as a step, not a slide.
    const k = this.stepAmount * this.stepAmount * (3 - 2 * this.stepAmount)
    figure.getTransform().setWorldPosition(home.add(this.stepOffset.uniformScale(k)))
  }

  // Everyone back to standing still (the next update pauses them on the first frame), at home.
  reset(): void {
    this.stepAmount = 0
    const home = this.homes[this.stepSpeaker - 1]
    const figure = this.figure(this.stepSpeaker)
    if (home && figure) figure.getTransform().setWorldPosition(home)
    this.players.forEach((player, i) => {
      this.talking[i] = false
      if (player) player.playClipAt(TALKING_CLIP, 0)
    })
  }

  isTalking(speaker: number): boolean {
    return this.talking[speaker - 1] === true
  }
}
