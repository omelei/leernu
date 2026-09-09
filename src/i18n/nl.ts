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
  'home.streakNone': 'Je begint vandaag',
  // Dutch needs both forms; "1 dagen op rij" is the kind of small wrongness a
  // ten-year-old notices immediately.
  'home.streakOne': '1 dag op rij',
  'home.streakMany': '{aantal} dagen op rij',
  // "Rustdag", not "vriezer": ADR-031 gives that word back to the item status,
  // where it means something a child is done with rather than a day off.
  'home.restDay': '{aantal} rustdag bewaard',
  'home.restDays': '{aantal} rustdagen bewaard',
  // K1, de landingspagina. De begroeting zet het kind bovenaan het scherm; de
  // zin eronder zegt hardop wat op een fout lijkt: dat je vragen terugkrijgt
  // die je al had. Dat is precies de belofte.
  //
  // Wat die zin niet meer doet is een aantal noemen. "Vandaag oefen je 10
  // vragen" las als een opdracht met een plafond: tien, en dan ben je klaar.
  // Niets in het product stopt na tien, dus zegt de zin nu wat er wel waar is
  // - je oefent zolang je wilt, en wat je eerder had komt terug omdat het zo
  // blijft hangen.
  'home.welcome': 'Welkom {naam}!',
  'home.todayOpen':
    'Oefen zolang je wilt. Vragen die je eerder had komen terug, want zo onthoud je ze.',
  'home.practiceMore': 'Verder oefenen',
  // De tegels tussen het toetsblok en het logboek: waar je zelf het vaakst
  // naar teruggaat, met het aantal keer erbij. Dat getal komt van dit apparaat
  // en van niets anders - er is geen server die meekijkt, dus er is ook geen
  // "3.412 keer gespeeld" te tonen dat waar zou zijn.
  'home.popularTitle': 'Meest geoefend',
  'home.popularIntro': 'Waar je het vaakst naar teruggaat.',
  'home.popularNew': 'Hier begin je mee.',
  'home.popularTimes': '{aantal} keer gespeeld',
  'home.popularOnce': '1 keer gespeeld',
  'home.popularNone': 'nog niet geoefend',
  // De voorspelling stond hier en staat nu alleen nog op K9. Weg in plaats van
  // ongebruikt blijven staan: copy die nergens meer verschijnt is copy die
  // niemand nog leest en die bij de volgende ronde toch wordt meegewogen.
  // Wat je net gedaan hebt, met het cijfer erbij. Een logboek, geen ranglijst:
  // het staat er in de volgorde waarin het gebeurde en telt niets bij elkaar op.
  'home.recentTitle': 'Recent geoefend',
  'home.recentNone': 'Nog niets geoefend. Na je eerste ronde staat het hier.',
  'home.recentGrade': 'cijfer',
  'home.recentOutOf': '{goed} van de {totaal} goed',

  // Alles bij elkaar, over alle rondes ooit. Nadrukkelijk niet hetzelfde als
  // wat je onthoudt: dit gaat over antwoorden die je gaf, dat over wat er
  // blijft hangen.
  'home.accuracyTitle': 'Goed beantwoord',
  'home.accuracyOf': '{goed} van de {totaal} vragen',
  'home.accuracyNone': 'Nog geen antwoorden. Doe één ronde.',

  // Waar je zelf steeds naar teruggaat, in één tik. Geen aanbeveling en geen
  // algoritme: het is wat je het vaakst gekozen hebt.
  'home.favouritesTitle': 'Jouw favorieten',
  'home.favouritesNone': 'Nog geen favorieten. Wat je vaak oefent, komt hier te staan.',

  // De reis. Alles hier komt uit één getal dat het product al sinds de eerste
  // versie bijhoudt en nooit liet zien: tien punten voor elk goed antwoord.
  // De middelste regel is de regel die telt — "nog 340 punten" is een munt
  // waarin niemand rekent, "nog 6 goede antwoorden" is iets wat je vanmiddag
  // kunt gaan doen. Nergens staat hoe lang of hoe vaak: door wachten gebeurt
  // hier niets.
  'home.journeyTitle': 'Jouw voortgang',
  'home.journeyLevel': 'Niveau {niveau}',
  'home.journeyHave': '{aantal} van de {totaal} dieren',
  'home.journeyBar': 'Op weg naar niveau {niveau}',
  'home.journeyToGo': 'Nog {aantal} goede antwoorden tot niveau {niveau}.',
  'home.journeyOneToGo': 'Nog één goed antwoord tot niveau {niveau}.',
  // Wat hierna komt is een verrassing, en de regel zegt dat ook. Hij noemde
  // het dier bij naam - "Hierna: vos in zwart" - en daarmee was het geen
  // verrassing meer maar een vooraankondiging. Wat er nu staat is wat je wel
  // mag weten: in welke reeks hij valt, en dus hoe zeldzaam hij is. Het
  // silhouet ernaast doet de rest.
  'home.journeyNext': 'Hierna: een nieuw dier in {reeks}',
  'home.journeyComplete': 'Je hebt alle dieren. Je niveau blijft stijgen.',
  'home.journeyAll': 'Bekijk alles wat je kunt halen',

  // De andere streak: goede antwoorden op rij, zonder dag ertussen. Hij staat
  // onder het percentage en niet erboven, want het is het enige getal in het
  // product dat één fout antwoord meteen afpakt.
  'home.runLabel': 'Foutloos op rij',
  'home.runBest': 'beste {aantal}',
  'sticker.kat': 'Kat',
  'sticker.uil': 'Uil',
  'sticker.vos': 'Vos',
  'sticker.beer': 'Beer',
  'sticker.haas': 'Haas',
  'sticker.vis': 'Vis',
  'sticker.egel': 'Egel',
  'sticker.kikker': 'Kikker',
  'sticker.eekhoorn': 'Eekhoorn',
  'sticker.pinguin': 'Pinguïn',
  'sticker.olifant': 'Olifant',
  'sticker.draak': 'Draak',
  'home.modules': 'Wat je kunt oefenen',
  'home.continueTitle': 'Verder waar je was',
  'home.retention': 'weet je hier over drie weken nog van',
  'home.setMastered': '{goed} van de {totaal} onthoud je',
  'home.setNew': 'nog niet geoefend',

  // The frame. Module order is ADR-029; only the ones with content are shown,
  // so six of these seven are written down before they are needed rather than
  // guessed at when they are.
  'nav.modules': 'Modules',
  // Het logo linksboven, dat naar de voordeur gaat. De naam van de knop noemt
  // het merk en wat de knop doet: een merkteken alleen zegt niet waar je
  // uitkomt, en "Naar Vandaag" alleen laat de naam van het product uit het
  // scherm verdwijnen voor wie het niet ziet. De merknaam komt uit brand.ts.
  'nav.home': '{merk}, naar Vandaag',
  'nav.destinations': 'Waar je heen kunt',
  'nav.vandaag': 'Vandaag',
  'nav.onthouden': 'Onthouden',
  'nav.vrienden': 'Vrienden',
  'nav.jij': 'Jij',
  // De rail draagt korte woorden, zoals K1 ze tekent: "topo", niet
  // "Topografie". Een rail van 88 breed leest als een lijst en niet als proza.
  'module.topo': 'Topo',
  'module.tafels': 'Rekenen',
  'module.klok': 'Klok',
  'module.woorden': 'Taal',
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
  // Meer dan één, want een periode is nooit één toets: topografie op dinsdag en
  // de tafels de vrijdag erna. Het blok toont ze allemaal en verder niets.
  'home.testTitle': 'Je toetsen',
  'home.testToday': 'De toets is vandaag',
  'home.testTomorrow': 'De toets is morgen',
  'home.testInDays': 'Toets over {aantal} dagen',
  'home.testPick': 'Wanneer is de toets?',
  'home.testAdd': 'Toets toevoegen',
  'home.testSave': 'Toevoegen',
  'home.testRemove': 'Weg',
  'home.testRemoveOne': 'Haal de toets weg: {wanneer}',
  // Het vak erbij, want een datum zonder vak plant niets. Alleen vakken die
  // bestaan: een toets voor klokkijken instellen belooft oefenstof die er niet
  // is. Het gekozen vak bepaalt waarmee "Ga verder" verdergaat.
  'home.testSubjectPick': 'Voor welk vak?',
  'home.testSubjectNone': 'Nog geen vak',

  // Een module die het plan wel heeft en het product nog niet. Geen datum,
  // want een datum die we missen is erger dan geen datum — en geen enkele
  // module wordt bij naam genoemd als de plek om heen te gaan: die lijst staat
  // eronder en groeit vanzelf mee.
  'soon.subtitle': 'Bestaat nog niet',
  'soon.body': 'Deze module bestaat nog niet. We zijn hem aan het maken.',
  'soon.instead': 'Dit kun je nu wel oefenen',
  'soon.insteadLine': 'Klaar om te oefenen',

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
  // De landen. De naam draagt de kaart mee, want "Landen" alleen zegt niet
  // welke - en deze naam staat op de startknop en in het logboek, waar de
  // regiorij van de kieslijst niet meekomt.
  'set.europa-landen': 'Landen van Europa',
  'set.afrika-landen': 'Landen van Afrika',
  'set.azie-landen': 'Landen van Azië',
  'set.noord-amerika-landen': 'Landen van Noord-Amerika',
  'set.zuid-amerika-landen': 'Landen van Zuid-Amerika',
  'set.oceanie-landen': 'Landen van Oceanië',
  'set.wereld-landen': 'Landen van de wereld',
  // De mix. Geen zesde set maar dezelfde items onder één naam, zodat een
  // provincie die je hier goed hebt hetzelfde doosje opschuift als altijd.
  'set.nl-mix': 'Topomix',
  // Kort, want deze regel staat op een tegel naast vijf andere: de vijf sets
  // opnoemen maakte die tegel twee keer zo hoog als de rest van de rij.
  'set.nl-mix.uitleg': 'Alles van de kaart door elkaar',

  // Topografie in drie stappen: eerst waar op de wereld, dan wat, dan hoe.
  // De regio staat vooraan omdat het de grofste keuze is die er te maken valt
  // — en omdat een kind dat de provincies zoekt niet langs de landen van
  // Europa hoeft. Wereld en Europa staan er wel en zijn nog niet te openen,
  // dezelfde afspraak die de linkerbalk maakt over modules die nog komen.
  'regio.title': 'Waar op de kaart?',
  'regio.wereld': 'Wereld',
  'regio.afrika': 'Afrika',
  'regio.azie': 'Azië',
  'regio.europa': 'Europa',
  'regio.noord-amerika': 'Noord-Amerika',
  'regio.zuid-amerika': 'Zuid-Amerika',
  'regio.oceanie': 'Oceanië',
  'regio.nederland': 'Nederland',
  'regio.soon': 'binnenkort',

  // Eén woord per onderwerp. "Provincies van Nederland" zei twee keer waar je
  // bent — de regio erboven zegt het al — en las op een tegel als een zin in
  // plaats van als een knop.
  'onderwerp.provincies': 'Provincies',
  'onderwerp.steden': 'Steden',
  'onderwerp.steden.uitleg': 'De hoofdsteden, of alle tachtig',
  'onderwerp.steden.keuze': 'Welke steden?',
  'onderwerp.steden.kortHoofd': 'Hoofdsteden',
  'onderwerp.steden.kortAlle': 'Alle',
  'onderwerp.wateren': 'Wateren',
  'onderwerp.eilanden': 'Eilanden',
  'onderwerp.topomix': 'Mix',
  'onderwerp.landen': 'Landen',
  // Het aantal staat erbij, want dat is wat een kind wil weten voordat het
  // begint: zestien landen is een middag, honderdzevenenzestig is een jaar.
  'onderwerp.landen.europa': 'Alle 46 landen van Europa',
  'onderwerp.landen.afrika': 'Alle 52 landen van Afrika',
  'onderwerp.landen.azie': 'Alle 47 landen van Azië',
  'onderwerp.landen.noord-amerika': 'Alle 23 landen van Noord-Amerika',
  'onderwerp.landen.zuid-amerika': 'Alle 12 landen van Zuid-Amerika',
  'onderwerp.landen.oceanie': 'Alle 9 landen van Oceanië',
  'onderwerp.landen.wereld': 'Alle 167 landen bij elkaar',

  // Modes
  'mode.wijs-aan': 'Aanwijzen',
  'mode.hoe-heet-dit': 'Typ de naam',
  'mode.ontdekken': 'Ontdekken',
  'mode.bliksemronde': 'Bliksemronde',
  'mode.overleven': 'Overleven',
  'mode.meerkeuze': 'Meerkeuze',

  // K2. De volgorde van de zes manieren is het argument, dus staat de reden
  // erbij: meerkeuze is de instap naar typen, geen alternatief ervoor. De klok
  // en de levens staan achteraan en zeggen zelf waarvoor ze zijn — ze staan in
  // de lijst, want alles wat een ronde start hoort langs dezelfde startknop.
  'way.wijs-aan': 'Tik het gebied aan — voor de eerste keer',
  'way.meerkeuze': 'Kies uit vier namen — de instap naar typen',
  'way.hoe-heet-dit': 'Schrijf het zelf op — voor de toets',
  'way.ontdekken': 'Rondkijken, geen vragen',
  'way.bliksemronde': 'Zo veel mogelijk in een minuut — voor als het al zit',
  'way.overleven': 'Doorgaan tot je levens op zijn — voor als het al zit',
  // Bij naam, net als de begroeting op de voordeur. "Wat wil je oefenen?" aan
  // niemand in het bijzonder is een formulier; aan Fem gevraagd is het een
  // vraag, en zij is degene die hem beantwoordt.
  'choose.title': 'Wat wil je oefenen, {naam}?',
  // "Waarover" was een woord dat niemand van tien hardop zegt. Deze zegt wat
  // de stap van je vraagt in plaats van waar hij over gaat.
  // De nummers staan niet meer in de tekst: de pagina telt zelf, want
  // topografie heeft een stap meer dan rekenen en één vaste "1 ·" in de copy
  // zou op één van de twee pagina's het verkeerde getal zijn.
  'choose.stepWhat': 'Kies een onderwerp',
  // "Van makkelijk naar moeilijk" stond in de kop en is eruit. Het was een
  // toelichting op de volgorde, niet de vraag zelf, en het maakte van een kop
  // van vier woorden een zin van acht — op een telefoon twee regels lang.
  // De volgorde blijft; wat weg is, is het bijschrift erop.
  'choose.stepHow': 'Hoe wil je oefenen?',
  'choose.dueToday': '{aantal} vandaag op de rol',
  'choose.testSubject': 'Hier gaat je toets over.',

  // Wat er nog niet zit, als dat ergens anders wacht dan waar het kind kijkt.
  // Het kiest de set en start niets: hoe je oefent blijft aan het kind.
  'choose.dueBody': 'Er staan {aantal} onderdelen van {set} vandaag op de rol.',
  'choose.dueAction': 'Kies {set}',

  // De startknop draagt de gekozen combinatie in woorden, en zijn maat komt
  // uit de ronde zelf: vragen, seconden of levens. Daarnaast hoe lang het
  // ongeveer duurt — de enige regel op deze pagina die net zo goed voor de
  // ouder in de kamer is als voor het kind.
  'choose.start': '{set} {hoe} · {aantal} vragen',
  'choose.startTime': '{set} {hoe} · {seconden} seconden',
  'choose.startLives': '{set} {hoe} · {aantal} levens',
  'choose.startOpen': '{set} {hoe}',
  'choose.minutes': 'Ongeveer {aantal} minuten',
  'choose.minuteOne': 'Ongeveer 1 minuut',
  // De knop zegt wat hij doet en niets meer; de zin ernaast zegt wat er gaat
  // gebeuren. Dat was eerst één ding — de knop dróég de zin — en dat leest een
  // kind niet als de weg vooruit. Wat een schermlezer hoort is nog steeds het
  // hele ding, want dat staat in het label.
  'choose.go': 'Start',
  'choose.goLabel': 'Start: {wat}',
  // Hoe lang de ronde duurt, waar er meer dan één eerlijk antwoord is. Tien is
  // wat een ronde altijd was en blijft de standaard; de rest bestaat omdat de
  // Rekenmix vijfhonderd sommen heeft.
  // De toetsstand. Geen zevende manier van oefenen maar een schakelaar op de
  // manier die je al koos: "de antwoorden komen pas aan het eind" kun je doen
  // met aanwijzen, met kiezen en met typen. Hij staat waar "hoeveel vragen?"
  // staat, want het is hetzelfde soort ding - een eigenschap van de ronde die
  // de twee stappen erboven al gekozen hebben.
  'choose.testModeLabel': 'Zoals op school',
  'choose.testMode': 'Toetsstand',
  'choose.testModeWhy': 'Je ziet pas aan het eind wat goed was, en je krijgt een cijfer.',
  'choose.startTest': '{wat} · toetsstand',
  'choose.likeTheTest': 'Oefen zoals de toets',
  'choose.howMany': 'Hoeveel vragen?',
  'choose.howManyOne': '{aantal} vragen',

  // De onderwerpen van rekenen. Vier soorten sommen en een mix ervan; de tafels
  // en het delen hebben er dertien elk, en die staan als knopjes onder de kaart
  // in plaats van als dertien kaarten ernaast.
  'onderwerp.tafels': 'Tafels',
  'onderwerp.tafels.uitleg': 'Keersommen, de tafel van 1 tot en met 12',
  'onderwerp.tafels.keuze': 'Welke tafel?',
  'onderwerp.delen': 'Deelsommen',
  'onderwerp.delen.uitleg': 'De tafels andersom: 56 : 7',
  'onderwerp.delen.keuze': 'Delen door welk getal?',
  'onderwerp.plus': 'Plussommen',
  'onderwerp.plus.uitleg': 'Optellen tot 20, 100 of 1000',
  'onderwerp.min': 'Minsommen',
  'onderwerp.min.uitleg': 'Aftrekken tot 20, 100 of 1000',
  'onderwerp.bereik.keuze': 'Tot welk getal?',
  // De mix heet naar wat erin zit en niet naar hoe spannend hij is: een kind
  // dat op deze kaart drukt hoort te weten wat het krijgt.
  'onderwerp.rekenmix': 'Rekenmix',
  'onderwerp.rekenmix.uitleg': 'Keer, delen, plus en min door elkaar',
  'onderwerp.rekenmix.keuze': 'Hoe moeilijk?',
  // Het enige onderwerp dat voor elk kind anders is. Hij staat er alleen als er
  // iets in zit: een kaart met nul sommen is een kaart over niets.
  'onderwerp.fouten': 'Oefen je fouten',
  'onderwerp.fouten.uitleg': 'De sommen die je eerder fout had',

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
  'practice.kindCountry': 'Wijs het land aan',
  'practice.kindTypeCountry': 'Hoe heet dit land?',
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
  'sums.table': 'Tafel van {tafel}',
  'sums.divideBy': 'Delen door {tafel}',
  'sums.plusUpTo': 'Plussommen tot {grens}',
  'sums.minusUpTo': 'Minsommen tot {grens}',
  'sums.upTo': 'tot {grens}',
  'sums.allTables': 'Alle tafels door elkaar',
  'sums.allDivides': 'Alle deelsommen door elkaar',
  // Het knopje naast de twaalf getallen. 'Door elkaar' en niet 'Alles', zodat
  // wat je ziet ook in de naam staat die een schermlezer voorleest — WCAG 2.5.3,
  // en de reden dat spraakbediening 'druk op door elkaar' begrijpt.
  'sums.allShort': 'Door elkaar',
  'sums.mix': 'Rekenmix',
  'sums.mistakes': 'Jouw fouten',
  // De drie moeilijkheden van de Rekenmix. Het niveau stond al op elke set en
  // bepaalde alleen de volgorde; nu bepaalt het ook wat er in de mix zit.
  'sums.mixLevel1': 'Rekenmix makkelijk',
  'sums.mixLevel1.kort': 'Makkelijk',
  'sums.mixLevel2': 'Rekenmix gemiddeld',
  'sums.mixLevel2.kort': 'Gemiddeld',
  'sums.mixLevel3': 'Rekenmix pittig',
  'sums.mixLevel3.kort': 'Pittig',
  'sums.prompt': 'Hoeveel is het?',
  'sums.typeQuestion': 'Typ het antwoord',
  'sums.chooseQuestion': 'Kies het antwoord',
  'sums.typePlaceholder': 'Antwoord',
  'sums.correct': '{som} = {antwoord} — goed.',
  'sums.wrong': '{som} = {antwoord}.',
  'sums.wrongSub': 'Jij zei {gegeven}.',
  'sums.dontKnowSub': 'Deze komt zo weer langs.',
  'sums.practiceMore': 'Deze sommen moet je nog oefenen',
  'mode.som-typen': 'Typ het antwoord',
  'mode.som-meerkeuze': 'Kies uit vier',
  // De tafeltoets die een kind van school kent, zonder de stopwatch: op de
  // instellingenpagina staat dat haast het onthouden niet helpt, en dat zetten
  // we niet uit voor de ene oefening waar een kind het het meest zou voelen.
  'mode.tafeldiploma': 'Tafeldiploma',
  'sums.diplomaStop': 'Bekijk je poging',
  'sums.diplomaEarned': 'Diploma gehaald: tafel van {tafel}',
  'sums.diplomaMissed': 'Nog geen diploma. Alle tien goed, dan is hij van jou.',
  'rekenen.diplomasTitle': 'Jouw tafeldiploma’s',
  'rekenen.diplomasCount': '{aantal} van de {totaal} gehaald',
  'rekenen.diplomaHave': 'Tafel van {tafel}: diploma gehaald',
  'rekenen.diplomaWant': 'Tafel van {tafel}: nog geen diploma',
  'way.som-typen': 'Zeg het antwoord zelf — zo weet je of je de tafel kent',
  'way.som-meerkeuze': 'Kies uit vier getallen — de weg terug als typen niet lukt',
  'way.tafeldiploma': 'De hele tafel foutloos — één fout en je begint opnieuw',

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

  // Het cijfer, en alleen na een toetsstand. Elke ronde wordt geteld en elke
  // ronde komt met een cijfer in het logboek, maar een cijfer voor een ronde
  // waarin de app je na elke vraag het antwoord gaf zegt niets over jou.
  'result.markLabel': 'cijfer',
  'result.markWhy': 'Zonder hulp onderweg, net als op school.',

  // Het pakje dat opengaat. Alleen te zien op het scherm na een ronde, en
  // alleen als er echt iets uit kwam - een kaart die er elke keer staat is
  // binnen een week meubilair. Geen "goed gedaan": het product zegt wat er
  // gebeurd is, niet wat je ervan moet vinden.
  'result.newAnimalTitle': 'Een nieuw dier',
  'result.newAnimalOne': 'Je hebt een nieuw dier!',
  'result.newAnimalMany': 'Je hebt {aantal} nieuwe dieren!',
  'result.newAnimalIn': '{dier} in {reeks}',
  // Waarvoor je hem kreeg staat erbij, net als bij een reisstempel. Een
  // beloning die je niet kunt uitleggen is een raadsel, en dan kun je er ook
  // geen tweede met opzet verdienen.
  'result.newAnimalLevel': 'Je haalde niveau {niveau}.',
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
  'you.children': 'Wie oefent er?',
  'you.practisingNow': 'oefent nu',
  'you.switchTo': 'Geef {naam} de beurt',
  'you.addChild': 'Nog een kind erbij',
  'you.childName': 'Naam van het kind',
  'you.add': 'Toevoegen',
  'you.childExplain':
    'Ieder kind heeft een eigen voortgang. Wat de een oefent, telt niet mee voor de ander.',
  // Het blok voor de volwassene. Nadrukkelijk geen rapport over het kind: geen
  // voorspelling, geen percentage, geen vergelijking. Wat er staat is wat er
  // gebeurd is — rondes, en waar ze op uitkwamen.
  'you.week': 'Deze week',
  'you.weekNone': 'Deze week nog niet geoefend.',
  'you.weekRounds': '{rondes} rondes op {dagen} dagen, samen {vragen} vragen.',
  'you.weekGrade': 'Gemiddeld cijfer {cijfer}.',
  'you.weekNoGrade': 'Nog geen cijfer deze week.',
  'you.weekMost': 'Het meest geoefend: {set}.',
  'you.settings': 'Instellingen',
  'you.readAloud': 'Vragen voorlezen',
  'you.readAloudWhy': 'Je kunt elke vraag laten voorlezen.',
  'you.timer': 'Klok bij het oefenen',
  'you.timerWhy': 'Haast helpt het onthouden niet.',
  'you.on': 'aan',
  'you.off': 'uit',
  'you.stays': 'Wat je oefent blijft op dit apparaat.',

  // De verzamelpagina: alles wat er te halen valt en wat het kost. De kaart in
  // de rechterkolom kan er maar één tegelijk laten zien; dit is het geheel.
  // Nergens staat wanneer — alles hier koop je met goede antwoorden.
  'reis.title': 'Jouw voortgang',
  'reis.intro': 'Alles wat je kunt halen, en wat het kost. Wat het wordt, zie je als je het haalt.',
  'reis.level': 'Jouw niveau',
  'reis.answered': '{aantal} goede antwoorden',
  'reis.animals': 'Dieren',
  'reis.animalsHave': '{aantal} van de {totaal}',
  'reis.reeksHave': '{reeks} · {aantal} van de {totaal}',
  'reis.animalHave': '{dier} in {reeks}',
  // Niet-gehaalde dieren houden hun naam voor zich. Wat erbij staat is wat je
  // ervoor moet doen, want daar kun je op mikken; wie het wordt is de
  // verrassing die het halen de moeite waard maakt.
  'reis.animalWant': 'Nog onbekend dier in {reeks}, vanaf niveau {niveau}',
  'reis.lockedLevel': 'niveau {niveau}',
  'reis.stamps': 'Reisstempels',
  'reis.stampsHave': '{aantal} van de {totaal}',

  // De vijf reeksen. Kleine letter, want ze staan midden in een zin — en in een
  // kop zet de opmaak ze zelf al in kapitalen.
  //
  // Brons, zilver, goud, platina, ultra: de ladder die elk kind al kent uit de
  // spellen die ze buiten dit product spelen. "Zwart" en "diamant" zeiden
  // niets over hoe ver je was; deze vijf wel, en "ultra" is een woord dat een
  // kind meteen als het einde van de ladder leest.
  'reeks.brons': 'brons',
  'reeks.zilver': 'zilver',
  'reeks.goud': 'goud',
  'reeks.platina': 'platina',
  'reeks.ultra': 'ultra',

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
  'stamp.tafel-foutloos': 'Een hele tafel foutloos',
  'stamp.tafel-foutloos.criterion': 'Een hele tafel in één ronde zonder fout.',
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
