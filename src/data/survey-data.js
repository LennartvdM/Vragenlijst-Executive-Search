/**
 * Survey questions and structure data
 * Monitoring Executive Search Code 2025
 * The HTML is generated from this data, reducing 1300+ lines to ~300 lines
 */

export const SURVEY_STEPS = [
  {
    id: 0,
    title: 'Welkom',
    type: 'welcome',
    content: {
      heading: 'Monitoring Executive Search Code 2025',
      intro: 'Welkom bij de monitoring tool. In de volgende stappen vragen we naar uw gegevens over executive search en diversiteit.'
    },
    fields: [
      { type: 'text', name: 'organisatie', label: 'Naam bureau', required: true, placeholder: 'Voer de naam van uw bureau in' }
    ]
  },
  {
    id: 1,
    title: 'Streefcijfer',
    sectionNum: '1',
    subtitle: 'Doelpercentage vrouwen op longlist en shortlist',
    introText: 'De Executive Search Code adviseert om te streven naar een minimum percentage van 50% vrouwen op de longlist en shortlist. Naar welk percentage vrouwen streeft u bij het presenteren van een longlist en een shortlist?',
    fields: [
      { type: 'number', name: 'streef_minimum', label: 'Minimaal', placeholder: 'bijv. 50', suffix: '%', compact: true, maxLength: 3 },
      { type: 'number', name: 'streef_gemiddeld', label: 'Gemiddeld over een jaar', placeholder: 'bijv. 50', suffix: '%', compact: true, maxLength: 3 }
    ]
  },
  {
    id: 2,
    title: 'Plaatsingen',
    sectionNum: '2',
    subtitle: 'Geplaatste personen in het afgelopen jaar',
    fields: [
      { type: 'number', name: 'aantal_geplaatst', label: 'Hoeveel personen heeft u het afgelopen jaar geplaatst?', group: 'geplaatst' },
      { type: 'number', name: 'geplaatst_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'geplaatst', indent: true },
      { type: 'number', name: 'geplaatst_rvb', label: 'Hoeveel personen heeft u op <span class="label-highlight">Raad van Bestuur</span> niveau geplaatst?', group: 'plaatsing_rvb' },
      { type: 'number', name: 'rvb_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'plaatsing_rvb', indent: true },
      { type: 'number', name: 'geplaatst_rvc_rvt', label: 'Hoeveel personen heeft u op <span class="label-highlight">RvC/RvT</span> niveau geplaatst?', group: 'plaatsing_rvc_rvt' },
      { type: 'number', name: 'rvc_rvt_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'plaatsing_rvc_rvt', indent: true }
    ]
  },
  {
    id: 3,
    title: 'Longlist',
    sectionNum: '3',
    subtitle: 'Kandidaten op de longlist',
    fields: [
      { type: 'number', name: 'longlist_totaal', label: 'Hoeveel kandidaten heeft u in totaal op de longlist geplaatst?', group: 'longlist_totaal' },
      { type: 'number', name: 'longlist_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'longlist_totaal', indent: true },
      { type: 'number', name: 'longlist_rvb', label: 'Hoeveel kandidaten heeft u op de longlist voor <span class="label-highlight">RvB</span> functies geplaatst?', group: 'longlist_rvb' },
      { type: 'number', name: 'longlist_rvb_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'longlist_rvb', indent: true },
      { type: 'number', name: 'longlist_rvc_rvt', label: 'Hoeveel kandidaten heeft u op de longlist voor <span class="label-highlight">RvC/RvT</span> functies geplaatst?', group: 'longlist_rvc_rvt' },
      { type: 'number', name: 'longlist_rvc_rvt_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'longlist_rvc_rvt', indent: true }
    ]
  },
  {
    id: 4,
    title: 'Shortlist',
    sectionNum: '4',
    subtitle: 'Kandidaten op de shortlist',
    fields: [
      { type: 'number', name: 'shortlist_totaal', label: 'Hoeveel kandidaten heeft u in totaal op de shortlist geplaatst?', group: 'shortlist_totaal' },
      { type: 'number', name: 'shortlist_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'shortlist_totaal', indent: true },
      { type: 'number', name: 'shortlist_rvb', label: 'Hoeveel kandidaten heeft u op de shortlist voor <span class="label-highlight">RvB</span> functies geplaatst?', group: 'shortlist_rvb' },
      { type: 'number', name: 'shortlist_rvb_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'shortlist_rvb', indent: true },
      { type: 'number', name: 'shortlist_rvc_rvt', label: 'Hoeveel kandidaten heeft u op de shortlist voor <span class="label-highlight">RvC/RvT</span> functies geplaatst?', group: 'shortlist_rvc_rvt' },
      { type: 'number', name: 'shortlist_rvc_rvt_vrouw', label: 'Hoeveel daarvan zijn vrouw?', group: 'shortlist_rvc_rvt', indent: true }
    ]
  },
  {
    id: 5,
    title: 'Verzoeken',
    sectionNum: '5',
    navDividerBefore: 'Kwalitatief',
    subtitle: 'Verzoeken omtrent geslacht kandidaten',
    fields: [
      {
        type: 'radio-cards',
        name: 'verzoek_vrouw',
        label: 'Hoe vaak heeft u het verzoek gekregen om alleen vrouwelijke kandidaten aan te leveren?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Vaak', label: 'Vaak' },
          { value: 'Soms', label: 'Soms' },
          { value: 'Nooit', label: 'Nooit' }
        ]
      },
      {
        type: 'radio-cards',
        name: 'verzoek_man',
        label: 'Hoe vaak heeft u het verzoek gekregen om alleen mannelijke kandidaten aan te leveren?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Vaak', label: 'Vaak' },
          { value: 'Soms', label: 'Soms' },
          { value: 'Nooit', label: 'Nooit' }
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Redenen keuze',
    sectionNum: '6',
    subtitle: 'Redenen voor keuze kandidaten',
    fields: [
      {
        type: 'group',
        name: 'reden_niet_vrouw',
        label: 'Wat zijn redenen dat men niet voor een vrouw kiest?',
        fields: [
          { type: 'text', name: 'reden_niet_vrouw_1', label: 'Reden 1' },
          { type: 'text', name: 'reden_niet_vrouw_2', label: 'Reden 2' }
        ]
      },
      {
        type: 'group',
        name: 'reden_wel_vrouw',
        label: 'Wat zijn redenen dat men wél voor een vrouw kiest?',
        fields: [
          { type: 'text', name: 'reden_wel_vrouw_1', label: 'Reden 1' },
          { type: 'text', name: 'reden_wel_vrouw_2', label: 'Reden 2' }
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'Aanbod & Sectoren',
    sectionNum: '7',
    subtitle: 'Beschikbaarheid vrouwelijke kandidaten en sectoren',
    fields: [
      {
        type: 'radio-cards',
        name: 'aanbod_vrouw',
        label: 'Heeft u voldoende potentieel geschikte vrouwelijke kandidaten ter beschikking om voor te dragen?',
        options: [
          { value: 'Ruim voldoende', label: 'Ruim voldoende' },
          { value: 'Voldoende', label: 'Voldoende' },
          { value: 'Onvoldoende', label: 'Onvoldoende' },
          { value: 'Geen', label: 'Geen' }
        ],
        conditional: {
          trigger: ['Onvoldoende', 'Geen'],
          fields: [
            {
              type: 'group',
              name: 'reden_onvoldoende',
              label: 'Wat zijn redenen voor onvoldoende/geen aanbod?',
              fields: [
                { type: 'text', name: 'reden_onvoldoende_1', label: 'Reden 1' },
                { type: 'text', name: 'reden_onvoldoende_2', label: 'Reden 2' }
              ]
            }
          ]
        }
      },
      { type: 'textarea', name: 'sector_voorloper', label: 'Welke sectoren zijn wat u betreft voorloper op m/v diversiteit?' },
      { type: 'textarea', name: 'sector_achterblijver', label: 'Welke sectoren blijven op basis van uw ervaring achter op m/v diversiteit?' }
    ]
  },
  {
    id: 8,
    title: 'M/V Diversiteit',
    sectionNum: '8',
    subtitle: 'Proactieve aandacht voor m/v diversiteit',
    fields: [
      {
        type: 'radio-cards',
        name: 'aandacht_mv',
        label: 'In hoeverre brengt u m/v diversiteit proactief onder de aandacht van uw opdrachtgevers?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ],
        conditional: {
          trigger: ['Meestal niet', 'Nooit'],
          fields: [
            { type: 'textarea', name: 'reden_niet_aandacht', label: 'Wat is hiervan de reden?' }
          ]
        }
      },
      {
        type: 'radio-cards',
        name: 'ondersteuning_selectie',
        label: 'In hoeverre biedt u gedurende het selectieproces ondersteuning aan kandidaten (vooral aan kandidaten die voor het eerst worden voorgedragen) om hen op interviews voor te bereiden en hen in het proces te begeleiden?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ],
        conditional: {
          trigger: ['Meestal niet', 'Nooit'],
          fields: [
            { type: 'textarea', name: 'reden_niet_ondersteuning', label: 'Wat is hiervan de reden?' }
          ]
        }
      }
    ]
  },
  {
    id: 9,
    title: 'Belemmeringen',
    sectionNum: '9',
    subtitle: 'Belemmeringen en ondersteuning bij vrouwen in topfuncties',
    fields: [
      {
        type: 'group',
        name: 'belemmering_vrouw',
        label: 'Welke belemmeringen signaleert u bij vrouwen die u wilt plaatsen om te kiezen voor een topfunctie?',
        fields: [
          { type: 'text', name: 'belemmering_vrouw_1', label: 'Belemmering 1' },
          { type: 'text', name: 'belemmering_vrouw_2', label: 'Belemmering 2' },
          { type: 'text', name: 'belemmering_vrouw_3', label: 'Belemmering 3' }
        ]
      },
      {
        type: 'group',
        name: 'ondersteuning_vrouw',
        label: 'Hoe ondersteunt u hen daarbij?',
        fields: [
          { type: 'text', name: 'ondersteuning_vrouw_1', label: 'Ondersteuning 1' },
          { type: 'text', name: 'ondersteuning_vrouw_2', label: 'Ondersteuning 2' },
          { type: 'text', name: 'ondersteuning_vrouw_3', label: 'Ondersteuning 3' }
        ]
      }
    ]
  },
  {
    id: 10,
    title: 'Kweekvijver',
    sectionNum: '10',
    subtitle: 'Investering in kweekvijver en kwaliteitswaarborging',
    fields: [
      {
        type: 'radio-cards',
        name: 'investering_kweekvijver',
        label: 'In hoeverre investeert u tijd in het opbouwen van relaties met \'kweekvijver kandidaten\' (vrouwelijke kandidaten met executive potentieel)?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ],
        conditional: {
          trigger: ['Meestal niet', 'Nooit'],
          fields: [
            { type: 'textarea', name: 'reden_niet_kweekvijver', label: 'Wat is hiervan de reden?' }
          ]
        }
      },
      {
        type: 'radio-cards',
        name: 'waarborg_kwaliteiten',
        label: 'In hoeverre waarborgt u dat kwaliteiten van mannen en vrouwen gelijkwaardig gewaardeerd worden door opdrachtgevers? (Zo noemt de Code bijvoorbeeld het voldoende gewicht toekennen aan uiteenlopende professionele en (intrinsieke) persoonlijke kwaliteiten en het waken voor het overwaarderen van specifieke (masculiene) kwaliteiten en ervaring?)',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ]
      },
      { type: 'textarea', name: 'best_practices_vrouwen', label: 'Welke best practices past uw bureau toe om plaatsing van vrouwen bij opdrachtgevers te bevorderen?' }
    ]
  },
  {
    id: 11,
    title: 'Culturele Diversiteit',
    sectionNum: '11',
    navDividerBefore: 'Culturele Diversiteit',
    subtitle: 'Culturele diversiteit',
    introText: '<em>Biculturele achtergrond: mensen met een andere culturele achtergrond dan alleen de Nederlandse.</em>',
    fields: [
      {
        type: 'radio-cards',
        name: 'aandacht_cultureel',
        label: 'In hoeverre brengt u culturele diversiteit proactief onder de aandacht bij uw opdrachtgevers?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ]
      },
      {
        type: 'radio-cards',
        name: 'verzoek_bicultureel',
        label: 'In hoeverre wordt door uw opdrachtgevers gevraagd om kandidaten met een biculturele achtergrond?',
        options: [
          { value: 'Altijd', label: 'Altijd' },
          { value: 'Meestal wel', label: 'Meestal wel' },
          { value: 'Meestal niet', label: 'Meestal niet' },
          { value: 'Nooit', label: 'Nooit' }
        ]
      },
      {
        type: 'radio-cards',
        name: 'aanbod_bicultureel',
        label: 'Heeft u voldoende potentieel geschikte kandidaten met een biculturele achtergrond ter beschikking om voor te dragen?',
        options: [
          { value: 'Ruim voldoende', label: 'Ruim voldoende' },
          { value: 'Voldoende', label: 'Voldoende' },
          { value: 'Onvoldoende', label: 'Onvoldoende' },
          { value: 'Geen', label: 'Geen' }
        ]
      },
      {
        type: 'group',
        name: 'belemmering_bicultureel',
        label: 'Welke belemmeringen signaleert u bij het plaatsen van kandidaten met een biculturele achtergrond?',
        fields: [
          { type: 'text', name: 'belemmering_bicultureel_1', label: 'Belemmering 1' },
          { type: 'text', name: 'belemmering_bicultureel_2', label: 'Belemmering 2' },
          { type: 'text', name: 'belemmering_bicultureel_3', label: 'Belemmering 3' }
        ]
      },
      { type: 'textarea', name: 'best_practices_bicultureel', label: 'Welke best practices past uw bureau toe om plaatsing van kandidaten met een biculturele achtergrond bij opdrachtgevers te bevorderen?' }
    ]
  },
  {
    id: 12,
    title: 'Aanvullend',
    sectionNum: '12',
    navDividerBefore: 'Afsluiting',
    subtitle: 'Aanvullende vragen',
    fields: [
      { type: 'textarea', name: 'nieuwe_themas', label: 'Welke (nieuwe) thema\'s of uitdagingen zijn er op dit moment in uw vakgebied van belang?' },
      { type: 'textarea', name: 'opmerkingen_vragen', label: 'Heeft u nog opmerkingen of vragen?' }
    ]
  },
  {
    id: 13,
    title: 'Ondertekenen',
    sectionNum: '13',
    subtitle: 'Ondertekening',
    introText: 'Wij verzoeken u de monitorgegevens 2025 te ondertekenen.',
    fields: [
      { type: 'date', name: 'datum', label: 'Datum' },
      { type: 'text', name: 'ondertekenaar', label: 'Naam ondertekenaar' },
      { type: 'checkbox', name: 'bevestiging', label: 'Ik bevestig dat de gegevens naar waarheid zijn ingevuld' }
    ]
  }
];

// Likert scale options (kept for build script compatibility, not used in this survey)
export const LIKERT_OPTIONS = [];

// Navigation index items
export const NAV_ITEMS = SURVEY_STEPS.map(step => ({
  id: step.id,
  label: step.title,
  section: step.sectionNum
}));
