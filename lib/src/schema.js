/**
 * Form Schema Definition — @vragenlijst/forms
 *
 * This module defines the schema format that drives form generation.
 * Any CMS (WordPress, GitBook, custom admin) can produce a JSON schema
 * conforming to this structure, and the renderer will produce the full UI.
 *
 * @example
 * const schema = {
 *   steps: [
 *     {
 *       id: 0,
 *       title: 'Welcome',
 *       subtitle: 'Tell us about yourself',
 *       fields: [
 *         { type: 'text', name: 'org_name', label: 'Organization', required: true }
 *       ]
 *     },
 *     {
 *       id: 1,
 *       title: 'Assessment',
 *       likert: {
 *         id: 'likert-assess',
 *         prefix: 'assess',
 *         questions: ['Our team is aligned', 'We have clear goals']
 *       }
 *     }
 *   ],
 *   likertOptions: [
 *     { value: 0, label: 'Not at all' },
 *     { value: 1, label: 'Somewhat' },
 *     { value: 2, label: 'Mostly' },
 *     { value: 3, label: 'Fully' }
 *   ]
 * };
 */

/**
 * Supported field types.
 * @typedef {'text'|'number'|'textarea'|'date'|'checkbox'|'radio-cards'|'radio'|'info-block'|'group'} FieldType
 */

/**
 * @typedef {Object} FieldOption
 * @property {string} value     - The value stored on selection
 * @property {string} label     - Display label
 * @property {string} [description] - Optional description text below label
 */

/**
 * @typedef {Object} ConditionalConfig
 * @property {string} trigger   - The parent value that reveals child fields (e.g. 'Yes')
 * @property {Field[]} fields   - Child fields to show when trigger matches
 */

/**
 * @typedef {Object} Field
 * @property {FieldType} type
 * @property {string} name           - Unique field identifier / form name
 * @property {string} [label]        - Display label (supports HTML for highlights)
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {boolean} [compact]     - Inline compact layout
 * @property {boolean} [indent]      - Visually indent as sub-field
 * @property {string} [group]        - Group key for related fields
 * @property {number} [maxLength]
 * @property {string} [hint]         - Help text below the input
 * @property {string} [suffix]       - Inline suffix text (e.g. '%')
 * @property {FieldOption[]} [options] - For radio-cards, radio types
 * @property {ConditionalConfig} [conditional] - Show/hide child fields
 * @property {string} [content]      - For info-block type
 * @property {Field[]} [fields]      - For group type (nested fields)
 */

/**
 * @typedef {Object} LikertConfig
 * @property {string} id           - DOM id for the table
 * @property {string} prefix       - Name prefix for radios (e.g. 'leid' → leid_1, leid_2)
 * @property {string[]} questions  - Array of question texts
 */

/**
 * @typedef {Object} LikertOption
 * @property {number|string} value
 * @property {string} label
 */

/**
 * @typedef {Object} Step
 * @property {number} id              - Unique step index
 * @property {string} title           - Step title for navigation
 * @property {string} [type]          - 'welcome', 'intro', 'review', 'success', or undefined
 * @property {string} [sectionNum]    - Section number label (e.g. '3.1')
 * @property {string} [subtitle]      - Subtitle text
 * @property {Object} [content]       - Static content block
 * @property {string} [content.heading]
 * @property {string} [content.text]
 * @property {string} [content.intro]
 * @property {string} [introText]     - Intro paragraph before fields
 * @property {Field[]} [fields]       - Field definitions for this step
 * @property {LikertConfig} [likert]  - Likert table config
 * @property {string} [toelichting]   - Name for optional explanation textarea
 */

/**
 * @typedef {Object} FormSchema
 * @property {Step[]} steps           - Ordered list of form steps
 * @property {LikertOption[]} [likertOptions] - Scale options (defaults to 4-point)
 * @property {Object} [labels]        - i18n overrides for UI strings
 * @property {string} [labels.next]
 * @property {string} [labels.previous]
 * @property {string} [labels.submit]
 * @property {string} [labels.review]
 * @property {string} [labels.reset]
 * @property {string} [labels.commentToggle]
 * @property {string} [labels.commentPlaceholder]
 * @property {string} [labels.toelichtingLabel]
 * @property {string} [labels.toelichtingPlaceholder]
 * @property {string} [labels.likertHeader]
 */

