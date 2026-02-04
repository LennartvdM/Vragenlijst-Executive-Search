/**
 * Survey questions and structure data
 * The HTML is generated from this data, reducing 1300+ lines to ~300 lines
 */

export const SURVEY_STEPS = [
  {
    id: 0,
    title: 'Welkom',
    type: 'welcome',
    content: {
      heading: 'Monitoring Cultureel Talent naar de Top 2026',
      intro: 'Welkom bij de monitoring tool. In de volgende stappen vragen we naar uw organisatiegegevens en beleid rondom culturele diversiteit.'
    },
    fields: [
      { type: 'text', name: 'organisatie', label: 'Naam organisatie (Charter)', required: true, placeholder: 'Voer de naam van uw organisatie in' }
    ]
  },
  {
    id: 1,
    title: 'Streefcijfer',
    sectionNum: '1',
    subtitle: 'Heeft uw organisatie een streefcijfer voor culturele diversiteit?',
    fields: [
      {
        type: 'radio-cards',
        name: 'streefcijfer',
        options: [
          { value: 'Ja', label: 'Ja', description: 'Wij hebben een streefcijfer' },
          { value: 'Nee', label: 'Nee', description: 'Wij hebben geen streefcijfer' }
        ],
        conditional: {
          trigger: 'Ja',
          fields: [
            { type: 'number', name: 'streefcijfer_percentage', label: 'Streefcijfer', placeholder: 'bijv. 99%', compact: true, maxLength: 3 },
            { type: 'number', name: 'streefcijfer_jaar', label: 'Te behalen in', placeholder: 'bijv. 1215', compact: true, maxLength: 4 },
            {
              type: 'radio-cards',
              name: 'streefcijfer_gehaald',
              label: 'Is het streefcijfer gehaald?',
              options: [
                { value: 'Ja', label: 'Ja' },
                { value: 'Nee', label: 'Nee' },
                { value: 'Gedeeltelijk', label: 'Gedeeltelijk' }
              ]
            }
          ]
        }
      },
      {
        type: 'info-block',
        content: 'Talent naar de Top gebruikt de definitie van het CBS (2022):\nIemand heeft een niet-Europese achtergrond als hij/zij in een niet-Europees land is geboren of als de ouders in een niet-Europees land zijn geboren.\n\n1. <strong>Europees:</strong> Europa (inclusief Nederland), Noord-Amerika en Oceanië\n2. <strong>Niet-Europees (Buiten-Europa):</strong> Afrika, Azië, Zuid- en Midden-Amerika (Turkije definiëren we als Buiten-Europa)'
      },
      {
        type: 'radio-cards',
        name: 'definitie_afwijking',
        label: 'Wijkt uw definitie af van bovenstaande definitie?',
        options: [
          { value: 'Ja', label: 'Ja' },
          { value: 'Nee', label: 'Nee' }
        ],
        conditional: {
          trigger: 'Ja',
          fields: [
            { type: 'textarea', name: 'eigen_definitie', label: 'Beschrijf uw definitie' }
          ]
        }
      }
    ]
  },
  {
    id: 2,
    title: 'Kwantitatief',
    sectionNum: '2',
    subtitle: 'Kwantitatieve gegevens over uw organisatie (per 31 december 2026)',
    fields: [
      { type: 'number', name: 'aantal_werknemers', label: 'Totaal aantal <span class="label-highlight">werknemers</span>', group: 'werknemers' },
      { type: 'number', name: 'werknemers_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>', hint: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven.', group: 'werknemers', indent: true },
      { type: 'checkbox', name: 'werknemers_buiten_europa_schatting', label: 'Ik heb een schatting gegeven', group: 'werknemers', indent: true },
      { type: 'number', name: 'aantal_top', label: 'Aantal in de <span class="label-highlight">top</span>', group: 'top' },
      { type: 'number', name: 'top_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>', hint: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven.', group: 'top', indent: true },
      { type: 'checkbox', name: 'top_buiten_europa_schatting', label: 'Ik heb een schatting gegeven', group: 'top', indent: true },
      { type: 'number', name: 'aantal_subtop', label: 'Aantal in de <span class="label-highlight">subtop</span>', group: 'subtop' },
      { type: 'number', name: 'subtop_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>', hint: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven.', group: 'subtop', indent: true },
      { type: 'checkbox', name: 'subtop_buiten_europa_schatting', label: 'Ik heb een schatting gegeven', group: 'subtop', indent: true }
    ]
  },
  {
    id: 3,
    title: 'Bestuursorganen',
    sectionNum: '2.1',
    subtitle: 'Samenstelling bestuursorganen',
    fields: [
      {
        type: 'radio-cards',
        name: 'heeft_rvb',
        label: 'Heeft uw organisatie een Raad van Bestuur?',
        options: [{ value: 'Ja', label: 'Ja' }, { value: 'Nee', label: 'Nee' }],
        conditional: {
          trigger: 'Ja',
          fields: [
            { type: 'number', name: 'aantal_rvb', label: 'Aantal leden', placeholder: 'bijv. 5', compact: true, maxLength: 2 },
            { type: 'number', name: 'rvb_buiten_europa', label: 'Waarvan Buiten-Europa', placeholder: 'bijv. 1', compact: true, maxLength: 2 }
          ]
        }
      },
      {
        type: 'radio-cards',
        name: 'heeft_rvc',
        label: 'Heeft uw organisatie een Raad van Commissarissen?',
        options: [{ value: 'Ja', label: 'Ja' }, { value: 'Nee', label: 'Nee' }],
        conditional: {
          trigger: 'Ja',
          fields: [
            { type: 'number', name: 'aantal_rvc', label: 'Aantal leden', placeholder: 'bijv. 5', compact: true, maxLength: 2 },
            { type: 'number', name: 'rvc_buiten_europa', label: 'Waarvan Buiten-Europa', placeholder: 'bijv. 1', compact: true, maxLength: 2 }
          ]
        }
      },
      {
        type: 'radio-cards',
        name: 'heeft_rvt',
        label: 'Heeft uw organisatie een Raad van Toezicht?',
        options: [{ value: 'Ja', label: 'Ja' }, { value: 'Nee', label: 'Nee' }],
        conditional: {
          trigger: 'Ja',
          fields: [
            { type: 'number', name: 'aantal_rvt', label: 'Aantal leden', placeholder: 'bijv. 5', compact: true, maxLength: 2 },
            { type: 'number', name: 'rvt_buiten_europa', label: 'Waarvan Buiten-Europa', placeholder: 'bijv. 1', compact: true, maxLength: 2 }
          ]
        }
      },
      {
        type: 'radio',
        name: 'beleid_samenstelling',
        label: 'Beleid samenstelling',
        options: [
          { value: 'rvb_rvc_rvt', label: 'Onze organisatie heeft bewust beleid om het aandeel mensen met herkomst Buiten-Europa in de raad van bestuur en/of raad van commissarissen/rvt te vergroten' },
          { value: 'hogere_management', label: 'Onze organisatie heeft bewust beleid om het aandeel mensen met herkomst Buiten-Europa in hogere managementposities te vergroten' },
          { value: 'anders', label: 'Anders' }
        ],
        conditional: {
          trigger: 'anders',
          fields: [
            { type: 'text', name: 'beleid_samenstelling_anders', label: 'Toelichting', placeholder: 'Beschrijf uw beleid' }
          ]
        }
      }
    ]
  },
  {
    id: 4,
    title: 'Kwalitatief (intro)',
    type: 'intro',
    sectionNum: '3',
    content: {
      text: 'De volgende secties bevatten stellingen over uw diversiteitsbeleid.'
    }
  },
  {
    id: 5,
    title: 'Leiderschap',
    sectionNum: '3.1',
    subtitle: 'Leiderschap',
    likert: {
      id: 'likert-leiderschap',
      prefix: 'leid',
      questions: [
        'De top heeft zich verbonden (is gecommitteerd) aan de doelstellingen en het beleid voor meer mensen met herkomst Buiten-Europa',
        'De top draagt het belang van culturele diversiteit actief uit',
        'De top stuurt aanwijsbaar op het bereiken van de gewenste resultaten',
        'De top stelt voldoende middelen (financiën, personeel, technologie) ter beschikking om de doelstellingen te kunnen realiseren',
        'De top neemt eindverantwoordelijkheid voor het culturele diversiteitsbeleid'
      ]
    },
    toelichting: 'leiderschap_toelichting'
  },
  {
    id: 6,
    title: 'Strategie',
    sectionNum: '3.2',
    subtitle: 'Strategie en management',
    likert: {
      id: 'likert-strategie',
      prefix: 'strat',
      questions: [
        'Culturele diversiteit is een business case voor onze organisatie, d.w.z. voor onze organisatie is het om zakelijke of bedrijfsmatige redenen waardevol om culturele diversiteit te stimuleren',
        'De organisatie streeft expliciete doelstellingen voor het aandeel mensen met herkomst Buiten-Europa in de top na',
        'Vastgelegd is hoe deze doelstellingen bereikt gaan worden en op welke termijn',
        'Bedrijfsonderdelen (business units, afdelingen, teams) rapporteren over het realiseren van culturele diversiteitdoelstellingen (via de planning en controle cyclus)',
        'Leidinggevenden worden beoordeeld op het realiseren van culturele diversiteits-doelstellingen i.h.k.v. de periodieke beoordeling',
        'Wij evalueren met vastgestelde regelmaat (bijvoorbeeld elk kwartaal) de resultaten van ons culturele diversiteitsbeleid',
        'De uitkomsten van evaluaties worden gebruikt om ons culturele diversiteitsbeleid te verbeteren',
        'Wij vergelijken ons culturele diversiteitsbeleid met dat van andere organisaties'
      ]
    },
    toelichting: 'strategie_toelichting'
  },
  {
    id: 7,
    title: 'HR Management',
    sectionNum: '3.3',
    subtitle: 'HR Management',
    likert: {
      id: 'likert-hr',
      prefix: 'hr',
      questions: [
        'De organisatie zet bewust maatwerkinstrumenten en regelingen in om de doorstroom van mensen met herkomst Buiten-Europa naar de top en subtop te vergroten',
        'Bij de werving van kandidaten voor top- en subtopfuncties wordt doelbewust gestreefd naar culturele diversiteit',
        'Subjectiviteit en stereotypering worden tegengegaan door transparante en objectieve selectieprocedures',
        'Onze arbeidsmarktcommunicatie reflecteert ons streven naar culturele diversiteit',
        'Begeleiding van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door opleiding en management-development',
        'Begeleiding van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door middel van coaching en mentoring',
        'Effectiviteit van onze HR-maatregelen ten behoeve het realiseren van culturele diversiteit wordt gemeten om beleid te kunnen verbeteren',
        'Het aandeel met herkomst Buiten-Europa naar functieniveau en naar afdeling (business unit, team) wordt gemeten (is bekend)',
        'Bij de personeels-/successie-planning wordt doelbewust gestreefd naar het realiseren van culturele diversiteit',
        'Ondersteuning van de carrièreontwikkeling van mensen met herkomst Buiten-Europa door netwerken',
        'Ondersteuning van de carrière-ontwikkeling van mensen met herkomst Buiten-Europa door rolmodellen',
        'Ons streven naar meer mensen met herkomst Buiten-Europa in de top is geïntegreerd in al onze HR-maatregelen',
        'Door empowerment worden mensen met herkomst Buiten-Europa gestimuleerd tot carrièreontwikkeling vanuit eigen kracht',
        'Ongewenste uitstroom van talentvolle mensen met herkomst Buiten-Europa wordt voorkomen'
      ]
    },
    toelichting: 'hr_toelichting'
  },
  {
    id: 8,
    title: 'Communicatie',
    sectionNum: '3.4',
    subtitle: 'Communicatie',
    likert: {
      id: 'likert-communicatie',
      prefix: 'comm',
      questions: [
        'De organisatie communiceert intern bewust over haar streven om het aandeel mensen met herkomst Buiten-Europa in topfuncties te verhogen',
        'De organisatie communiceert extern bewust over haar streven om het aandeel mensen met herkomst Buiten-Europa in topfuncties te verhogen',
        'Alle medewerkers in de organisatie zijn op de hoogte van onze strategie en beleid voor culturele diversiteit',
        'De organisatie staat extern bekend als cultureel diversiteitsgericht',
        'Culturele diversiteit is in onze organisatie zichtbaar in woord en beeld'
      ]
    },
    toelichting: 'communicatie_toelichting'
  },
  {
    id: 9,
    title: 'Kennis',
    sectionNum: '3.5',
    subtitle: 'Kennis en vaardigheden',
    likert: {
      id: 'likert-kennis',
      prefix: 'kennis',
      questions: [
        'De organisatie beschikt over inzicht in de maatregelen die culturele diversiteit bevorderen',
        'De organisatie beschikt over inzicht in de mechanismen die culturele diversiteit belemmeren',
        'Leidinggevenden zijn zich bewust van de meerwaarde van culturele diversiteit',
        'Leidinggevenden zijn zich bewust van de mechanismen (zoals stereotypen) die doorstroom van mensen met herkomst Buiten-Europa naar de top belemmeren',
        'Leidinggevenden zetten maatregelen in die de doorstroom van mensen met herkomst Buiten-Europa naar de top bevorderen',
        'Wij maken voortdurend gebruik van alle beschikbare kennis en ervaring voor het verbeteren van culturele diversiteit',
        'Het periodieke medewerkers-tevredenheidsonderzoek wordt gebruikt om te sturen op culturele diversiteit',
        'De organisatie weet waarom talentvolle medewerkers met herkomst Buiten-Europa de organisatie verlaten en gebruikt deze kennis om medewerkers te behouden'
      ]
    },
    toelichting: 'kennis_toelichting'
  },
  {
    id: 10,
    title: 'Klimaat',
    sectionNum: '3.6',
    subtitle: 'Organisatieklimaat',
    likert: {
      id: 'likert-klimaat',
      prefix: 'klimaat',
      questions: [
        'Stereotypen, vooroordelen en discriminatie worden in deze organisatie actief bestreden',
        'De inzet van specifieke maatregelen om te investeren in mensen met herkomst Buiten-Europa teneinde culturele diversiteit in de top te vergroten, is zonder meer geaccepteerd in de organisatie',
        'Culturele verschillen tussen medewerkers worden in de gehele organisatie - op alle niveaus en in de organisatie breed - erkend en gewaardeerd',
        'De aandacht voor culturele diversiteit leeft binnen de organisatie - op alle niveaus en in de organisatie breed',
        'Leidinggevenden voelen zich verantwoordelijk voor het realiseren van culturele diversiteit',
        'De organisatie wordt door medewerkers gezien als culturele diversiteit minded'
      ]
    },
    toelichting: 'klimaat_toelichting'
  },
  {
    id: 11,
    title: 'Motivatie',
    sectionNum: '4',
    subtitle: 'Motivatie en blokkades',
    fields: [
      { type: 'textarea', name: 'motivatie', label: 'Wat is uw belangrijkste motivatie voor diversiteitsbeleid?' },
      { type: 'textarea', name: 'blokkade_1', label: 'Wat is de grootste blokkade die u ervaart?' },
      { type: 'textarea', name: 'bevorderend_1', label: 'Wat werkt het meest bevorderend?' }
    ]
  },
  {
    id: 12,
    title: 'Aanvullend',
    sectionNum: '5',
    subtitle: 'Aanvullende informatie',
    fields: [
      {
        type: 'group',
        name: 'vraag_5a',
        label: 'Heeft u vragen naar aanleiding van uw strategie en beleid ten behoeve van de toename van het aandeel mensen met herkomst Buiten-Europa in de top, of culturele diversiteit in het algemeen?',
        fields: [
          { type: 'text', name: 'vraag_5a_1', label: 'Vraag 1' },
          { type: 'text', name: 'vraag_5a_2', label: 'Vraag 2' },
          { type: 'text', name: 'vraag_5a_3', label: 'Vraag 3' }
        ]
      },
      { type: 'textarea', name: 'voorbeeld_organisatie', label: 'Deel een voorbeeld of best practice' }
    ]
  },
  {
    id: 13,
    title: 'Ondertekenen',
    sectionNum: '6',
    subtitle: 'Ondertekening',
    introText: 'Wij verzoeken de CEO/directeur als ondertekenaar van het Charter Talent naar de Top de monitorgegevens 2026 te ondertekenen.',
    fields: [
      { type: 'date', name: 'datum', label: 'Datum' },
      { type: 'text', name: 'ondertekenaar', label: 'Naam CEO/directeur' },
      { type: 'checkbox', name: 'bevestiging', label: 'Ik bevestig dat de gegevens naar waarheid zijn ingevuld' }
    ]
  }
];

// Likert scale options (shared across all tables)
export const LIKERT_OPTIONS = [
  { value: 0, label: 'Niet' },
  { value: 1, label: 'Enigszins' },
  { value: 2, label: 'Grotendeels' },
  { value: 3, label: 'Volledig' }
];

// Navigation index items
export const NAV_ITEMS = SURVEY_STEPS.map(step => ({
  id: step.id,
  label: step.title,
  section: step.sectionNum
}));
