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
  // zin eronder zegt wat je hier doet, in de volgorde waarin je het doet: een
  // vak kiezen, een ronde doen, en wat dat oplevert (herontwerp 2026-09).
  //
  // Hij noemt nog steeds geen aantal. "Vandaag oefen je 10 vragen" las als een
  // opdracht met een plafond: tien, en dan ben je klaar. Niets in het product
  // stopt na tien.
  'home.welcome': 'Welkom {naam}!',
  'home.todayOpen': 'Kies een vak, doe een ronde en verdien je volgende held.',
  'home.practiceMore': 'Verder oefenen',
  // De tegels tussen het toetsblok en het logboek: waar je zelf het vaakst
  // naar teruggaat, met het aantal keer erbij. Dat getal komt van dit apparaat
  // en van niets anders - er is geen server die meekijkt, dus er is ook geen
  // "3.412 keer gespeeld" te tonen dat waar zou zijn.
  'home.popularTitle': 'Meest geoefend',
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
  'home.recentOutOf': '{goed} van de {totaal} goed',
  'home.recentLine': 'Cijfer {cijfer} · {goed} van de {totaal} goed',
  // De twee knoppen boven een rij, die hem een kaart opschuiven. Ze noemen de
  // rij, want er staan er drie onder elkaar en "verder" alleen zegt niet welke.
  'home.rowBack': 'Terug in {rij}',
  'home.rowOn': 'Verder in {rij}',

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
  'home.journeyHave': '{aantal} van de {totaal} helden',
  'home.journeyBar': 'Op weg naar niveau {niveau}',
  'home.journeyToGo': 'Nog {aantal} goede antwoorden tot niveau {niveau}.',
  'home.journeyOneToGo': 'Nog één goed antwoord tot niveau {niveau}.',
  'home.journeyAll': 'Bekijk alles wat je kunt verdienen',

  // De andere streak: goede antwoorden op rij, zonder dag ertussen. Hij staat
  // onder het percentage en niet erboven, want het is het enige getal in het
  // product dat één fout antwoord meteen afpakt.
  'home.runLabel': 'Foutloos op rij',
  // "beste 12" las als een lijstje van de beste twaalf. Het is je record.
  'home.runBest': 'je record is {aantal}',

  // De reeks in de rechterkolom en op zijn eigen pagina (ADR-110). Het getal is
  // dat van de pil in de balk; het rijtje eronder zegt welke dagen erachter
  // zitten. Nul is een zin en geen nul: "0 dagen op rij" leest als een cijfer
  // voor een kind dat niets fout heeft gedaan.
  'reeks.titel': 'Jouw reeks',
  'reeks.nul': 'Oefen vandaag en begin je reeks.',
  'reeks.een': 'dag op rij geoefend',
  'reeks.veel': 'dagen op rij geoefend',
  'reeks.week': 'De laatste zeven dagen',
  'reeks.dagWel': '{dag}: geoefend',
  'reeks.dagNiet': '{dag}: niet geoefend',
  'reeks.vandaagWel': 'Vandaag: geoefend',
  'reeks.vandaagNiet': 'Vandaag: nog niet geoefend',
  'reeks.bekijk': 'Bekijk je reeks',
  // De pagina. Wat een ronde vandaag doet, zonder te dreigen: in het weekend
  // kost niet oefenen niets, en deze zin mag niet anders klinken.
  'reeks.nuTitel': 'Je reeks nu',
  'reeks.vandaagKlaar': 'Vandaag heb je al geoefend. Deze dag telt mee.',
  'reeks.vandaagBegin': 'Eén ronde is genoeg om te beginnen.',
  'reeks.vandaagErbij': 'Doe vandaag een ronde, dan staat je reeks op {aantal} dagen.',
  // Alleen getallen van dingen die gebeurd zijn. Geen gemiddelde, en geen
  // vergelijking met een ander kind of met vorige week.
  'reeks.cijfersTitel': 'In getallen',
  'reeks.cijferLangste': 'Langste reeks in dagen',
  'reeks.cijferDagen': 'Dagen geoefend',
  'reeks.cijferMaand': 'Dagen deze maand',
  'reeks.cijferRondes': 'Rondes gespeeld',
  'reeks.cijferVragen': 'Vragen beantwoord',
  'reeks.cijferRustdagen': 'Rustdagen bewaard',
  'reeks.kalenderTitel': 'De laatste vijf weken',
  'reeks.kalGeoefend': 'geoefend',
  'reeks.kalVandaag': 'vandaag',
  'reeks.kalVandaagGeoefend': 'vandaag, geoefend',
  // De vier regels van streak.ts, in woorden. Een reeks die je niet kunt
  // voorspellen voelt oneerlijk zodra hij iets doet wat je niet verwachtte.
  'reeks.regelsTitel': 'Zo werkt je reeks',
  'reeks.regel1':
    'Elke dag waarop je een ronde afmaakt, telt mee. Vier rondes op één dag zijn één dag.',
  'reeks.regel2':
    'In het weekend en in de schoolvakantie gaat je reeks nooit kapot. Oefen je dan toch, dan telt het wel.',
  'reeks.regel3': 'Mis je een schooldag? Dan gebruik je een rustdag en blijft je reeks staan.',
  'reeks.regel4': 'Elke week waarin je oefent, krijg je een rustdag. Je kunt er twee bewaren.',
  // De dagen van de week: kort boven een streepje, voluit voor wie voorleest.
  // Genummerd zoals Date.getDay telt: zondag is 0.
  'dag.kort.0': 'zo',
  'dag.kort.1': 'ma',
  'dag.kort.2': 'di',
  'dag.kort.3': 'wo',
  'dag.kort.4': 'do',
  'dag.kort.5': 'vr',
  'dag.kort.6': 'za',
  'dag.lang.0': 'zondag',
  'dag.lang.1': 'maandag',
  'dag.lang.2': 'dinsdag',
  'dag.lang.3': 'woensdag',
  'dag.lang.4': 'donderdag',
  'dag.lang.5': 'vrijdag',
  'dag.lang.6': 'zaterdag',
  // De twaalf helden (ADR-098). Een voornaam met dezelfde letter als het dier:
  // makkelijk voor te lezen in groep 4, en een naam maakt er een karakter van
  // in plaats van een soort.
  'held.valerie': 'Valerie Vos',
  'held.daan': 'Daan Das',
  'held.olaf': 'Olaf Otter',
  'held.harm': 'Harm Havik',
  'held.willem': 'Willem Wolf',
  'held.esmee': 'Esmee Egel',
  'held.bart': 'Bart Bever',
  'held.udo': 'Udo Uil',
  'held.minou': 'Minou Marter',
  'held.fem': 'Fem Flamingo',
  'held.richard': 'Richard Ree',
  'held.ben': 'Ben Buizerd',
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
  // Het vakmenu onder de balk op een tablet en een telefoon, waar de rail niet
  // staat. Het woord ervoor zegt wat je kiest; de knop zegt welk vak het is,
  // of vraagt erom waar je nog in geen vak bent.
  'nav.vak': 'vak',
  'nav.vakKies': 'Kies een vak',
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

  // Het toetsenblok, bovenaan de eigen kolom van het kind. Het is de reden dat
  // het kind deze week oefent, en het zegt alleen dat: wanneer, en waarover.
  'home.testLabel': 'toets',
  'home.testNone': 'Nog geen toetsdatum',
  // Meer dan één, want een periode is nooit één toets: topografie op dinsdag en
  // de tafels de vrijdag erna. Het blok toont ze allemaal en verder niets.
  'home.testTitle': 'Jouw toetsen',
  'home.testToday': 'De toets is vandaag',
  'home.testTomorrow': 'De toets is morgen',
  'home.testInDays': 'Toets over {aantal} dagen',
  'home.testPick': 'Wanneer is de toets?',
  'home.testAdd': 'Toets toevoegen',
  'home.testSave': 'Toevoegen',
  'home.testRemove': 'Verwijder',
  // Begint met het woord op de knop, zodat wie de knop bij naam aanspreekt
  // hem ook zo vindt (WCAG 2.5.3), en zegt daarna welke toets.
  'home.testRemoveOne': 'Verwijder: {wanneer}',
  // Kort, zoals het blok ze toont: het woord "toets" staat al in de kop.
  'home.testSoonToday': 'Vandaag',
  'home.testSoonTomorrow': 'Morgen',
  'home.testSoonDays': 'Over {aantal} dagen',
  // Op een tablet en een telefoon is het blok eerst alleen de datums. Erop
  // tikken klapt het open tot wat een laptop meteen laat zien.
  'home.testsChange': 'Toetsen wijzigen',
  'home.testsDone': 'Klaar',
  // Het vak erbij, want een datum zonder vak plant niets. Alleen vakken die
  // bestaan: een toets voor woordjes instellen belooft oefenstof die er niet
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

  // Klokkijken, in de vier stappen waarin een groep 4 en 5 het leert. De namen
  // zijn de woorden die de juf gebruikt, niet de id's uit het bestand.
  'set.klok-heel': 'Hele uren',
  'set.klok-half': 'Halve uren',
  'set.klok-kwart': 'Kwartieren',
  'set.klok-vijf': 'Vijf minuten',
  // Ook hier geen vijfde bestand maar dezelfde standen onder één naam, zodat
  // half acht dat je hier goed hebt hetzelfde doosje opschuift als altijd.
  'set.klok-mix': 'Klokmix',
  'set.klok-mix.uitleg': 'Alle standen van de klok door elkaar',

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
  'onderwerp.eilanden': 'Waddeneilanden',
  'onderwerp.topomix': 'Topo-mix',
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

  // De klok, in vier stappen en een mix. Eén woord per tegel, net als bij
  // topografie — en het merk ernaast is de wijzerstand zelf, zodat een kind
  // dat "kwartieren" nog niet leest toch ziet welke tegel dat is.
  'onderwerp.heleUren': 'Hele uren',
  'onderwerp.heleUren.uitleg': 'Eén uur, twee uur, tot en met twaalf uur',
  'onderwerp.halveUren': 'Halve uren',
  // De regel waar het hele vak om draait, en hij staat er voluit: half acht is
  // half acht en niet half zeven.
  'onderwerp.halveUren.uitleg': 'Half één tot half twaalf — half acht is 7:30',
  'onderwerp.kwartieren': 'Kwartieren',
  'onderwerp.kwartieren.uitleg': 'Kwart over en kwart voor',
  'onderwerp.vijfMinuten': 'Vijf minuten',
  'onderwerp.vijfMinuten.uitleg': 'Vijf over, tien voor half, en alles ertussen',
  'onderwerp.klokmix': 'Klokmix',

  // Modes
  'mode.wijs-aan': 'Aanwijzen',
  'mode.hoe-heet-dit': 'Zelf typen',
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
  // De oefentoets, als eigen manier van oefenen (ADR-100): je typt, zoals op
  // een toets, en pas aan het eind zie je wat goed was. Eerst was het een
  // schakelaar op een manier die je al koos, en dan moest je een manier kiezen
  // die een toets niet heeft. "Zelf typen" staat er bewust niet in: dat is de
  // naam van de tegel ernaast, en twee tegels die zo heten zijn er één te veel.
  'choose.testMode': 'Oefentoets',
  'choose.testModeWhy':
    'Je typt zonder hulp. Aan het eind zie je wat goed was en krijg je een cijfer.',
  'choose.startTest': '{wat} · oefentoets',
  'choose.likeTheTest': 'Oefen zoals de toets',
  'choose.howMany': 'Hoeveel vragen?',
  'choose.howManyOne': '{aantal} vragen',
  // De hele set, als die in één ronde past: twaalf provincies zijn "Alle 12".
  'choose.howManyAll': 'Alle {aantal}',
  'choose.howManyAllLabel': 'Alle {aantal} vragen',
  // De startbalk (herontwerp 2026-09): wat er gekozen is, als een rij kleine
  // labels, en daarna de knop. Het woordje voor elke waarde zegt welke vraag die
  // beantwoordt. De knop zelf zegt voor een schermlezer nog steeds de hele zin.
  'start.klaar': 'Klaar om te starten',
  'start.kaart': 'kaart',
  'start.onderwerp': 'onderwerp',
  'start.som': 'som',
  'start.welke': 'welke',
  'start.manier': 'manier',
  'start.ronde': 'ronde',
  'start.stand': 'stand',
  'start.vragen': '{aantal} vragen',
  'start.vragenTijd': '{aantal} vragen · ±{minuten} min',
  'start.seconden': '{aantal} seconden',
  'start.levens': '{aantal} levens',
  'start.vrij': 'rondkijken',
  // Zolang niet elke stap een antwoord heeft, staat de balk er wel maar is hij
  // leeg, en zegt hij welke stappen nog wachten. De stappen zijn genummerd op
  // de pagina, dus het nummer is de kortste weg terug.
  'start.nogKiezen': 'Nog even kiezen',
  'start.kiesNogStap': 'Kies nog bij stap {stap}',
  'start.kiesNogStappen': 'Kies nog bij stap {stappen} en {laatste}',
  // Wat straks alleen met een account kan (ADR-110). Het label staat er al; de
  // functie werkt nog voor iedereen, want inloggen bestaat nog niet.
  'premium.label': 'Premium',

  // De onderwerpen van rekenen. Vijf soorten sommen en een mix ervan; de tafels
  // en het delen hebben er twaalf elk, en die staan als knopjes onder de kaart
  // in plaats van als twaalf kaarten ernaast.
  'onderwerp.tafels': 'Tafels',
  'onderwerp.tafels.uitleg': 'De tafel van 1 tot en met 12',
  'onderwerp.tafels.keuze': 'Welke tafel?',
  'onderwerp.keer': 'Keersommen',
  'onderwerp.keer.uitleg': 'Voorbij de tafels: 6 × 14, tot 100 of 1000',
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
  // Tien goede antwoorden zijn een ster. Tussen twee kisten is dit het enige
  // dat beweegt, en daarom staat het in elke ronde (ADR-099).
  'practice.counterStar': 'ster',
  'practice.counterStarValue': '{aantal}/{totaal}',
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
  'sums.timesUpTo': 'Keersommen tot {grens}',
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
  'mode.som-typen': 'Zelf typen',
  'mode.som-meerkeuze': 'Meerkeuze',
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

  // Klokkijken. De klok zelf staat op het toneel waar bij topografie de kaart
  // staat en bij rekenen de som: het ding waar de vraag over gaat.
  //
  // De namen van de vier standen worden hier voluit geschreven en niet in
  // cijfers. Het verschil tussen "7:30" en "half acht" ís de oefening; een
  // antwoordknop met "half 8" erop zou het kind het lezen uit handen nemen.
  'klok.uur.1': 'een',
  'klok.uur.2': 'twee',
  'klok.uur.3': 'drie',
  'klok.uur.4': 'vier',
  'klok.uur.5': 'vijf',
  'klok.uur.6': 'zes',
  'klok.uur.7': 'zeven',
  'klok.uur.8': 'acht',
  'klok.uur.9': 'negen',
  'klok.uur.10': 'tien',
  'klok.uur.11': 'elf',
  'klok.uur.12': 'twaalf',
  // Vijf en tien, en verder niets: de inhoud gaat met stappen van vijf, dus de
  // afstand tot een kwartier, een half of een heel uur is er een van die twee.
  'klok.getal.5': 'vijf',
  'klok.getal.10': 'tien',
  // De acht vormen waarin het Nederlands een klok uitspreekt. Welke vorm en
  // welk uur wordt in game-core uitgerekend; hier staan alleen de woorden.
  'klok.zeg.uur': '{uur} uur',
  'klok.zeg.over': '{aantal} over {uur}',
  'klok.zeg.kwartOver': 'kwart over {uur}',
  'klok.zeg.voorHalf': '{aantal} voor half {uur}',
  'klok.zeg.half': 'half {uur}',
  'klok.zeg.overHalf': '{aantal} over half {uur}',
  'klok.zeg.kwartVoor': 'kwart voor {uur}',
  'klok.zeg.voor': '{aantal} voor {uur}',
  // Allebei de notaties, in de volgorde waarin een kind ze leert. Wie er één
  // van de twee kent, kent het half — daarom staan ze samen op het
  // resultaatscherm en niet los.
  'klok.beide': '{woorden} ({cijfers})',

  'klok.prompt': 'Hoe laat is het?',
  // Wat de voorleesknop zegt op de twee vormen waar een klok op het toneel
  // staat. Niet de tijd zelf: dat zou het antwoord voorlezen.
  'klok.lookPrompt': 'Kijk naar de klok. Hoe laat is het?',
  'klok.typeQuestion': 'Typ hoe laat het is',
  'klok.chooseQuestion': 'Kies hoe laat het is',
  'klok.whichQuestion': 'Welke klok is dit?',
  'klok.typePlaceholder': '7:30',
  'klok.correct': 'Het is {tijd} — goed.',
  'klok.wrong': 'Het was {tijd}.',
  'klok.wrongSub': 'Jij zei {gegeven}.',
  'klok.dontKnowSub': 'Deze komt zo weer langs.',
  'klok.practiceMore': 'Deze tijden moet je nog oefenen',
  'mode.klok-meerkeuze': 'Meerkeuze',
  // "Klok zoeken" en niet "Welke klok?": de naam van een oefenvorm komt in de
  // startzin terecht — "Hele uren klok zoeken · 10 vragen" — en een vraagteken
  // midden in die zin leest als een fout. De vraag zelf staat boven de vier
  // klokken, waar hij hoort.
  'mode.klok-welke-klok': 'Klok zoeken',
  'mode.klok-typen': 'Zelf typen',
  // De volgorde is het argument. Meerkeuze staat vooraan en niet achteraan
  // zoals bij rekenen: de vier tijden die je krijgt zijn precies de vier
  // fouten die kinderen maken, dus kiezen ís de oefening.
  'way.klok-meerkeuze': 'Kies uit vier tijden — voor de eerste keer',
  'way.klok-welke-klok': 'Van de tijd naar de wijzers — andersom dus',
  'way.klok-typen': 'Schrijf de tijd zelf op — voor de toets',

  // Vlaggen (ADR-102). Een onderwerp is één of twee woorden, zoals bij
  // topografie; de rij erboven zegt al waar.
  'onderwerp.vlaggen.bekend': 'Bekende vlaggen',
  'onderwerp.vlaggen.bekend.uitleg': 'De vlaggen die de meeste kinderen kennen',
  'onderwerp.vlaggen.alle': 'Alle vlaggen',
  'onderwerp.vlaggen.alle.uitleg': 'Elke vlag van dit deel van de wereld',
  'onderwerp.vlaggen.lijkt': 'Lijkt op elkaar',
  'onderwerp.vlaggen.lijkt.uitleg': 'Vlaggen die je makkelijk door elkaar haalt',
  'onderwerp.vlaggen.mix': 'Vlaggenmix',
  'onderwerp.vlaggen.mix.uitleg': 'Alle landen en provincies door elkaar',
  'onderwerp.vlaggen.provincies': 'Provincievlaggen',
  'onderwerp.vlaggen.provincies.uitleg': 'De vlaggen van de twaalf provincies',
  'onderwerp.vlaggen.fouten.uitleg': 'De vlaggen die je eerder fout had',
  // "Oefen je fouten" bij topografie en klok (ADR-103). Per kaart, want een
  // ronde blijft op één kaart.
  'onderwerp.topo.fouten.uitleg': 'De plekken die je eerder fout had',
  'onderwerp.klok.fouten.uitleg': 'De tijden die je eerder fout had',
  'set.nl-fouten': 'Jouw fouten in Nederland',
  'set.europa-fouten': 'Jouw fouten in Europa',
  'set.afrika-fouten': 'Jouw fouten in Afrika',
  'set.azie-fouten': 'Jouw fouten in Azië',
  'set.noord-amerika-fouten': 'Jouw fouten in Noord-Amerika',
  'set.zuid-amerika-fouten': 'Jouw fouten in Zuid-Amerika',
  'set.oceanie-fouten': 'Jouw fouten in Oceanië',
  'set.wereld-fouten': 'Jouw fouten op de wereldkaart',
  'set.klok-fouten': 'Jouw fouten met de klok',
  // De naam van een set: wat de startbalk, de kaarten en de favorieten tonen.
  'vlag.regio.wereld': 'de wereld',
  'vlag.set.bekend': 'Bekende vlaggen van {regio}',
  'vlag.set.alle': 'Alle vlaggen van {regio}',
  'vlag.set.lijkt': 'Vlaggen van {regio} die op elkaar lijken',
  'vlag.set.mix': 'Vlaggenmix',
  'vlag.set.provincies': 'Provincievlaggen',
  'vlag.set.fouten': 'Jouw fouten met vlaggen van {regio}',
  'vlag.set.foutenWereld': 'Al jouw fouten met vlaggen',
  'vlag.set.foutenNederland': 'Jouw fouten met provincievlaggen',
  'vlag.en': 'en',
  // "Vlag zoeken" en niet "Welke vlag?": de naam van een oefenvorm komt in de
  // startzin terecht, net als "Klok zoeken".
  'mode.vlag-zoeken': 'Vlag zoeken',
  'mode.vlag-meerkeuze': 'Meerkeuze',
  // Alleen de oefentoets vraagt zo, en zo heet hij dan ook in de lijst van
  // wat je laatst hebt geoefend.
  'mode.vlag-gemengd': 'Oefentoets',
  'way.vlag-zoeken': 'Kies de vlag die bij de naam hoort',
  'way.vlag-meerkeuze': 'Kies de naam die bij de vlag hoort',
  'way.vlag-gemengd':
    'Je kiest zonder hulp, vlaggen en namen door elkaar. Aan het eind zie je wat goed was en krijg je een cijfer.',
  'vlag.zoekLabel': 'Welke vlag hoort hierbij?',
  'vlag.meerkeuzeLabelLand': 'Van welk land is deze vlag?',
  'vlag.meerkeuzeLabelProvincie': 'Van welke provincie is deze vlag?',
  'vlag.prompt': 'Kijk goed naar de vlag.',
  'vlag.optiesLabel': 'Kies een vlag',
  'vlag.namenLabel': 'Kies een naam',
  'vlag.alt': 'De vlag van {naam}',
  'vlag.correct': 'Goed! Dit is de vlag van {naam}.',
  'vlag.wrong': 'Dit is de vlag van {naam}.',
  'vlag.wrongSubVlag': 'Jij koos de vlag van {gekozen}.',
  'vlag.wrongSubNaam': 'Jij koos {gekozen}.',
  'vlag.dontKnowSub': 'Nu weet je hem.',
  'vlag.practiceMore': 'Deze vlaggen moet je nog oefenen',
  'vlag.loading': 'Vlaggen worden geladen…',
  'vlag.failed': 'De vlaggen konden niet geladen worden.',
  'vlag.explore.kind': 'Ontdek de vlaggen',
  'vlag.explore.hint': 'Kies een naam. Je ziet meteen de vlag.',
  'vlag.explore.nothingChosen': 'Kies een vlag uit de lijst.',
  'vlag.explore.werelddeel': 'Werelddeel',
  'vlag.explore.land': 'Land',
  'vlag.explore.hoofdstad': 'Hoofdstad',
  // Het vlaggendiploma (ADR-104): twintig vlaggen van een werelddeel, negen van
  // de tien goed, en pas aan het eind hoor je hoe het ging.
  'mode.vlag-diploma': 'Vlaggendiploma',
  'way.vlag-diploma': 'Negen van de tien goed, en pas aan het eind zie je hoe het ging',
  'vlag.diplomasTitle': 'Jouw vlaggendiploma’s',
  'vlag.diplomasCount': '{aantal} van de {totaal} gehaald',
  'vlag.diplomaHave': '{deel}: vlaggendiploma gehaald',
  'vlag.diplomaWant': '{deel}: nog geen vlaggendiploma',
  'vlag.diplomaEarned': 'Vlaggendiploma gehaald: {deel}',
  'vlag.diplomaMissed':
    'Nog geen diploma: {goed} van de {totaal} goed. Met {nodig} goed is hij van jou.',

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

  // Wat een ronde opleverde (ADR-096): de sterren die erbij kwamen, en als er
  // een kist openging, welke held eruit kwam. Alleen te zien als er echt iets
  // bij kwam. Geen "goed gedaan": het product zegt wat er gebeurd is, niet wat
  // je ervan moet vinden. En nooit wat er in de volgende kist zit.
  'result.beloningTitle': 'Wat je verdiende',
  'result.sterEen': 'Je verdiende een ster.',
  'result.sterVeel': 'Je verdiende {aantal} sterren.',
  'result.sterStand': '{aantal} van de {totaal} sterren voor je volgende kist.',
  'result.kistEen': 'Je kist gaat open.',
  'result.kistVeel': 'Je {aantal} kisten gaan open.',
  // Wat er uit een kist kwam. ADR-084 vraagt drie dingen: wat het is, uit welke
  // reeks, en welk moment het overhandigde — dat laatste stond er niet in en
  // staat er nu wel: uit welke kist. Nooit "goed gedaan": het product zegt wat
  // er gebeurde, wat je ervan vindt is aan het kind.
  'result.heldNieuw': '{held} komt erbij, in {reeks}. Uit kist {kist}.',
  // De zwakste uitkomst, dus het aantal staat vooraan: dat is het enige dat
  // beweegt, en de zin moet naar het bewegende deel wijzen.
  'result.heldDubbel': '{held}: {aantal} van de {totaal} naar {reeks}. Uit kist {kist}.',
  // Noem waar hij vandaan komt, anders is "naar goud" een mededeling zonder
  // afstand.
  'result.heldHoger': '{held} gaat van {vorige} naar {reeks}. Uit kist {kist}.',
  // Onbereikbaar sinds ADR-097: een held op ultra wordt niet meer aangeboden.
  // Blijft staan als vangnet voor een rij uit een oudere versie.
  'result.heldVol': '{held} staat al op ultra.',

  // De drie kaarten die een kist openlegt. Elke kaart zegt wat hij doet vóór
  // je hem indrukt: drie kaarten die niet zeggen wat ze zijn, zijn geen keuze
  // maar drie knoppen (ADR-097).
  'kist.titel': 'Je kist',
  'kist.kiesTitel': 'Kies wie eruit komt.',
  'kist.kiesTitelVeel': 'Kies wie eruit komt. Je hebt {aantal} kisten.',
  'kist.kaartNieuw': '{held} erbij, in {reeks}',
  'kist.kaartHoger': '{held} naar {reeks}',
  'kist.kaartDubbel': '{held}, {aantal} van de {totaal} naar {reeks}',
  'kist.kaartKort': 'naar {reeks}',
  // K8. De score staat er, maar wat er veranderd is, is het product: het enige
  // op dit scherm dat een kind niet zelf had kunnen uitrekenen.
  'result.changed': 'Wat er is veranderd',
  'result.gainedOne': 'Eén vraag meer die je nu onthoudt.',
  'result.gainedMany': '{aantal} vragen meer die je nu onthoudt.',
  'result.gainedNone': 'Nog niets erbij. Deze komen morgen terug.',
  'result.again': 'Nog een ronde',
  // Alleen wat er in deze ronde fout ging, meteen nog een keer (ADR-110).
  'result.herhaalFouten': 'Herhaal je fouten',

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

  // De verzamelpagina: alles wat je hebt, en hoe de rest komt. De kaart in de
  // rechterkolom kan er maar één tegelijk laten zien; dit is het geheel.
  // Nergens staat wanneer — alles hier koop je met goede antwoorden.
  'reis.title': 'Jouw voortgang',
  'reis.answered': '{aantal} goede antwoorden',
  // Bovenaan staat de beloning die het dichtst bij is: de sterren naar de
  // volgende kist, in één grote zin. Bij nul is de eerste ster het doel, want
  // tien is vanmiddag te halen en vijftig niet.
  'reis.kistTitel': 'Je volgende kist',
  'reis.sterrenStand': '{aantal} van de {totaal} sterren',
  'reis.totKist': 'Nog {aantal} goede antwoorden tot je volgende kist.',
  'reis.totKistEen': 'Nog één goed antwoord tot je volgende kist.',
  'reis.totEersteSter': 'Nog {aantal} goede antwoorden tot je eerste ster.',
  'reis.totEersteSterEen': 'Nog één goed antwoord tot je eerste ster.',
  // De weg terug naar oefenen, naar het vak waar je het laatst was. Zonder die
  // weg is de pagina een eindpunt in plaats van een aanleiding.
  'reis.verderMet': 'Verder oefenen met {vak}',
  'reis.doeEenRonde': 'Doe één ronde',
  'reis.vak.topo': 'topografie',
  'reis.vak.tafels': 'tafels',
  'reis.vak.klok': 'klokkijken',
  'reis.animals': 'Helden',
  'reis.heldHave': '{dier}, {reeks}',
  'reis.heldDubbel': '{reeks} · {aantal} van de {totaal}',
  'reis.heldUltra': '{reeks} · hoogste reeks',
  'reis.heldDraagt': 'je draagt deze',
  'reis.heldDragen': 'dragen',
  // Een held die je nog niet hebt houdt zijn naam voor zich: welke het wordt,
  // is waar een kist voor is. Wat hij kost staat er wel.
  'reis.heldWant': 'Nog niet gevonden',
  'reis.heldPrijs': 'Kist: vijf sterren',
  'reis.heldWantLabel': 'Nog niet gevonden. Kist: vijf sterren.',
  // De spelregels, voluit. Er zit geen geluk meer in: elke kist geeft een held
  // die je nog niet hebt en je kiest er één van drie (ADR-097). Een kind mag
  // precies weten hoe het werkt, en nu is dat een kortere zin dan eerst.
  'reis.regelsTitel': 'Zo werkt het',
  'reis.regel1': 'Tien goede antwoorden zijn één ster.',
  'reis.regel2':
    'Vijf sterren zijn een kist. Een kist legt drie helden neer die je nog niet hebt, en jij kiest er één.',
  'reis.regel3':
    'Heb je alle twaalf? Dan kies je wie er omhoog gaat. Na drie keer gaat een held een reeks omhoog: brons, zilver, goud, platina, ultra.',
  'reis.regel4':
    'Je kunt niets kopen, door te wachten krijg je niets, en er komt geen geluk aan te pas. Alleen goede antwoorden tellen.',
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
