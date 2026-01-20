/**
 * Google Apps Script for Monitoring Cultureel Talent naar de Top
 *
 * This script handles:
 * 1. Organization code validation
 * 2. Survey data storage in Google Sheets
 * 3. Google Docs generation for each submission
 *
 * SETUP INSTRUCTIONS:
 * ==================
 *
 * 1. Create a new Google Sheet with two tabs:
 *    - "Organisaties" (for organization codes)
 *    - "Responses" (for survey responses)
 *
 * 2. In the "Organisaties" tab, create columns:
 *    A: Code (e.g., ORG-2025-001)
 *    B: Organisatie Naam
 *    C: Email (optional)
 *    D: Actief (TRUE/FALSE)
 *
 * 3. In the "Responses" tab, create columns matching the form fields:
 *    A: Timestamp
 *    B: OrgCode
 *    C: OrgName
 *    D: organisatie
 *    E: streefcijfer
 *    F: streefcijfer_percentage
 *    G: streefcijfer_jaar
 *    H: streefcijfer_gehaald
 *    ... (continue for all fields)
 *
 * 4. Create a new Google Apps Script project:
 *    - Go to script.google.com
 *    - Create a new project
 *    - Paste this entire code
 *    - Update SPREADSHEET_ID and FOLDER_ID below
 *
 * 5. Deploy as Web App:
 *    - Click Deploy > New deployment
 *    - Select type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy
 *    - Copy the Web App URL
 *
 * 6. Update CONFIG.SCRIPT_URL in your website's js/config.js
 */

// =============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// =============================================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // The ID from your Google Sheet URL
const FOLDER_ID = 'YOUR_FOLDER_ID';           // Google Drive folder ID for documents
const SHEET_ORGS = 'Organisaties';            // Sheet name for organization codes
const SHEET_RESPONSES = 'Responses';          // Sheet name for survey responses

// =============================================================================
// WEB APP HANDLERS
// =============================================================================

/**
 * Handle GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Monitoring API is running' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    let result;

    switch (request.action) {
      case 'validateCode':
        result = validateOrganizationCode(request.code);
        break;
      case 'submitSurvey':
        result = submitSurvey(request.data);
        break;
      default:
        result = { success: false, message: 'Unknown action' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Server error: ' + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// ORGANIZATION CODE VALIDATION
// =============================================================================

/**
 * Validate an organization code against the spreadsheet
 */
function validateOrganizationCode(code) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_ORGS);

    if (!sheet) {
      return { success: false, message: 'Configuration error: Organization sheet not found' };
    }

    const data = sheet.getDataRange().getValues();

    // Skip header row, search for code
    for (let i = 1; i < data.length; i++) {
      const rowCode = String(data[i][0]).trim().toUpperCase();
      const orgName = data[i][1];
      const isActive = data[i][3];

      if (rowCode === code.toUpperCase()) {
        // Check if organization is active
        if (isActive === false || isActive === 'FALSE' || isActive === 'Nee') {
          return {
            success: false,
            message: 'Deze organisatiecode is niet meer actief.'
          };
        }

        return {
          success: true,
          organizationName: orgName
        };
      }
    }

    return {
      success: false,
      message: 'Ongeldige organisatiecode. Controleer uw code en probeer opnieuw.'
    };

  } catch (error) {
    console.error('Error validating code:', error);
    return {
      success: false,
      message: 'Er ging iets mis bij het controleren van uw code.'
    };
  }
}

// =============================================================================
// SURVEY SUBMISSION
// =============================================================================

/**
 * Submit survey data to spreadsheet and create document
 */
function submitSurvey(data) {
  try {
    // 1. Save to Google Sheets
    const sheetResult = saveToSheet(data);
    if (!sheetResult.success) {
      return sheetResult;
    }

    // 2. Create Google Doc
    const docResult = createDocument(data);

    return {
      success: true,
      message: 'Survey submitted successfully',
      rowNumber: sheetResult.rowNumber,
      documentUrl: docResult.success ? docResult.documentUrl : null,
      documentId: docResult.success ? docResult.documentId : null
    };

  } catch (error) {
    console.error('Error submitting survey:', error);
    return {
      success: false,
      message: 'Er ging iets mis bij het opslaan van uw gegevens.'
    };
  }
}

/**
 * Save survey data to Google Sheets
 */
function saveToSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_RESPONSES);

    if (!sheet) {
      // Create the sheet if it doesn't exist
      const newSheet = ss.insertSheet(SHEET_RESPONSES);
      // Add headers
      newSheet.appendRow(getHeaders());
    }

    const responseSheet = ss.getSheetByName(SHEET_RESPONSES);

    // Build row data matching header order
    const row = buildRowData(data);
    responseSheet.appendRow(row);

    return {
      success: true,
      rowNumber: responseSheet.getLastRow()
    };

  } catch (error) {
    console.error('Error saving to sheet:', error);
    return {
      success: false,
      message: 'Error saving to spreadsheet'
    };
  }
}

