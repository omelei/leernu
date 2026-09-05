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
  'app.tagline': 'Leer waar alles ligt',

  // Home
  'home.greeting': 'Hoi {naam}!',
  'home.streakNone': 'Je begint vandaag',
  'home.privacy': 'Geen advertenties. Geen account nodig.',
  'home.continueTitle': 'Verder waar je was',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.retentionAfter': 'Eén ronde vandaag houdt het op {procent}%.',
  'home.continueAction': 'Ga verder — {aantal} vragen',
  'home.chooseOther': 'Of kies iets anders',
  'home.moduleTopo': 'Topografie',
  'home.setMastered': '{goed}/{totaal} vast',
  'home.setNew': 'nog niet geoefend',

  // Practice
  'practice.kind': 'Wijs aan op de kaart',
  'practice.question': 'Waar ligt {naam}?',
  'practice.counterQuestion': 'vraag',
  'practice.counterCombo': 'goed op rij',
  'practice.speak': 'Lees de vraag voor',
  'practice.correct': '{naam} — goed.',
  'practice.wrong': '{naam} ligt hier.',
  'practice.wrongSub': 'Je wees {gekozen} aan.',
  'practice.next': 'Volgende vraag',
  'practice.loading': 'Kaart wordt geladen…',
  'practice.mapFailed': 'De kaart kon niet geladen worden.',

  // Result
  'result.title': 'Klaar!',
  'result.score': '{goed} van de {totaal} goed',
  'result.practiceMore': 'Deze moet je nog oefenen',
  'result.allCorrect': 'Alles goed. Morgen komen er nieuwe bij.',
  'result.home': 'Terug naar start',

  // Profile
  'profile.title': 'Wie ben jij?',
  'profile.help': 'Typ je naam. Je naam blijft op dit apparaat.',
  'profile.placeholder': 'Je naam',
  'profile.submit': 'Beginnen',
  'profile.nameTooShort': 'Typ eerst je naam.',

  // Settings
  'settings.font': 'Makkelijker lezen',
  'settings.fontHelp': 'Een letter die voor sommige kinderen prettiger leest.',
  'settings.on': 'Aan',
  'settings.off': 'Uit',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
  'a11y.settings': 'Instellingen',
} as const;
