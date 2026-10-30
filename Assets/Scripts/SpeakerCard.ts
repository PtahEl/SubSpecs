// One caption card per speaker: color + number, the live line, the final line, and the
// translation underneath. The wearer pinches and drags it anywhere; it stays there.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {DemoLine, LanguageCode, translationOf} from "./CaptionDemoScript"
import {makeText, setTextAlpha, speakerColor, withAlpha, faceCamera} from "./CaptionUiKit"

// Specs shows about 32 degrees across (about 64 cm at 110 cm), so three cards side by side fit.
export const CARD_DISTANCE_CM = 110
export const CARD_WIDTH = 19
export const CARD_HEIGHT = 16

const PAD = 1.4
const INNER_LEFT = -CARD_WIDTH / 2 + PAD
const INNER_RIGHT = CARD_WIDTH / 2 - PAD
const CONTENT_Z = 0.6

const LIVE_ALPHA = 0.7
const PREVIOUS_ALPHA = 0.55
const PREVIOUS_FADE_SECONDS = 2.5
const BADGE_HOLD_SECONDS = 1.2
const BADGE_FADE_SECONDS = 0.8

export class SpeakerCard {
  readonly speaker: number
  readonly root: SceneObject

  // True once the card has been placed for this speaker; its spot is kept for the session.
  placed = false
  // True while the wearer is dragging the card.
  dragging = false

  private backPlate: BackPlate
  private ready = false
  private wantVisible = false

  private speakerLabel: Text
  private badge: Text
  private currentText: Text
  private translationText: Text
  private previousText: Text

  private line: DemoLine | null = null
  private words: string[] = []
  private revealed = 0
  private typing = false
  private wordsPerSecond = 2.8
  private typeClock = 0

  private holdRemaining = 0
  private previousAge = -1
  private badgeAge = -1
  private language: LanguageCode = "es"