/**
 * Get spreadsheet headers
 */
function getHeaders() {
  return [
    'Timestamp',
    'OrgCode',
    'OrgName',
    'Organisatie',
    'Streefcijfer',
    'Streefcijfer_Percentage',
    'Streefcijfer_Jaar',
    'Streefcijfer_Gehaald',
    'Aantal_Werknemers',
    'Werknemers_Buiten_Europa',
    'Aantal_Top',
    'Top_Buiten_Europa',
    'Aantal_Subtop',
    'Subtop_Buiten_Europa',
    'Heeft_RvB',
    'Aantal_RvB',
    'RvB_Buiten_Europa',
    'Heeft_RvC',
    'Aantal_RvC',
    'RvC_Buiten_Europa',
    'Heeft_RvT',
    'Aantal_RvT',
    'RvT_Buiten_Europa',
    'Leiderschap_1',
    'Leiderschap_2',
    'Leiderschap_3',
    'Leiderschap_4',
    'Leiderschap_5',
    'Leiderschap_Toelichting',
    'Datum',
    'Ondertekenaar',
    'Bevestiging',
    'Document_URL'
  ];
}

/**
 * Build row data from form submission
 */
function buildRowData(data) {
  return [
    data.timestamp || new Date().toISOString(),
    data.orgCode || '',
    data.orgName || '',
    data.organisatie || '',
    data.streefcijfer || '',
    data.streefcijfer_percentage || '',
    data.streefcijfer_jaar || '',
    data.streefcijfer_gehaald || '',
    data.aantal_werknemers || '',
    data.werknemers_buiten_europa || '',
    data.aantal_top || '',
    data.top_buiten_europa || '',
    data.aantal_subtop || '',
    data.subtop_buiten_europa || '',
    data.heeft_rvb || '',
    data.aantal_rvb || '',
    data.rvb_buiten_europa || '',
    data.heeft_rvc || '',
    data.aantal_rvc || '',
    data.rvc_buiten_europa || '',
    data.heeft_rvt || '',
    data.aantal_rvt || '',
    data.rvt_buiten_europa || '',
    data.leid_1 || '',
    data.leid_2 || '',
    data.leid_3 || '',
    data.leid_4 || '',
    data.leid_5 || '',
    data.leiderschap_toelichting || '',
    data.datum || '',
    data.ondertekenaar || '',
    data.bevestiging ? 'Ja' : 'Nee',
    '' // Document URL placeholder
  ];
}

// =============================================================================
// GOOGLE DOCS GENERATION
// =============================================================================

/**
 * Create a Google Doc for the submission
 */
