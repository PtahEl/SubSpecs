// SubSpecs. Demo mode plays the scripted three-speaker conversation picked on the start card
// (conference corridor or hospital intake), giving each voice its own sub card, with pre-written
// translations. Live mode listens to the microphone and puts what Gemini (through Snap's Remote
// Service Gateway) hears on one "Speaking" card, since nothing here can tell voices apart.
// Neither mode uses AsrModule: it turns on Bystander Speech Rejection, which hides everyone but the wearer.

import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DEMO_SCENARIOS, DemoLine, DemoScenarioId, LanguageCode, spokenWords} from "./CaptionDemoScript"
import {SpeakerCard, CARD_DISTANCE_CM} from "./SpeakerCard"
import {LanguagePicker, PICKER_DISTANCE_CM} from "./LanguagePicker"
import {OnboardingCard, ONBOARDING_DISTANCE_CM, StartChoice} from "./OnboardingCard"
import {placeInFrontOfCamera, spotInFrontOfCamera} from "./CaptionUiKit"
import {SpeakerFigures} from "./SpeakerFigures"
import {IntakeForm, INTAKE_DISTANCE_CM, INTAKE_RIGHT_CM, INTAKE_UP_CM} from "./IntakeForm"
import {RecapPanel, RECAP_DISTANCE_CM, RECAP_RIGHT_CM, RECAP_UP_CM} from "./RecapPanel"
import {LiveSession} from "./Live/LiveSession"
import {DemoVoices, TimedLine} from "./DemoVoices"
import {LiveTranslator} from "./Live/LiveTranslator"
import {GeminiTranslator} from "./Live/GeminiTranslator"
import {AudioSource, FileSource, MicrophoneSource} from "./Live/LiveAudio"
import {LiveNotice, NOTICE_DISTANCE_CM, NOTICE_UP_CM} from "./Live/LiveNotice"

// The single Live mode card's label, and what the recap calls the conversation.
export const LIVE_CARD_NAME = "Speaking"
export const LIVE_RECAP_NAME = "Conversation"

const SPEAKER_COUNT = 3
const PICKER_FIT_WIDTH_CM = 32
// Some Preview worlds (e.g. Sunlit Room) move the camera after the Lens starts, which left the start
// card out of view. Until the first pick, the start card and bar follow if the camera moves this far.
const START_UI_DRIFT_CM = 20
// Live words arrive all at once after the AI answers, so they type out faster than the demo voices.
const LIVE_WORDS_PER_SECOND = 8

@component
export class CaptionController extends BaseScriptComponent {
  @ui.label("SubSpecs — Demo and Live mode")
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

  @input
  @allowUndefined
  @hint("Demo voices: one recorded clip per scripted line, corridor lines then hospital lines (Assets/Demo/Voices). Words type out in time with each clip.")
  demoVoices: AudioTrackAsset[] = []

  @input
  @allowUndefined
  @hint("Live mode: an Audio Track asset set to Microphone Audio. Live mode can't start without it.")
  microphoneTrack: AudioTrackAsset

  @input
  @allowUndefined
  @hint("Preview only: a recorded clip Live mode listens to instead of the microphone, to test without the glasses. Leave empty for the glasses.")
  previewClip: AudioTrackAsset

  @input
  @allowUndefined
  @hint("Live mode: the Remote Service Gateway's Gemini_Sync service module (in the RemoteServiceGateway package).")
  geminiService: RemoteServiceModule

  @input
  @allowUndefined
  @hint("Internet Module. Snap requires it in Lenses that use the microphone with an online service, so the Lens can be published.")
  internetModule: InternetModule

  @input
  @allowUndefined
  @hint("SubSpecs logo material (white logo, see-through background) for the start card and the small logo above the language bar")
  logoMaterial: Material

  private camera: Transform
  private cards: SpeakerCard[] = []
  private heard = new Set<number>()
  private picker: LanguagePicker
  private onboarding: OnboardingCard
  private figures: SpeakerFigures
  private intake: IntakeForm
  private recap: RecapPanel
  private notice: LiveNotice
  private live: LiveSession | null = null
  private liveMode = false
  // LEAF tests: what the start card's Live button uses instead of the real AI, sound and internet.
  private liveForTests: {translator: LiveTranslator; source: AudioSource; online: () => boolean} | null = null
  // Lines being spoken now, by speaker; once said, they go into the recap (and the intake form).
  private speaking = new Map<number, DemoLine>()

  private running = false
  private everStarted = false
  private scenarioId: DemoScenarioId = "corridor"
  private lines: DemoLine[] = DEMO_SCENARIOS.corridor
  // This conversation's lines with when each starts and how long its voice lasts.
  private timed: TimedLine[] = []
  private voices: DemoVoices
  private clock = 0
  private nextLine = 0

