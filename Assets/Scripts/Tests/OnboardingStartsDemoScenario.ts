// Criterion 5: the onboarding card explains SubSpecs and the privacy note; "Conference corridor"
// begins the corridor conversation.

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

    expect(textOf("CorridorButtonLabel")).toBe("Conference corridor")
    expect(textOf("HospitalButtonLabel")).toBe("Hospital intake")

    await pressStart()

    expect(card.enabled).toBe(false)
    expect(controller().isRunning).toBe(true)
    expect(controller().scenario).toBe("corridor")
    expect(findSceneObjectByName("LanguagePicker").enabled).toBe(true)
    expect(controller().status.includes("DEMO")).toBe(true)
  }
}
