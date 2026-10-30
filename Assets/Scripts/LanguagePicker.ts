// Small panel at the bottom of the view: pinch a language to translate the captions,
// plus the mode status (Demo / Live / Reconnecting).

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {DEMO_LANGUAGES, LanguageCode} from "./CaptionDemoScript"
import {makeButton, makeText, WHITE} from "./CaptionUiKit"

export const PICKER_DISTANCE_CM = 60

const BUTTON_W = 7.2
const BUTTON_H = 3.0
const GAP = 0.8
const LABEL_W = 7.5
const STATUS_W = 7.0
const PAD = 1.0
const CONTENT_Z = 0.6

const SELECTED_COLOR = new vec4(0.45, 0.9, 0.55, 1)
const STATUS_DEMO_COLOR = new vec4(0.45, 0.9, 0.55, 1)

export class LanguagePicker {
  readonly root: SceneObject
  private buttons: {code: LanguageCode; button: Button; label: Text; text: string}[] = []
  private listeners: ((code: LanguageCode) => void)[] = []
  private selected: LanguageCode
  private statusText: Text
  private ready = false
  private wantVisible = false

  constructor(parent: SceneObject, initial: LanguageCode) {
    this.selected = initial
    this.root = global.scene.createSceneObject("LanguagePicker")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const count = DEMO_LANGUAGES.length
    const width = PAD * 2 + LABEL_W + count * BUTTON_W + (count + 1) * GAP + STATUS_W
    const height = BUTTON_H + PAD * 2
    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(width, height)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))

    let x = -width / 2 + PAD
    makeText(content, "TranslateLabel", "Translate:", {
      role: "Callout",
      distanceCm: PICKER_DISTANCE_CM,
      rect: Rect.create(x, x + LABEL_W, -BUTTON_H / 2, BUTTON_H / 2),
      color: new vec4(1, 1, 1, 0.75)
    })
    x += LABEL_W + GAP

    for (const option of DEMO_LANGUAGES) {
      const {button, label} = makeButton(
        content,
        "Lang_" + option.code,
        option.label,
        new vec2(BUTTON_W, BUTTON_H),
        PICKER_DISTANCE_CM,
        new vec3(x + BUTTON_W / 2, 0, 0)
      )
      button.onTriggerUp.add(() => this.select(option.code))
      this.buttons.push({code: option.code, button, label, text: option.label})
      x += BUTTON_W + GAP
    }

    this.statusText = makeText(content, "StatusIndicator", "● DEMO", {
      role: "Callout",
      distanceCm: PICKER_DISTANCE_CM,
      rect: Rect.create(x, width / 2 - PAD, -BUTTON_H / 2, BUTTON_H / 2),
      align: HorizontalAlignment.Right,
      color: STATUS_DEMO_COLOR
    })
    this.refreshSelection()

    plate.onInitialized.add(() => {
      // The background is only a backdrop: its own collider would catch reaches meant for the buttons.
      const collider = this.root.getComponent("Physics.ColliderComponent")
      if (collider) collider.enabled = false
      const plateTarget = this.root.getComponent(Interactable.getTypeName())
      if (plateTarget) plateTarget.enabled = false
      this.ready = true
      this.root.enabled = this.wantVisible
    })
  }

  get language(): LanguageCode {
    return this.selected
  }

  get status(): string {
    return this.statusText.text
  }

  onLanguageChanged(fn: (code: LanguageCode) => void): void {
    this.listeners.push(fn)
  }

  select(code: LanguageCode): void {
    this.selected = code
    this.refreshSelection()
    this.listeners.forEach((fn) => fn(code))
  }

  show(): void {
    this.wantVisible = true
    if (this.ready) this.root.enabled = true
  }

  private refreshSelection(): void {
    for (const b of this.buttons) {
      const isSelected = b.code === this.selected
      b.label.text = isSelected ? "✓ " + b.text : b.text
      b.label.textFill.color = isSelected ? SELECTED_COLOR : WHITE
    }
  }
}
