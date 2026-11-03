// Demo mode conversations: a scripted conference-corridor chat and a hospital intake desk,
// each with three speakers. Each line arrives on a timer as if spoken. Translations are pre-written for the demo
// languages; in Live mode the AI hears any language (see Live/LiveSession.ts).

// Translation setting. "auto": subs in the wearer's language (English in the demo);
// anyone speaking another language is detected and translated automatically.
// The others translate every line into that language.
export type LanguageCode = "auto" | "off" | "es" | "fr" | "ja"

// A language a speaker can talk in. In Demo mode detection is scripted; in Live mode the
// AI reports the language it hears (as `heard` below).
export type SpokenLanguage = "en" | "es" | "fr" | "ja"

// The wearer's own language in Demo mode.
export const WEARER_LANGUAGE: SpokenLanguage = "en"

export const SPOKEN_LANGUAGE_NAMES: Record<SpokenLanguage, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  ja: "Japanese"
}

// The scripted conversations the start card offers.
export type DemoScenarioId = "corridor" | "hospital"

export interface LanguageOption {
  code: LanguageCode
  label: string
}

export const DEMO_LANGUAGES: LanguageOption[] = [
  {code: "auto", label: "Auto"},
  {code: "off", label: "Off"},
  {code: "es", label: "Español"},
  {code: "fr", label: "Français"},
  {code: "ja", label: "日本語"}
]

export interface DemoLine {
  // Speaker number as the diarizer would report it (1-based, anonymous).
  speaker: number
  // Seconds after the demo starts when this speaker begins talking.
  at: number
  // The language the speaker talks in (English unless set).
  spoken?: SpokenLanguage
  en: string
  es: string
  fr: string
  ja: string
  // Intake facts to highlight in the English translation, each an exact phrase of `en`.
  // Demo mode only: Live mode doesn't fill the intake form.
  highlights?: string[]
  // What this answer fills in on the patient's intake form, drawn from its highlighted facts.
  intake?: Partial<Record<IntakeField, string>>
  // Reply help (hospital): a suggested next question for the wearer, in English and in the
  // patient's own language, shown on the patient's card under the answer once it is said.
  reply?: {en: string; native: string}
  // The name the speaker introduces themselves with in this line. Once the line is said, their
  // card shows it instead of "Speaker N", for this conversation only. In Live mode the SubSpecs
  // server would report it.
  name?: string
  // Recap: a one-line summary of everything this speaker has said so far, as of this line (in
  // English). Scripted in Demo mode; in Live mode the AI writes it.
  recap?: string
  // Live mode only: the words as heard, in whatever language was spoken (which may be none of
  // the demo languages). When set, it replaces `spoken` and the matching field above.
  // `nameSaid` is a name the speaker said for themselves in this bit of speech, if any.
  heard?: {text: string; code: string; languageName: string; noSpaces: boolean; nameSaid?: string}
}

// The fields on the hospital intake form, in the order shown.
export type IntakeField = "allergies" | "medicines" | "pain" | "since" | "symptoms"

export const INTAKE_FIELDS: {field: IntakeField; label: string}[] = [
  {field: "allergies", label: "Allergies"},
  {field: "medicines", label: "Medicines"},
  {field: "pain", label: "Pain"},
  {field: "since", label: "Since when"},
  {field: "symptoms", label: "Symptoms"}
]

