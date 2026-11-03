import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {OnboardingStartsDemoScenario} from "./OnboardingStartsDemoScenario"
import {ThreeSpeakersThreeCardsScenario} from "./ThreeSpeakersThreeCardsScenario"
import {CardHoldAndReturnScenario} from "./CardHoldAndReturnScenario"
import {DragCardOverFigureScenario} from "./DragCardOverFigureScenario"
import {LanguageSwitchScenario} from "./LanguageSwitchScenario"
import {LanguagePickerReachIKScenario} from "./LanguagePickerReachIKScenario"
import {AutoDetectLanguageScenario} from "./AutoDetectLanguageScenario"
import {FigureTalksWhileSpeakingScenario} from "./FigureTalksWhileSpeakingScenario"
import {HospitalIntakeStartsScenario} from "./HospitalIntakeStartsScenario"
import {HospitalHighlightsScenario} from "./HospitalHighlightsScenario"
import {SwitchScenarioScenario} from "./SwitchScenarioScenario"
import {LiquidGlassCardsScenario} from "./LiquidGlassCardsScenario"
import {IntakeFormScenario} from "./IntakeFormScenario"
import {ReplyHelpScenario} from "./ReplyHelpScenario"
import {NamedSpeakersScenario} from "./NamedSpeakersScenario"
import {RecapScenario} from "./RecapScenario"
import {DepthEffectScenario} from "./DepthEffectScenario"
import {LiveModeScenario} from "./LiveModeScenario"
import {DemoVoicesScenario} from "./DemoVoicesScenario"

// Order matters: onboarding starts the demo, and the new-speaker check needs the start
// of the conversation. Ids are prefixed with the done-criterion number from the brief.
@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "c5-onboarding-starts-demo", typename: OnboardingStartsDemoScenario.getTypeName()},
    {id: "c1-three-speakers-three-cards", typename: ThreeSpeakersThreeCardsScenario.getTypeName()},
    {id: "c3-card-hold-and-return", typename: CardHoldAndReturnScenario.getTypeName()},
    {id: "c2-drag-card-over-figure", typename: DragCardOverFigureScenario.getTypeName()},
    {id: "c4-language-switch", typename: LanguageSwitchScenario.getTypeName()},
    {id: "reach-language-picker-ik", typename: LanguagePickerReachIKScenario.getTypeName()},
    {id: "auto-detect-language", typename: AutoDetectLanguageScenario.getTypeName()},
    {id: "figure-talks-while-speaking", typename: FigureTalksWhileSpeakingScenario.getTypeName()},
    {id: "c6-hospital-intake-starts", typename: HospitalIntakeStartsScenario.getTypeName()},
    {id: "c7-hospital-highlights", typename: HospitalHighlightsScenario.getTypeName()},
    {id: "switch-scenario", typename: SwitchScenarioScenario.getTypeName()},
    {id: "c14-liquid-glass-cards", typename: LiquidGlassCardsScenario.getTypeName()},
    {id: "c8-intake-form", typename: IntakeFormScenario.getTypeName()},
    {id: "c12-reply-help", typename: ReplyHelpScenario.getTypeName()},
    {id: "named-speakers", typename: NamedSpeakersScenario.getTypeName()},
    {id: "c11-recap", typename: RecapScenario.getTypeName()},
    {id: "depth-effect", typename: DepthEffectScenario.getTypeName()},
    {id: "live-mode", typename: LiveModeScenario.getTypeName(), parameters: {screenshot: "false", real: "false"}},
    {id: "demo-voices", typename: DemoVoicesScenario.getTypeName()}
  ]
}
