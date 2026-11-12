import {i18n} from '@servicenow/aiux/aiux-services';

export const TAXONOMY_LABELS = {
  uncategorised: () => i18n.getMessage('Not in any category'),
  generic: () => i18n.getMessage('In a vaguely named category'),
  misplaced: () => i18n.getMessage('Name fits another category better')
};
