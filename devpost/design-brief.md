---
status: approved
---

# Design brief: SubSpecs

<!-- Filled in by plan-lens from the learner's interview. Use the learner's words. Mark any value they didn't choose as (default). -->

## The one spatial moment
A wearer who is hard of hearing is at a conference during the break. Walking through a loud corridor he sees a friend he hasn't seen in years. Normally it would be too loud to engage, but he points to his SPECS and reads his friend's words in a sub card placed over his friend. Two more people join the conversation, each gets their own card, and he stays engaged and in the moment instead of missing it or making everyone yell.

## Second scenario: hospital intake (added Oct 30)
The wearer hears fine: she is an intake worker at a hospital next to an international airport, where patients
arrive every day speaking languages she doesn't. Wearing SPECS at the intake desk, she asks her usual
questions in English; each patient's answers appear on their own card in their language, with the English
translation underneath, and the facts she needs for the intake form (allergies, medicines, pain level, how
long, symptoms) stand out in a highlight color. She stops guessing, fills the form faster and more
accurately, and can help start the right treatment sooner, which can save lives. This shows SubSpecs isn't
only for people who are deaf or hard of hearing: anyone who works with people across a language barrier
benefits.

- People in the demo: the same three figures, recast as patients. A Japanese traveler with chest pain, a
  French-speaking woman having an allergic reaction, and a Spanish-speaking father describing his child's
  symptoms. Only the patients are subbed; the worker's own questions are not shown (she hears them).
- Choosing it: the start card offers two buttons, "Conference corridor" and "Hospital intake".
- Translation: Auto (the default) detects each patient's language and translates into English. Picking a
  language by hand works as in the corridor scenario.
- Highlights: in the English translation, intake facts are shown in a highlight color. In Demo mode which
  words are highlighted is scripted; in Live mode the server would mark them.
- Privacy matters even more here: subs are shown only to the wearer, audio is never stored, speakers are
  anonymous numbers.

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
6. The start card offers "Conference corridor" and "Hospital intake"; pinching "Hospital intake" begins the hospital conversation, and each of the three patients gets their own card showing their language detected (Japanese, French, Spanish) with the English translation underneath.
7. In the hospital scenario, the intake facts in each English translation (allergies, medicines, pain level, how long, symptoms) appear in a highlight color, and other words don't.

Differentiating features (added Nov 2; see "Differentiating features" below):

8. Hospital intake: as patients speak, their highlighted facts fill a small intake form card (Allergies, Medicines, Pain, Since when, Symptoms), each field filled the moment its fact is said.
9. A card dropped onto a person is pinned to them: when that person moves, the card moves with them and stays above their head.
10. When someone outside the wearer's view starts talking, a small cue at the edge of the view in that speaker's color points toward them, and disappears once they're in view.
11. Pinching "Recap" shows a short summary of what each speaker said so far, one line per speaker in their color, and pinching it again hides it.
12. Hospital intake: after a patient answers, a suggested next question appears for the wearer in English with the patient's language underneath, so the wearer can read it aloud or show it.
13. Live mode: with the SubSpecs server running, choosing Live streams the microphone to the server and real subs from real speech appear on speaker cards, with the status showing Live, or Reconnecting when the link drops. (Checked with the server, not only in the preview.)
14. Speaker cards have a "liquid glass" look: a faint, see-through tinted plate with a bright edge, so the person behind stays visible, while the words stay bright and readable.

Server criterion (checked outside the preview, with the SubSpecs server): at least 80% of words transcribed correctly on a multi-speaker test clip. "That is better than the wearer never being able to understand in the first place." (Measured on Oct 29: about 98% on a two-speaker clip.)

## Differentiating features (added Nov 2)
What sets SubSpecs apart from caption and translation glasses: one card per voice pinned to that
person, several speakers and languages at once, and understanding the conversation, not just
transcribing it. Defaults below are CLAD's (default) unless the learner chose them.

1. Intake form auto-fill (hospital): a small form card beside the language bar fills in from the
   highlighted facts as they're said, with the field flashing briefly when filled (default).
2. Card follows the person: dropping a card on a figure pins it there; in the demo one patient shifts
   a step during the conversation and the card follows (default). Real glasses would need people
   tracking, which stays future work; SubSpecs never identifies anyone.
3. Who's-talking cue: a soft arrow at the view's edge in the speaker's color. In the demo a fourth
   voice (a nurse calling from off to the side in the hospital, a passer-by in the corridor) speaks
   from outside the view (default). Real direction finding is an open question (see Risks).
4. Conversation recap: a "Recap" button on the language bar; scripted summaries in Demo mode, server
   summaries in Live mode.
5. Reply help (hospital): suggested next question in English plus the patient's language, shown small
   under that patient's card for a few seconds (default).
6. Live mode end to end: mic audio streamed to the SubSpecs server (no AsrModule), real subs and
   translation back, status Live / Reconnecting. Demo mode must still carry the demo.
7. Liquid glass cards: see done criterion 14; no real-time blur (SPECS can't blur the real world).

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