/** Default 4-point Likert scale */
export const DEFAULT_LIKERT_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Somewhat' },
  { value: 2, label: 'Mostly' },
  { value: 3, label: 'Fully' }
];

/** Default UI labels (English) */
export const DEFAULT_LABELS = {
  next: 'Next',
  previous: 'Previous',
  submit: 'Submit',
  review: 'Review',
  reset: '\u21BA',               // ↺
  commentToggle: 'Leave a comment',
  commentPlaceholder: 'Optional: leave a comment here',
  toelichtingLabel: 'Explanation (optional)',
  toelichtingPlaceholder: 'Explain your answers...',
  likertHeader: 'Achieved:'
};

/**
 * Validate a schema object, returning an array of error strings.
 * Returns empty array if valid.
 *
 * @param {FormSchema} schema
 * @returns {string[]} errors
 */
export function validateSchema(schema) {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return ['Schema must be a non-null object'];
  }

  if (!Array.isArray(schema.steps) || schema.steps.length === 0) {
    errors.push('Schema must have a non-empty "steps" array');
    return errors;
  }

  const seenIds = new Set();
  const seenNames = new Set();

  for (const step of schema.steps) {
    if (typeof step.id !== 'number') {
      errors.push(`Step missing numeric "id": ${JSON.stringify(step)}`);
      continue;
    }
    if (seenIds.has(step.id)) {
      errors.push(`Duplicate step id: ${step.id}`);
    }
    seenIds.add(step.id);

    if (!step.title) {
      errors.push(`Step ${step.id} missing "title"`);
    }

    if (step.fields) {
      validateFields(step.fields, step.id, seenNames, errors);
    }

    if (step.likert) {
      if (!step.likert.id) errors.push(`Step ${step.id}: likert missing "id"`);
      if (!step.likert.prefix) errors.push(`Step ${step.id}: likert missing "prefix"`);
      if (!Array.isArray(step.likert.questions) || step.likert.questions.length === 0) {
        errors.push(`Step ${step.id}: likert must have non-empty "questions" array`);
      }
    }
  }

  if (schema.likertOptions) {
    if (!Array.isArray(schema.likertOptions) || schema.likertOptions.length === 0) {
      errors.push('"likertOptions" must be a non-empty array');
    }
  }

  return errors;
}

function validateFields(fields, stepId, seenNames, errors) {
  for (const field of fields) {
    if (!field.type) {
      errors.push(`Step ${stepId}: field missing "type": ${JSON.stringify(field)}`);
      continue;
    }

    if (field.type === 'info-block') {
      if (!field.content) errors.push(`Step ${stepId}: info-block missing "content"`);
      continue;
    }

    if (field.type === 'group') {
      if (Array.isArray(field.fields)) {
        validateFields(field.fields, stepId, seenNames, errors);
      }
      continue;
    }

    if (!field.name) {
      errors.push(`Step ${stepId}: field missing "name": ${JSON.stringify(field)}`);
      continue;
    }

    if (seenNames.has(field.name)) {
      errors.push(`Step ${stepId}: duplicate field name "${field.name}"`);
    }
    seenNames.add(field.name);

    if ((field.type === 'radio-cards' || field.type === 'radio') && !Array.isArray(field.options)) {
      errors.push(`Step ${stepId}: ${field.type} field "${field.name}" missing "options" array`);
    }

    if (field.conditional) {
      if (!field.conditional.trigger) {
        errors.push(`Step ${stepId}: conditional on "${field.name}" missing "trigger"`);
      }
      if (Array.isArray(field.conditional.fields)) {
        validateFields(field.conditional.fields, stepId, seenNames, errors);
      }
    }
  }
}