// Speaker 1 is the old friend, then speakers 2 and 3 join. Speaker 3 speaks Spanish. Gaps between a speaker's
// lines are longer than the 3 s hold so each card visibly hides and comes back.
export const DEMO_LINES: DemoLine[] = [
  {
    speaker: 1,
    at: 1.0,
    en: "Hey! Is that really you? It's been, what, six years?",
    es: "¡Oye! ¿De verdad eres tú? Han pasado, ¿qué, seis años?",
    fr: "Hé ! C'est vraiment toi ? Ça fait quoi, six ans ?",
    ja: "ねえ！本当に君？もう6年ぶりくらいかな？",
    recap: "Recognized you; it's been about six years."
  },
  {
    speaker: 1,
    at: 6.5,
    en: "I almost didn't recognize you with the beard.",
    es: "Casi no te reconozco con la barba.",
    fr: "Je ne t'ai presque pas reconnu avec la barbe.",
    ja: "ひげで危うく気づかないところだったよ。",
    recap: "Old friend, six years since you met; almost didn't recognize you with the beard."
  },
  {
    speaker: 2,
    at: 14.0,
    en: "Sorry to jump in, I'm Daniel. Are you two speaking on the accessibility panel?",
    es: "Perdón por interrumpir, soy Daniel. ¿Ustedes dos hablan en el panel de accesibilidad?",
    fr: "Désolé de vous interrompre, je suis Daniel. Vous intervenez au panel sur l'accessibilité ?",
    ja: "割り込んでごめんなさい、ダニエルです。お二人はアクセシビリティのパネルで話す方ですか？",
    recap: "Asked if you two are speaking on the accessibility panel.",
    name: "Daniel"
  },
  {
    speaker: 1,
    at: 21.0,
    en: "Just me. I'm Sam, by the way. This is my old friend from university.",
    es: "Solo yo. Por cierto, soy Sam. Este es mi viejo amigo de la universidad.",
    fr: "Juste moi. Je suis Sam, au fait. Voici mon vieil ami de l'université.",
    ja: "私だけです。ちなみにサムです。こちらは大学時代の古い友人です。",
    recap: "Old university friend, six years since you met; she's speaking on the accessibility panel.",
    name: "Sam"
  },
  {
    speaker: 3,
    at: 27.0,
    spoken: "es",
    en: "Mind if I join you? I'm Lucía. The coffee line is endless.",
    es: "¿Les importa si me uno? Soy Lucía. La fila del café es interminable.",
    fr: "Je peux me joindre à vous ? Je m'appelle Lucía. La queue pour le café est interminable.",
    ja: "ご一緒してもいいですか？ルシアです。コーヒーの列が全然進まなくて。",
    recap: "Joined the group to escape the long coffee line.",
    name: "Lucía"
  },
  {
    speaker: 2,
    at: 32.5,
    en: "Of course. Did you catch the keynote this morning?",
    es: "Claro. ¿Viste la conferencia principal esta mañana?",
    fr: "Bien sûr. Tu as vu la keynote ce matin ?",
    ja: "もちろん。今朝の基調講演は見ましたか？",
    recap: "Asked about the accessibility panel and whether you saw this morning's keynote."
  },
  {
    speaker: 3,
    at: 38.0,
    spoken: "es",
    en: "I did. The live subs demo was amazing.",
    es: "Sí. La demo de subtítulos en vivo fue increíble.",
    fr: "Oui. La démo de sous-titres en direct était incroyable.",
    ja: "見ました。ライブ字幕のデモがすごかったです。",
    recap: "Joined to escape the coffee line; loved the keynote's live subs demo."
  },
  {
    speaker: 1,
    at: 43.5,
    en: "Funny you say that. My friend is wearing them right now.",
    es: "Qué curioso. Mi amigo los lleva puestos ahora mismo.",
    fr: "C'est drôle. Mon ami les porte en ce moment même.",
    ja: "偶然ですね。友人がちょうど今それを着けているんです。",
    recap: "Old university friend; speaking on the accessibility panel; told them you're wearing live subs."
  },
  {
    speaker: 2,
    at: 49.0,
    en: "Wait, so you can read everything we're saying?",
    es: "Espera, ¿entonces puedes leer todo lo que decimos?",
    fr: "Attends, tu peux lire tout ce qu'on dit ?",
    ja: "待って、じゃあ私たちの話が全部読めるの？",
    recap: "Asked about the panel and the keynote; surprised you can read everything they say."
  },
  {
    speaker: 3,
    at: 54.5,
    spoken: "es",
    en: "That's brilliant. Let's grab a table and keep talking.",
    es: "Genial. Busquemos una mesa y sigamos hablando.",
    fr: "Génial. Trouvons une table et continuons à parler.",
    ja: "すばらしい。テーブルを取って話を続けましょう。",
    recap: "Loved the live subs demo; suggests getting a table to keep talking."
  }
]

