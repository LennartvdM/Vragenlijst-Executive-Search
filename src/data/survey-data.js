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
      heading: 'Monitoring Cultureel Talent naar de Top 2025',
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
        type: 'radio-cards',
        name: 'definitie_afwijking',
        label: 'Wijkt uw definitie af van de standaard?',
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
    subtitle: 'Kwantitatieve gegevens over uw organisatie',
    fields: [
      { type: 'number', name: 'aantal_werknemers', label: 'Totaal aantal <span class="label-highlight">werknemers</span>' },
      { type: 'number', name: 'werknemers_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>' },
      { type: 'number', name: 'werknemers_buiten_europa_schatting', label: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven', groupEnd: true },
      { type: 'number', name: 'aantal_top', label: 'Aantal in de <span class="label-highlight">top</span>' },
      { type: 'number', name: 'top_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>' },
      { type: 'number', name: 'top_buiten_europa_schatting', label: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven', groupEnd: true },
      { type: 'number', name: 'aantal_subtop', label: 'Aantal in de <span class="label-highlight">subtop</span>' },
      { type: 'number', name: 'subtop_buiten_europa', label: 'Waarvan herkomst <span class="label-highlight">Buiten-Europa</span>' },
      { type: 'number', name: 'subtop_buiten_europa_schatting', label: 'Mocht u niet over concrete gegevens beschikken, dan kunt u een schatting geven' }
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
      heading: 'Kwalitatieve vragen',
      text: 'De volgende secties bevatten stellingen over uw diversiteitsbeleid.'
    }
  },
  {
    id: 5,
    title: 'Leiderschap',
    sectionNum: '3.1',
    subtitle: 'Leiderschap en commitment',
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
        'Er is een meerjarige strategie voor het bereiken van culturele diversiteitsdoelstellingen',
        'Er zijn concrete, meetbare doelen gesteld',
        'De voortgang wordt periodiek gemeten en gerapporteerd',
        'Er is een verantwoordelijke aangesteld voor het diversiteitsbeleid',
        'Het diversiteitsbeleid is geïntegreerd in het algemene HR-beleid',
        'Er wordt samengewerkt met externe partijen (bijv. netwerken, kennisinstellingen)',
        'Het management wordt afgerekend op diversiteitsdoelstellingen',
        'Er is budget gereserveerd voor diversiteitsinitiatieven'
      ]
    },
    toelichting: 'strategie_toelichting'
  },
  {
    id: 7,
    title: 'HR Management',
    sectionNum: '3.3',
    subtitle: 'HR Management en werving',
    likert: {
      id: 'likert-hr',
      prefix: 'hr',
      questions: [
        'Vacatureteksten zijn inclusief geformuleerd',
        'Er wordt actief geworven via diverse kanalen',
        'Selectieprocedures zijn objectief en gestandaardiseerd',
        'Er is aandacht voor onbewuste bias in selectie',
        'Er zijn mentorprogramma\'s voor diverse medewerkers',
        'Er zijn doorgroeimogelijkheden voor diverse medewerkers',
        'Exit-interviews bevatten vragen over inclusie',
        'Er is een onboardingprogramma gericht op inclusie',
        'Leidinggevenden worden getraind in inclusief leiderschap',
        'Er zijn Employee Resource Groups of netwerken',
        'Flexibel werken wordt gefaciliteerd',
        'Er is aandacht voor werk-privébalans',
        'Beloningsbeleid is transparant en eerlijk',
        'Er zijn stages/traineeships gericht op diversiteit'
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
        'Diversiteit en inclusie worden intern gecommuniceerd',
        'Er is externe communicatie over diversiteitsbeleid',
        'Successen worden gedeeld en gevierd',
        'Er is ruimte voor dialoog over diversiteit',
        'Communicatie-uitingen zijn divers en inclusief'
      ]
    },
    toelichting: 'communicatie_toelichting'
  },
  {
    id: 9,
    title: 'Kennis',
    sectionNum: '3.5',
    subtitle: 'Kennis en bewustwording',
    likert: {
      id: 'likert-kennis',
      prefix: 'kennis',
      questions: [
        'Er worden trainingen gegeven over diversiteit en inclusie',
        'Medewerkers zijn zich bewust van onbewuste bias',
        'Er is kennis over culturele verschillen',
        'Best practices worden gedeeld binnen de organisatie',
        'Er wordt geleerd van andere organisaties',
        'Onderzoek naar diversiteit wordt gebruikt',
        'Er is kennis over wet- en regelgeving',
        'Nieuwe inzichten worden toegepast'
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
        'Er wordt actief strijd gevoerd tegen stereotypen',
        'Maatregelen worden geaccepteerd in de organisatie',
        'Culturele verschillen worden gewaardeerd',
        'Diversiteitsaandacht leeft in de organisatie',
        'Managers voelen zich verantwoordelijk',
        'De organisatie staat bekend als diversiteitsgericht'
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
