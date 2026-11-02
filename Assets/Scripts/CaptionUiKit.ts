// Shared UI helpers for Caption: type scale, speaker colors, text and button factories.

import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {RoundedRectangle} from "SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle"

// ── Type scale — calibrated for the SnapOS system font at 110 cm; pass the panel distance.
type TextRole =
  | "Title1" | "Title2" | "HeadlineXL" | "Headline1" | "Headline2"
  | "Subheadline" | "Button" | "Callout" | "Body" | "Caption"
const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700}, Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700}, Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700}, Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500}, Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500}, Caption: {size: 38, weight: 500}
}
export type {TextRole}

export function roleSize(role: TextRole, distanceCm: number = 110): number {
  return TYPE_SCALE[role].size * (distanceCm / 110)
}

export function applyTextRole(t: Text, role: TextRole, distanceCm: number = 110): void {
  t.size = roleSize(role, distanceCm)
  ;(t as Text & {weight?: number}).weight = TYPE_SCALE[role].weight
}

// Speaker accent colors. Light and saturated so they read on the additive display.
export const SPEAKER_COLORS: vec4[] = [
  new vec4(0.35, 0.85, 1.0, 1), // 1: sky blue
  new vec4(1.0, 0.78, 0.3, 1), // 2: amber
  new vec4(0.85, 0.55, 1.0, 1) // 3: violet
]

export function speakerColor(speaker: number): vec4 {
  return SPEAKER_COLORS[(speaker - 1) % SPEAKER_COLORS.length]
}

export function withAlpha(c: vec4, a: number): vec4 {
  return new vec4(c.x, c.y, c.z, a)
}

export const WHITE = new vec4(1, 1, 1, 1)

// Width over height of Assets/Branding/SubSpecsLogo_White.png (797 x 286 px).
export const LOGO_ASPECT = 797 / 286

export interface TextOptions {
  role: TextRole
  distanceCm: number
  rect: Rect
  color?: vec4
  align?: HorizontalAlignment
  valign?: VerticalAlignment
  wrap?: boolean
  localPos?: vec3
}

// World-space text in cm. Wrapped text shrinks to fit its rect instead of overflowing.
export function makeText(parent: SceneObject, name: string, value: string, o: TextOptions): Text {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  so.getTransform().setLocalPosition(o.localPos ?? vec3.zero())
  const t = so.createComponent("Component.Text") as Text
  t.text = value
  t.depthTest = true
  applyTextRole(t, o.role, o.distanceCm)
  t.horizontalAlignment = o.align ?? HorizontalAlignment.Left
  t.verticalAlignment = o.valign ?? VerticalAlignment.Center
  t.horizontalOverflow = o.wrap ? HorizontalOverflow.Wrap : HorizontalOverflow.Overflow
  t.verticalOverflow = o.wrap ? VerticalOverflow.Shrink : VerticalOverflow.Overflow
  t.layoutRect = o.rect
  t.textFill.color = o.color ?? WHITE
  return t
}

// World-space image in cm on a flat quad facing +Z; `material` carries the texture.
export function makeImage(parent: SceneObject, name: string, material: Material, size: vec2, localPos: vec3): RenderMeshVisual {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  so.getTransform().setLocalPosition(localPos)
  const w = size.x / 2
  const h = size.y / 2
  const mb = new MeshBuilder([
    {name: "position", components: 3},
    {name: "normal", components: 3},
    {name: "texture0", components: 2}
  ])
  mb.topology = MeshTopology.Triangles
  mb.indexType = MeshIndexType.UInt16
  mb.appendVerticesInterleaved([
    -w, -h, 0, 0, 0, 1, 0, 0,
    w, -h, 0, 0, 0, 1, 1, 0,
    w, h, 0, 0, 0, 1, 1, 1,
    -w, h, 0, 0, 0, 1, 0, 1
  ])
  mb.appendIndices([0, 1, 2, 0, 2, 3])
  mb.updateMesh()
  const visual = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
  visual.mesh = mb.getMesh()
  visual.mainMaterial = material
  return visual
}