// Hospital intake: the wearer works the intake desk at a hospital next to an international airport.
// She asks her questions in English (not subbed: she hears them); only the patients are subbed.
// Speaker 1 is a Japanese traveler with chest pain, speaker 2 a Spanish-speaking father describing
// his daughter's symptoms, speaker 3 a French-speaking woman having an allergic reaction.
export const HOSPITAL_LINES: DemoLine[] = [
  {
    speaker: 1,
    at: 1.0,
    spoken: "ja",
    en: "I'm Yuki Tanaka. My chest hurts. It started about two hours ago, after I got off the plane.",
    es: "Soy Yuki Tanaka. Me duele el pecho. Empezó hace unas dos horas, después de bajar del avión.",
    fr: "Je m'appelle Yuki Tanaka. J'ai mal à la poitrine. Ça a commencé il y a environ deux heures, en descendant de l'avion.",
    ja: "田中ゆきです。胸が痛いです。2時間ほど前、飛行機を降りてから始まりました。",
    recap: "Chest pain for about 2 hours, since getting off the plane.",
    name: "Yuki Tanaka",
    reply: {en: "Does the pain spread to your arm, jaw or back?", native: "痛みは腕、あご、背中に広がりますか？"},
    highlights: ["My chest hurts", "about two hours ago"],
    intake: {symptoms: "Chest pain", since: "About 2 hours, after the flight"}
  },
  {
    speaker: 2,
    at: 7.5,
    spoken: "es",
    en: "I'm Carlos. It's my daughter, she's six. She's had a fever since last night and threw up twice.",
    es: "Soy Carlos. Es mi hija, tiene seis años. Tiene fiebre desde anoche y vomitó dos veces.",
    fr: "Je suis Carlos. C'est ma fille, elle a six ans. Elle a de la fièvre depuis hier soir et a vomi deux fois.",
    ja: "カルロスです。娘です、6歳です。昨夜から熱があって、2回吐きました。",
    recap: "Daughter, 6: fever since last night, vomited twice.",
    name: "Carlos",
    reply: {en: "How high was her temperature?", native: "¿Qué tan alta fue su temperatura?"},
    highlights: ["a fever", "since last night", "threw up twice"],
    intake: {symptoms: "Fever, vomited twice", since: "Last night"}
  },
  {
    speaker: 3,
    at: 14.0,
    spoken: "fr",
    en: "I'm Amélie. I think there were peanuts in my lunch. My lips are swelling and I'm itchy all over.",
    es: "Soy Amélie. Creo que mi almuerzo tenía cacahuetes. Se me hinchan los labios y me pica todo el cuerpo.",
    fr: "Je m'appelle Amélie. Je crois qu'il y avait des cacahuètes dans mon déjeuner. Mes lèvres gonflent et ça me gratte partout.",
    ja: "アメリです。昼食にピーナッツが入っていたと思います。唇が腫れてきて、全身がかゆいです。",
    recap: "Suspects peanuts at lunch; lips swelling, itchy all over.",
    name: "Amélie",
    reply: {en: "Are you having any trouble breathing?", native: "Avez-vous du mal à respirer ?"},
    highlights: ["peanuts", "My lips are swelling", "itchy all over"],
    intake: {symptoms: "Lips swelling, itchy all over", since: "After lunch", allergies: "Peanuts? (suspected)"}
  },
  {
    speaker: 1,
    at: 20.5,
    spoken: "ja",
    en: "It feels tight, like pressure. About a 6 out of 10.",
    es: "Se siente apretado, como una presión. Más o menos un 6 de 10.",
    fr: "Ça serre, comme une pression. Environ 6 sur 10.",
    ja: "締め付けられるような圧迫感です。10のうち6くらいです。",
    recap: "Chest pain for 2 hours since the flight; tight pressure, 6 out of 10.",
    reply: {en: "Do you take any medicines?", native: "何かお薬を飲んでいますか？"},
    highlights: ["tight, like pressure", "a 6 out of 10"],
    intake: {pain: "6 / 10, tight pressure"}
  },
  {
    speaker: 2,
    at: 26.5,
    spoken: "es",
    en: "I gave her ibuprofen at six this morning. She's not allergic to anything.",
    es: "Le di ibuprofeno a las seis de la mañana. No es alérgica a nada.",
    fr: "Je lui ai donné de l'ibuprofène à six heures ce matin. Elle n'est allergique à rien.",
    ja: "今朝6時にイブプロフェンを飲ませました。アレルギーは何もありません。",
    recap: "Daughter, 6: fever since last night, vomited twice; ibuprofen at 6 am; no allergies.",
    reply: {en: "Does anything hurt her right now?", native: "¿Le duele algo ahora mismo?"},
    highlights: ["ibuprofen at six this morning", "not allergic to anything"],
    intake: {medicines: "Ibuprofen, 6 am", allergies: "None"}
  },
  {
    speaker: 3,
    at: 32.5,
    spoken: "fr",
    en: "I'm allergic to peanuts. I took an antihistamine twenty minutes ago.",
    es: "Soy alérgica a los cacahuetes. Tomé un antihistamínico hace veinte minutos.",
    fr: "Je suis allergique aux arachides. J'ai pris un antihistaminique il y a vingt minutes.",
    ja: "ピーナッツアレルギーです。20分前に抗ヒスタミン薬を飲みました。",
    recap: "Peanut allergy; lips swelling, itchy; antihistamine 20 minutes ago.",
    reply: {en: "Do you carry an epinephrine pen?", native: "Avez-vous un stylo d'adrénaline sur vous ?"},
    highlights: ["allergic to peanuts", "an antihistamine twenty minutes ago"],
    intake: {allergies: "Peanuts", medicines: "Antihistamine, 20 min ago"}
  },
  {
    speaker: 1,
    at: 38.5,
    spoken: "ja",
    en: "I take blood pressure medicine every morning. It's amlodipine.",
    es: "Tomo medicina para la presión todas las mañanas. Es amlodipino.",
    fr: "Je prends un médicament pour la tension tous les matins. C'est de l'amlodipine.",
    ja: "毎朝、血圧の薬を飲んでいます。アムロジピンです。",
    recap: "Chest pain 6/10 for 2 hours since the flight; takes amlodipine daily.",
    reply: {en: "Are you allergic to any medicines?", native: "お薬のアレルギーはありますか？"},
    highlights: ["blood pressure medicine every morning", "amlodipine"],
    intake: {medicines: "Amlodipine (blood pressure), daily"}
  },
  {
    speaker: 2,
    at: 44.5,
    spoken: "es",
    en: "She says her stomach hurts, down here on the right.",
    es: "Dice que le duele la barriga, aquí abajo a la derecha.",
    fr: "Elle dit qu'elle a mal au ventre, ici en bas à droite.",
    ja: "お腹が痛いと言っています。ここ、右下のあたりです。",
    recap: "Daughter, 6: fever, vomited twice, now lower-right stomach pain; ibuprofen 6 am; no allergies.",
    reply: {en: "How much does she weigh?", native: "¿Cuánto pesa la niña?"},
    highlights: ["her stomach hurts", "down here on the right"],
    intake: {pain: "Stomach, lower right"}
  },
  {
    speaker: 3,
    at: 50.5,
    spoken: "fr",
    en: "I can breathe fine, but my throat feels a little tight.",
    es: "Respiro bien, pero siento la garganta un poco cerrada.",
    fr: "Je respire bien, mais j'ai la gorge un peu serrée.",
    ja: "呼吸は大丈夫ですが、喉が少し締め付けられる感じがします。",
    recap: "Peanut allergy; lips swelling, throat a little tight, breathing fine; antihistamine 20 min ago.",
    reply: {en: "Has this happened before?", native: "Est-ce déjà arrivé auparavant ?"},
    highlights: ["can breathe fine", "throat feels a little tight"],
    intake: {symptoms: "Lips swelling, itchy, throat a little tight; breathing fine"}
  },
  {
    speaker: 1,
    at: 56.5,
    spoken: "ja",
    en: "Also, I'm allergic to penicillin.",
    es: "Además, soy alérgico a la penicilina.",
    fr: "Aussi, je suis allergique à la pénicilline.",
    ja: "それと、ペニシリンにアレルギーがあります。",
    recap: "Chest pain 6/10 for 2 hours; takes amlodipine; allergic to penicillin.",
    reply: {en: "Please take a seat. A doctor will see you shortly.", native: "お掛けください。すぐに医師が診察します。"},
    highlights: ["allergic to penicillin"],
    intake: {allergies: "Penicillin"}
  },
  {
    speaker: 2,
    at: 61.5,
    spoken: "es",
    en: "She weighs about twenty kilos, if that helps.",
    es: "Pesa unos veinte kilos, por si sirve.",
    fr: "Elle pèse environ vingt kilos, si ça peut aider.",
    ja: "体重は20キロくらいです。参考になれば。",
    recap: "Daughter, 6, about 20 kg: fever, vomiting, lower-right stomach pain; ibuprofen 6 am.",
    reply: {en: "Thank you. A nurse will call her name soon.", native: "Gracias. Una enfermera la llamará pronto."},
    highlights: ["about twenty kilos"]
  },
  {
    speaker: 3,
    at: 67.0,
    spoken: "fr",
    en: "Thank you. This happened once before, three years ago.",
    es: "Gracias. Esto me pasó una vez antes, hace tres años.",
    fr: "Merci. C'est déjà arrivé une fois, il y a trois ans.",
    ja: "ありがとうございます。3年前にも一度こうなりました。",
    recap: "Peanut reaction, throat a little tight, breathing fine; antihistamine taken; once before, 3 years ago.",
    reply: {en: "Thank you. Please wait here; a nurse is coming.", native: "Merci. Attendez ici, une infirmière arrive."},
    highlights: ["once before, three years ago"]
  }
]

