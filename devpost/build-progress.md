# SubSpecs build progress (Demo mode)

Hand-over notes from the build sessions on Oct 29, 2026.

## What's built

All scripts are in `Assets/Scripts/`. Everything is created at runtime by `CaptionController.ts`,
which sits on the `CaptionController` scene object.

| File | What it does |
|---|---|
| `CaptionController.ts` | Runs Demo mode: plays the conversation picked on the start card (corridor or hospital) on a timer, sends each to its speaker's card, places a new speaker's card in an arc about 1.1 m in front and a little below eye level (10.2 degrees apart, so all three fit the view), loops the conversation. Inspector settings: hold seconds (3), words per second (2.8), loop, loop pause, start language. |
| `CaptionDemoScript.ts` | The two conversations, with pre-written English, Spanish, French and Japanese text. Corridor (`DEMO_LINES`): 10 lines, speakers 1 (old friend) and 2 speak English, speaker 3 speaks Spanish. Hospital intake (`HOSPITAL_LINES`): 12 patient answers, speaker 1 in Japanese, 2 in Spanish, 3 in French; each line's `highlights` lists the intake facts in its English text. `translationFor` decides what goes under each sub for the current setting; `highlightedTranslation` wraps the facts in a color tag; `spokenWords` splits Japanese (no spaces) into 3-character pieces for the typing effect. Gaps are longer than the 3 s hold so cards visibly hide and come back. |
| `SpeakerCard.ts` | One UI Kit BackPlate card per speaker (19 x 16 cm at 1.1 m): color and number, live line typed word by word, final line, translation underneath, the previous line below fading away, a "<language> detected" tag when the speaker isn't speaking the wearer's language, intake facts in lime green (`#C6FF4D`) inside the English translation (the translation Text has rich text on; `<color=#RRGGBB>` tags), and a "New speaker detected" label that fades after about 2 s. Pinch and drag to move it (SIK InteractableManipulation, no rotate, scale or Z stretch, so it moves 1:1 with the hand). Lights up on hover. Hides after the hold time and returns to the same spot. |
| `LanguagePicker.ts` | Panel about 0.6 m away at the bottom of the view (scaled to fit the view): Auto (default) / Off / Español / Français / 日本語 buttons, plus a "● DEMO" status label. Only the buttons are pinch targets; the background panel is not. Shown once a conversation starts. |
| `OnboardingCard.ts` | Centered card about 1 m away: what SubSpecs does, the privacy note, and two buttons side by side, "Conference corridor" (`CorridorButton`) and "Hospital intake" (`HospitalButton`). |
| `CaptionUiKit.ts` | Shared text sizes, speaker colors, and text, button and placement helpers. |
| `SpeakerFigures.ts` | Demo only: each person plays their Talking animation while their speaker's words appear, and holds its first frame (a natural standing pose, not the rig's T-pose) otherwise. The clip loops for long lines. |

## Demo people

The scene object `STAND-IN Speaker Figures (placeholders)` holds three Mixamo people (`Assets/People/`),
wired in speaker order into `CaptionController`'s `speakerFigures` input:

| Speaker | Person | Where (as the wearer sees it) |
|---|---|---|
| 1, the old friend | Sophie | left, nearest, about 2.4 m away, 11 degrees left |
| 2 | Brian | center, farthest, about 3.6 m away |
| 3, the Spanish speaker | Meghan | right, about 2.8 m away, 10 degrees right |

