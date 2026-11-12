/**
 * SIMULATED content for the Grow demonstration. Nothing here comes from the platform or from an AI service.
 * It exists so the full journey can be shown before the real AI Catalog Assembly Line is connected.
 */

export const DEMO_INTAKE = {
  title: 'Loaner laptop for travel',
  description:
    'Employees travelling to high-risk regions or conferences need a clean, short-term loaner laptop so no corporate data leaves the building on their primary device. IT Security wants this requested through the catalog, approved by the manager and returned and wiped within 5 days of travel. Today people email the service desk and wait.',
  owner: 'Dana Whitfield, End User Computing',
  type: 'item',
  audience: 'All employees',
  files: [{name: 'Travel-Device-Policy-v3.pdf', size: 482113, sample: true}]
};

/** The simulated queue of service-owner intake requests shown on the Grow overview. */
export const INCOMING = [
  {id: 'REQ-2041', status: 'ready', title: DEMO_INTAKE.title, owner: 'End User Computing', age: 'today', intake: DEMO_INTAKE, blurb: 'Policy attached. Best end-to-end demonstration.'},
  {
    id: 'REQ-2037',
    status: 'queued',
    title: 'Parental leave notification',
    owner: 'People Operations',
    age: '2 days ago',
    blurb: 'Record producer candidate with a sensitive-data form.',
    intake: {
      title: 'Parental leave notification',
      description: 'Employees tell People Operations about upcoming parental leave so payroll, the manager and benefits are informed in one step instead of three emails.',
      owner: 'Sam Okoye, People Operations',
      type: 'producer',
      audience: 'All employees',
      files: []
    }
  },
  {
    id: 'REQ-2033',
    status: 'queued',
    title: 'Conference room AV support',
    owner: 'Workplace Services',
    age: '4 days ago',
    blurb: 'Likely to overlap with existing workplace requests.',
    intake: {
      title: 'Conference room AV support',
      description: 'Book on-site audio visual help for a meeting or event in a conference room, including microphones, screens and a technician standing by.',
      owner: 'Priya Raman, Workplace Services',
      type: 'item',
      audience: 'All employees',
      files: []
    }
  }
];

export const STAGES = [
  {id: 'requirements', tab: 'overview', live: false},
  {id: 'duplicates', tab: 'duplicates', live: true},
  {id: 'draft', tab: 'form', live: false},
  {id: 'governance', tab: 'governance', live: false},
  {id: 'review', tab: 'review', live: false}
];

/** What a Content Understanding pass would typically lift out of an attached policy document (SIMULATED). */
export const EXTRACTED_REQUIREMENTS = [
  {text: 'Requester must be an active employee with an approved travel plan.', source: 'Policy §2.1', kind: 'eligibility'},
  {text: 'Manager approval is required before a device is issued.', source: 'Policy §3.4', kind: 'approval'},
  {text: 'Device is returned and wiped within 5 business days of the return date.', source: 'Policy §5.2', kind: 'fulfilment'},
  {text: 'Destination country must be captured to apply the right device profile.', source: 'Policy §4.1', kind: 'data'}
];

export const GENERIC_REQUIREMENTS = [
  {text: 'Who the request is for and how to reach them.', source: 'Intake description', kind: 'data'},
  {text: 'A business reason that fulfilment and approvers can act on.', source: 'Intake description', kind: 'data'},
  {text: 'Needs a clear owner and a fulfilment team.', source: 'Intake description', kind: 'fulfilment'}
];

export const STANDARD_SET = {name: 'Requester details (standard)', kb: 'KB0010421'};

export const STANDARD_VARIABLES = [
  {id: 'v-requested-for', label: 'Requested for', type: 'Reference (User)', mandatory: true, set: STANDARD_SET.name, hint: 'Defaults to the logged-in user'},
  {id: 'v-contact', label: 'Contact phone', type: 'Single line text', mandatory: false, set: STANDARD_SET.name, hint: 'For delivery questions'}
];

export const DEMO_VARIABLES = [
  {id: 'v-dest', label: 'Destination country', type: 'Select box', mandatory: true, hint: 'Drives the security profile on the device'},
  {id: 'v-depart', label: 'Departure date', type: 'Date', mandatory: true, hint: 'Device is prepared 2 days before'},
  {id: 'v-return', label: 'Return date', type: 'Date', mandatory: true, hint: 'Return and wipe is due 5 days later'},
  {id: 'v-justify', label: 'Business justification', type: 'Multi line text', mandatory: true, hint: 'Shown to the approving manager'},
  {id: 'v-os', label: 'Preferred operating system', type: 'Select box', mandatory: false, hint: 'Windows or macOS'},
  {id: 'v-accessories', label: 'Accessories needed', type: 'Checkbox', mandatory: false, hint: 'Charger, adapter, mouse'}
];

export const GENERIC_VARIABLES = [
  {id: 'v-need', label: 'What do you need?', type: 'Multi line text', mandatory: true, hint: 'Describe the request in a sentence or two'},
  {id: 'v-date', label: 'Needed by', type: 'Date', mandatory: false, hint: 'Leave empty if not time-critical'},
  {id: 'v-location', label: 'Location', type: 'Reference (Location)', mandatory: false, hint: 'Where the service is needed'},
  {id: 'v-justify', label: 'Business justification', type: 'Multi line text', mandatory: false, hint: 'Shown to approvers'}
];

export const WORKFLOW_BASE = [
  {id: 'w-submit', label: 'Request submitted', kind: 'start', detail: 'The requester completes the form in the portal.'},
  {id: 'w-check', label: 'Eligibility check', kind: 'auto', detail: 'Automatic: confirms an active employee.'},
  {id: 'w-fulfil', label: 'Fulfilment task', kind: 'task', detail: 'Assigned to the owning team’s group.'},
  {id: 'w-confirm', label: 'Confirm with requester', kind: 'task', detail: 'Requester confirms the outcome.'},
  {id: 'w-close', label: 'Close request', kind: 'end', detail: 'Request item closes and the survey is sent.'}
];

export const APPROVAL_STEP = {id: 'w-approve', label: 'Manager approval', kind: 'approval', detail: 'Requester’s manager approves or rejects.', added: true};