  onAwake(): void {
    this.camera = WorldCameraFinderProvider.getInstance().getTransform()

    this.onboarding = new OnboardingCard(this.sceneObject, this.logoMaterial)
    this.picker = new LanguagePicker(this.sceneObject, this.startLanguage as LanguageCode, this.logoMaterial)
    this.intake = new IntakeForm(this.sceneObject, (patient) => this.cards[patient - 1].name)
    this.recap = new RecapPanel(this.sceneObject, (speaker) => (this.liveMode ? LIVE_RECAP_NAME : this.cards[speaker - 1].name))
    this.notice = new LiveNotice(this.sceneObject)
    for (let i = 1; i <= SPEAKER_COUNT; i++) {
      const card = new SpeakerCard(this.sceneObject, i, this.camera)
      card.setLanguage(this.startLanguage as LanguageCode)
      card.setWordsPerSecond(this.wordsPerSecond)
      this.cards.push(card)
    }

    this.picker.onLanguageChanged((code) => this.cards.forEach((c) => c.setLanguage(code)))
    this.onboarding.onStart((choice) => this.begin(choice))
    this.picker.onSwitch(() => this.switchScenario())
    this.picker.onRecap(() => this.toggleRecap())
    this.figures = new SpeakerFigures(this.speakerFigures ?? [])
    this.voices = new DemoVoices(this.sceneObject, this.demoVoices ?? [], SPEAKER_COUNT)

    this.createEvent("OnStartEvent").bind(() => {
      this.placeStartUi()
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

  get scenario(): DemoScenarioId {
    return this.scenarioId
  }

  get isLive(): boolean {
    return this.liveMode
  }

  get liveSession(): LiveSession | null {
    return this.live
  }

  get liveNotice(): LiveNotice {
    return this.notice
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

  get demoVoice(): DemoVoices {
    return this.voices
  }

  // When each line of the conversation running now starts, and how long it lasts.
  get timedLines(): TimedLine[] {
    return this.timed
  }

  get intakeForm(): IntakeForm {
    return this.intake
  }

  get recapPanel(): RecapPanel {
    return this.recap
  }

  // The language bar's Recap: open the recap in the top left of the view, or close it.
  toggleRecap(): void {
    if (!this.recap.visible) placeInFrontOfCamera(this.recap.root, this.camera, RECAP_RIGHT_CM, RECAP_UP_CM, RECAP_DISTANCE_CM)
    this.recap.toggle()
    this.picker.setRecapOpen(this.recap.visible)
  }

  // LEAF tests: the next Live start uses this fake AI, sound and internet check.
  useLiveForTests(translator: LiveTranslator, source: AudioSource, online: () => boolean): void {
    this.liveForTests = {translator, source, online}
  }

  clearLiveForTests(): void {
    this.liveForTests = null
  }

  private placeStartUi(): void {
    placeInFrontOfCamera(this.onboarding.root, this.camera, 0, 0, ONBOARDING_DISTANCE_CM)
    // Low in the view but inside it: the view's bottom edge is about 18 degrees down.
    placeInFrontOfCamera(this.picker.root, this.camera, 0, -15, PICKER_DISTANCE_CM)
  }

  // Before the first pick only: if the camera has moved away from the start card, bring it back.
  private keepStartUiInView(): void {
    if (this.everStarted || !this.onboarding.visible) return
    const spot = spotInFrontOfCamera(this.camera, 0, 0, ONBOARDING_DISTANCE_CM)
    if (spot.distance(this.onboarding.root.getTransform().getWorldPosition()) > START_UI_DRIFT_CM) this.placeStartUi()
  }

  private begin(choice: StartChoice): void {
    this.everStarted = true
    const t = this.liveForTests
    if (choice === "live" && t) this.startLive(t.translator, t.source, t.online)
    else if (choice === "live") this.startLive()
    else this.startDemo(choice)
  }

  startDemo(scenario: DemoScenarioId = "corridor"): void {
    this.liveMode = false
    this.picker.setStatus("demo")
    this.scenarioId = scenario
    this.lines = DEMO_SCENARIOS[scenario]
    this.timed = this.voices.schedule(this.lines, (line) => spokenWords(line).length / this.wordsPerSecond)
    this.picker.show()
    this.running = true
    this.restartConversation()
    if (scenario === "hospital") {
      // Top right, above the patients' heads, so the form never covers a face.
      placeInFrontOfCamera(this.intake.root, this.camera, INTAKE_RIGHT_CM, INTAKE_UP_CM, INTAKE_DISTANCE_CM)
      this.intake.show()
    }
  }

  // Live mode: the microphone (or, in Preview, the recorded clip), sent to the AI. Tests pass a
  // fake AI and their own sound.
  startLive(translator?: LiveTranslator, source?: AudioSource, online?: () => boolean): void {
    this.liveMode = true
    this.running = false
    this.restartConversation()
    this.cards.forEach((c) => {
      c.setAnonymousName(LIVE_CARD_NAME)
      c.setWordsPerSecond(LIVE_WORDS_PER_SECOND)
    })
    this.picker.show()
    placeInFrontOfCamera(this.notice.root, this.camera, 0, NOTICE_UP_CM, NOTICE_DISTANCE_CM)

    const audio = source ?? this.liveAudio()
    if (!audio) {
      this.picker.setStatus("stopped")
      this.notice.set("Live mode isn't set up: no microphone track in the Lens. (NO_MIC_TRACK)")
      return
    }
    if (!translator && !this.geminiService) {
      this.picker.setStatus("stopped")
      this.notice.set("Live mode isn't set up: the AI service module is missing from the Lens. (NO_SERVICE)")
      return
    }
    this.live = new LiveSession(audio, translator ?? new GeminiTranslator(this.geminiService), online)
    this.live.onLine((line) => this.deliverLine(line))
    this.live.onChange(() => this.showLiveState())
    this.live.start()
    this.showLiveState()
  }

  private liveAudio(): AudioSource | null {
    if (this.previewClip && global.deviceInfoSystem.isEditor()) return new FileSource(this.previewClip)
    return this.microphoneTrack ? new MicrophoneSource(this.microphoneTrack) : null
  }

  private showLiveState(): void {
    if (!this.live) return
    const state = this.live.state
    this.picker.setStatus(state === "listening" ? "live" : state === "offline" ? "offline" : "stopped")
    this.notice.set(this.live.notice)
  }

  private stopLive(): void {
    this.live?.stop()
    this.live = null
    this.liveMode = false
    this.notice.set("")
    this.cards.forEach((c, i) => {
      c.setAnonymousName("Speaker " + (i + 1))
      c.setWordsPerSecond(this.wordsPerSecond)
    })
  }

  // From the first line again: empty intake forms and recap, nothing being said.
  private restartConversation(): void {
    this.voices.stopAll()
    this.clock = 0
    this.nextLine = 0
    this.speaking.clear()
    this.intake.clear()
    this.recap.clear()
  }

  // The language bar's Switch: stop the conversation, clear every card and person, and bring
  // the start card back in front of the wearer. The language setting stays as it is.
  switchScenario(): void {
    this.stopLive()
    this.picker.setStatus("demo")
    this.running = false
    this.restartConversation()
    this.intake.hide()
    this.recap.hide()
    this.picker.setRecapOpen(false)
    this.heard.clear()
    this.cards.forEach((c) => c.reset())
    this.figures.reset()
    this.picker.hide()
    placeInFrontOfCamera(this.onboarding.root, this.camera, 0, 0, ONBOARDING_DISTANCE_CM)
    this.onboarding.show()
  }

  get startCardVisible(): boolean {
    return this.onboarding.visible
  }

  private onUpdate(): void {
    const dt = getDeltaTime()
    this.keepStartUiInView()
    if (this.running) {
      this.clock += dt
      while (this.nextLine < this.timed.length && this.timed[this.nextLine].start <= this.clock) {
        this.deliver(this.nextLine)
        this.nextLine++
      }
      if (this.nextLine >= this.timed.length && this.loopDemo) {
        const last = this.timed[this.timed.length - 1]
        const lastEnds = last.start + last.seconds
        if (this.clock > lastEnds + this.holdSeconds + this.loopPauseSeconds) this.restartConversation()
      }
    }
    this.live?.update(dt)
    this.cards.forEach((c) => c.update(dt, this.holdSeconds))
    // A line is said once its card stops typing; it then joins the recap and fills the intake form.
    this.speaking.forEach((line, speaker) => {
      if (this.cards[speaker - 1].isSpeaking) return
      this.speaking.delete(speaker)
      this.recap.add(line)
      if (!this.liveMode && this.scenarioId === "hospital") this.intake.fill(line)
    })
    this.intake.update(dt)
    this.figures.update(this.cards.map((c) => c.isSpeaking))
  }

  // A scripted line: its voice plays and its words type out over the clip's length.
  private deliver(index: number): void {
    const t = this.timed[index]
    const card = this.cards[t.line.speaker - 1]
    card.setWordsPerSecond(spokenWords(t.line).length / t.seconds)
    if (t.clip) this.voices.play(t.line.speaker, t.clip)
    this.deliverLine(t.line)
  }

  private deliverLine(line: DemoLine): void {
    const card = this.cards[line.speaker - 1]
    // Live mode can't tell voices apart, so it never claims a new speaker.
    const isNew = !this.liveMode && !this.heard.has(line.speaker)
    this.heard.add(line.speaker)
    if (!card.placed) {
      // A new speaker's card appears in an arc in front of the wearer, a little below
      // eye level, until the wearer moves it. After that it keeps its spot.
      // 10.2 degrees apart keeps all three inside the view with a small gap between them.
      // Live mode's single card sits in the middle.
      const slot = this.liveMode ? 0 : line.speaker - 2
      const angle = (slot * 10.2 * Math.PI) / 180
      placeInFrontOfCamera(
        card.root,
        this.camera,
        Math.sin(angle) * CARD_DISTANCE_CM,
        -12,
        Math.cos(angle) * CARD_DISTANCE_CM
      )
      card.placed = true
      card.rebase()
    }
    // A new bit of speech arriving while the last is still typing: the last one counts as said.
    const before = this.speaking.get(line.speaker)
    if (this.liveMode && before && before !== line) this.recap.add(before)
    card.speak(line, isNew)
    this.speaking.set(line.speaker, line)
    if (!this.liveMode && this.scenarioId === "hospital") this.intake.showPatient(line.speaker)
  }
}