function createDocument(data) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const timestamp = new Date().toISOString().split('T')[0];
    const docName = `Monitoring 2025 - ${data.organisatie || data.orgName} - ${timestamp}`;

    // Create new document
    const doc = DocumentApp.create(docName);
    const docId = doc.getId();

    // Move to correct folder
    const file = DriveApp.getFileById(docId);
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // Build document content
    const body = doc.getBody();

    // Title
    body.appendParagraph('Monitoring Cultureel Talent naar de Top 2025')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    body.appendParagraph('');

    // Organization Info
    body.appendParagraph('Organisatiegegevens')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    addField(body, 'Organisatie', data.organisatie || data.orgName);
    addField(body, 'Organisatiecode', data.orgCode);
    addField(body, 'Inzenddatum', data.datum);
    addField(body, 'Ondertekend door', data.ondertekenaar);

    body.appendParagraph('');

    // Streefcijfer
    body.appendParagraph('Streefcijfer')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    addField(body, 'Heeft streefcijfer', data.streefcijfer);
    if (data.streefcijfer === 'Ja') {
      addField(body, 'Percentage', data.streefcijfer_percentage);
      addField(body, 'Doeljaar', data.streefcijfer_jaar);
    }
    addField(body, 'Streefcijfer gehaald', data.streefcijfer_gehaald);

    body.appendParagraph('');

    // Kwantitatieve gegevens
    body.appendParagraph('Kwantitatieve Gegevens')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    // Create table for employee data
    const employeeTable = [
      ['Categorie', 'Totaal', 'Buiten-Europa', 'Percentage'],
      ['Werknemers', data.aantal_werknemers || '0', data.werknemers_buiten_europa || '0',
        calculatePercentage(data.werknemers_buiten_europa, data.aantal_werknemers)],
      ['Top', data.aantal_top || '0', data.top_buiten_europa || '0',
        calculatePercentage(data.top_buiten_europa, data.aantal_top)],
      ['Subtop', data.aantal_subtop || '0', data.subtop_buiten_europa || '0',
        calculatePercentage(data.subtop_buiten_europa, data.aantal_subtop)]
    ];

    const table1 = body.appendTable(employeeTable);
    styleTable(table1);

    body.appendParagraph('');

    // Bestuursorganen
    body.appendParagraph('Bestuursorganen')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    if (data.heeft_rvb === 'Ja') {
      addField(body, 'Raad van Bestuur', `${data.aantal_rvb || 0} leden, ${data.rvb_buiten_europa || 0} met herkomst Buiten-Europa`);
    } else {
      addField(body, 'Raad van Bestuur', 'Niet van toepassing');
    }

    if (data.heeft_rvc === 'Ja') {
      addField(body, 'Raad van Commissarissen', `${data.aantal_rvc || 0} leden, ${data.rvc_buiten_europa || 0} met herkomst Buiten-Europa`);
    } else {
      addField(body, 'Raad van Commissarissen', 'Niet van toepassing');
    }

    if (data.heeft_rvt === 'Ja') {
      addField(body, 'Raad van Toezicht', `${data.aantal_rvt || 0} leden, ${data.rvt_buiten_europa || 0} met herkomst Buiten-Europa`);
    } else {
      addField(body, 'Raad van Toezicht', 'Niet van toepassing');
    }

    body.appendParagraph('');

    // Leiderschap
    body.appendParagraph('Leiderschap')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    const likertLabels = ['Niet', 'Enigszins', 'Grotendeels', 'Volledig'];
    const leadershipTable = [
      ['Stelling', 'Score'],
      ['De top is gecommitteerd aan de doelstellingen', likertLabels[data.leid_1] || '-'],
      ['De top draagt het belang actief uit', likertLabels[data.leid_2] || '-'],
      ['De top stuurt op resultaten', likertLabels[data.leid_3] || '-'],
      ['De top stelt voldoende middelen beschikbaar', likertLabels[data.leid_4] || '-'],
      ['De top neemt eindverantwoordelijkheid', likertLabels[data.leid_5] || '-']
    ];

    const table2 = body.appendTable(leadershipTable);
    styleTable(table2);

    if (data.leiderschap_toelichting) {
      body.appendParagraph('');
      addField(body, 'Toelichting', data.leiderschap_toelichting);
    }

    body.appendParagraph('');

    // Footer
    body.appendHorizontalRule();
    body.appendParagraph(`Document gegenereerd op ${new Date().toLocaleString('nl-NL')}`)
      .setFontSize(10)
      .setForegroundColor('#888888');

    // Save and close
    doc.saveAndClose();

    // Update spreadsheet with document URL
    updateDocumentUrl(data.orgCode, data.timestamp, doc.getUrl());

    return {
      success: true,
      documentId: docId,
      documentUrl: doc.getUrl()
    };

  } catch (error) {
    console.error('Error creating document:', error);
    return {
      success: false,
      message: 'Error creating document'
    };
  }
}

/**
 * Add a labeled field to the document
 */
function addField(body, label, value) {
  const para = body.appendParagraph('');
  para.appendText(label + ': ').setBold(true);
  para.appendText(value || '-').setBold(false);
}

/**
 * Calculate percentage safely
 */
function calculatePercentage(part, total) {
  const p = parseFloat(part) || 0;
  const t = parseFloat(total) || 0;
  if (t === 0) return '0%';
  return (p / t * 100).toFixed(1) + '%';
}

/**
 * Style a table
 */
function styleTable(table) {
  const headerRow = table.getRow(0);
  for (let i = 0; i < headerRow.getNumCells(); i++) {
    headerRow.getCell(i).setBackgroundColor('#f5e6d3');
  }
}

/**
 * Update spreadsheet with document URL
 */
function updateDocumentUrl(orgCode, timestamp, url) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_RESPONSES);
    const data = sheet.getDataRange().getValues();

    // Find the matching row
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === orgCode && data[i][0] === timestamp) {
        // Update Document_URL column (last column)
        sheet.getRange(i + 1, data[0].length).setValue(url);
        break;
      }
    }
  } catch (error) {
    console.error('Error updating document URL:', error);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Test function - can be run from script editor
 */
function testValidation() {
  const result = validateOrganizationCode('ORG-2025-001');
  console.log(result);
}

/**
 * Setup function - creates initial spreadsheet structure
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Create Organisaties sheet if not exists
  let orgsSheet = ss.getSheetByName(SHEET_ORGS);
  if (!orgsSheet) {
    orgsSheet = ss.insertSheet(SHEET_ORGS);
    orgsSheet.appendRow(['Code', 'Organisatie Naam', 'Email', 'Actief']);
    // Add sample data
    orgsSheet.appendRow(['ORG-2025-001', 'Voorbeeld Bedrijf BV', 'contact@voorbeeld.nl', true]);
    orgsSheet.appendRow(['ORG-2025-002', 'Test Organisatie NV', 'info@test.nl', true]);
  }

  // Create Responses sheet if not exists
  let responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!responsesSheet) {
    responsesSheet = ss.insertSheet(SHEET_RESPONSES);
    responsesSheet.appendRow(getHeaders());
  }

  console.log('Spreadsheet setup complete');
}
