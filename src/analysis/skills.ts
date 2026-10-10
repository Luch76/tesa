/**
 * The skill taxonomy and Bloom levels used by the web app's job-fit scoring
 * (web/src/lib/tesa/data.ts). Kept in sync by skills.spec.ts.
 */
export const SKILLS = [
  'Insurance Verification',
  'Medical Terminology',
  'EHR Systems (Epic)',
  'HIPAA Compliance',
  'Scheduling & Patient Flow',
  'Customer Success Management',
  'CRM (Salesforce/HubSpot)',
  'Data Analysis (Excel)',
  'SQL',
  'Data Visualization (Tableau/Power BI)',
  'Python',
  'Customs & Trade Compliance',
  'Supply Chain Planning',
  'Freight & Logistics Coordination',
  'Revenue Management',
  'Hospitality Operations',
  'Service Recovery',
  'Security Monitoring (SIEM)',
  'Incident Response',
  'AML/KYC Compliance',
  'Legal Research & Drafting',
  'Process Improvement',
  'Project Coordination',
  'AI Tools & Prompting',
] as const;

export const BLOOM = [
  'Not yet',
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
] as const;
