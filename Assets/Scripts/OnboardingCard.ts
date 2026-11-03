// Start card: what SubSpecs does, the privacy note, a button for each demo conversation and one
// for Live mode.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {LOGO_ASPECT, makeButton, makeImage, makeText} from "./CaptionUiKit"
import {DemoScenarioId} from "./CaptionDemoScript"

export const ONBOARDING_DISTANCE_CM = 100

// What the start card can begin: one of the scripted demos, or Live mode.
export type StartChoice = DemoScenarioId | "live"

const WIDTH = 36
const HEIGHT = 25
const PAD = 2.0
const CONTENT_Z = 0.6
const LOGO_HEIGHT = 3.8
const BUTTON_WIDTH = 10.4
const BUTTON_OFFSET = 11

export const ONBOARDING_BODY =
  "Live subs for every voice around you. In the demos each speaker gets their own color-coded card; " +
  "Live mode puts what it hears on one \"Speaking\" card, since it can't tell voices apart, and hides your own speech when it can tell. " +
  "Anyone speaking another language is translated automatically; pick a language at the bottom to change it."

export const PRIVACY_NOTE =
  "Privacy: subs are shown only to you. The demos use no microphone. In Live mode, what the " +
  "microphone hears is sent to Snap's cloud and Google's Gemini AI to be written down and translated. " +
  "SubSpecs itself saves no audio or text; names are forgotten when the conversation ends. No face recognition."

export class OnboardingCard {
  readonly root: SceneObject
  private listeners: ((choice: StartChoice) => void)[] = []
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
    makeText(content, "ModeLabel", "Demo: scripted conversations · Live: real speech, needs internet", {
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

    // One button per scripted conversation, then Live mode, side by side.
    const buttonY = -HEIGHT / 2 + PAD + 1.8
    const choices: [string, string, StartChoice, number][] = [
      ["CorridorButton", "Conference corridor", "corridor", -BUTTON_OFFSET],
      ["HospitalButton", "Hospital intake", "hospital", 0],
      ["LiveButton", "Live", "live", BUTTON_OFFSET]
    ]
    for (const [name, label, scenario, x] of choices) {
      const {button} = makeButton(content, name, label, new vec2(BUTTON_WIDTH, 3.6), d, new vec3(x, buttonY, 0))
      button.onTriggerUp.add(() => this.start(scenario))
    }
  }

  onStart(fn: (choice: StartChoice) => void): void {
    this.listeners.push(fn)
  }

  // Shown again by the language bar's Switch button, ready for another pick.
  show(): void {
    this.started = false
    this.root.enabled = true
  }

  get visible(): boolean {
    return this.root.enabled
  }

  start(choice: StartChoice): void {
    if (this.started) return
    this.started = true
    this.root.enabled = false
    this.listeners.forEach((fn) => fn(choice))
  }
}