// "Liquid glass" plate: a very see-through, slightly cool tint fading from a light sheen (top
// left) to a faint smoky blue (bottom right, behind the words, for contrast), with a thin bright
// rim so the card's shape still reads. No blur: SPECS can't blur the real world, and it would cost
// frame rate. Hover is a touch brighter.
export const GLASS_START = new vec2(-1.3, 1.25)
const GLASS_END = new vec2(1.25, -1.3)
const GLASS_RIM_CM = 0.12
// Draw glass panels after the scene (people included); the glass doesn't hide what's behind, so
// anything drawn later would paint over the words.
export const GLASS_RENDER_ORDER = 100
export const GLASS = {
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

// Gives a UI Kit plate (a BackPlate's RoundedRectangle) the liquid glass look.
export function applyGlass(plate: RoundedRectangle, hover: boolean): void {
  const g = hover ? GLASS.hover : GLASS.normal
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

// Draws everything under `root` after the glass plate on it: each level one step later, so
// button faces draw over the plate and their labels over the faces.
export function drawAbove(root: SceneObject, order: number): void {
  for (let i = 0; i < root.getChildrenCount(); i++) {
    const child = root.getChild(i)
    for (const v of child.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[]) v.renderOrder = order
    for (const t of child.getComponents("Component.Text") as Text[]) t.renderOrder = order + 1
    drawAbove(child, order + 1)
  }
}

// Soft dark outline so words stay readable over a busy background seen through glass cards.
const TEXT_OUTLINE_SIZE = 0.3
const TEXT_OUTLINE_ALPHA = 0.85
const TEXT_SHADOW_ALPHA = 0.6
const TEXT_SHADOW_OFFSET = new vec2(0.04, -0.04)

export function addTextOutline(t: Text): void {
  t.outlineSettings.enabled = true
  t.outlineSettings.size = TEXT_OUTLINE_SIZE
  t.dropshadowSettings.enabled = true
  t.dropshadowSettings.offset = TEXT_SHADOW_OFFSET
  setTextAlpha(t, t.textFill.color.w)
}

export function setTextAlpha(t: Text, alpha: number): void {
  const c = t.textFill.color
  t.textFill.color = new vec4(c.x, c.y, c.z, alpha)
  // The outline and shadow fade with the words, or they would linger as a dark ghost.
  if (t.outlineSettings.enabled) {
    t.outlineSettings.fill.color = new vec4(0, 0, 0, TEXT_OUTLINE_ALPHA * alpha)
    t.dropshadowSettings.fill.color = new vec4(0, 0, 0, TEXT_SHADOW_ALPHA * alpha)
  }
}

// Forward lift for labels drawn on a Button face, so the face doesn't occlude glyphs.
const BUTTON_LABEL_Z = 0.08

// A UI Kit Button with a raw Text label sized to the button face.
export function makeButton(
  parent: SceneObject,
  name: string,
  label: string,
  size: vec2,
  distanceCm: number,
  localPos: vec3
): {button: Button; label: Text} {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  so.getTransform().setLocalPosition(localPos)
  const button = so.createComponent(Button.getTypeName()) as Button
  button.size = new vec3(size.x, size.y, 1)
  button.onInitialized.add(() => {
    button.size = new vec3(size.x, size.y, 1)
  })
  const text = makeText(so, name + "Label", label, {
    role: "Button",
    distanceCm,
    rect: Rect.create(-(size.x - 0.5) / 2, (size.x - 0.5) / 2, -size.y / 2, size.y / 2),
    align: HorizontalAlignment.Center,
    localPos: new vec3(0, 0, BUTTON_LABEL_Z)
  })
  return {button, label: text}
}

// Places `so` relative to the camera: right/up/forward offsets in cm, facing the camera.
export function placeInFrontOfCamera(so: SceneObject, camera: Transform, right: number, up: number, forward: number): void {
  const flatForward = new vec3(camera.forward.x, 0, camera.forward.z)
  // Lens Studio cameras look down -Z, so the view direction is -forward.
  const view = flatForward.length > 0.001 ? flatForward.normalize().uniformScale(-1) : new vec3(0, 0, -1)
  const rightDir = view.cross(vec3.up()).normalize()
  const pos = camera.getWorldPosition()
    .add(view.uniformScale(forward))
    .add(rightDir.uniformScale(right))
    .add(vec3.up().uniformScale(up))
  so.getTransform().setWorldPosition(pos)
  faceCamera(so, camera)
}

// Turns `so` so its front (+Z) faces the camera.
export function faceCamera(so: SceneObject, camera: Transform): void {
  const t = so.getTransform()
  const toCamera = camera.getWorldPosition().sub(t.getWorldPosition())
  if (toCamera.length < 0.001) return
  t.setWorldRotation(quat.lookAt(toCamera.normalize(), vec3.up()))
}
