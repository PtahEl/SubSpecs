// A small notice just above the language bar in Live mode: no internet, the AI service is busy,
// Live mode isn't set up, and the like, in plain words with a code. Hidden when all is well.

import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {makeText} from "../CaptionUiKit"

export const NOTICE_DISTANCE_CM = 60
// Up from the view's center, in cm at 60 cm: just above the bar, its logo and Recap button.
export const NOTICE_UP_CM = -9.5

const WIDTH = 26
const HEIGHT = 3.4
const PAD = 0.8
const CONTENT_Z = 0.6
const NOTICE_COLOR = new vec4(1.0, 0.8, 0.45, 1)

export class LiveNotice {
  readonly root: SceneObject
  private text: Text
  private ready = false
  private wantVisible = false

  constructor(parent: SceneObject) {
    this.root = global.scene.createSceneObject("LiveNotice")
    this.root.setParent(parent)
    this.root.createComponent("Component.Canvas")

    const plate = this.root.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.style = "dark"
    plate.size = new vec2(WIDTH, HEIGHT)

    const content = global.scene.createSceneObject("Content")
    content.setParent(this.root)
    content.getTransform().setLocalPosition(new vec3(0, 0, CONTENT_Z))
    this.text = makeText(content, "LiveNoticeText", "", {
      role: "Caption",
      distanceCm: NOTICE_DISTANCE_CM,
      rect: Rect.create(-WIDTH / 2 + PAD, WIDTH / 2 - PAD, -HEIGHT / 2 + PAD / 2, HEIGHT / 2 - PAD / 2),
      align: HorizontalAlignment.Center,
      color: NOTICE_COLOR,
      wrap: true
    })

    plate.onInitialized.add(() => {
      this.ready = true
      this.root.enabled = this.wantVisible
    })
  }

  get message(): string {
    return this.wantVisible ? this.text.text : ""
  }

  get visible(): boolean {
    return this.root.enabled
  }

  // Shows `message`, or hides the notice when it's "".
  set(message: string): void {
    this.text.text = message
    this.wantVisible = message !== ""
    if (this.ready) this.root.enabled = this.wantVisible
  }
}
