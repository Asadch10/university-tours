// Shared building blocks for the account settings sections.

export const settingsInput =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

export const settingsSelect = `${settingsInput} cursor-pointer appearance-none pr-10`;

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Pakistan',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Ireland',
  'Singapore',
  'United Arab Emirates',
];

export const DIAL_CODES = [
  { flag: '🇺🇸', code: '+1', label: 'US' },
  { flag: '🇬🇧', code: '+44', label: 'UK' },
  { flag: '🇨🇦', code: '+1', label: 'CA' },
  { flag: '🇦🇺', code: '+61', label: 'AU' },
  { flag: '🇮🇳', code: '+91', label: 'IN' },
  { flag: '🇵🇰', code: '+92', label: 'PK' },
];
