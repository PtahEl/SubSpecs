// One caption card per speaker: color + number, the live line, the final line, and the
// translation underneath. The wearer pinches and drags it anywhere; it stays there.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"
import {InteractableManipulation} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {
  DemoLine,
  LanguageCode,
  SPOKEN_LANGUAGE_NAMES,
  WEARER_LANGUAGE,
  highlightedTranslation,
  joinWords,
  spokenLanguageOf,
  spokenText,
  spokenWords,
  translationFor
} from "./CaptionDemoScript"
import {addTextOutline, makeText, setTextAlpha, speakerColor, withAlpha, faceCamera} from "./CaptionUiKit"

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

// Intake facts in the English translation (hospital scenario). Lime stands apart from all
// three speaker colors and reads well on the additive display.
export const HIGHLIGHT_HEX = "#C6FF4D"
const HIGHLIGHT_TAG = /<color=[^>]*>(.*?)<\/color>/g

// "Liquid glass" plate: a very see-through, slightly cool tint fading from a light sheen (top
// left) to a faint smoky blue (bottom right, behind the words, for contrast), with a thin bright
// rim so the card's shape still reads. No blur: SPECS can't blur the real world, and it would cost
// frame rate. Hover is a touch brighter.
const GLASS_START = new vec2(-1.3, 1.25)
const GLASS_END = new vec2(1.25, -1.3)
const GLASS_RIM_CM = 0.12
// Draw cards after the scene (people included); the glass plate doesn't hide what's behind, so
// anything drawn later would paint over the words.
const CARD_RENDER_ORDER = 100
const GLASS = {
  normal: {
    light: new vec4(0.78, 0.88, 1.0, 0.22),
    clear: new vec4(0.06, 0.1, 0.18, 0.3),
    rimBright: new vec4(1, 1, 1, 0.85),
    rimDim: new vec4(0.75, 0.88, 1.0, 0.25)
  },
  hover: {
    light: new vec4(0.85, 0.93, 1.0, 0.3),
    clear: new vec4(0.12, 0.18, 0.28, 0.35),
    rimBright: new vec4(1, 1, 1, 1),
    rimDim: new vec4(0.8, 0.92, 1.0, 0.4)
  }
}

export class SpeakerCard {
  readonly speaker: number
  readonly root: SceneObject

  // True once the card has been placed for this speaker; its spot is kept for the session.
  placed = false
  // True while the wearer is dragging the card.
  dragging = false

  private backPlate: BackPlate
  private glassHover = false
  private ready = false
  private wantVisible = false

  private speakerLabel: Text
  private badge: Text
  private languageTag: Text
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
  private language: LanguageCode = "auto"

  constructor(parent: SceneObject, speaker: number, private camera: Transform) {
    this.speaker = speaker
    this.root = global.scene.createSceneObject("SpeakerCard_" + speaker)
    this.root.setParent(parent)

    this.root.createComponent("Component.Canvas")
    this.backPlate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    this.backPlate.style = "dark"
    this.backPlate.size = new vec2(CARD_WIDTH, CARD_HEIGHT)
    this.backPlate.renderOrder = CARD_RENDER_ORDER

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
    // Shown while the speaker talks in a language other than the wearer's, in the same
    // corner as the "New speaker detected" badge, once that has faded.
    this.languageTag = makeText(content, "LanguageTag", "", {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(-1, INNER_RIGHT, top - 2.2, top),
      align: HorizontalAlignment.Right,
      color: new vec4(1, 1, 1, 0.8)
    })
    this.languageTag.getSceneObject().enabled = false

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
    this.translationText.enableRichText = true
    this.previousText = makeText(content, "PreviousLine", "", {
      role: "Caption",
      distanceCm: d,
      rect: Rect.create(INNER_LEFT, INNER_RIGHT, -CARD_HEIGHT / 2 + PAD, -4.2),
      valign: VerticalAlignment.Top,
      color: new vec4(1, 1, 1, PREVIOUS_ALPHA),
      wrap: true
    })

    for (const t of [this.speakerLabel, this.badge, this.languageTag, this.currentText, this.translationText, this.previousText]) {
      addTextOutline(t)
      t.renderOrder = CARD_RENDER_ORDER + 1
    }
  }

