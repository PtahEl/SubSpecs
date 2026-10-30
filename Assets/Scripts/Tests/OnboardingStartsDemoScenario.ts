// Criterion 5: the onboarding card explains Caption and the privacy note; Start begins the demo.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {controller, pressStart, textOf} from "./CaptionTestUtils"

@component
export class OnboardingStartsDemoScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const card = findSceneObjectByName("OnboardingCard")
    expect(card.enabled).toBe(true)
    expect(controller().isRunning).toBe(false)
    expect(textOf("Description").includes("Live subs for every voice")).toBe(true)
    expect(textOf("PrivacyNote").includes("Audio is never stored")).toBe(true)
    expect(textOf("PrivacyNote").includes("no face recognition")).toBe(true)

    await pressStart()

    expect(card.enabled).toBe(false)
    expect(controller().isRunning).toBe(true)
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(true)
    expect(controller().status.includes("DEMO")).toBe(true)
  }
}
