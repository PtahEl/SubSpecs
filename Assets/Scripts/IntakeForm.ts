// Hospital intake: a small form in the top right of the view that fills itself in from the
// patients' highlighted facts as they say them. It shows the form of the patient talking now;
// each patient keeps their own. A field flashes lime when it fills.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {DemoLine, INTAKE_FIELDS, IntakeField} from "./CaptionDemoScript"
import {makeText, speakerColor, WHITE} from "./CaptionUiKit"

export const INTAKE_DISTANCE_CM = 60
// Where it sits, in cm at 60 cm: up and to the right, above the people's heads and inside the
// view (its right edge is about 15.5 degrees right, its top about 16.5 degrees up).
export const INTAKE_RIGHT_CM = 9.9
export const INTAKE_UP_CM = 12.5

const WIDTH = 13
const HEIGHT = 10
const PAD = 0.7
const TITLE_H = 1.4
const ROW_H = 1.35
const LABEL_W = 3.8
const CONTENT_Z = 0.6

const EMPTY = "—"
const FLASH_SECONDS = 1.5
// Same lime as the highlighted facts on the cards.
const FLASH_COLOR = new vec4(0.776, 1.0, 0.302, 1)
const LABEL_COLOR = new vec4(1, 1, 1, 0.6)

export class IntakeForm {
  readonly root: SceneObject
  private title: Text
  private rows = new Map<IntakeField, {label: Text; value: Text; flashAge: number}>()
  private forms = new Map<number, Partial<Record<IntakeField, string>>>()
  private shownPatient = 0
  private ready = false
  private wantVisible = false

  // `nameOf` gives what a patient's card calls them: their name once said, otherwise "Speaker N".
  constructor(parent: SceneObject, private nameOf: (patient: number) => string) {
    this.root = global.scene.createSceneObject("IntakeForm")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(WIDTH, HEIGHT)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))

    const d = INTAKE_DISTANCE_CM
    const left = -WIDTH / 2 + PAD
    const right = WIDTH / 2 - PAD
    let top = HEIGHT / 2 - PAD
    this.title = makeText(content, "IntakeTitle", "Intake form", {
      role: "Subheadline",
      distanceCm: d,
      rect: Rect.create(left, right, top - TITLE_H, top)
    })
    top -= TITLE_H + 0.3
    for (const {field, label} of INTAKE_FIELDS) {
      const labelText = makeText(content, "Label_" + field, label, {
        role: "Caption",
        distanceCm: d,
        rect: Rect.create(left, left + LABEL_W, top - ROW_H, top),
        color: LABEL_COLOR
      })
      const value = makeText(content, "Value_" + field, EMPTY, {
        role: "Caption",
        distanceCm: d,
        rect: Rect.create(left + LABEL_W, right, top - ROW_H, top),
        wrap: true
      })
      this.rows.set(field, {label: labelText, value, flashAge: -1})
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
    return this.root.enabled
  }

  get patient(): number {
    return this.shownPatient
  }

  // What the form shows in `field` right now ("" when empty).
  valueOf(field: IntakeField): string {
    const v = this.rows.get(field).value.text
    return v === EMPTY ? "" : v
  }

  // What `patient`'s form holds in `field`, shown or not.
  storedValue(patient: number, field: IntakeField): string {
    return this.forms.get(patient)?.[field] ?? ""
  }

  isFlashing(field: IntakeField): boolean {
    return this.rows.get(field).flashAge >= 0
  }

  // Switch to `patient`'s form (when they start talking).
  showPatient(patient: number): void {
    if (patient === this.shownPatient) return
    this.shownPatient = patient
    this.title.text = "Intake · " + this.nameOf(patient)
    this.title.textFill.color = speakerColor(patient)
    const form = this.forms.get(patient) ?? {}
    this.rows.forEach((row, field) => {
      row.value.text = form[field] ?? EMPTY
      row.flashAge = -1
      this.paint(row, 0)
    })
  }

  // `line` has just been said: write its facts into its speaker's form, flashing each field.
  fill(line: DemoLine): void {
    if (!line.intake) return
    const form = this.forms.get(line.speaker) ?? {}
    this.forms.set(line.speaker, form)
    this.showPatient(line.speaker)
    // The answer may have just told us their name.
    this.title.text = "Intake · " + this.nameOf(line.speaker)
    for (const {field} of INTAKE_FIELDS) {
      const value = line.intake[field]
      if (value === undefined) continue
      form[field] = value
      const row = this.rows.get(field)
      row.value.text = value
      row.flashAge = 0
      this.paint(row, 1)
    }
  }

  // Empty forms for everyone (a new conversation).
  clear(): void {
    this.forms.clear()
    this.shownPatient = 0
    this.rows.forEach((row) => {
      row.value.text = EMPTY
      row.flashAge = -1
      this.paint(row, 0)
    })
    this.title.text = "Intake form"
    this.title.textFill.color = WHITE
  }

  show(): void {
    this.wantVisible = true
    if (this.ready) this.root.enabled = true
  }

  hide(): void {
    this.wantVisible = false
    if (this.ready) this.root.enabled = false
  }

  update(dt: number): void {
    this.rows.forEach((row) => {
      if (row.flashAge < 0) return
      row.flashAge += dt
      const k = Math.max(0, 1 - row.flashAge / FLASH_SECONDS)
      this.paint(row, k)
      if (k <= 0) row.flashAge = -1
    })
  }

  // k = 1: freshly filled (lime); k = 0: settled (white value, dim label).
  private paint(row: {label: Text; value: Text}, k: number): void {
    row.value.textFill.color = vec4.lerp(WHITE, FLASH_COLOR, k)
    row.label.textFill.color = vec4.lerp(LABEL_COLOR, FLASH_COLOR, k)
  }
}
