// Who's-talking cue: when a speaker's card is showing but outside the wearer's view (they're off to
// the side), a soft glowing arrow in that speaker's color sits at the edge of the view, pointing
// toward them, with their name. It goes as soon as their card is in view.

import {makeText, setTextAlpha, speakerColor} from "./CaptionUiKit"
import {SpeakerCard} from "./SpeakerCard"

export const CUE_DISTANCE_CM = 60
// The Specs view is about 32 degrees wide and 37 tall. A card counts as in view when its middle is
// this far from the center or less.
export const IN_VIEW_HALF_WIDTH_DEG = 14
export const IN_VIEW_HALF_HEIGHT_DEG = 16
// The arrow sits this far out from the center, just inside the view's edge, a little low.
const CUE_SIDE_DEG = 13
const CUE_DOWN_CM = 2
const PULSE_SECONDS = 1.2

function degrees(rad: number): number {
  return (rad * 180) / Math.PI
}

export class SpeakerCue {
  readonly root: SceneObject
  private arrow: Text
  private label: Text
  private speaker = 0
  private side = 0
  private clock = 0

  constructor(parent: SceneObject, private camera: Transform) {
    this.root = global.scene.createSceneObject("SpeakerCue")
    this.root.setParent(parent)
    // The arrow is drawn about twice the usual headline size so the edge of the eye catches it.
    this.arrow = makeText(this.root, "CueArrow", "", {
      role: "HeadlineXL",
      distanceCm: CUE_DISTANCE_CM * 2,
      rect: Rect.create(-3, 3, -2, 2),
      align: HorizontalAlignment.Center
    })
    this.label = makeText(this.root, "CueLabel", "", {
      role: "Caption",
      distanceCm: CUE_DISTANCE_CM,
      rect: Rect.create(-5, 5, 1.6, 3.0),
      align: HorizontalAlignment.Center
    })
    // A dark outline doubles as a soft glow edge on the additive display.
    for (const t of [this.arrow, this.label]) {
      t.outlineSettings.enabled = true
      t.outlineSettings.size = 0.25
    }
    this.root.enabled = false
  }

  // ── State, used by the LEAF tests ──
  // The speaker the cue points to (0 when hidden), and which way: 1 right, -1 left.
  get pointsTo(): number {
    return this.root.enabled ? this.speaker : 0
  }

  get direction(): number {
    return this.side
  }

  get color(): vec4 {
    return this.arrow.textFill.color
  }

  // Where `so` is as the wearer sees it: degrees right of and above the view's center, and whether
  // it is in front at all.
  viewAngles(so: SceneObject): {right: number; up: number; ahead: boolean} {
    const to = so.getTransform().getWorldPosition().sub(this.camera.getWorldPosition())
    const look = this.camera.forward.uniformScale(-1)
    const ahead = to.dot(look)
    return {
      right: degrees(Math.atan2(to.dot(this.camera.right), ahead)),
      up: degrees(Math.atan2(to.dot(this.camera.up), ahead)),
      ahead: ahead > 0
    }
  }

  isInView(card: SpeakerCard): boolean {
    const a = this.viewAngles(card.root)
    return a.ahead && Math.abs(a.right) <= IN_VIEW_HALF_WIDTH_DEG && Math.abs(a.up) <= IN_VIEW_HALF_HEIGHT_DEG
  }

  update(dt: number, cards: SpeakerCard[]): void {
    // The most recent voice wins: a card that's talking now beats one that's only still showing.
    const outside = cards.filter((c) => c.visible && !this.isInView(c))
    const target = outside.find((c) => c.isSpeaking) ?? outside[0]
    if (!target) {
      this.root.enabled = false
      this.speaker = 0
      return
    }
    if (target.speaker !== this.speaker) this.clock = 0
    this.speaker = target.speaker
    const a = this.viewAngles(target.root)
    this.side = a.right >= 0 ? 1 : -1
    const color = speakerColor(this.speaker)
    this.arrow.text = this.side > 0 ? "▶" : "◀"
    this.label.text = "● " + target.name
    this.arrow.textFill.color = color
    this.label.textFill.color = color
    // Soft pulse so the edge of the eye catches it, without flashing.
    this.clock += dt
    const glow = 0.65 + 0.35 * (0.5 + 0.5 * Math.cos((this.clock / PULSE_SECONDS) * 2 * Math.PI))
    setTextAlpha(this.arrow, glow)
    setTextAlpha(this.label, Math.min(1, glow + 0.2))
    this.place()
    this.root.enabled = true
  }

  // Just inside the view's edge on the speaker's side, facing the wearer, following the head.
  private place(): void {
    const look = this.camera.forward.uniformScale(-1)
    const side = Math.tan((CUE_SIDE_DEG * Math.PI) / 180) * CUE_DISTANCE_CM * this.side
    const pos = this.camera.getWorldPosition()
      .add(look.uniformScale(CUE_DISTANCE_CM))
      .add(this.camera.right.uniformScale(side))
      .add(this.camera.up.uniformScale(-CUE_DOWN_CM))
    const t = this.root.getTransform()
    t.setWorldPosition(pos)
    t.setWorldRotation(this.camera.getWorldRotation())
  }
}