export const DEMO_SCENARIOS: Record<DemoScenarioId, DemoLine[]> = {
  corridor: DEMO_LINES,
  hospital: HOSPITAL_LINES
}

// Every scripted line in every scenario.
export const ALL_DEMO_LINES: DemoLine[] = DEMO_LINES.concat(HOSPITAL_LINES)

// The language code the speaker talked in: a demo language, or any code Live mode heard.
export function spokenLanguageOf(line: DemoLine): string {
  return line.heard?.code ?? line.spoken ?? "en"
}

// The language's name for the card's "… detected" tag.
export function spokenLanguageName(line: DemoLine): string {
  return line.heard?.languageName ?? SPOKEN_LANGUAGE_NAMES[line.spoken ?? "en"]
}

// The words as the speaker said them.
export function spokenText(line: DemoLine): string {
  return line.heard?.text ?? line[line.spoken ?? "en"]
}

// Japanese has no spaces between words; it is revealed a few characters at a time instead.
const JA_CHUNK = 3

// The pieces the live line reveals one at a time, as words arrive from the speaker.
export function spokenWords(line: DemoLine): string[] {
  const text = spokenText(line)
  if (!hasNoSpaces(line)) return text.split(" ")
  const chars = Array.from(text)
  const chunks: string[] = []
  for (let i = 0; i < chars.length; i += JA_CHUNK) chunks.push(chars.slice(i, i + JA_CHUNK).join(""))
  return chunks
}

