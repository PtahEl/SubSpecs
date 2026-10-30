// Start card: what SubSpecs does, the privacy note, and the Start button.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {LOGO_ASPECT, makeButton, makeImage, makeText} from "./CaptionUiKit"

export const ONBOARDING_DISTANCE_CM = 100

const WIDTH = 36
const HEIGHT = 25
const PAD = 2.0
const CONTENT_Z = 0.6
const LOGO_HEIGHT = 3.8

export const ONBOARDING_BODY =
  "Live subs for every voice around you. Each new speaker gets their own color-coded card. " +
  "Pinch and drag a card over the person talking; it stays there for the rest of the conversation. " +
  "Anyone speaking another language is translated automatically; pick a language at the bottom to change it."

export const PRIVACY_NOTE =
  "Privacy: subs are shown only to you. Audio is never stored. " +
  "Speakers are anonymous numbers, with no face recognition."

export class OnboardingCard {
  readonly root: SceneObject
  private listeners: (() => void)[] = []
  private started = false

  // `logo` replaces the "SubSpecs" title text when given.
  constructor(parent: SceneObject, logo?: Material) {
    this.root = global.scene.createSceneObject("OnboardingCard")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(WIDTH, HEIGHT)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))

    const d = ONBOARDING_DISTANCE_CM
    const left = -WIDTH / 2 + PAD
    const right = WIDTH / 2 - PAD
    const top = HEIGHT / 2 - PAD

    if (logo) {
      makeImage(content, "Logo", logo, new vec2(LOGO_HEIGHT * LOGO_ASPECT, LOGO_HEIGHT), new vec3(0, top - 2, 0))
    } else {
      makeText(content, "Title", "SubSpecs", {
        role: "Title2",
        distanceCm: d,
        rect: Rect.create(left, right, top - 4, top),
        align: HorizontalAlignment.Center
      })
    }
    makeText(content, "ModeLabel", "Demo mode · scripted conversation, no server needed", {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(left, right, top - 6, top - 4),
      align: HorizontalAlignment.Center,
      color: new vec4(0.45, 0.9, 0.55, 1)
    })
    makeText(content, "Description", ONBOARDING_BODY, {
      role: "Body",
      distanceCm: d,
      rect: Rect.create(left, right, -1.5, top - 6.6),
      valign: VerticalAlignment.Top,
      wrap: true
    })
    makeText(content, "PrivacyNote", PRIVACY_NOTE, {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(left, right, -6.8, -1.8),
      valign: VerticalAlignment.Top,
      color: new vec4(0.35, 0.85, 1.0, 1),
      wrap: true
    })

    const {button} = makeButton(
      content,
      "StartButton",
      "Start",
      new vec2(12, 3.6),
      d,
      new vec3(0, -HEIGHT / 2 + PAD + 1.8, 0)
    )
    button.onTriggerUp.add(() => this.start())
  }

  onStart(fn: () => void): void {
    this.listeners.push(fn)
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.root.enabled = false
    this.listeners.forEach((fn) => fn())
  }
}
