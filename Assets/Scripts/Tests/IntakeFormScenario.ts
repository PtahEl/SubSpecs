// Criterion 8: in the hospital scenario, the patients' highlighted facts fill a small intake form
// (Allergies, Medicines, Pain, Since when, Symptoms), each field the moment its fact is said, with a
// brief flash. The form stays inside the view, above the patients' faces, and only in the hospital.

import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObject, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"
import {DemoLine, HOSPITAL_LINES, INTAKE_FIELDS} from "../CaptionDemoScript"
import {INTAKE_DISTANCE_CM} from "../IntakeForm"
import {controller, ensureDemoRunning, finishedLine, interactable, pressHospital, waitFor} from "./CaptionTestUtils"

// Answers checked: the first six (two per patient).
const LINES_TO_CHECK = 6
const FORM_HALF_HEIGHT_CM = 5
const FORM_HALF_WIDTH_CM = 6.5
const VIEW_HALF_WIDTH_DEG = 16

function degrees(rad: number): number {
  return (rad * 180) / Math.PI
}

@component
export class IntakeFormScenario extends Scenario {
  async run(): Promise<void> {
    const c = controller()
    expect(c.intakeForm.visible).toBe(false)
    await ensureDemoRunning(pressHospital)
    const form = c.intakeForm
    await waitFor("intake form to show", () => form.visible, 3000)

    // Inside the view and above every patient's head, as the wearer sees it.
    const cam = WorldCameraFinderProvider.getInstance().getTransform()
    const eye = cam.getWorldPosition()
    const look = cam.forward.uniformScale(-1)
    const toForm = form.root.getTransform().getWorldPosition().sub(eye)
    const right = look.cross(vec3.up()).normalize()
    const sideDeg = degrees(Math.atan2(toForm.dot(right), toForm.dot(look)))
    const formBottomDeg = degrees(Math.atan2(toForm.y - FORM_HALF_HEIGHT_CM, toForm.dot(look)))
    print("[Caption test] intake form " + sideDeg.toFixed(1) + " deg right, bottom edge " + formBottomDeg.toFixed(1) + " deg up")
    expect(Math.abs(sideDeg) + degrees(Math.atan(FORM_HALF_WIDTH_CM / INTAKE_DISTANCE_CM)) < VIEW_HALF_WIDTH_DEG).toBe(true)
    for (const figure of c.speakerFigures) {
      const head = findSceneObject((so) => (so.name.endsWith(":Head") ? so : undefined), figure)
      if (!head || head.getChildrenCount() === 0) throw new Error("Head not found on " + figure.name)
      const toTop = head.getChild(0).getTransform().getWorldPosition().sub(eye)
      const headTopDeg = degrees(Math.atan2(toTop.y, toTop.dot(look)))
      expect(formBottomDeg).toBeGreaterThan(headTopDeg)
    }

    // Each answer's facts land in that patient's form as soon as the answer is said, flashing.
    const checked = new Set<DemoLine>()
    await waitFor(
      LINES_TO_CHECK + " answers written into the intake form",
      () => {
        for (const speaker of [1, 2, 3]) {
          const line = finishedLine(speaker)
          if (!line || checked.has(line) || HOSPITAL_LINES.indexOf(line) < 0) continue
          expect(form.patient).toBe(speaker)
          for (const {field} of INTAKE_FIELDS) {
            const value = line.intake?.[field]
            if (value === undefined) continue
            expect(form.valueOf(field)).toBe(value)
            expect(form.storedValue(speaker, field)).toBe(value)
            expect(form.isFlashing(field)).toBe(true)
          }
          checked.add(line)
        }
        return checked.size >= LINES_TO_CHECK
      },
      60000
    )

    // Each patient keeps their own form: patient 3 said "Peanuts", patient 2 "None".
    expect(form.storedValue(3, "allergies")).toBe("Peanuts")
    expect(form.storedValue(2, "allergies")).toBe("None")
    expect(form.storedValue(1, "pain")).toBe("6 / 10, tight pressure")
    // The flash is brief: the sixth answer's "Allergies" just filled; it settles within 2 s.
    const flashedFor = await waitFor("the allergies flash to end", () => !form.isFlashing("allergies"), 2500)
    print("[Caption test] flash settled after " + flashedFor.toFixed(2) + " s more")

    // Hospital only: Switch hides it, and the corridor doesn't show it.
    await new DefaultLeafInteractor().trigger(interactable("SwitchButton"))
    await sleep(300)
    expect(form.visible).toBe(false)
    await new DefaultLeafInteractor().trigger(interactable("CorridorButton"))
    await sleep(500)
    expect(c.scenario).toBe("corridor")
    expect(form.visible).toBe(false)
  }
}