  private applyGlass(hover: boolean): void {
    this.glassHover = hover
    const g = hover ? GLASS.hover : GLASS.normal
    const plate = this.root.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    plate.gradient = true
    plate.setBackgroundGradient({
      type: "Linear",
      start: GLASS_START,
      end: GLASS_END,
      stop0: {enabled: true, color: g.light, percent: 0},
      stop1: {enabled: true, color: g.clear, percent: 1}
    })
    plate.border = true
    plate.borderSize = GLASS_RIM_CM
    plate.setBorderGradient({
      enabled: true,
      type: "Linear",
      start: GLASS_START,
      end: GLASS_END,
      stop0: {enabled: true, color: g.rimBright, percent: 0},
      stop1: {enabled: true, color: g.rimDim, percent: 1}
    })
  }

  private onBackPlateReady(): void {
    this.ready = true
    this.applyGlass(false)
    const interactable = this.backPlate.interactable
    interactable.onHoverEnter.add(() => this.applyGlass(true))
    interactable.onHoverExit.add(() => this.applyGlass(false))

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

  // The translation as plain words, without highlight markup.
  get translationLineText(): string {
    return this.translationText.getSceneObject().enabled ? this.translationText.text.replace(HIGHLIGHT_TAG, "$1") : ""
  }

  // The phrases currently drawn in the highlight color, read back from the Text component.
  get translationHighlights(): string[] {
    if (!this.translationText.getSceneObject().enabled) return []
    const found: string[] = []
    const text = this.translationText.text
    let m: RegExpExecArray | null
    HIGHLIGHT_TAG.lastIndex = 0
    while ((m = HIGHLIGHT_TAG.exec(text)) !== null) found.push(m[1])
    return found
  }

  get translationUsesRichText(): boolean {
    return this.translationText.enableRichText
  }

  get previousLineText(): string {
    return this.previousText.text
  }

  get previousLineAlpha(): number {
    return this.previousText.textFill.color.w
  }

  get languageTagText(): string {
    return this.languageTag.getSceneObject().enabled ? this.languageTag.text : ""
  }

  // The glass plate as drawn now, for the tests: gradient and rim on, and the two tint stops.
  get glassLook(): {gradient: boolean; rim: boolean; hover: boolean; light: vec4; clear: vec4} {
    const plate = this.root.getComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    const g = this.glassHover ? GLASS.hover : GLASS.normal
    return {gradient: plate.gradient, rim: plate.border, hover: this.glassHover, light: g.light, clear: g.clear}
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
      this.previousText.text = spokenText(this.line)
      this.previousAge = 0
      setTextAlpha(this.previousText, PREVIOUS_ALPHA)
    }
    this.line = line
    this.words = spokenWords(line)
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
    const spoken = spokenLanguageOf(line)
    this.languageTag.text = spoken === WEARER_LANGUAGE ? "" : SPOKEN_LANGUAGE_NAMES[spoken] + " detected"
    this.refreshLanguageTag()
    this.show()
  }

  // Back to a card that has heard nothing: hidden, empty, and placed afresh in the arc when its
  // speaker next talks. The language setting is kept.
  reset(): void {
    this.line = null
    this.words = []
    this.revealed = 0
    this.typing = false
    this.typeClock = 0
    this.holdRemaining = 0
    this.previousAge = -1
    this.badgeAge = -1
    this.placed = false
    this.dragging = false
    this.currentText.text = ""
    this.previousText.text = ""
    this.badge.getSceneObject().enabled = false
    this.languageTag.text = ""
    this.refreshLanguageTag()
    this.refreshTranslation()
    this.hide()
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
        this.currentText.text = joinWords(this.line, this.words.slice(0, this.revealed))
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
        this.refreshLanguageTag()
      }
    }

    if (this.root.enabled && !this.dragging) faceCamera(this.root, this.camera)
  }

  private finishLine(): void {
    this.typing = false
    this.currentText.text = spokenText(this.line)
    setTextAlpha(this.currentText, 1)
    this.refreshTranslation()
  }

  private refreshTranslation(): void {
    // Translations arrive with the final line, as they would from the SubSpecs server.
    const show = this.line !== null && !this.typing
    const text = show ? translationFor(this.line, this.language) : ""
    this.translationText.getSceneObject().enabled = text !== ""
    this.translationText.text = show ? highlightedTranslation(this.line, text, HIGHLIGHT_HEX) : text
  }

  private refreshLanguageTag(): void {
    this.languageTag.getSceneObject().enabled = this.languageTag.text !== "" && this.badgeAge < 0
  }
}