  constructor(parent: SceneObject, speaker: number, private camera: Transform) {
    this.speaker = speaker
    this.root = global.scene.createSceneObject("SpeakerCard_" + speaker)
    this.root.setParent(parent)

    this.root.createComponent("Component.Canvas")
    this.backPlate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    this.backPlate.style = "dark"
    this.backPlate.size = new vec2(CARD_WIDTH, CARD_HEIGHT)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))
    this.buildContent(content)

    const onReady = () => this.onBackPlateReady()
    if (this.backPlate.initialized) onReady()
    else this.backPlate.onInitialized.add(onReady)
  }

  private buildContent(content: SceneObject): void {
    const color = speakerColor(this.speaker)
    const d = CARD_DISTANCE_CM
    const top = CARD_HEIGHT / 2 - PAD

    this.speakerLabel = makeText(content, "SpeakerLabel", "● Speaker " + this.speaker, {
      role: "Subheadline",
      distanceCm: d,
      rect: Rect.create(INNER_LEFT, 0, top - 2.2, top),
      color
    })
    this.badge = makeText(content, "NewSpeakerBadge", "New speaker detected", {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(-1, INNER_RIGHT, top - 2.2, top),
      align: HorizontalAlignment.Right,
      color
    })
    this.badge.getSceneObject().enabled = false

    // Newest line on top, its translation underneath, the older line below fading away.
    this.currentText = makeText(content, "CurrentLine", "", {
      role: "Headline2",
      distanceCm: d,
      rect: Rect.create(INNER_LEFT, INNER_RIGHT, -0.6, top - 2.5),
      valign: VerticalAlignment.Bottom,
      wrap: true
    })
    this.translationText = makeText(content, "TranslationLine", "", {
      role: "Body",
      distanceCm: d,
      rect: Rect.create(INNER_LEFT, INNER_RIGHT, -3.9, -0.8),
      valign: VerticalAlignment.Top,
      color: withAlpha(color, 0.95),
      wrap: true
    })
    this.previousText = makeText(content, "PreviousLine", "", {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(INNER_LEFT, INNER_RIGHT, -CARD_HEIGHT / 2 + PAD, -4.2),
      valign: VerticalAlignment.Top,
      color: new vec4(1, 1, 1, PREVIOUS_ALPHA),
      wrap: true
    })
  }

  private onBackPlateReady(): void {
    this.ready = true
    const interactable = this.backPlate.interactable
    interactable.onHoverEnter.add(() => {
      this.backPlate.style = "default"
    })
    interactable.onHoverExit.add(() => {
      this.backPlate.style = "dark"
    })

    // Pinch-and-drag moves the card; it keeps facing the wearer, never scales or spins.
    const manipulation = this.root.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    manipulation.setNewInteractable(interactable)
    manipulation.setCanRotate(false)
    manipulation.setCanScale(false)
    // Move 1:1 with the hand: Z stretch would fling the card into the wearer's face or far away.
    manipulation.enableStretchZ = false
    manipulation.onManipulationStart.add(() => {
      this.dragging = true
      this.placed = true
    })
    manipulation.onManipulationEnd.add(() => {
      this.dragging = false
    })

    // Start hidden. This must run after BackPlate init, or the plate never initializes.
    this.root.enabled = this.wantVisible
  }

  get visible(): boolean {
    return this.root.enabled
  }

  get currentLineText(): string {
    return this.currentText.text
  }

  get translationLineText(): string {
    return this.translationText.getSceneObject().enabled ? this.translationText.text : ""
  }

  get previousLineText(): string {
    return this.previousText.text
  }

  get previousLineAlpha(): number {
    return this.previousText.textFill.color.w
  }

  get badgeVisible(): boolean {
    return this.badge.getSceneObject().enabled
  }

  get isSpeaking(): boolean {
    return this.typing
  }

  setWordsPerSecond(wps: number): void {
    this.wordsPerSecond = wps
  }

  setLanguage(language: LanguageCode): void {
    this.language = language
    this.refreshTranslation()
  }

  // A new line from this speaker: the card shows (in its saved spot), the new words go on
  // top, and the line they said before moves underneath and fades away.
  speak(line: DemoLine, isNewSpeaker: boolean): void {
    if (this.line !== null) {
      this.previousText.text = this.line.en
      this.previousAge = 0
      setTextAlpha(this.previousText, PREVIOUS_ALPHA)
    }
    this.line = line
    this.words = line.en.split(" ")
    this.revealed = 0
    this.typeClock = 0
    this.typing = true
    this.currentText.text = ""
    setTextAlpha(this.currentText, LIVE_ALPHA)
    this.refreshTranslation()

    if (isNewSpeaker) {
      this.badgeAge = 0
      this.badge.getSceneObject().enabled = true
      setTextAlpha(this.badge, 1)
    }
    this.show()
  }

  show(): void {
    this.wantVisible = true
    if (this.ready) this.root.enabled = true
  }

  hide(): void {
    this.wantVisible = false
    if (this.ready) this.root.enabled = false
  }

  update(dt: number, holdSeconds: number): void {
    if (this.typing) {
      this.typeClock += dt
      const target = Math.min(this.words.length, Math.floor(this.typeClock * this.wordsPerSecond) + 1)
      if (target !== this.revealed) {
        this.revealed = target
        this.currentText.text = this.words.slice(0, this.revealed).join(" ")
      }
      if (this.revealed >= this.words.length && this.typeClock * this.wordsPerSecond >= this.words.length) {
        this.finishLine()
        this.holdRemaining = holdSeconds
      }
    } else if (this.wantVisible && !this.dragging) {
      // Last words stay readable for the hold time after the speaker stops, then hide.
      this.holdRemaining -= dt
      if (this.holdRemaining <= 0) this.hide()
    }

    if (this.previousAge >= 0) {
      this.previousAge += dt
      const a = PREVIOUS_ALPHA * Math.max(0, 1 - this.previousAge / PREVIOUS_FADE_SECONDS)
      setTextAlpha(this.previousText, a)
      if (a <= 0) {
        this.previousAge = -1
        this.previousText.text = ""
      }
    }

    if (this.badgeAge >= 0) {
      this.badgeAge += dt
      const fade = (this.badgeAge - BADGE_HOLD_SECONDS) / BADGE_FADE_SECONDS
      setTextAlpha(this.badge, Math.max(0, Math.min(1, 1 - fade)))
      if (fade >= 1) {
        this.badgeAge = -1
        this.badge.getSceneObject().enabled = false
      }
    }

    if (this.root.enabled && !this.dragging) faceCamera(this.root, this.camera)
  }

  private finishLine(): void {
    this.typing = false
    this.currentText.text = this.line.en
    setTextAlpha(this.currentText, 1)
    this.refreshTranslation()
  }

  private refreshTranslation(): void {
    // Translations arrive with the final line, as they would from the Caption server.
    const show = this.language !== "off" && this.line !== null && !this.typing
    this.translationText.getSceneObject().enabled = show
    this.translationText.text = show ? translationOf(this.line, this.language) : ""
  }
}
