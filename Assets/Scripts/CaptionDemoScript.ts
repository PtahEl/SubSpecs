// Demo mode conversation: a scripted conference-corridor chat between three speakers.
// Each line arrives on a timer as if spoken. Translations are pre-written for the demo
// languages; the full language list only exists in Live mode (Caption server).

export type LanguageCode = "off" | "es" | "fr" | "ja"

export interface LanguageOption {
  code: LanguageCode
  label: string
}

export const DEMO_LANGUAGES: LanguageOption[] = [
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
  en: string
  es: string
  fr: string
  ja: string
}

// Speaker 1 is the old friend, then speakers 2 and 3 join. Gaps between a speaker's
// lines are longer than the 3 s hold so each card visibly hides and comes back.
export const DEMO_LINES: DemoLine[] = [
  {
    speaker: 1,
    at: 1.0,
    en: "Hey! Is that really you? It's been, what, six years?",
    es: "¡Oye! ¿De verdad eres tú? Han pasado, ¿qué, seis años?",
    fr: "Hé ! C'est vraiment toi ? Ça fait quoi, six ans ?",
    ja: "ねえ！本当に君？もう6年ぶりくらいかな？"
  },
  {
    speaker: 1,
    at: 6.5,
    en: "I almost didn't recognize you with the beard.",
    es: "Casi no te reconozco con la barba.",
    fr: "Je ne t'ai presque pas reconnu avec la barbe.",
    ja: "ひげで危うく気づかないところだったよ。"
  },
  {
    speaker: 2,
    at: 14.0,
    en: "Sorry to jump in. Are you two speaking on the accessibility panel?",
    es: "Perdón por interrumpir. ¿Ustedes dos hablan en el panel de accesibilidad?",
    fr: "Désolé de vous interrompre. Vous intervenez au panel sur l'accessibilité ?",
    ja: "割り込んでごめんなさい。お二人はアクセシビリティのパネルで話す方ですか？"
  },
  {
    speaker: 1,
    at: 21.0,
    en: "Just me. This is my old friend from university.",
    es: "Solo yo. Este es mi viejo amigo de la universidad.",
    fr: "Juste moi. Voici mon vieil ami de l'université.",
    ja: "私だけです。こちらは大学時代の古い友人です。"
  },
  {
    speaker: 3,
    at: 27.0,
    en: "Mind if I join you? The coffee line is endless.",
    es: "¿Les importa si me uno? La fila del café es interminable.",
    fr: "Je peux me joindre à vous ? La queue pour le café est interminable.",
    ja: "ご一緒してもいいですか？コーヒーの列が全然進まなくて。"
  },
  {
    speaker: 2,
    at: 32.5,
    en: "Of course. Did you catch the keynote this morning?",
    es: "Claro. ¿Viste la conferencia principal esta mañana?",
    fr: "Bien sûr. Tu as vu la keynote ce matin ?",
    ja: "もちろん。今朝の基調講演は見ましたか？"
  },
  {
    speaker: 3,
    at: 38.0,
    en: "I did. The live captions demo was amazing.",
    es: "Sí. La demo de subtítulos en vivo fue increíble.",
    fr: "Oui. La démo de sous-titres en direct était incroyable.",
    ja: "見ました。ライブ字幕のデモがすごかったです。"
  },
  {
    speaker: 1,
    at: 43.5,
    en: "Funny you say that. My friend is wearing them right now.",
    es: "Qué curioso. Mi amigo los lleva puestos ahora mismo.",
    fr: "C'est drôle. Mon ami les porte en ce moment même.",
    ja: "偶然ですね。友人がちょうど今それを着けているんです。"
  },
  {
    speaker: 2,
    at: 49.0,
    en: "Wait, so you can read everything we're saying?",
    es: "Espera, ¿entonces puedes leer todo lo que decimos?",
    fr: "Attends, tu peux lire tout ce qu'on dit ?",
    ja: "待って、じゃあ私たちの話が全部読めるの？"
  },
  {
    speaker: 3,
    at: 54.5,
    en: "That's brilliant. Let's grab a table and keep talking.",
    es: "Genial. Busquemos una mesa y sigamos hablando.",
    fr: "Génial. Trouvons une table et continuons à parler.",
    ja: "すばらしい。テーブルを取って話を続けましょう。"
  }
]

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