// The first revealed pieces of `line` joined back into text.
export function joinWords(line: DemoLine, words: string[]): string {
  return words.join(hasNoSpaces(line) ? "" : " ")
}

// Japanese (and, in Live mode, Chinese, Thai and the like) is written without spaces between words.
function hasNoSpaces(line: DemoLine): boolean {
  return line.heard ? line.heard.noSpaces : spokenLanguageOf(line) === "ja"
}

// What goes under the caption for this setting; "" when no translation line is needed.
export function translationFor(line: DemoLine, language: LanguageCode): string {
  const spoken = spokenLanguageOf(line)
  if (language === "off") return ""
  if (language === "auto") return spoken === WEARER_LANGUAGE ? "" : line.en
  if (language === spoken) return ""
  return translationOf(line, language)
}

export function translationOf(line: DemoLine, language: LanguageCode): string {
  switch (language) {
    case "es":
      return line.es
    case "fr":
      return line.fr
    case "ja":
      return line.ja
    default:
      return ""
  }
}

// Rich text for a translation: the line's intake facts wrapped in a highlight color.
// Only the English translation is highlighted; any other text comes back unchanged.
export function highlightedTranslation(line: DemoLine, translation: string, colorHex: string): string {
  if (!line.highlights || translation !== line.en) return translation
  let out = translation
  for (const phrase of line.highlights) {
    out = out.replace(phrase, "<color=" + colorHex + ">" + phrase + "</color>")
  }
  return out
}
