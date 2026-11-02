// Small panel at the bottom of the view: Auto (detect other languages and translate them),
// Off, or pinch a language to translate everything into it; plus the mode status
// (Demo / Live / Reconnecting), a Switch button back to the start card, and a Recap button above.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {DEMO_LANGUAGES, LanguageCode} from "./CaptionDemoScript"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {GLASS_RENDER_ORDER, LOGO_ASPECT, addTextOutline, applyGlass, drawAbove, makeButton, makeImage, makeText, WHITE} from "./CaptionUiKit"

export const PICKER_DISTANCE_CM = 60

const BUTTON_W = 6.6
const BUTTON_H = 3.0
const GAP = 0.8
const LABEL_W = 6.5
const STATUS_W = 5.5
// "Switch" at the right end goes back to the start card to pick another conversation.
const SWITCH_W = 6.0
// "Recap" above the right end opens the conversation recap.
const RECAP_W = 6.0
const PAD = 1.0
const CONTENT_Z = 0.6
// Small logo sitting just above the panel's left end, in panel cm before scaling.
const LOGO_HEIGHT = 2.6
const LOGO_GAP = 0.6

const SELECTED_COLOR = new vec4(0.45, 0.9, 0.55, 1)
const STATUS_DEMO_COLOR = new vec4(0.45, 0.9, 0.55, 1)

export class LanguagePicker {
  readonly root: SceneObject
  private buttons: {code: LanguageCode; button: Button; label: Text; text: string}[] = []
  private listeners: ((code: LanguageCode) => void)[] = []
  private switchListeners: (() => void)[] = []
  private recapListeners: (() => void)[] = []
  private recapLabel: Text
  private selected: LanguageCode
  private statusText: Text
  private ready = false
  private wantVisible = false
  // Full width in cm before any scaling.
  readonly width: number

  // `logo`, when given, shows as a small SubSpecs logo above the panel's left end.
  constructor(parent: SceneObject, initial: LanguageCode, logo?: Material) {
    this.selected = initial
    this.root = global.scene.createSceneObject("LanguagePicker")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const count = DEMO_LANGUAGES.length
    const width = PAD * 2 + LABEL_W + count * BUTTON_W + (count + 2) * GAP + STATUS_W + SWITCH_W
    this.width = width
    const height = BUTTON_H + PAD * 2
    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(width, height)
    // Liquid glass like the speaker cards, drawn after the people so they never cover the bar.
    plate.renderOrder = GLASS_RENDER_ORDER

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
      rect: Rect.create(x, x + STATUS_W, -BUTTON_H / 2, BUTTON_H / 2),
      align: HorizontalAlignment.Right,
      color: STATUS_DEMO_COLOR
    })
    x += STATUS_W + GAP

    const {button: switchButton} = makeButton(
      content,
      "SwitchButton",
      "Switch",
      new vec2(SWITCH_W, BUTTON_H),
      PICKER_DISTANCE_CM,
      new vec3(x + SWITCH_W / 2, 0, 0)
    )
    switchButton.onTriggerUp.add(() => this.switchListeners.forEach((fn) => fn()))
    this.refreshSelection()

    // "Recap" sits just above the bar's right end (the logo sits above its left end), so the
    // bar's own buttons keep their size.
    const recap = makeButton(
      content,
      "RecapButton",
      "Recap",
      new vec2(RECAP_W, BUTTON_H),
      PICKER_DISTANCE_CM,
      new vec3(width / 2 - PAD - RECAP_W / 2, height / 2 + LOGO_GAP + BUTTON_H / 2, 0)
    )
    this.recapLabel = recap.label
    recap.button.onTriggerUp.add(() => this.recapListeners.forEach((fn) => fn()))

    if (logo) {
      const logoW = LOGO_HEIGHT * LOGO_ASPECT
      makeImage(content, "Logo", logo, new vec2(logoW, LOGO_HEIGHT),
        new vec3(-width / 2 + PAD + logoW / 2, height / 2 + LOGO_GAP + LOGO_HEIGHT / 2, 0))
    }

    // Everything on the bar draws over the glass; buttons build their faces when they initialize.
    // Words get the cards' dark outline so they stay readable over whatever is behind the glass.
    const raise = () => drawAbove(this.root, GLASS_RENDER_ORDER + 1)
    for (const b of this.buttons) b.button.onInitialized.add(raise)
    switchButton.onInitialized.add(raise)
    recap.button.onInitialized.add(raise)
    this.forEachText(content, (t) => addTextOutline(t))

    plate.onInitialized.add(() => {
      applyGlass(this.root.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle, false)
      raise()
      // The background is only a backdrop: its own collider would catch reaches meant for the buttons.
      const collider = this.root.getComponent("Physics.ColliderComponent")
      if (collider) collider.enabled = false
      const plateTarget = this.root.getComponent(Interactable.getTypeName())
      if (plateTarget) plateTarget.enabled = false
      this.ready = true
      this.root.enabled = this.wantVisible
    })
  }

  private forEachText(so: SceneObject, fn: (t: Text) => void): void {
    for (const t of so.getComponents("Component.Text") as Text[]) fn(t)
    for (let i = 0; i < so.getChildrenCount(); i++) this.forEachText(so.getChild(i), fn)
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

  // Pinching "Switch" asks to go back to the start card.
  onSwitch(fn: () => void): void {
    this.switchListeners.push(fn)
  }

  // Pinching "Recap" asks to open or close the recap.
  onRecap(fn: () => void): void {
    this.recapListeners.push(fn)
  }

  // The Recap button shows green while the recap is open.
  setRecapOpen(open: boolean): void {
    this.recapLabel.textFill.color = open ? SELECTED_COLOR : WHITE
  }

  show(): void {
    this.wantVisible = true
    if (this.ready) this.root.enabled = true
  }

  hide(): void {
    this.wantVisible = false
    if (this.ready) this.root.enabled = false
  }

  private refreshSelection(): void {
    for (const b of this.buttons) {
      const isSelected = b.code === this.selected
      b.label.text = isSelected ? "✓ " + b.text : b.text
      b.label.textFill.color = isSelected ? SELECTED_COLOR : WHITE
    }
  }
}
