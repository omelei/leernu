# Welke vlaggen, en waarom

Peildatum: **12 september 2026**. Vastgesteld door de product owner; zie ADR-102.
Niet aanpassen "ter verbetering": een land toevoegen of weghalen is een
inhoudelijke beslissing, geen onderhoud.

## Het criterium

De staten die Nederland erkent, met één bewuste uitzondering. Dat zijn **196
vlaggen**:

- de **193 lidstaten van de Verenigde Naties**;
- **Kosovo**: door Nederland erkend sinds 2008;
- **Vaticaanstad**: door Nederland erkend, geen VN-lid, wel een herkenbare
  eigen vlag;
- **Taiwan**: de uitzondering. Nederland erkent Taiwan formeel niet als staat
  (één-China-beleid). Taiwan bestuurt zichzelf wel, voert een eigen vlag en is
  voor kinderen herkenbaar. Het staat hier als leerstof, niet als politiek
  standpunt.

**Palestina staat er niet in**: Nederland erkent Palestina niet als staat.

Afhankelijke en overzeese gebieden staan er ook niet in: Aruba, Curaçao,
Sint-Maarten, Groenland, Hongkong, Puerto Rico en dergelijke.

Daarnaast de **twaalf provincievlaggen**, gekoppeld aan de provincies die
/topografie al kent.

## Werelddelen

Zoals /topografie ze indeelt, zodat een land bij vlaggen in hetzelfde
werelddeel staat als op de kaart. **Cyprus staat in twee werelddelen**, Europa
en Azië, net als op de kaart. Rusland staat bij Europa, Turkije en de Kaukasus
bij Azië.

Acht lidstaten staan op geen enkele kaart van /topografie. Voor die acht
gebruiken we het veld `REGION_UN` uit dezelfde bron (Natural Earth):

- **Afrika**: Mauritius en de Seychellen;
- **Azië**: de Malediven;
- **Oceanië**: de Marshalleilanden, Micronesia, Palau, Samoa en Tonga.

## Hoofdsteden

We volgen de **Verenigde Naties** (UNdata-landenprofielen, geraadpleegd op
12 september 2026), niet onze eigen voorkeur. Waar de VN een voetnoot plaatst,
krijgt het kind die ook te zien, in één korte zin. Het gaat om:

- **Israël**: de VN noemt Jeruzalem "zoals opgegeven door Israël" en verwijzen
  voor hun eigen standpunt naar resolutie A/RES/181 (II) en latere resoluties.
  Het kind leest: "Zo noemt Israël het. De Verenigde Naties erkennen Jeruzalem
  niet als hoofdstad."
- **Nederland** (Amsterdam; de regering zit in Den Haag), **Bolivia** (Sucre;
  La Paz), **Zuid-Afrika** (Pretoria; Kaapstad en Bloemfontein), **Ivoorkust**
  (Yamoussoukro; Abidjan), **Benin** (Porto-Novo; Cotonou), **Eswatini**
  (Mbabane; Lobamba), **Maleisië** (Kuala Lumpur; Putrajaya) en **Sri Lanka**
  (Colombo; Sri Jayawardenepura Kotte).

Voor de drie landen die geen VN-lid zijn: Pristina, Vaticaanstad en Taipei.

## Waar het in de code staat

- De lijst en de uitzondering: `VN_LEDEN` en `ERBIJ` in
  `tools/content/build-vlaggen.mjs`.
- De controle: `src/content/vlaggen.content.test.ts` telt 196 landen, eist
  Kosovo, Vaticaanstad en Taiwan en weigert Palestina.