They stand at different distances with a gap between each in the view, so they never overlap. All are
real height (176 to 178 cm, eyes at the wearer's eye height) and face the wearer. They only move their
bodies: there is no voice audio and no lip sync, because Demo mode plays scripted text, not sound.
They are committed to the repo on purpose so judges see them, and exist only for Demo mode and the
video: the launched SubSpecs app captions real people from real audio, with no models.
The old capsule figures are still in the scene, disabled (`StandIn Figure A (friend)`, B, C).

Performance: about 144,500 triangles in all (Sophie 53,460, Meghan 48,229, Brian 42,818), 17 skinned
meshes. The FBX files embed 4096 px textures; Lens Studio caps them at 2048 px. Only the color textures
are used (normal maps are off), and those were shrunk to 1024 px into `Assets/People/Textures/` and
used through project-owned materials in `Assets/People/Materials/` (hair and eyelashes cut out their
see-through edges). Editing the FBX's own materials does not stick: Lens Studio keeps those only in its
cache. Mixamo also varies the bone prefix (`mixamorig`, `mixamorig1`, `mixamorig12`), so find bones by
the part after the colon.

No AsrModule, ASRMLModule or VoiceML is used anywhere (they turn on Bystander Speech Rejection).

## Auto translation

Auto (the default) keeps subs in the wearer's language (English in the demo). When someone
speaks another language, their card shows what they said, a "Spanish detected" tag, and the
English translation underneath. English speakers get no translation line. Picking a language by
hand overrides Auto and translates everyone into that language (no line when the speaker already
speaks it); pinching Auto brings detection back. In Demo mode detection is scripted. In Live mode
the SubSpecs server's Nemotron ASR reports the language of every sub (`lang`), and the server
skips translating subs already in the chosen language (it sends an empty `translation` with
`same_language: true`). For Auto, the Lens sets the target to the wearer's language.

## The Specs view is narrow

Measured in Preview: the Specs display is about 32 degrees wide and 37 degrees tall (about 58 cm
wide at 1 m). Anything placed wider than about 16 degrees off-center is invisible to the wearer.
Keep new UI inside that.

## Hospital intake scenario

Picked with "Hospital intake" on the start card. The same three people are patients at an intake desk
next to an international airport; the wearer (the intake worker) hears fine and her questions are not
subbed. Speaker 1, Sophie: Japanese traveler with chest pain. Speaker 2, Brian: Spanish-speaking father
of a six-year-old with a fever. Speaker 3, Meghan: French-speaking woman with a mild peanut reaction.
Auto translates every patient into English with the "<language> detected" tag. Only the English
translation is highlighted: in Live mode the server would mark the facts.

## Done criteria (checked in Lens Studio's Preview, Oct 30 with the Mixamo people)

All ten LEAF scenarios pass when run in index order in Preview (each run resets the Lens and
presses a start-card button itself: "Conference corridor" for the original eight, "Hospital intake"
for c6 and c7). Test files are in `Assets/Scripts/Tests/`, one scenario per file, registered
in `LeafIndex.ts` on the `LeafIndex` scene object.

| Criterion | LEAF scenario | Result | Also checked by eye |
|---|---|---|---|
| 1. Three voices, three color-coded cards, "New speaker detected" | `c1-three-speakers-three-cards` | Pass | Cards appear inside the view, each with its own color |
| 2. Drag a card over a figure; next words appear above the previous line in that spot; older line fades | `c2-drag-card-over-figure` | Pass (card moved about 24 cm and sits within 1 degree of the spot above Sophie's head) | Yes |
| 3. Card hides about 3 s after its speaker stops, returns to the same spot | `c3-card-hold-and-return` | Pass (measured 3.00 s) | Yes |
| 4. Picking another language changes the translation, including recent lines | `c4-language-switch` | Pass (French, Spanish, Japanese) | Japanese text renders correctly |
| 5. Onboarding shows what SubSpecs does and the privacy note; "Conference corridor" begins the demo | `c5-onboarding-starts-demo` | Pass | Yes |
| 6. Start card offers both scenarios; "Hospital intake" gives three patients' cards with Japanese, Spanish, French detected and English underneath | `c6-hospital-intake-starts` | Pass | Yes, see `history/screenshots/2026-10-30-hospital-start-card.png` |
| 7. Intake facts in the English translation are highlighted, other words aren't | `c7-hospital-highlights` | Pass (exact highlighted phrases checked on 6 answers; none when Japanese is picked by hand) | Yes, see `history/screenshots/2026-10-30-hospital-intake.png` |
| Reach: a full-arm reach can press a language button | `reach-language-picker-ik` | Pass (missed once in about 6 runs on Oct 30: the pinch didn't register; passed on every rerun) | |
| Extra: Auto detects Spanish and translates it; manual choice overrides; Auto restores | `auto-detect-language` | Pass | Yes |
| Demo people: a person talks only while their speaker's words appear | `figure-talks-while-speaking` | Pass (about 270 checks over a full round of the conversation) | Yes, see `devpost/screenshots/people-talking-preview.png` |

Every done criterion has a test. Logic proven in Preview; feel unproven until real glasses
(reading while keeping eye contact, the 3-second hold, card size at real distance, real hand tracking).

## Fixed in this session

- LEAF and the AI preview helper packages were made for a newer, renamed Interaction Kit
  (`InteractionKit.lspkg`). They were unpacked into `Assets/Leaf.lspkg`, `Assets/AiPreviewAgentInspect.lspkg`
  and `Assets/AiPreviewAgentInteract.lspkg`, and their imports point at the installed
  `SpectaclesInteractionKit.lspkg` / `SpectaclesUIKit.lspkg`. If LEAF is ever updated from the Asset
  Library, redo that rename (or update SIK to the version LEAF expects).
- Cards 1 and 3, figures A and C, and the language picker were outside the Specs view. All moved in.
- The stand-in figures showed as a magenta checkerboard (their placeholder texture was missing).
  They now use plain colored materials.
- Dragging a card could fling it toward the wearer's face (SIK Z stretch). Turned off for cards.
- The picker's background panel caught pinches meant for its buttons. Turned off.

## What's left

1. ~~Add the SubSpecs logo at start-up and as a small overlay.~~ Done Oct 30: a white copy of the logo
   (`Assets/Branding/SubSpecsLogo_White.png`, unlit material `SubSpecsLogo.mat`, wired to
   `CaptionController`'s `logoMaterial`) replaces the title on the start card and sits small above the
   left end of the language bar. No 3D model version was made.
2. Live mode (streaming to the SubSpecs server) is not built.
3. Watch it in Interactive Preview yourself and judge the feel (see "After the build: judge it" in
   the design brief).

## Notes

- The app is named **SubSpecs** and the feature is called **subs**. Internal names keep the old
  "Caption" wording on purpose (script and class names such as `CaptionController`, the project
  folder `CaptionSpecs`, the `caption-server` folder, its `CAPTION_` settings and its `caption`
  message type) so nothing breaks in Lens Studio or the server.

- `.virtual-scene.json` is a generated scene snapshot and is ignored by git.
- `leaf_plugin_settings.json` is local LEAF panel state and is ignored by git.
