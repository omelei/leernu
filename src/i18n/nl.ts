/**
 * Dutch copy. Every user-visible string in the product lives here.
 *
 * Written for readers of roughly AVI-M6: short sentences, common words, active
 * voice, and the second person. Two habits that matter more than they look:
 * we say what happens rather than what the system does ("je naam blijft op dit
 * apparaat", not "gegevens worden lokaal opgeslagen"), and we never use a word
 * a ten-year-old would have to guess at.
 *
 * The teacher-facing side, when it arrives, gets its own namespace and a plainer
 * professional register. Do not mix the two.
 */
export const nl = {
  'app.tagline': 'Leer waar alles ligt',

  'home.greeting': 'Hoi {naam}!',
  'home.noMapsTitle': 'De kaarten komen eraan',
  'home.noMapsBody': 'Hier ga je straks oefenen met provincies, steden en rivieren.',
  'home.practice': 'Oefenen',

  'profile.title': 'Wie ben jij?',
  'profile.help': 'Typ je naam. Je naam blijft op dit apparaat.',
  'profile.placeholder': 'Je naam',
  'profile.submit': 'Beginnen',
  'profile.nameTooShort': 'Typ eerst je naam.',

  'privacy.line': 'Geen advertenties. Alles wat je doet blijft op dit apparaat.',

  'settings.title': 'Instellingen',
  'settings.font': 'Makkelijker lezen',
  'settings.fontHelp': 'Een letter die voor sommige kinderen prettiger leest.',
  'settings.on': 'Aan',
  'settings.off': 'Uit',

  'streak.days': '{aantal} dagen op rij',
  'streak.none': 'Je bent nog niet begonnen',

  'a11y.mainLabel': 'Startscherm',
  'a11y.settingsLabel': 'Instellingen',
} as const;
