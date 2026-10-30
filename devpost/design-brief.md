---
status: approved
---

# Design brief: SubSpecs

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
A wearer who is hard of hearing is at a conference during the break. Walking through a loud corridor he sees a friend he hasn't seen in years. Normally it would be too loud to engage, but he points to his SPECS and reads his friend's words in a sub card placed over his friend. Two more people join the conversation, each gets their own card, and he stays engaged and in the moment instead of missing it or making everyone yell.

## Why it belongs on glasses
- Uses: leaves your body free (eyes up on the people, not down at a phone); draws in the world (each person's words sit where the wearer placed them, over or beside that person).
- Why it's better than the phone or laptop version: a phone transcript is one undivided wall of text you have to look down at, so you lose faces and lose track of who said what. On glasses the wearer keeps eye contact and each speaker's words stay with that speaker. The wearer already wears prescription glasses, and hearing aids are uncomfortable for him.

## Product or overlay
- Type: overlay: it responds to real people speaking.
- What the real version would sense: live speech from the people around the wearer, split by speaker (who is talking) and transcribed, then translated into the wearer's language of choice. This is Live mode: the Lens streams microphone audio to the SubSpecs GPU server (Nemotron diarization + ASR + translation).
- Stand-in for the preview: Demo mode. A scripted conference-corridor conversation plays on its own with no server: three speakers, the old friend first and then two others who join. Each line arrives on a timer as if spoken, with pre-written translations for the demo languages. Three 3D figures stand in the room as the people; the learner will provide rigged, animated models (FBX or GLB), and CLAD uses simple placeholder figures until they arrive. The figures are scenery: SubSpecs doesn't know where they stand, just as it wouldn't know where real people stand. The wearer places each card on a figure by hand.

## Where things live
- Where the user is looking during the main task: at the people in the conversation, about 1 to 2 m away, roughly at face height.
- Three speaker figures: standing in the corridor in front of the wearer, about 1.5 to 2 m away, spread across the view (default).
- New speaker card: appears in an arc in front of the wearer, a little below eye level, about 1 m away (default), until the wearer moves it.
- Card size: about one third of the tablet-sized view, about 13 x 8 cm at arm's length (about 24 x 15 cm at 1 m) (default for exact cm).
- Card contents: the speaker's color and number, the live line, the final line, and the translation underneath.
- A placed card stays where the wearer put it for that speaker for the rest of the session.
- Language picker: a small panel below the cards, at the bottom of the view, about 0.6 m away (default).
- Onboarding card: centered in front of the wearer, about 1 m away, at the start (default).
- Status indicator (Demo / Live / Reconnecting): small, at the bottom edge next to the language picker (default).

## Hands and input
- Move a card: pinch and drag a speaker's card anywhere in view, over a person or arranged however the wearer needs. The app is about the wearer's control and customization.
- Pick the translation language: pinch a language on the language picker; the change is live.
- Start: pinch the Start button on the onboarding card.
- Targets are big and highlight when aimed at.
- Voice (if any) and the button that does the same job: no voice commands.

## When things show
- Speaker card: shows while that person is speaking. Their last words stay readable for 3 seconds after they stop talking (adjustable), then the card hides.
- Same speaker talks again: the card comes back in the spot where the wearer left it. Their new words appear just above their previous words, and the older line fades away.
- "New speaker detected" overlay: shows on a card the first time a new voice is detected, then fades (about 2 s, default).
- Translation line: shows under each sub whenever a translation language is chosen. When the language changes, the most recent lines switch to the new language.
- Onboarding card: shows at start with what SubSpecs does and the privacy note; hides after Start.
- If something needs attention out of view: none. The wearer places the cards where they're already looking.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. In Demo mode, as each of the three figures starts talking, a new color-coded card appears with a "New speaker detected" label, giving three cards for three voices.
2. Pinching and dragging a card moves it over a figure; that speaker's next words appear just above their previous line in that same spot while the older line fades.
3. A card hides about 3 seconds after its speaker stops talking, and returns to the same spot when that speaker talks again.
4. Pinching a different language on the language picker changes the translation under the cards, including the most recent lines.
5. The onboarding card shows what SubSpecs does and the privacy note, and pinching Start begins the demo conversation.

Server criterion (checked outside the preview, with the SubSpecs server): at least 80% of words transcribed correctly on a multi-speaker test clip. "That is better than the wearer never being able to understand in the first place." (Measured on Oct 29: about 98% on a two-speaker clip.)

## Out of scope
- Knowing where a speaker is standing (camera vision, face tracking or directional audio). Cards are placed by hand.
- Face recognition or identifying anyone; speakers are anonymous numbers.
- Storing audio or transcripts; audio is never saved.
- Everyone in the conversation wearing glasses and sharing subs (the future vision for the video, not this build).
- Remembering card placements between sessions.

## Risks and open questions
- Directional cues: the learner hoped SPECS could tell which direction a voice comes from. No Lens API for this was found (Snap's documentation search was unavailable when checked), and the preview can't simulate it. Feel unproven; explore on real glasses later.
- Snap's on-device speech recognition (AsrModule) turns on Bystander Speech Rejection, which ignores speech that isn't the wearer's. SubSpecs needs bystanders' speech, so Demo mode must not rely on AsrModule, and Live mode should stream raw microphone audio with no AsrModule in the same Lens. Confirm during the build.
- Live mode depends on the learner's PC running the SubSpecs server and a secure wss:// tunnel; judges may test while the PC is off, so Demo mode must carry the demo.
- Translation in Demo mode is pre-written for a few languages (Spanish, French, Japanese) (default); the full language list works only in Live mode.
- Other people's speech is shown as subs. Subs are shown only to the wearer, audio is never stored, speakers are anonymous numbers, and there's no face recognition. The demo uses figures, not real people.
- Feel unproven: reading speed while keeping eye contact, the 3-second hold, and card size at real conversation distance.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
