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
  // "Rustdag", not "vriezer": ADR-031 gives that word back to the item status,
  // where it means something a child is done with rather than a day off.
  'home.restDay': '{aantal} rustdag bewaard',
  'home.restDays': '{aantal} rustdagen bewaard',
  'home.continueTitle': 'Verder waar je was',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.retentionAfter': 'Eén ronde vandaag houdt het op {procent}%.',
  'home.continueAction': 'Ga verder — {aantal} vragen',
  'home.setMastered': '{goed} van de {totaal} onthoud je',
  'home.setNew': 'nog niet geoefend',
  'home.moreWays': 'Andere manieren',

  // The frame. Module order is ADR-029; only the ones with content are shown,
  // so six of these seven are written down before they are needed rather than
  // guessed at when they are.
  'nav.modules': 'Modules',
  'nav.destinations': 'Waar je heen kunt',
  'nav.vandaag': 'Vandaag',
  'nav.onthouden': 'Onthouden',
  'nav.vrienden': 'Vrienden',
  'nav.jij': 'Jij',
  'module.topo': 'Topografie',
  'module.tafels': 'Tafels',
  'module.klok': 'Klokkijken',
  'module.woorden': 'Woordjes',
  'module.spelling': 'Spelling',
  'module.tijdvakken': 'Tijdvakken',
  'module.vlaggen': 'Vlaggen',

  // K9, wat je onthoudt. De tabel is het detail, de punten erboven zijn alles
  // in één blik — dezelfde vorm, kleiner, geen tweede diagram om te leren.
  'retention.title': 'Wat je onthoudt',
  'retention.glance': 'Alles in één blik',
  'retention.item': 'Onderdeel',
  'retention.status': 'Hoe het gaat',
  'retention.correct': 'Goed',
  'retention.due': 'Weer op',
  'retention.dueNow': 'vandaag',

  // K1's toetsdatumblok: het enige blok op het scherm met een vlak én een
  // rand, want het is de reden dat het kind vandaag oefent.
  'home.testLabel': 'toets',
  'home.testNone': 'Nog geen toetsdatum',
  'home.testToday': 'De toets is vandaag',
  'home.testTomorrow': 'De toets is morgen',
  'home.testInDays': 'Toets over {aantal} dagen',
  'home.testPast': 'De toets is geweest',
  'home.testPick': 'Wanneer is de toets?',
  'home.testSet': 'Datum instellen',
  'home.testChange': 'Datum wijzigen',

  // Een module die het plan wel heeft en het product nog niet. Alleen te
  // bereiken door het adres te typen; geen datum, want een datum die we missen
  // is erger dan geen datum.
  'soon.body': 'Deze module bestaat nog niet. We beginnen bij topografie.',
  'soon.action': 'Naar topografie',

  // Eén categorie, en de vorm ervan is het punt: tafels hoort onder rekenen,
  // klokkijken niet. Klokkijken is geen rekenen maar een instrument aflezen.
  'category.rekenen': 'Rekenen',
  'category.holds': 'Hieronder valt:',

  // Item status, K9. Four states, each with a shape as well as a word — and
  // none of them green, because green is an answer state and would tell a
  // child they had just got something right.
  'status.frozen': 'in de vriezer',
  'status.remembered': 'dit onthoud je nu',
  'status.practising': 'nog niet onthouden',
  'status.new': 'nog niet geoefend',

  // Set names
  'set.nl-provincies': 'Provincies van Nederland',
  'set.nl-hoofdsteden': 'Hoofdsteden van de provincies',
  'set.nl-waddeneilanden': 'De Waddeneilanden',
  'set.nl-wateren': 'Zeeën en meren',
  'set.nl-steden': 'Steden van Nederland',

  // Modes
  'mode.wijs-aan': 'Wijs aan',
  'mode.hoe-heet-dit': 'Typ de naam',
  'mode.ontdekken': 'Ontdek',
  'mode.bliksemronde': 'Bliksemronde',
  'mode.overleven': 'Overleven',
  'mode.meerkeuze': 'Meerkeuze',

  // K2. De volgorde van de vier manieren is het argument, dus staat de reden
  // erbij: meerkeuze is de instap naar typen, geen alternatief ervoor.
  'way.wijs-aan': 'Tik het gebied aan — voor de eerste keer',
  'way.meerkeuze': 'Kies uit vier namen — de instap naar typen',
  'way.hoe-heet-dit': 'Schrijf het zelf op — voor de toets',
  'way.ontdekken': 'Rondkijken, geen vragen',
  'choose.title': 'Wat wil je oefenen?',
  'choose.stepWhat': '1 · Waarover',
  'choose.stepHow': '2 · Hoe wil je oefenen? van makkelijk naar moeilijk',
  'choose.whenItSticks': 'Voor als het al zit',
  'choose.dueToday': '{aantal} vandaag op de rol',
  'choose.start': '{set} {hoe} · {aantal} vragen',

  // Explore
  'explore.kind': 'Ontdek de kaart',
  'explore.hint': 'Kies een naam. Je ziet meteen waar het ligt.',
  'explore.listLabel': 'Alles wat je kunt ontdekken',
  'explore.nothingChosen': 'Kies iets uit de lijst of tik op de kaart.',
  'explore.done': 'Klaar',

  // Practice
  'practice.kind': 'Wijs aan op de kaart',
  'practice.question': 'Waar ligt {naam}?',
  'practice.questionOf': 'vraag {nu} van {totaal}',
  'practice.counterTime': 'tijd',
  'practice.counterLives': 'levens',
  'practice.counterCorrect': 'goed',
  'practice.counterCombo': 'goed op rij',
  'practice.speak': 'Lees de vraag voor',
  'practice.correct': '{naam} — goed.',
  'practice.wrong': '{naam} ligt hier.',
  'practice.wrongSub': 'Je wees {gekozen} aan.',
  'practice.wrongTyped': 'Je schreef {gekozen}.',
  // The near miss from ADR-017: naming another real place is not a typo, and
  // saying so is the whole reason that decision exists.
  'practice.almost': 'Bijna!',
  'practice.almostSub':
    'Je schreef {gekozen}. Dat bestaat ook, maar het ligt ergens anders. Wij zochten {naam}.',
  'practice.next': 'Volgende vraag',
  'practice.stop': 'Stoppen',
  'practice.kindCity': 'Wijs de stad aan',
  'practice.kindIsland': 'Wijs het eiland aan',
  'practice.kindWater': 'Wijs het water aan',
  'practice.kindTypeWater': 'Hoe heet dit water?',
  'practice.kindTypeIsland': 'Hoe heet dit eiland?',
  'practice.kindTypeArea': 'Hoe heet dit gebied?',
  'practice.kindTypeCity': 'Hoe heet deze stad?',
  'practice.typeQuestion': 'Typ de naam',
  'practice.chooseQuestion': 'Kies de naam',
  'practice.dontKnow': 'Ik weet het niet',
  'practice.typePlaceholder': 'Naam',
  'practice.check': 'Kijk na',
  'practice.emptyAnswer': 'Typ eerst een naam.',
  'practice.loading': 'Kaart wordt geladen…',
  'practice.mapFailed': 'De kaart kon niet geladen worden.',

  // Result
  // "Ronde klaar" and not "Klaar!" (K8). The exclamation mark congratulated the
  // child for stopping, which is the one thing on this screen that is not an
  // achievement — and the register rule is that we talk about the work, never
  // about the child.
  // Rekenen. De tafels van 1 tot 12 en tien sommen per tafel, allebei uit het
  // app-ontwerp v2. Het oefenscherm zelf is daar niet getekend (ADR-049).
  'sums.title': 'Welke tafel?',
  'sums.table': 'Tafel van {tafel}',
  'sums.prompt': 'Hoeveel is het?',
  'sums.typeQuestion': 'Typ het antwoord',
  'sums.chooseQuestion': 'Kies het antwoord',
  'sums.typePlaceholder': 'Antwoord',
  'sums.correct': '{som} = {antwoord} — goed.',
  'sums.wrong': '{som} = {antwoord}.',
  'sums.wrongSub': 'Jij zei {gegeven}.',
  'sums.dontKnowSub': 'Deze komt zo weer langs.',
  'sums.start': 'Tafel van {tafel} {hoe} · {aantal} sommen',
  'sums.practiceMore': 'Deze sommen moet je nog oefenen',
  'mode.som-typen': 'Typ het antwoord',
  'mode.som-meerkeuze': 'Kies uit vier',
  'way.som-typen': 'Zeg het antwoord zelf — zo weet je of je de tafel kent',
  'way.som-meerkeuze': 'Kies uit vier getallen — de weg terug als typen niet lukt',

  'result.title': 'Ronde klaar',
  // The one place the word "score" is allowed: the result of one round. It is
  // never a word for how much a child knows (ADR-030).
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
  'result.streakSaved': 'Je rustdag heeft je streak gered.',
  'result.restDayEarned': 'Je hebt er een rustdag bij verdiend.',
  'result.newStamp': 'Nieuwe reisstempel: {naam}',
  // K8. De score staat er, maar wat er veranderd is, is het product: het enige
  // op dit scherm dat een kind niet zelf had kunnen uitrekenen.
  'result.changed': 'Wat er is veranderd',
  'result.gainedOne': 'Eén vraag meer die je nu onthoudt.',
  'result.gainedMany': '{aantal} vragen meer die je nu onthoudt.',
  'result.gainedNone': 'Nog niets erbij. Deze komen morgen terug.',
  'result.again': 'Nog een ronde',

  // K10. Twee schakelaars in plaats van drie: de leesmodus verviel (ADR-025).
  // School en woonplaats staan er niet en komen er niet — dat zijn de twee
  // velden die een naam op een apparaat veranderen in een vindbaar kind.
  'you.title': 'Jij',
  'you.nameIs': 'Je oefent als {naam}.',
  'you.settings': 'Instellingen',
  'you.readAloud': 'Vragen voorlezen',
  'you.readAloudWhy': 'Je kunt elke vraag laten voorlezen.',
  'you.timer': 'Klok bij het oefenen',
  'you.timerWhy': 'Haast helpt het onthouden niet.',
  'you.on': 'aan',
  'you.off': 'uit',
  'you.stays': 'Wat je oefent blijft op dit apparaat.',

  // Reisstempels. Elk criterium staat erbij, want een stempel die je niet kunt
  // uitleggen is een raadsel in plaats van een beloning — en een kind dat niet
  // weet waarvoor het er een kreeg, kan er ook niet nog een verdienen.
  //
  // "Op weg", voor je eerste ronde, bestaat niet meer: een stempel is er voor
  // wat je onthoudt, nooit voor meedoen alleen (ADR-040).
  'stamp.provincies-foutloos': 'Alle provincies foutloos',
  'stamp.provincies-foutloos.criterion': 'Een hele ronde provincies zonder fout.',
  'stamp.hoofdsteden-foutloos': 'Alle hoofdsteden foutloos',
  'stamp.hoofdsteden-foutloos.criterion': 'Een hele ronde hoofdsteden zonder fout.',
  'stamp.eilanden-foutloos': 'Alle Waddeneilanden foutloos',
  'stamp.eilanden-foutloos.criterion': 'Een hele ronde Waddeneilanden zonder fout.',
  'stamp.wateren-foutloos': 'Alle wateren foutloos',
  'stamp.wateren-foutloos.criterion': 'Een hele ronde wateren zonder fout.',
  'stamp.steden-foutloos': 'Alle steden foutloos',
  'stamp.steden-foutloos.criterion': 'Een hele ronde steden zonder fout.',
  'stamp.week-op-rij': 'Zeven dagen op rij',
  'stamp.week-op-rij.criterion': 'Zeven dagen achter elkaar geoefend.',
  'stamp.set-onthouden': 'Alles onthouden',
  'stamp.set-onthouden.criterion': 'Elk onderdeel vier keer op rij goed.',
  'stamp.bliksem-tien': 'Tien in een minuut',
  'stamp.bliksem-tien.criterion': 'Tien goed binnen één minuut.',
  'stamp.overleven-vijftien': 'Vijftien levens lang',
  'stamp.overleven-vijftien.criterion': 'Vijftien goed met drie levens.',
  // Profile
  'profile.title': 'Wie ben jij?',
  'profile.help': 'Typ je naam. Je naam blijft op dit apparaat.',
  'profile.placeholder': 'Je naam',
  'profile.submit': 'Beginnen',
  'profile.nameTooShort': 'Typ eerst je naam.',

  // Accessible names for things that have no visible label of their own
  'a11y.progress': 'Voortgang in deze ronde',
} as const;
