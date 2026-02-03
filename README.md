# Monitoring Cultureel Talent naar de Top 2025

Een webapplicatie voor het monitoren van culturele diversiteit in Nederlandse organisaties.

## Kenmerken

- **Inlogsysteem met organisatiecodes** - Elke deelnemende organisatie krijgt een unieke toegangscode
- **Stapsgewijs vragenformulier** - Overzichtelijke wizard met voortgangsindicator
- **Automatisch opslaan** - Formuliergegevens worden lokaal opgeslagen bij onderbreking
- **Google Sheets integratie** - Alle reacties worden opgeslagen in een centrale spreadsheet
- **Google Docs rapportage** - Voor elke inzending wordt automatisch een document gegenereerd

## Projectstructuur

```
├── index.html              # Inlogpagina
├── survey.html             # Vragenformulier
├── css/
│   └── styles.css          # Alle styling
├── js/
│   ├── config.js           # Configuratie-instellingen
│   ├── auth.js             # Authenticatie module
│   └── survey.js           # Formulier logica
├── docs/
│   └── google-apps-script.js   # Backend code voor Google
└── README.md
```

## Installatie

### 1. Google Spreadsheet aanmaken

1. Ga naar [Google Sheets](https://sheets.google.com) en maak een nieuwe spreadsheet
2. Hernoem de spreadsheet naar "Monitoring CTT 2025"
3. Maak twee tabbladen:
   - **Organisaties** - voor organisatiecodes
   - **Responses** - voor formulierreacties

4. Vul het tabblad "Organisaties" in met kolommen:
   | A: Code | B: Organisatie Naam | C: Email | D: Actief |
   |---------|---------------------|----------|-----------|
   | ORG-2025-001 | Voorbeeld BV | contact@voorbeeld.nl | TRUE |
   | ORG-2025-002 | Test Organisatie | info@test.nl | TRUE |

5. Kopieer de **Spreadsheet ID** uit de URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2. Google Drive map aanmaken

1. Maak een nieuwe map in Google Drive voor de gegenereerde documenten
2. Kopieer de **Folder ID** uit de URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID]
   ```

### 3. Google Apps Script deployen

1. Ga naar [script.google.com](https://script.google.com)
2. Klik op **Nieuw project**
3. Kopieer de inhoud van `docs/google-apps-script.js`
4. Werk de configuratie bovenaan het script bij:
   ```javascript
   const SPREADSHEET_ID = 'jouw-spreadsheet-id';
   const FOLDER_ID = 'jouw-folder-id';
   ```
5. Sla op (Ctrl+S)
6. Klik op **Uitvoeren** > **setupSpreadsheet** om de structuur te initialiseren
7. Ga naar **Deploy** > **New deployment**
8. Kies **Web app** als type
9. Stel in:
   - Execute as: **Me**
   - Who has access: **Anyone**
10. Klik op **Deploy**
11. Kopieer de **Web App URL**

### 4. Website configureren

1. Open `js/config.js`
2. Vervang `YOUR_GOOGLE_APPS_SCRIPT_URL` met de Web App URL:
   ```javascript
   SCRIPT_URL: 'https://script.google.com/macros/s/xxx/exec',
   ```

### 5. Deployen naar Netlify

1. Push de code naar GitHub
2. Ga naar [Netlify](https://netlify.com)
3. Klik op **Add new site** > **Import an existing project**
4. Verbind met je GitHub repository
5. Configuratie:
   - Branch: `main` (of je branch naam)
   - Build command: (leeg laten)
   - Publish directory: `.` of `/`
6. Klik op **Deploy**

## Gebruik

### Testmodus

Zonder geconfigureerde Google Apps Script URL werkt de applicatie in demo-modus:
- Gebruik code `DEMO` of `ORG-2025-001` om in te loggen
- Formuliergegevens worden gelogd naar de console
- Geen data wordt opgeslagen

### Organisatiecodes toevoegen

1. Open de Google Spreadsheet
2. Ga naar het tabblad "Organisaties"
3. Voeg een nieuwe rij toe met:
   - **Code**: Unieke code (bijv. ORG-2025-003)
   - **Organisatie Naam**: Naam van de organisatie
   - **Email**: Contactpersoon (optioneel)
   - **Actief**: TRUE of FALSE

### Reacties bekijken

1. Open de Google Spreadsheet
2. Ga naar het tabblad "Responses"
3. Alle inzendingen worden hier gelogd met timestamp

### Documenten bekijken

1. Open de Google Drive map
2. Per inzending wordt een Google Doc aangemaakt
3. Documenten bevatten een volledig overzicht van de ingevulde gegevens

## Aanpassingen

### Kleuren wijzigen

Bewerk de CSS variabelen in `css/styles.css`:

```css
:root {
  --salmon: #e8a091;
  --terracotta: #c4785a;
  --sand: #f5e6d3;
  /* etc. */
}
```

### Vragen toevoegen/wijzigen

1. Bewerk `survey.html` om vragen toe te voegen
2. Update `CONFIG.STEP_FIELDS` in `js/config.js`
3. Update `getHeaders()` en `buildRowData()` in `docs/google-apps-script.js`
4. Deploy het script opnieuw

## Technische details

- **Frontend**: Vanilla HTML, CSS, JavaScript (geen frameworks)
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **Documenten**: Google Docs API
- **Hosting**: Statische hosting (Netlify, GitHub Pages, etc.)

## Privacy & Beveiliging

- Organisatiecodes worden gevalideerd tegen een centrale lijst
- Sessies verlopen na 24 uur
- Formuliergegevens worden lokaal opgeslagen (localStorage) voor herstel bij onderbreking
- Alle data wordt versleuteld verzonden (HTTPS)
- Google Sheets toegang is beperkt tot de eigenaar van het script

## Support

Bij vragen of problemen, neem contact op via info@commissiemonitoring.nl

## Licentie

Alle rechten voorbehouden.
