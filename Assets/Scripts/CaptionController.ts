// Subspecs — Demo mode. Plays a scripted three-speaker corridor conversation, giving each
// voice its own sub card, with pre-written translations and an onboarding card.
// Demo mode never uses AsrModule (it would turn on Bystander Speech Rejection).

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DEMO_LINES, LanguageCode, spokenText} from "./CaptionDemoScript"
import {SpeakerCard, CARD_DISTANCE_CM} from "./SpeakerCard"
import {LanguagePicker, PICKER_DISTANCE_CM} from "./LanguagePicker"
import {OnboardingCard, ONBOARDING_DISTANCE_CM} from "./OnboardingCard"
import {placeInFrontOfCamera} from "./CaptionUiKit"
import {SpeakerFigures} from "./SpeakerFigures"

const SPEAKER_COUNT = 3
const PICKER_FIT_WIDTH_CM = 31

@component
export class CaptionController extends BaseScriptComponent {
  @ui.label("Subspecs — Demo mode")
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Seconds a card keeps the last words readable after its speaker stops talking")
  @widget(new SliderWidget(1, 10, 0.5))
  holdSeconds: number = 3

  @input
  @hint("Speaking speed of the scripted demo voices")
  @widget(new SliderWidget(1, 6, 0.1))
  wordsPerSecond: number = 2.8

  @input
  @hint("Replay the conversation after it ends")
  loopDemo: boolean = true

  @input
  @hint("Pause before the conversation replays")
  @widget(new SliderWidget(2, 30, 1))
  loopPauseSeconds: number = 8

  @input
  @hint("Translation language shown at start")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("Auto (detect and translate)", "auto"),
      new ComboBoxItem("Off", "off"),
      new ComboBoxItem("Español", "es"),
      new ComboBoxItem("Français", "fr"),
      new ComboBoxItem("日本語", "ja")
    ])
  )
  startLanguage: string = "auto"
  @ui.group_end

  @input
  @allowUndefined
  @hint("Demo stand-in people for speakers 1, 2 and 3; each plays its Talking animation while speaking")
  speakerFigures: SceneObject[] = []

  private camera: Transform
  private cards: SpeakerCard[] = []
  private heard = new Set<number>()
  private picker: LanguagePicker
  private onboarding: OnboardingCard
  private figures: SpeakerFigures

  private running = false
  private clock = 0
  private nextLine = 0

  onAwake(): void {
    this.camera = WorldCameraFinderProvider.getInstance().getTransform()

    this.onboarding = new OnboardingCard(this.sceneObject)
    this.picker = new LanguagePicker(this.sceneObject, this.startLanguage as LanguageCode)
    for (let i = 1; i <= SPEAKER_COUNT; i++) {
      const card = new SpeakerCard(this.sceneObject, i, this.camera)
      card.setLanguage(this.startLanguage as LanguageCode)
      card.setWordsPerSecond(this.wordsPerSecond)
      this.cards.push(card)
    }

    this.picker.onLanguageChanged((code) => this.cards.forEach((c) => c.setLanguage(code)))
    this.onboarding.onStart(() => this.startDemo())
    this.figures = new SpeakerFigures(this.speakerFigures ?? [])

    this.createEvent("OnStartEvent").bind(() => {
      placeInFrontOfCamera(this.onboarding.root, this.camera, 0, 0, ONBOARDING_DISTANCE_CM)
      // Low in the view but inside it: the view's bottom edge is about 18 degrees down.
      placeInFrontOfCamera(this.picker.root, this.camera, 0, -15, PICKER_DISTANCE_CM)
      // At 60 cm the view is only about 35 cm wide; shrink the picker to fit with a margin.
      const scale = Math.min(1, PICKER_FIT_WIDTH_CM / this.picker.width)
      this.picker.root.getTransform().setLocalScale(vec3.one().uniformScale(scale))
    })
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  // ── Public state, used by the LEAF tests ──
  get isRunning(): boolean {
    return this.running
  }

  get demoTime(): number {
    return this.clock
  }

  get language(): LanguageCode {
    return this.picker.language
  }

  get status(): string {
    return this.picker.status
  }

  isFigureTalking(speaker: number): boolean {
    return this.figures.isTalking(speaker)
  }

  getCard(speaker: number): SpeakerCard {
    return this.cards[speaker - 1]
  }

  startDemo(): void {
    this.picker.show()
    this.running = true
    this.clock = 0
    this.nextLine = 0
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    if (this.running) {
      this.clock += dt
      while (this.nextLine < DEMO_LINES.length && DEMO_LINES[this.nextLine].at <= this.clock) {
        this.deliver(this.nextLine)
        this.nextLine++
      }
      if (this.nextLine >= DEMO_LINES.length && this.loopDemo) {
        const last = DEMO_LINES[DEMO_LINES.length - 1]
        const lastEnds = last.at + spokenText(last).split(" ").length / this.wordsPerSecond
        if (this.clock > lastEnds + this.holdSeconds + this.loopPauseSeconds) {
          this.clock = 0
          this.nextLine = 0
        }
      }
    }
    this.cards.forEach((c) => c.update(dt, this.holdSeconds))
    this.figures.update(this.cards.map((c) => c.isSpeaking))
  }

  private deliver(index: number): void {
    const line = DEMO_LINES[index]
    const card = this.cards[line.speaker - 1]
    const isNew = !this.heard.has(line.speaker)
    this.heard.add(line.speaker)
    if (!card.placed) {
      // A new speaker's card appears in an arc in front of the wearer, a little below
      // eye level, until the wearer moves it. After that it keeps its spot.
      // 10.2 degrees apart keeps all three inside the view with a small gap between them.
      const angle = ((line.speaker - 2) * 10.2 * Math.PI) / 180
      placeInFrontOfCamera(
        card.root,
        this.camera,
        Math.sin(angle) * CARD_DISTANCE_CM,
        -12,
        Math.cos(angle) * CARD_DISTANCE_CM
      )
      card.placed = true
    }
    card.speak(line, isNew)
  }
}
