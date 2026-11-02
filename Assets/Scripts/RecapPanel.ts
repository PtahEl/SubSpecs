// Conversation recap: pinching "Recap" opens a small panel in the top left of the view with one
// short line per speaker, in their color, summing up what they've said so far. Pinching it
// again closes it. The summaries grow as the conversation goes.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {DemoLine} from "./CaptionDemoScript"
import {makeText, speakerColor} from "./CaptionUiKit"

export const RECAP_DISTANCE_CM = 60
// Up and to the left, above the people, mirroring the intake form on the right.
export const RECAP_RIGHT_CM = -9.9
export const RECAP_UP_CM = 12.5

const WIDTH = 13
const HEIGHT = 10
const PAD = 0.7
const TITLE_H = 1.4
const CONTENT_Z = 0.6
// Room for up to four voices.
export const RECAP_ROWS = 4
const ROW_H = (HEIGHT - 2 * PAD - TITLE_H - 0.3) / RECAP_ROWS

export const RECAP_EMPTY = "Nothing said yet."

export class RecapPanel {
  readonly root: SceneObject
  private rows: Text[] = []
  private empty: Text
  // Latest summary per speaker, in the order they first spoke.
  private summaries = new Map<number, string>()
  private ready = false
  private wantVisible = false

  // `nameOf` gives what a speaker's card calls them: their name once said, otherwise "Speaker N".
  constructor(parent: SceneObject, private nameOf: (speaker: number) => string) {
    this.root = global.scene.createSceneObject("RecapPanel")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(WIDTH, HEIGHT)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))

    const d = RECAP_DISTANCE_CM
    const left = -WIDTH / 2 + PAD
    const right = WIDTH / 2 - PAD
    let top = HEIGHT / 2 - PAD
    makeText(content, "RecapTitle", "Recap", {
      role: "Subheadline",
      distanceCm: d,
      rect: Rect.create(left, right, top - TITLE_H, top)
    })
    top -= TITLE_H + 0.3
    this.empty = makeText(content, "RecapEmpty", RECAP_EMPTY, {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(left, right, top - ROW_H, top),
      color: new vec4(1, 1, 1, 0.6)
    })
    for (let i = 0; i < RECAP_ROWS; i++) {
      this.rows.push(
        makeText(content, "RecapRow" + i, "", {
          role: "Caption",
          distanceCm: d,
          rect: Rect.create(left, right, top - ROW_H, top),
          valign: VerticalAlignment.Top,
          wrap: true
        })
      )
      top -= ROW_H
    }

    plate.onInitialized.add(() => {
      // Read-only: the plate must not catch pinches meant for the cards behind it.
      const collider = this.root.getComponent("Physics.ColliderComponent")
      if (collider) collider.enabled = false
      const plateTarget = this.root.getComponent(Interactable.getTypeName())
      if (plateTarget) plateTarget.enabled = false
      this.ready = true
      this.root.enabled = this.wantVisible
    })
  }

  // ── State, used by the LEAF tests ──
  get visible(): boolean {
    return this.wantVisible
  }

  // The lines shown now, top to bottom ("" rows left out).
  get lines(): string[] {
    return this.rows.map((t) => t.text).filter((t) => t !== "")
  }

  rowColor(index: number): vec4 {
    return this.rows[index].textFill.color
  }

  // `line` has just been said: its speaker's summary is now its recap.
  add(line: DemoLine): void {
    if (!line.recap) return
    this.summaries.set(line.speaker, line.recap)
    this.refresh()
  }

  // A new conversation: nothing said yet.
  clear(): void {
    this.summaries.clear()
    this.refresh()
  }

  // Names may arrive after a summary; redraw with what the cards call everyone now.
  refresh(): void {
    const speakers = Array.from(this.summaries.keys()).slice(0, RECAP_ROWS)
    this.rows.forEach((row, i) => {
      const speaker = speakers[i]
      row.text = speaker === undefined ? "" : "● " + this.nameOf(speaker) + ": " + this.summaries.get(speaker)
      if (speaker !== undefined) row.textFill.color = speakerColor(speaker)
    })
    this.empty.getSceneObject().enabled = speakers.length === 0
  }

  show(): void {
    this.refresh()
    this.wantVisible = true
    if (this.ready) this.root.enabled = true
  }

  hide(): void {
    this.wantVisible = false
    if (this.ready) this.root.enabled = false
  }

  toggle(): void {
    if (this.wantVisible) this.hide()
    else this.show()
  }
}
