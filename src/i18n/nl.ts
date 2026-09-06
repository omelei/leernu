/**
 * Dutch copy. Every user-visible string in the product lives here.
 *
 * Wording follows docs/leer.nu oefenkaart.html and the app design where they
 * specify it; the rest is written for readers of roughly AVI-M6: short
 * sentences, common words, active voice, second person. Two habits that matter
 * more than they look: we say what happens rather than what the system does
 * ("je naam blijft op dit apparaat", not "gegevens worden lokaal opgeslagen"),
 * and we never use a word a ten-year-old would have to guess at.
 */
export const nl = {

  // Home
  'home.greeting': 'Hoi {naam}!',
  'home.streakNone': 'Je begint vandaag',
  // Dutch needs both forms; "1 dagen op rij" is the kind of small wrongness a
  // ten-year-old notices immediately.
  'home.streakOne': '1 dag op rij',
  'home.streakMany': '{aantal} dagen op rij',
  'home.freezes': '{aantal} vriezer bewaard',
  'home.freezesMany': '{aantal} vriezers bewaard',
  'home.privacy': 'Geen advertenties. Geen account nodig.',
  'home.continueTitle': 'Verder waar je was',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.retentionAfter': 'Eén ronde vandaag houdt het op {procent}%.',
  'home.continueAction': 'Ga verder — {aantal} vragen',
  'home.setMastered': '{goed}/{totaal} vast',
  'home.setNew': 'nog niet geoefend',

  // Set names
  'set.nl-provincies': 'Provincies van Nederland',
  'set.nl-hoofdsteden': 'Hoofdsteden van de provincies',
  'set.nl-waddeneilanden': 'De Waddeneilanden',

  // Modes
  'mode.wijs-aan': 'Wijs aan',
  'mode.hoe-heet-dit': 'Typ de naam',

  // Practice
  'practice.kind': 'Wijs aan op de kaart',
  'practice.question': 'Waar ligt {naam}?',
  'practice.counterQuestion': 'vraag',
  'practice.counterCombo': 'goed op rij',
  'practice.speak': 'Lees de vraag voor',
  'practice.correct': '{naam} — goed.',
  'practice.wrong': '{naam} ligt hier.',
  'practice.wrongSub': 'Je wees {gekozen} aan.',
  'practice.wrongTyped': 'Je schreef {gekozen}.',
  // The near miss from ADR-017: naming another real place is not a typo, and
  // saying so is the whole reason that decision exists.
  'practice.almost': 'Bijna!',
  'practice.almostSub': 'Je schreef {gekozen}. Dat bestaat ook, maar het ligt ergens anders. Wij zochten {naam}.',
  'practice.next': 'Volgende vraag',
  'practice.stop': 'Stoppen',
  'practice.kindCity': 'Wijs de stad aan',
  'practice.kindIsland': 'Wijs het eiland aan',
  'practice.kindTypeIsland': 'Hoe heet dit eiland?',
  'practice.kindTypeArea': 'Hoe heet dit gebied?',
  'practice.kindTypeCity': 'Hoe heet deze stad?',
  'practice.typeQuestion': 'Typ de naam',
  'practice.typePlaceholder': 'Naam',
  'practice.check': 'Kijk na',
  'practice.emptyAnswer': 'Typ eerst een naam.',
  'practice.loading': 'Kaart wordt geladen…',
  'practice.mapFailed': 'De kaart kon niet geladen worden.',

  // Result
  'result.title': 'Klaar!',
  'result.score': '{goed} van de {totaal} goed',
  'result.practiceMore': 'Deze moet je nog oefenen',
  'result.allCorrect': 'Alles goed. Morgen komen er nieuwe bij.',
  'result.home': 'Terug naar start',
  'result.stoppedEarly': 'Je stopte na {gedaan} van de {totaal} vragen.',
  'result.mapLabel': 'Kaart met wat je nog moet oefenen',
  'result.mapHelp': 'De blauwe plekken moet je nog oefenen.',
  'result.streakStarted': 'Je bent begonnen. Kom morgen terug!',
  'result.streakGrew': 'Dat is {aantal} dagen op rij.',
  'result.streakGrewOne': 'Dat is je eerste dag.',
  'result.streakSaved': 'Je vriezer heeft je streak gered.',
  'result.freezeEarned': 'Je hebt er een vriezer bij verdiend.',

  // Profile
  'profile.title': 'Wie ben jij?',
  'profile.help': 'Typ je naam. Je naam blijft op dit apparaat.',
  'profile.placeholder': 'Je naam',
  'profile.submit': 'Beginnen',
  'profile.nameTooShort': 'Typ eerst je naam.',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
} as const;
