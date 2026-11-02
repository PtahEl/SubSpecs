// Criterion 1: as each of the three voices starts talking, a new color-coded card appears
// with "New speaker detected" — three cards for three voices.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {cardText, controller, ensureDemoRunning, pressStart, waitFor} from "./CaptionTestUtils"

function findSpeakerColor(speaker: number): vec4 {
  const t = cardText(speaker, "SpeakerLabel")
  // "Speaker N" until they say their name in a finished line.
  expect(t.text).toBe("● " + controller().getCard(speaker).name)
  return t.textFill.color
}

@component
export class ThreeSpeakersThreeCardsScenario extends Scenario {
  async run(): Promise<void> {
    await ensureDemoRunning(pressStart)
    const c = controller()
    const colors: vec4[] = []
    for (const speaker of [1, 2, 3]) {
      const card = c.getCard(speaker)
      await waitFor("card " + speaker + " to appear", () => card.visible, 40000)
      expect(card.badgeVisible).toBe(true)
      expect(cardText(speaker, "NewSpeakerBadge").text).toBe("New speaker detected")
      // The badge fades on its own after about 2 s.
      const shownFor = await waitFor("card " + speaker + " badge to fade", () => !card.badgeVisible, 4000)
      expect(shownFor).toBeGreaterThan(1.0)
      colors.push(findSpeakerColor(speaker))
    }
    let visibleCards = 0
    for (const speaker of [1, 2, 3]) if (controller().getCard(speaker).placed) visibleCards++
    expect(visibleCards).toBe(3)
    // Each card has its own color.
    expect(colors[0].equal(colors[1])).toBe(false)
    expect(colors[1].equal(colors[2])).toBe(false)
    expect(colors[0].equal(colors[2])).toBe(false)
  }
}
