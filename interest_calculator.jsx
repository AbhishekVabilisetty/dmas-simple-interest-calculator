import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toBlob } from 'html-to-image';
import {
  AlertCircle,
  CheckCircle,
  Cloud,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  FileText,
  IndianRupee,
  Languages,
  LoaderCircle,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Pencil,
  Plus,
  Settings2,
  Sun,
  Trash2
} from 'lucide-react';
import {
  deleteCloudBill,
  fetchCloudBills,
  getCloudUser,
  signInToCloud,
  signOutFromCloud,
  subscribeToCloudAuth,
  upsertCloudBills
} from './src/lib/cloudBills.js';
import { isSupabaseConfigured } from './src/lib/supabase.js';

const STORAGE_KEY = 'interest-calculator-bills-v1';
const THEME_STORAGE_KEY = 'interest-calculator-theme-mode-v1';
const CALC_RULES_STORAGE_KEY = 'interest-calculator-rules-v1';
const SITE_LANGUAGE_STORAGE_KEY = 'interest-calculator-site-language-v1';

const DEFAULT_CALC_RULES = {
  principalMultiplier: 1000,
  dailyMultiplier: 3,
  dayOffset: 1
};

const DEFAULT_SITE_LANGUAGE = 'en';
const DEFAULT_STATEMENT_LANGUAGE = 'te';

const normalizeRoundingAdjustment = (value) =>
  Math.max(0, Number.parseFloat(value) || 0);

function MoneyStackLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="17"
        y="14"
        width="28"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.45"
      />
      <rect
        x="13"
        y="22"
        width="32"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.7"
      />
      <rect
        x="19"
        y="30"
        width="32"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="3.2"
      />
      <text
        x="35"
        y="43"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="20"
        fontWeight="700"
        textAnchor="middle"
      >
        ₹
      </text>
    </svg>
  );
}

function SidebarDmasLogo({ className = '' }) {
  return (
    <svg
      viewBox="0 0 52 52"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="26"
        y="11"
        className="dmas-symbol dmas-symbol-divide"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
      >
        ÷
      </text>
      <text
        x="26"
        y="22"
        className="dmas-symbol dmas-symbol-multiply"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
      >
        ×
      </text>
      <text
        x="26"
        y="33"
        className="dmas-symbol dmas-symbol-add"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
      >
        +
      </text>
      <text
        x="26"
        y="44"
        className="dmas-symbol dmas-symbol-subtract"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
        fontWeight="700"
        textAnchor="middle"
      >
        −
      </text>
    </svg>
  );
}

const SITE_TEXT = {
  en: {
    english: 'English',
    telugu: 'Telugu',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    sidebarBrand: 'Interest Calc',
    expandSidebar: 'Expand sidebar',
    collapseSidebar: 'Collapse sidebar',
    newBill: 'New Bill',
    createNewBill: 'Create new bill',
    savedBillsSection: 'Saved Bills Section',
    yourBills: 'Your Bills',
    savedBillsHelp: 'Open a saved bill from here and continue editing it on the right.',
    savedBills: 'Saved Bills',
    loadingSavedBills: 'Loading saved bills...',
    noSavedBills: 'Save a bill once and it will appear here for future editing.',
    openBill: (name) => `Open ${name}`,
    deleteBill: (name) => `Delete ${name}`,
    settings: 'Settings',
    appearance: 'Appearance',
    websiteLanguage: 'Website Language',
    calculationRules: 'Calculation Rules',
    globalDefault: 'Global default',
    thisBillOnly: 'This bill only',
    units: 'Units',
    principal: 'Principal',
    daily: 'Daily',
    days: 'Days',
    interest: 'Interest',
    subtotal: 'Subtotal',
    roundOff: 'Return',
    total: 'Total',
    calcRulePrincipal: 'Units x',
    calcRulePrincipalSuffix: '= Principal',
    calcRuleDaily: 'Daily = Units x',
    calcRuleDays: 'Days = (End - Start) +',
    calcRulesNote:
      '`Global default` affects bills that use default rules. `This bill only` stores a custom rule set in the current bill.',
    pageTitle: 'DMAS Simple Interest Calculator',
    pageSubtitle: (rules) =>
      `Units x ${rules.principalMultiplier} = Principal | Daily = Units x ${rules.dailyMultiplier} | Days = (End - Start) + ${rules.dayOffset}`,
    billName: 'Bill Name',
    billNamePlaceholder: 'Enter a bill name',
    saveBill: 'Save Bill',
    saveAsCopy: 'Save As Copy',
    created: 'Created',
    lastModified: 'Last Modified',
    status: 'Status',
    notSavedYet: 'Not saved yet',
    unsavedChanges: 'Unsaved changes',
    saved: 'Saved',
    endDate: 'End Date (DD-MM or DD-MM-YYYY)',
    endDatePlaceholder: 'e.g. 25-3 or 25-3-2025',
    differentReturnDates: 'Different end dates',
    usingRowReturnDates: 'Using row-wise end dates from the entries table below.',
    invalidDate: 'Invalid date',
    entries: 'Entries',
    entriesInfoLabel: 'About entries',
    entriesInfoText:
      'Date is the start date. End Date is the row-wise closing date when different end dates are enabled. Amount is in units. Daily is the daily value for that row. Days is the total days used. Daily x Days gives the row interest.',
    editValue: 'Edit',
    addEntry: 'Add Entry',
    date: 'Date',
    returnDate: 'End Date',
    amountUnits: 'Amount (Units)',
    dailyTimesDays: 'Daily x Days',
    removeEntry: 'Remove entry',
    auto: 'Auto',
    summary: 'Summary',
    totalUnits: 'Total Units',
    suggestedRoundOff: 'Suggested round off',
    applySuggestedValue: 'Apply Suggested Value',
    verification: 'Verification',
    unitsTotalMatch: 'Units Total Match',
    interestTotalMatch: 'Interest Total Match',
    allRowsValid: 'All Rows Valid',
    principalValid: 'Principal Valid',
    finalAmountValid: 'Final Amount Valid',
    allCalculationsVerified: 'All calculations verified.',
    statementOutput: 'Statement Output',
    statementPreviewNote:
      'This preview follows the sample output format while keeping your numbers live.',
    switchStatementLanguageTo: (label) => `Switch statement language to ${label}`,
    copyStatementText: 'Copy Statement Text',
    statementImageCopied: 'Statement image copied',
    statementImageCopyFailed: 'Statement image copy failed',
    copyStatementAsImage: 'Copy statement as image',
    loadAnotherBillConfirm:
      'Load another bill? Unsaved changes in the current bill will be lost.',
    startNewBillConfirm:
      'Start a new bill? Unsaved changes in the current bill will be lost.',
    deleteBillConfirm: (name) => `Delete "${name}"?`,
    billPrefix: 'Bill'
  },
  te: {
    english: 'ఇంగ్లీష్',
    telugu: 'తెలుగు',
    light: 'లైట్',
    dark: 'డార్క్',
    system: 'సిస్టమ్',
    sidebarBrand: 'వడ్డీ లెక్క',
    expandSidebar: 'సైడ్‌బార్ విస్తరించు',
    collapseSidebar: 'సైడ్‌బార్ ముడుచు',
    newBill: 'కొత్త బిల్లు',
    createNewBill: 'కొత్త బిల్లు సృష్టించు',
    savedBillsSection: 'సేవ్ చేసిన బిల్లుల విభాగం',
    yourBills: 'మీ బిల్లులు',
    savedBillsHelp: 'ఇక్కడి నుంచి సేవ్ చేసిన బిల్లును తెరిచి కుడివైపు ఎడిట్ చేయండి.',
    savedBills: 'సేవ్ చేసిన బిల్లులు',
    loadingSavedBills: 'సేవ్ చేసిన బిల్లులు లోడ్ అవుతున్నాయి...',
    noSavedBills: 'ఒక్కసారి బిల్లు సేవ్ చేస్తే అది తర్వాత ఎడిటింగ్ కోసం ఇక్కడ కనిపిస్తుంది.',
    openBill: (name) => `${name} తెరువు`,
    deleteBill: (name) => `${name} తొలగించు`,
    settings: 'సెట్టింగ్స్',
    appearance: 'రూపం',
    websiteLanguage: 'వెబ్‌సైట్ భాష',
    calculationRules: 'లెక్కింపు నియమాలు',
    globalDefault: 'అన్ని బిల్లులకు',
    thisBillOnly: 'ఈ బిల్లు మాత్రమే',
    units: 'యూనిట్లు',
    principal: 'తల్లి',
    daily: 'రోజువారీ',
    days: 'రోజులు',
    interest: 'పిల్ల',
    subtotal: 'ఉపమొత్తం',
    roundOff: 'రిటర్న్',
    total: 'మొత్తం',
    calcRulePrincipal: 'యూనిట్లు x',
    calcRulePrincipalSuffix: '= అసలు',
    calcRuleDaily: 'రోజువారీ = యూనిట్లు x',
    calcRuleDays: 'రోజులు = (ముగింపు - ప్రారంభం) +',
    calcRulesNote:
      '`అన్ని బిల్లులకు` ఎంచుకుంటే డిఫాల్ట్ నియమాలు వాడే బిల్లులకు వర్తిస్తుంది. `ఈ బిల్లు మాత్రమే` ఎంచుకుంటే ప్రస్తుత బిల్లుకే కస్టమ్ నియమాలు సేవ్ అవుతాయి.',
    pageTitle: 'వడ్డీ కాలిక్యులేటర్',
    pageSubtitle: (rules) =>
      `యూనిట్లు x ${rules.principalMultiplier} = అసలు | రోజువారీ = యూనిట్లు x ${rules.dailyMultiplier} | రోజులు = (ముగింపు - ప్రారంభం) + ${rules.dayOffset}`,
    billName: 'బిల్లు పేరు',
    billNamePlaceholder: 'బిల్లు పేరు నమోదు చేయండి',
    saveBill: 'బిల్లు సేవ్ చేయి',
    saveAsCopy: 'కాపీగా సేవ్ చేయి',
    created: 'సృష్టించిన సమయం',
    lastModified: 'చివరి మార్పు',
    status: 'స్థితి',
    notSavedYet: 'ఇంకా సేవ్ కాలేదు',
    unsavedChanges: 'సేవ్ చేయని మార్పులు',
    saved: 'సేవ్ అయింది',
    endDate: 'చివరి తేదీ (DD-MM లేదా DD-MM-YYYY)',
    endDatePlaceholder: 'ఉదా. 25-3 లేదా 25-3-2025',
    entries: 'ఎంట్రీలు',
    entriesInfoLabel: 'ఎంట్రీల గురించి',
    entriesInfoText:
      'తేదీ అంటే ప్రారంభ తేదీ. మొత్తం యూనిట్లలో ఉంటుంది. రోజువారీ అంటే ఆ వరుసకు రోజువారీ విలువ. రోజులు అంటే తీసుకున్న మొత్తం రోజులు. రోజువారీ x రోజులు అంటే ఆ వరుస వడ్డీ.',
    editValue: 'ఎడిట్',
    addEntry: 'ఎంట్రీ చేర్చు',
    date: 'తేదీ',
    amountUnits: 'మొత్తం (యూనిట్లు)',
    dailyTimesDays: 'రోజువారీ x రోజులు',
    removeEntry: 'ఎంట్రీ తొలగించు',
    auto: 'ఆటో',
    summary: 'సారాంశం',
    totalUnits: 'మొత్తం యూనిట్లు',
    suggestedRoundOff: 'సూచించిన రౌండ్ ఆఫ్',
    applySuggestedValue: 'సూచించిన విలువను పెట్టు',
    verification: 'ధృవీకరణ',
    unitsTotalMatch: 'యూనిట్ల మొత్తం సరిపోలింది',
    interestTotalMatch: 'వడ్డీ మొత్తం సరిపోలింది',
    allRowsValid: 'అన్ని వరుసలు సరైనవి',
    principalValid: 'అసలు మొత్తం సరైనది',
    finalAmountValid: 'చివరి మొత్తం సరైనది',
    allCalculationsVerified: 'అన్ని లెక్కలు సరిపోయాయి.',
    statementOutput: 'స్టేట్మెంట్ అవుట్‌పుట్',
    statementPreviewNote:
      'ఈ ప్రివ్యూ మీ సంఖ్యలను అలాగే ఉంచి నమూనా అవుట్‌పుట్ ఫార్మాట్‌ను చూపిస్తుంది.',
    switchStatementLanguageTo: (label) => `స్టేట్మెంట్ భాషను ${label}కి మార్చు`,
    copyStatementText: 'స్టేట్మెంట్ టెక్స్ట్ కాపీ చేయి',
    statementImageCopied: 'స్టేట్మెంట్ చిత్రం కాపీ అయింది',
    statementImageCopyFailed: 'స్టేట్మెంట్ చిత్రం కాపీ కాలేదు',
    copyStatementAsImage: 'స్టేట్మెంట్‌ను చిత్రంగా కాపీ చేయి',
    loadAnotherBillConfirm:
      'మరో బిల్లును తెరవాలా? ప్రస్తుత బిల్లులో సేవ్ చేయని మార్పులు పోతాయి.',
    startNewBillConfirm:
      'కొత్త బిల్లు ప్రారంభించాలా? ప్రస్తుత బిల్లులో సేవ్ చేయని మార్పులు పోతాయి.',
    deleteBillConfirm: (name) => `"${name}" బిల్లును తొలగించాలా?`,
    billPrefix: 'బిల్లు'
  }
};

const ROW_END_DATE_TEXT = {
  en: {
    toggleLabel: 'Different end dates',
    note: 'Using row-wise end dates from the entries table below.',
    columnLabel: 'End Date',
    entriesInfoText:
      'Date is the start date. End Date is the row-wise closing date when different end dates are enabled. Amount is in units. Daily is the daily value for that row. Days is the total days used. Daily x Days gives the row interest.'
  },
  te: {
    toggleLabel: 'వేర్వేరు ముగింపు తేదీలు',
    note: 'క్రింది ఎంట్రీల పట్టికలో ప్రతి వరుసకు ముగింపు తేదీ వాడబడుతుంది.',
    columnLabel: 'ముగింపు తేదీ',
    entriesInfoText:
      'తేదీ అంటే ప్రారంభ తేదీ. ముగింపు తేదీ కాలమ్ ఆన్ చేస్తే ప్రతి వరుసకు చివరి తేదీ పెట్టవచ్చు. మొత్తం యూనిట్లలో ఉంటుంది. రోజువారీ అంటే ఆ వరుసకు రోజువారీ విలువ. రోజులు అంటే లెక్కలో తీసుకున్న మొత్తం రోజులు. రోజువారీ x రోజులు అంటే ఆ వరుస వడ్డీ.'
  }
};

const CLOUD_TEXT = {
  en: {
    sectionTitle: 'Cloud Backup',
    localOnly: 'Device only',
    localOnlyNote: 'Bills are staying only in this browser right now.',
    setupNote: 'Add Supabase keys to enable online bill storage before publishing.',
    connectNote: 'Sign in once to sync your bills across devices.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    sendMagicLink: 'Send Magic Link',
    sendingLink: 'Sending link...',
    linkSent: 'Check your email to finish sign in.',
    syncing: 'Syncing...',
    synced: 'Synced',
    syncIssue: 'Sync issue',
    signedInAs: 'Signed in as',
    signOut: 'Sign Out'
  },
  te: {
    sectionTitle: 'క్లౌడ్ బ్యాకప్',
    localOnly: 'ఈ పరికరం మాత్రమే',
    localOnlyNote: 'బిల్లులు ప్రస్తుతం ఈ బ్రౌజర్‌లో మాత్రమే సేవ్ అవుతున్నాయి.',
    setupNote: 'వెబ్‌సైట్‌ను లైవ్ చేయడానికి ముందు ఆన్‌లైన్ స్టోరేజ్ కోసం Supabase keys జోడించండి.',
    connectNote: 'ఒకసారి సైన్ ఇన్ చేస్తే మీ బిల్లులు అన్ని పరికరాల్లో అందుబాటులో ఉంటాయి.',
    emailLabel: 'ఇమెయిల్',
    emailPlaceholder: 'you@example.com',
    sendMagicLink: 'మ్యాజిక్ లింక్ పంపు',
    sendingLink: 'లింక్ పంపుతోంది...',
    linkSent: 'సైన్ ఇన్ పూర్తి చేయడానికి మీ ఇమెయిల్ చూడండి.',
    syncing: 'సింక్ అవుతోంది...',
    synced: 'సింక్ అయింది',
    syncIssue: 'సింక్ సమస్య',
    signedInAs: 'సైన్ ఇన్ అయినది',
    signOut: 'సైన్ అవుట్'
  }
};

const STATEMENT_LABELS = {
  en: {
    languageLabel: 'English',
    title: 'Interest Calculation',
    titleWithDate: (date) => `Interest Calculation (Up to ${date})`,
    uptoDateLabel: 'Calculated up to',
    totalSlipsLabel: 'Total no.of slips',
    principal: 'Principal',
    interest: 'Interest',
    subtotal: 'Subtotal',
    roundOff: 'Return',
    total: 'Total'
  },
  te: {
    languageLabel: '\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41',
    title: '\u0c24\u0c32\u0c4d\u0c32\u0c3f \u0c2a\u0c3f\u0c32\u0c4d\u0c32',
    titleWithDate: (date) =>
      `\u0c24\u0c32\u0c4d\u0c32\u0c3f \u0c2a\u0c3f\u0c32\u0c4d\u0c32 (${date} \u0c35\u0c30\u0c15\u0c41)`,
    uptoDateLabel: '\u0c32\u0c46\u0c15\u0c4d\u0c15\u0c3f\u0c02\u0c1a\u0c3f\u0c28 \u0c24\u0c47\u0c26\u0c40 \u0c35\u0c30\u0c15\u0c41',
    totalSlipsLabel: '\u0c2e\u0c4a\u0c24\u0c4d\u0c24\u0c02 \u0c36\u0c3e\u0c32\u0c4d\u0c24\u0c40\u0c32\u0c41',
    principal: '\u0c24\u0c32\u0c4d\u0c32\u0c3f',
    interest: '\u0c2a\u0c3f\u0c32\u0c4d\u0c32',
    subtotal: '\u0c09\u0c2a\u0c2e\u0c4a\u0c24\u0c4d\u0c24\u0c02',
    roundOff: '\u0c30\u0c3f\u0c1f\u0c30\u0c4d\u0c28\u0c4d',
    total: '\u0c2e\u0c4a\u0c24\u0c4d\u0c24\u0c02'
  }
};

const normalizeStatementLanguage = (value) =>
  value === 'en' || value === 'te' ? value : DEFAULT_STATEMENT_LANGUAGE;

const normalizeSiteLanguage = (value) =>
  value === 'en' || value === 'te' ? value : DEFAULT_SITE_LANGUAGE;

const getSavedThemeMode = () => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
      return storedTheme;
    }
  } catch (error) {
    console.error('Unable to load theme preference:', error);
  }

  return 'system';
};

const getSavedSiteLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_SITE_LANGUAGE;
  }

  try {
    const storedLanguage = window.localStorage.getItem(SITE_LANGUAGE_STORAGE_KEY);
    return normalizeSiteLanguage(storedLanguage);
  } catch (error) {
    console.error('Unable to load site language preference:', error);
  }

  return DEFAULT_SITE_LANGUAGE;
};

const getIsMobileViewport = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(max-width: 840px)').matches;
};

const getSystemTheme = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const sanitizeCalcRules = (source, fallbackRules = DEFAULT_CALC_RULES) => {
  const principalMultiplier = Number(source?.principalMultiplier);
  const dailyMultiplier = Number(source?.dailyMultiplier);
  const dayOffset = Number(source?.dayOffset);

  return {
    principalMultiplier:
      Number.isFinite(principalMultiplier) && principalMultiplier > 0
        ? principalMultiplier
        : fallbackRules.principalMultiplier,
    dailyMultiplier:
      Number.isFinite(dailyMultiplier) && dailyMultiplier >= 0
        ? dailyMultiplier
        : fallbackRules.dailyMultiplier,
    dayOffset:
      Number.isFinite(dayOffset) ? dayOffset : fallbackRules.dayOffset
  };
};

const getSavedCalcRules = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_CALC_RULES;
  }

  try {
    const rawRules = window.localStorage.getItem(CALC_RULES_STORAGE_KEY);
    if (!rawRules) {
      return DEFAULT_CALC_RULES;
    }

    const parsedRules = JSON.parse(rawRules);
    return sanitizeCalcRules(parsedRules, DEFAULT_CALC_RULES);
  } catch (error) {
    console.error('Unable to load calculation rules:', error);
    return DEFAULT_CALC_RULES;
  }
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEmptyEntry = () => ({
  id: createId(),
  date: '',
  endDate: '',
  amount: '',
  days: '',
  daily: ''
});

const getEntryEndDate = (entry) => entry?.endDate ?? entry?.returnDate ?? '';

const serializeEntries = (source) => {
  if (!Array.isArray(source) || source.length === 0) {
    return [
      {
        id: 'blank-entry',
        date: '',
        endDate: '',
        amount: '',
        days: '',
        daily: ''
      }
    ];
  }

  return source.map((entry, index) => ({
    id: entry?.id ?? `entry-${index}`,
    date: entry?.date ?? '',
    endDate: getEntryEndDate(entry),
    amount: entry?.amount ?? '',
    days: entry?.days ?? '',
    daily: entry?.daily ?? ''
  }));
};

const normalizeEntriesForState = (source) => {
  if (!Array.isArray(source) || source.length === 0) {
    return [createEmptyEntry()];
  }

  return source.map((entry) => ({
    id: entry?.id ?? createId(),
    date: entry?.date ?? '',
    endDate: getEntryEndDate(entry),
    amount: entry?.amount ?? '',
    days: entry?.days ?? '',
    daily: entry?.daily ?? ''
  }));
};

const hasEntryEndDates = (entries) =>
  Array.isArray(entries) &&
  entries.some((entry) => getEntryEndDate(entry).trim());

const getBillUseEntryEndDates = (bill) => {
  if (typeof bill?.useEntryEndDates === 'boolean') {
    return bill.useEntryEndDates;
  }

  if (typeof bill?.useEntryReturnDates === 'boolean') {
    return bill.useEntryReturnDates;
  }

  return hasEntryEndDates(bill?.entries ?? []);
};

const normalizeBillRecord = (bill) => {
  const { useEntryReturnDates, ...nextBill } = bill ?? {};

  return {
    ...nextBill,
    entries: serializeEntries(bill?.entries),
    useEntryEndDates: getBillUseEntryEndDates(bill)
  };
};

const sortBills = (bills) =>
  [...bills].sort(
    (left, right) =>
      new Date(right.updatedAt ?? 0).getTime() -
      new Date(left.updatedAt ?? 0).getTime()
  );

const getLocalSavedBills = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawBills = window.localStorage.getItem(STORAGE_KEY);
    if (!rawBills) {
      return [];
    }

    const parsedBills = JSON.parse(rawBills);
    return Array.isArray(parsedBills)
      ? sortBills(parsedBills.map(normalizeBillRecord))
      : [];
  } catch (error) {
    console.error('Unable to load saved bills:', error);
    return [];
  }
};

const setLocalSavedBills = (bills) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sortBills(bills).map(normalizeBillRecord))
    );
  } catch (error) {
    console.error('Unable to save bills locally:', error);
  }
};

const mergeBillsById = (...billCollections) => {
  const mergedMap = new Map();

  billCollections
    .flat()
    .filter(Boolean)
    .forEach((bill) => {
      const existingBill = mergedMap.get(bill.id);

      if (!existingBill) {
        mergedMap.set(bill.id, bill);
        return;
      }

      const existingStamp = new Date(
        existingBill.updatedAt ?? existingBill.createdAt ?? 0
      ).getTime();
      const nextStamp = new Date(bill.updatedAt ?? bill.createdAt ?? 0).getTime();

      if (nextStamp >= existingStamp) {
        mergedMap.set(bill.id, bill);
      }
    });

  return sortBills([...mergedMap.values()]);
};

const buildDraftSnapshot = ({
  billName,
  entries,
  endDate,
  useEntryEndDates,
  roundingAdjustment,
  billRuleMode,
  billCalcRules,
  statementLanguage
}) => ({
  name: billName.trim(),
  endDate,
  useEntryEndDates,
  roundingAdjustment: normalizeRoundingAdjustment(roundingAdjustment),
  entries: serializeEntries(entries),
  billRuleMode,
  billCalcRules: billRuleMode === 'custom' ? sanitizeCalcRules(billCalcRules) : null,
  statementLanguage: normalizeStatementLanguage(statementLanguage)
});

const isEntryBlank = (entry) =>
  !entry.date?.trim() &&
  !getEntryEndDate(entry).trim() &&
  !entry.amount?.toString().trim() &&
  !entry.days?.toString().trim() &&
  !entry.daily?.toString().trim();

const formatStamp = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const createFallbackBillName = (prefix = 'Bill') => {
  const stamp = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());

  return `${prefix} ${stamp}`;
};

const formatDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const normalizedInput = value.replace(/[^\d]+/g, '-').replace(/^-+/, '').replace(/-+/g, '-');
  const rawGroups = normalizedInput
    .split('-')
    .map((group) => group.replace(/\D/g, ''))
    .filter((group) => group.length > 0);
  const digits = normalizedInput.replace(/\D/g, '').slice(0, 8);

  if (normalizedInput.includes('-') && rawGroups.length > 0) {
    const capacities = [2, 2, 4];
    const buckets = ['', '', ''];
    let bucketIndex = 0;

    rawGroups.forEach((group) => {
      let remaining = group;

      while (remaining && bucketIndex < buckets.length) {
        const available = capacities[bucketIndex] - buckets[bucketIndex].length;
        if (available <= 0) {
          bucketIndex += 1;
          continue;
        }

        buckets[bucketIndex] += remaining.slice(0, available);
        remaining = remaining.slice(available);

        if (!remaining) {
          bucketIndex += 1;
        }
      }
    });

    let formatted = buckets[0];

    if (rawGroups.length > 1 || buckets[1]) {
      formatted += `-${buckets[1]}`;
    }

    if (rawGroups.length > 2 || buckets[2]) {
      formatted += `-${buckets[2]}`;
    }

    if (
      normalizedInput.endsWith('-') &&
      !formatted.endsWith('-') &&
      rawGroups.length < 3
    ) {
      formatted += '-';
    }

    return formatted;
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
};

export default function InterestCalculator() {
  const [siteLanguage, setSiteLanguage] = useState(getSavedSiteLanguage);
  const [billName, setBillName] = useState('');
  const [activeBillId, setActiveBillId] = useState(null);
  const [savedBills, setSavedBills] = useState([]);
  const [entries, setEntries] = useState([createEmptyEntry()]);
  const [endDate, setEndDate] = useState('');
  const [useEntryEndDates, setUseEntryEndDates] = useState(false);
  const [roundingAdjustment, setRoundingAdjustment] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [cloudUser, setCloudUser] = useState(null);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudSyncState, setCloudSyncState] = useState(
    isSupabaseConfigured ? 'local' : 'disabled'
  );
  const [isCloudPanelExpanded, setIsCloudPanelExpanded] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getIsMobileViewport);
  const [themeMode, setThemeMode] = useState(getSavedThemeMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [expandedSettingsSections, setExpandedSettingsSections] = useState({
    siteLanguage: false,
    appearance: false,
    calcRules: false
  });
  const [globalCalcRules, setGlobalCalcRules] = useState(getSavedCalcRules);
  const [billRuleMode, setBillRuleMode] = useState('global');
  const [billCalcRules, setBillCalcRules] = useState(getSavedCalcRules);
  const [statementLanguage, setStatementLanguage] = useState(
    DEFAULT_STATEMENT_LANGUAGE
  );
  const [isDailyColumnEditable, setIsDailyColumnEditable] = useState(false);
  const [isDaysColumnEditable, setIsDaysColumnEditable] = useState(false);
  const [isEditorOpening, setIsEditorOpening] = useState(false);
  const [statementImageCopyState, setStatementImageCopyState] = useState('idle');
  const [copyAutoSaveToastVisible, setCopyAutoSaveToastVisible] = useState(false);
  const themeMenuRef = useRef(null);
  const mainColumnRef = useRef(null);
  const statementSheetRef = useRef(null);
  const statementImageCopyTimeoutRef = useRef(null);
  const copyAutoSaveToastTimeoutRef = useRef(null);
  const editorOpenTimeoutRef = useRef(null);
  const normalizedSiteLanguage = normalizeSiteLanguage(siteLanguage);
  const siteText = SITE_TEXT[normalizedSiteLanguage];
  const rowEndDateText = ROW_END_DATE_TEXT[normalizedSiteLanguage];
  const entriesInfoText = rowEndDateText.entriesInfoText;
  const cloudText = CLOUD_TEXT[normalizedSiteLanguage];

  const syncBillsToCloud = async (nextBills, options = {}) => {
    if (!isSupabaseConfigured || !cloudUser?.id) {
      return;
    }

    setCloudSyncState('syncing');

    try {
      if (options.deletedBillId) {
        await deleteCloudBill(cloudUser.id, options.deletedBillId);
      }

      await upsertCloudBills(cloudUser.id, nextBills);
      setCloudSyncState('online');
    } catch (error) {
      console.error('Unable to sync bills to cloud:', error);
      setCloudSyncState('error');
    }
  };

  const hydrateBillsFromStorage = async (nextUser) => {
    const localBills = getLocalSavedBills();

    if (!isSupabaseConfigured) {
      setSavedBills(localBills);
      setStorageReady(true);
      return;
    }

    if (!nextUser?.id) {
      setSavedBills(localBills);
      setCloudSyncState('local');
      setStorageReady(true);
      return;
    }

    setCloudSyncState('syncing');

    try {
      const remoteBills = await fetchCloudBills(nextUser.id);
      const mergedBills = mergeBillsById(remoteBills, localBills);

      if (mergedBills.length > 0) {
        await upsertCloudBills(nextUser.id, mergedBills);
      }

      setSavedBills(mergedBills);
      setLocalSavedBills(mergedBills);
      setCloudSyncState('online');
    } catch (error) {
      console.error('Unable to load cloud bills:', error);
      setSavedBills(localBills);
      setCloudSyncState('error');
    } finally {
      setStorageReady(true);
    }
  };

  useEffect(() => {
    let isActive = true;

    const bootstrapStorage = async () => {
      const localBills = getLocalSavedBills();
      if (isActive) {
        setSavedBills(localBills);
      }

      if (!isSupabaseConfigured) {
        if (isActive) {
          setStorageReady(true);
        }
        return;
      }

      try {
        const nextUser = await getCloudUser();
        if (!isActive) {
          return;
        }

        setCloudUser(nextUser);
        await hydrateBillsFromStorage(nextUser);
      } catch (error) {
        console.error('Unable to initialize cloud storage:', error);
        if (isActive) {
          setCloudSyncState('error');
          setStorageReady(true);
        }
      }
    };

    bootstrapStorage();

    if (!isSupabaseConfigured) {
      return () => {
        isActive = false;
      };
    }

    const unsubscribe = subscribeToCloudAuth((nextUser) => {
      if (!isActive) {
        return;
      }

      setCloudUser(nextUser);
      void hydrateBillsFromStorage(nextUser);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 840px)');
    const handleChange = (event) => {
      setIsMobileViewport(event.matches);
      if (event.matches) {
        setIsSidebarCollapsed(true);
        setIsThemeMenuOpen(false);
      }
    };

    setIsMobileViewport(mediaQuery.matches);
    if (mediaQuery.matches) {
      setIsSidebarCollapsed(true);
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(SITE_LANGUAGE_STORAGE_KEY, siteLanguage);
    } catch (error) {
      console.error('Unable to save site language preference:', error);
    }
  }, [siteLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch (error) {
      console.error('Unable to save theme preference:', error);
    }
  }, [themeMode]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        CALC_RULES_STORAGE_KEY,
        JSON.stringify(globalCalcRules)
      );
    } catch (error) {
      console.error('Unable to save calculation rules:', error);
    }
  }, [globalCalcRules]);

  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode;
  const calcRules = billRuleMode === 'custom' ? billCalcRules : globalCalcRules;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!isThemeMenuOpen || typeof document === 'undefined') {
      return;
    }

    const handlePointerDown = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  useEffect(() => {
    return () => {
      if (statementImageCopyTimeoutRef.current) {
        window.clearTimeout(statementImageCopyTimeoutRef.current);
      }

      if (editorOpenTimeoutRef.current) {
        window.clearTimeout(editorOpenTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isSidebarCollapsed) {
      setIsThemeMenuOpen(false);
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    setIsCloudPanelExpanded(false);
  }, [cloudUser]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const shouldLockScroll = isMobileViewport && !isSidebarCollapsed;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobileViewport, isSidebarCollapsed]);

  const persistBills = (nextBills) => {
    const orderedBills = sortBills(nextBills);
    setSavedBills(orderedBills);
    setLocalSavedBills(orderedBills);
    void syncBillsToCloud(orderedBills);

    return orderedBills;
  };

  const resetDraft = () => {
    setActiveBillId(null);
    setBillName('');
    setEntries([createEmptyEntry()]);
    setEndDate('');
    setUseEntryEndDates(false);
    setRoundingAdjustment(0);
    setBillRuleMode('global');
    setBillCalcRules(globalCalcRules);
    setStatementLanguage(DEFAULT_STATEMENT_LANGUAGE);
    setIsDailyColumnEditable(false);
    setIsDaysColumnEditable(false);
  };

  const activeSavedBill = useMemo(
    () => savedBills.find((bill) => bill.id === activeBillId) ?? null,
    [savedBills, activeBillId]
  );

  const isDraftEmpty = useMemo(() => {
    return (
      !billName.trim() &&
      !endDate.trim() &&
      !useEntryEndDates &&
      Number(roundingAdjustment) === 0 &&
      entries.every(isEntryBlank) &&
      billRuleMode === 'global' &&
      statementLanguage === DEFAULT_STATEMENT_LANGUAGE
    );
  }, [
    billName,
    endDate,
    useEntryEndDates,
    roundingAdjustment,
    entries,
    billRuleMode,
    statementLanguage
  ]);

  const hasUnsavedChanges = useMemo(() => {
    if (!activeSavedBill) {
      return !isDraftEmpty;
    }

    const currentDraft = JSON.stringify(
      buildDraftSnapshot({
        billName,
        entries,
        endDate,
        useEntryEndDates,
        roundingAdjustment,
        billRuleMode,
        billCalcRules,
        statementLanguage
      })
    );

    const savedDraft = JSON.stringify(
      buildDraftSnapshot({
        billName: activeSavedBill.name ?? '',
        entries: activeSavedBill.entries ?? [],
        endDate: activeSavedBill.endDate ?? '',
        useEntryEndDates: getBillUseEntryEndDates(activeSavedBill),
        roundingAdjustment: activeSavedBill.roundingAdjustment ?? 0,
        billRuleMode: activeSavedBill.billRuleMode ?? 'global',
        billCalcRules:
          activeSavedBill.billRuleMode === 'custom'
            ? sanitizeCalcRules(activeSavedBill.billCalcRules, globalCalcRules)
            : globalCalcRules,
        statementLanguage: activeSavedBill.statementLanguage ?? DEFAULT_STATEMENT_LANGUAGE
      })
    );

    return currentDraft !== savedDraft;
  }, [
    activeSavedBill,
    billName,
    entries,
    endDate,
    useEntryEndDates,
    roundingAdjustment,
    isDraftEmpty,
    billRuleMode,
    billCalcRules,
    globalCalcRules,
    statementLanguage
  ]);

  const getDefaultYear = () => {
    const parts = endDate.split('-').map((part) => part.trim());
    if (parts.length === 3) {
      const year = Number.parseInt(parts[2], 10);
      if (!Number.isNaN(year)) {
        return year;
      }
    }

    return new Date().getFullYear();
  };

  const parseDateParts = (dateStr) => {
    if (!dateStr) {
      return null;
    }

    const parts = dateStr.split('-').map((part) => part.trim());

    if (parts.length === 2) {
      const [day, month] = parts;
      const parsedDay = Number.parseInt(day, 10);
      const parsedMonth = Number.parseInt(month, 10);

      if (
        Number.isNaN(parsedDay) ||
        Number.isNaN(parsedMonth) ||
        parsedDay < 1 ||
        parsedMonth < 1 ||
        parsedMonth > 12
      ) {
        return null;
      }

      return {
        day: parsedDay,
        month: parsedMonth,
        year: null,
        hasExplicitYear: false
      };
    }

    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsedDay = Number.parseInt(day, 10);
      const parsedMonth = Number.parseInt(month, 10);
      const parsedYear = Number.parseInt(year, 10);

      if (
        Number.isNaN(parsedDay) ||
        Number.isNaN(parsedMonth) ||
        Number.isNaN(parsedYear) ||
        parsedDay < 1 ||
        parsedMonth < 1 ||
        parsedMonth > 12
      ) {
        return null;
      }

      return {
        day: parsedDay,
        month: parsedMonth,
        year: parsedYear,
        hasExplicitYear: true
      };
    }

    return null;
  };

  const buildValidatedDate = (dateParts, fallbackYear = getDefaultYear()) => {
    if (!dateParts) {
      return null;
    }

    const resolvedYear = dateParts.year ?? fallbackYear;
    const date = new Date(Date.UTC(resolvedYear, dateParts.month - 1, dateParts.day));

    if (
      date.getUTCFullYear() !== resolvedYear ||
      date.getUTCMonth() !== dateParts.month - 1 ||
      date.getUTCDate() !== dateParts.day
    ) {
      return null;
    }

    return date;
  };

  const compareMonthDay = (leftDateParts, rightDateParts) => {
    if (leftDateParts.month !== rightDateParts.month) {
      return leftDateParts.month - rightDateParts.month;
    }

    return leftDateParts.day - rightDateParts.day;
  };

  const resolveDateRange = (startDate, finalDate) => {
    const startParts = parseDateParts(startDate);
    const endParts = parseDateParts(finalDate);

    if (!startParts || !endParts) {
      return { start: null, end: null };
    }

    const defaultYear = getDefaultYear();
    let startYear = startParts.year;
    let endYear = endParts.year;

    if (startYear == null && endYear == null) {
      startYear = defaultYear;
      endYear = defaultYear;

      if (compareMonthDay(endParts, startParts) < 0) {
        endYear += 1;
      }
    } else if (startYear != null && endYear == null) {
      endYear = startYear;

      if (compareMonthDay(endParts, startParts) < 0) {
        endYear += 1;
      }
    } else if (startYear == null && endYear != null) {
      startYear = endYear;

      if (compareMonthDay(startParts, endParts) > 0) {
        startYear -= 1;
      }
    }

    return {
      start: buildValidatedDate(startParts, startYear),
      end: buildValidatedDate(endParts, endYear)
    };
  };

  const isDateInputValid = (dateStr, role = 'standalone', relatedDate = '') => {
    if (!dateStr?.trim()) {
      return true;
    }

    const dateParts = parseDateParts(dateStr);
    if (!dateParts) {
      return false;
    }

    let fallbackYear = getDefaultYear();
    const relatedDateParts = parseDateParts(relatedDate);

    if (dateParts.year != null) {
      fallbackYear = dateParts.year;
    } else if (relatedDateParts?.year != null) {
      fallbackYear = relatedDateParts.year;

      if (role === 'start' && compareMonthDay(dateParts, relatedDateParts) > 0) {
        fallbackYear -= 1;
      }

      if (role === 'end' && compareMonthDay(dateParts, relatedDateParts) < 0) {
        fallbackYear += 1;
      }
    }

    return Boolean(buildValidatedDate(dateParts, fallbackYear));
  };

  const hasEndDateBeforeStartDate = (startDate, finalDate) => {
    if (!startDate?.trim() || !finalDate?.trim()) {
      return false;
    }

    const { start, end } = resolveDateRange(startDate, finalDate);
    if (!start || !end) {
      return false;
    }

    return end < start;
  };

  const calculateDays = (startDate, finalDate) => {
    const { start, end } = resolveDateRange(startDate, finalDate);

    if (!start || !end) {
      return 0;
    }

    const diffTime = end - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 0;
    }

    return Math.max(0, diffDays + calcRules.dayOffset);
  };

  const calculations = useMemo(() => {
    const validEntries = entries.filter((entry) => {
      return entry.date && entry.amount && Number.parseFloat(entry.amount) > 0;
    });

    const rows = validEntries.map((entry) => {
      const amount = Number.parseFloat(entry.amount) || 0;
      const resolvedEndDate = useEntryEndDates ? entry.endDate : endDate;
      const parsedDays = Number.parseFloat(entry.days);
      const hasDaysOverride = entry.days !== '' && !Number.isNaN(parsedDays);
      const days = hasDaysOverride
        ? Math.max(0, parsedDays)
        : calculateDays(entry.date, resolvedEndDate);
      const parsedDaily = Number.parseFloat(entry.daily);
      const hasDailyOverride = entry.daily !== '' && !Number.isNaN(parsedDaily);
      const dailyInterest = hasDailyOverride
        ? parsedDaily
        : amount * calcRules.dailyMultiplier;
      const interest = dailyInterest * days;

      return {
        ...entry,
        amount,
        resolvedEndDate,
        days,
        dailyInterest,
        interest,
        hasDaysOverride,
        hasDailyOverride
      };
    });

    const totalUnits = rows.reduce((sum, row) => sum + row.amount, 0);
    const totalInterest = rows.reduce((sum, row) => sum + row.interest, 0);
    const principal = totalUnits * calcRules.principalMultiplier;
    const subtotal = principal + totalInterest;
    const safeRoundingAdjustment = normalizeRoundingAdjustment(roundingAdjustment);
    const finalAmount = subtotal + safeRoundingAdjustment;
    const suggestedRounding = Math.ceil(subtotal / 1000) * 1000 - subtotal;

    return {
      rows,
      totalUnits,
      totalInterest,
      principal,
      subtotal,
      finalAmount,
      suggestedRounding
    };
  }, [entries, endDate, useEntryEndDates, roundingAdjustment, calcRules]);

  const entryCalculationsById = new Map(
    calculations.rows.map((row) => [row.id, row])
  );

  const addEntry = () => {
    setEntries((currentEntries) => [...currentEntries, createEmptyEntry()]);
  };

  const removeEntry = (id) => {
    if (entries.length === 1) {
      return;
    }

    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== id)
    );
  };

  const updateEntry = (id, field, value) => {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const applySuggestedRounding = () => {
    setRoundingAdjustment(calculations.suggestedRounding);
  };

  const closeSidebarForMobile = () => {
    if (isMobileViewport) {
      setIsSidebarCollapsed(true);
      setIsThemeMenuOpen(false);
    }
  };

  const triggerEditorOpenEffect = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (editorOpenTimeoutRef.current) {
      window.clearTimeout(editorOpenTimeoutRef.current);
    }

    setIsEditorOpening(false);

    window.requestAnimationFrame(() => {
      mainColumnRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });

      window.requestAnimationFrame(() => {
        setIsEditorOpening(true);
        editorOpenTimeoutRef.current = window.setTimeout(() => {
          setIsEditorOpening(false);
        }, 900);
      });
    });
  };

  const loadBill = (billId) => {
    const bill = savedBills.find((item) => item.id === billId);
    if (!bill) {
      return;
    }

    if (
      hasUnsavedChanges &&
      billId !== activeBillId &&
      !window.confirm(siteText.loadAnotherBillConfirm)
    ) {
      return;
    }

    setActiveBillId(bill.id);
    setBillName(bill.name ?? '');
    setEntries(normalizeEntriesForState(bill.entries));
    setEndDate(bill.endDate ?? '');
    setUseEntryEndDates(getBillUseEntryEndDates(bill));
    setRoundingAdjustment(normalizeRoundingAdjustment(bill.roundingAdjustment));
    const nextBillRuleMode = bill.billRuleMode === 'custom' ? 'custom' : 'global';
    setBillRuleMode(nextBillRuleMode);
    setBillCalcRules(
      nextBillRuleMode === 'custom'
        ? sanitizeCalcRules(bill.billCalcRules, globalCalcRules)
        : globalCalcRules
    );
    setStatementLanguage(normalizeStatementLanguage(bill.statementLanguage));
    setIsDailyColumnEditable(false);
    setIsDaysColumnEditable(false);
    closeSidebarForMobile();
    triggerEditorOpenEffect();
  };

  const saveBill = ({ asCopy = false } = {}) => {
    const now = new Date().toISOString();
    const normalizedName =
      billName.trim() || createFallbackBillName(siteText.billPrefix);
    const nextDraft = {
      name: normalizedName,
      entries: serializeEntries(entries),
      endDate,
      useEntryEndDates,
      roundingAdjustment: normalizeRoundingAdjustment(roundingAdjustment),
      billRuleMode,
      billCalcRules:
        billRuleMode === 'custom' ? sanitizeCalcRules(billCalcRules) : null,
      statementLanguage: normalizeStatementLanguage(statementLanguage)
    };

    setBillName(normalizedName);

    if (!asCopy && activeBillId) {
      const existingBill = savedBills.find((bill) => bill.id === activeBillId);
      const updatedBill = {
        id: activeBillId,
        createdAt: existingBill?.createdAt ?? now,
        updatedAt: now,
        ...nextDraft
      };

      persistBills(
        savedBills.map((bill) => (bill.id === activeBillId ? updatedBill : bill))
      );
      return;
    }

    const newBillId = createId();
    const newBill = {
      id: newBillId,
      createdAt: now,
      updatedAt: now,
      ...nextDraft
    };

    setActiveBillId(newBillId);
    persistBills([newBill, ...savedBills]);
  };

  const autoSaveBillBeforeCopy = () => {
    if (isDraftEmpty) {
      return false;
    }

    saveBill();
    return true;
  };

  const showCopyAutoSaveToast = () => {
    setCopyAutoSaveToastVisible(true);

    if (copyAutoSaveToastTimeoutRef.current) {
      window.clearTimeout(copyAutoSaveToastTimeoutRef.current);
    }

    copyAutoSaveToastTimeoutRef.current = window.setTimeout(() => {
      setCopyAutoSaveToastVisible(false);
      copyAutoSaveToastTimeoutRef.current = null;
    }, 1000);
  };

  const startNewBill = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(siteText.startNewBillConfirm)
    ) {
      return;
    }

    resetDraft();
    closeSidebarForMobile();
    triggerEditorOpenEffect();
  };

  const deleteBill = (billId) => {
    const bill = savedBills.find((item) => item.id === billId);
    if (!bill) {
      return;
    }

    if (!window.confirm(siteText.deleteBillConfirm(bill.name))) {
      return;
    }

    const nextBills = savedBills.filter((item) => item.id !== billId);
    const orderedBills = sortBills(nextBills);
    setSavedBills(orderedBills);
    setLocalSavedBills(orderedBills);
    void syncBillsToCloud(orderedBills, { deletedBillId: billId });

    if (billId === activeBillId) {
      resetDraft();
    }
  };

  const sendCloudMagicLink = async () => {
    const normalizedEmail = cloudEmail.trim().toLowerCase();
    if (!normalizedEmail || !isSupabaseConfigured) {
      return;
    }

    setCloudSyncState('sending');

    try {
      await signInToCloud(normalizedEmail);
      setCloudSyncState('link-sent');
    } catch (error) {
      console.error('Unable to send cloud sign-in link:', error);
      setCloudSyncState('error');
    }
  };

  const signOutCloudAccount = async () => {
    if (!isSupabaseConfigured) {
      return;
    }

    setCloudSyncState('syncing');

    try {
      await signOutFromCloud();
      setCloudSyncState('local');
    } catch (error) {
      console.error('Unable to sign out from cloud sync:', error);
      setCloudSyncState('error');
    }
  };

  const verifyCalculations = () => {
    const sumUnits = calculations.rows.reduce((sum, row) => sum + row.amount, 0);
    const sumInterest = calculations.rows.reduce(
      (sum, row) => sum + row.interest,
      0
    );
    const allRowsValid = calculations.rows.every((row) => {
      const expectedInterest = row.dailyInterest * row.days;
      return Math.abs(expectedInterest - row.interest) < 0.01;
    });

    return {
      unitsMatch: Math.abs(sumUnits - calculations.totalUnits) < 0.01,
      interestMatch: Math.abs(sumInterest - calculations.totalInterest) < 0.01,
      rowsValid: allRowsValid,
      principalValid:
        Math.abs(
          calculations.principal -
            calculations.totalUnits * calcRules.principalMultiplier
        ) < 0.01,
      finalValid:
        Math.abs(
          calculations.finalAmount -
            (calculations.principal +
              calculations.totalInterest +
              roundingAdjustment)
        ) < 0.01
    };
  };

  const verification = verifyCalculations();
  const allVerified =
    calculations.rows.length > 0 && Object.values(verification).every(Boolean);

  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);

  const formatNumber = (num) =>
    num.toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const formatStatementNumber = (num) =>
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

  const formatSignedStatementNumber = (num) => {
    const prefix = num >= 0 ? '+' : '-';
    return `${prefix} ${formatStatementNumber(Math.abs(num))}`;
  };

  const formatStatementEndDate = (dateStr) => {
    if (!dateStr) {
      return '';
    }

    const parts = dateStr.split('-').map((part) => part.trim());

    if (parts.length === 2) {
      const [day, month] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
    }

    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
    }

    return dateStr;
  };

  const statementTitleDate = useEntryEndDates ? '' : formatStatementEndDate(endDate);
  const resolvedThemeLabel = resolvedTheme === 'dark' ? siteText.dark : siteText.light;
  const invalidDateLabel =
    siteText.invalidDate ?? (siteLanguage === 'te' ? 'చెల్లని తేదీ' : 'Invalid date');
  const endBeforeStartLabel =
    siteLanguage === 'te'
      ? 'ముగింపు తేదీ ప్రారంభ తేదీ కంటే ముందుంది'
      : 'End date is before start date';
  const globalEndBeforeStartLabel =
    siteLanguage === 'te'
      ? 'ఒకటి లేదా ఎక్కువ ప్రారంభ తేదీల కంటే ముగింపు తేదీ ముందుంది'
      : 'End date is before one or more start dates';
  const globalEndDateError =
    !useEntryEndDates && endDate.trim()
      ? !isDateInputValid(endDate)
        ? invalidDateLabel
        : entries.some((entry) => hasEndDateBeforeStartDate(entry.date, endDate))
          ? globalEndBeforeStartLabel
          : ''
      : '';
  const autoSavedToastLabel =
    siteLanguage === 'te' ? 'ఆటో-సేవ్ అయింది' : 'Auto-saved';
  const statementLabels =
    STATEMENT_LABELS[normalizeStatementLanguage(statementLanguage)];
  const statementTitle = statementTitleDate
    ? statementLabels.titleWithDate(statementTitleDate)
    : statementLabels.title;
  const statementHasEndDateColumn = useEntryEndDates;
  const statementRows = calculations.rows.map((row, index) => ({
    ...row,
    serial: index + 1
  }));
  const statementSlipCount = statementRows.length;
  const statementRowLines = statementRows.map((row) =>
    statementHasEndDateColumn
      ? `${row.serial}\t${row.date}\t${row.resolvedEndDate}\t${formatStatementNumber(row.amount)}\t${formatStatementNumber(row.dailyInterest)}x${row.days}\t${formatStatementNumber(row.interest)}`
      : `${row.serial}\t${row.date}\t${formatStatementNumber(row.amount)}\t${formatStatementNumber(row.dailyInterest)}x${row.days}\t${formatStatementNumber(row.interest)}`
  );
  const statementTotalLine = statementHasEndDateColumn
    ? `${statementLabels.total}\t\t\t${formatStatementNumber(calculations.totalUnits)}\t\t${formatStatementNumber(calculations.totalInterest)}`
    : `${statementLabels.total}\t\t${formatStatementNumber(calculations.totalUnits)}\t\t${formatStatementNumber(calculations.totalInterest)}`;

  const statementText = [
    statementTitle,
    ...(statementTitleDate
      ? [`${statementLabels.uptoDateLabel}: ${statementTitleDate}`]
      : []),
    `${statementLabels.totalSlipsLabel}: ${statementSlipCount}`,
    '',
    ...statementRowLines,
    statementTotalLine,
    '',
    `${statementLabels.principal}\t${formatStatementNumber(calculations.principal)}`,
    `${statementLabels.interest}\t${formatSignedStatementNumber(calculations.totalInterest)}`,
    `${statementLabels.subtotal}\t${formatStatementNumber(calculations.subtotal)}`,
    `${statementLabels.roundOff}\t${formatSignedStatementNumber(roundingAdjustment)}`,
    `${statementLabels.total}\t${formatStatementNumber(calculations.finalAmount)}`
  ].join('\n');

  const copyStatementText = async () => {
    const didAutoSave = autoSaveBillBeforeCopy();
    await navigator.clipboard.writeText(statementText);
    if (didAutoSave) {
      showCopyAutoSaveToast();
    }
  };

  const setStatementImageCopyFeedback = (nextState) => {
    setStatementImageCopyState(nextState);

    if (statementImageCopyTimeoutRef.current) {
      window.clearTimeout(statementImageCopyTimeoutRef.current);
    }

    if (nextState !== 'idle') {
      statementImageCopyTimeoutRef.current = window.setTimeout(() => {
        setStatementImageCopyState('idle');
        statementImageCopyTimeoutRef.current = null;
      }, 2200);
    }
  };

  const copyStatementImage = async () => {
    if (!statementSheetRef.current) {
      return;
    }

    try {
      const didAutoSave = autoSaveBillBeforeCopy();
      const blob = await toBlob(statementSheetRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor:
          window.getComputedStyle(statementSheetRef.current).backgroundColor ||
          '#ffffff'
      });

      if (!blob) {
        throw new Error('Failed to generate statement image.');
      }

      if (
        typeof window === 'undefined' ||
        typeof ClipboardItem === 'undefined' ||
        !navigator.clipboard?.write
      ) {
        throw new Error('Clipboard image copy is not supported in this browser.');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type || 'image/png']: blob
        })
      ]);

      setStatementImageCopyFeedback('copied');
      if (didAutoSave) {
        showCopyAutoSaveToast();
      }
    } catch (error) {
      console.error('Unable to copy statement image:', error);
      setStatementImageCopyFeedback('failed');
    }
  };

  const updateCalcRule = (field, value, fallbackValue, scope = billRuleMode) => {
    const parsedValue = Number.parseFloat(value);
    const nextValue = Number.isFinite(parsedValue) ? parsedValue : fallbackValue;

    if (scope === 'custom') {
      setBillCalcRules((currentRules) => ({
        ...currentRules,
        [field]: nextValue
      }));
      return;
    }

    setGlobalCalcRules((currentRules) => ({
      ...currentRules,
      [field]: nextValue
    }));
  };

  const themeOptions = [
    { id: 'light', label: siteText.light, Icon: Sun },
    { id: 'dark', label: siteText.dark, Icon: Moon },
    { id: 'system', label: siteText.system, Icon: Monitor }
  ];

  const toggleSettingsSection = (sectionKey) => {
    setExpandedSettingsSections((currentSections) => {
      const nextExpandedValue = !currentSections[sectionKey];

      return Object.keys(currentSections).reduce((nextSections, currentKey) => {
        nextSections[currentKey] =
          currentKey === sectionKey ? nextExpandedValue : false;
        return nextSections;
      }, {});
    });
  };

  const statementImageCopyLabel =
    statementImageCopyState === 'copied'
      ? siteText.statementImageCopied
      : statementImageCopyState === 'failed'
        ? siteText.statementImageCopyFailed
        : siteText.copyStatementAsImage;
  const cloudStatusLabel =
    cloudSyncState === 'online'
      ? cloudText.synced
      : cloudSyncState === 'syncing'
        ? cloudText.syncing
        : cloudSyncState === 'sending'
          ? cloudText.sendingLink
          : cloudSyncState === 'link-sent'
            ? cloudText.linkSent
            : cloudSyncState === 'error'
              ? cloudUser
                ? cloudText.syncIssue
                : cloudText.localOnly
              : cloudText.localOnly;
  const cloudStatusClassName =
    cloudSyncState === 'online'
      ? 'status-saved'
      : cloudSyncState === 'syncing' ||
          cloudSyncState === 'sending' ||
          cloudSyncState === 'link-sent'
        ? 'status-current'
        : 'status-alert';

  return (
    <div className="calculator-page">
      <div className="calculator-shell">
        {isMobileViewport && isSidebarCollapsed && (
          <button
            type="button"
            className="mobile-sidebar-open-button"
            onClick={() => setIsSidebarCollapsed(false)}
            aria-label={siteText.expandSidebar}
          >
            <Menu size={18} />
          </button>
        )}

        {isMobileViewport && !isSidebarCollapsed && (
          <button
            type="button"
            className="mobile-sidebar-backdrop"
            onClick={() => {
              setIsSidebarCollapsed(true);
              setIsThemeMenuOpen(false);
            }}
            aria-label={siteText.collapseSidebar}
          />
        )}

        <div
          className={`workspace-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${
            isMobileViewport && !isSidebarCollapsed ? 'mobile-sidebar-open' : ''
          }`}
        >
          <aside className="sidebar-column">
            <section className="panel sidebar-panel">
              <div className="sidebar-topbar">
                <div className="sidebar-brand">
                  <div className="sidebar-brand-icon">
                    <SidebarDmasLogo className="sidebar-dmas-logo" />
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="sidebar-text-reveal sidebar-brand-label">
                      {siteText.sidebarBrand}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="sidebar-toggle-button"
                  onClick={() => setIsSidebarCollapsed((currentValue) => !currentValue)}
                  aria-label={
                    isSidebarCollapsed ? siteText.expandSidebar : siteText.collapseSidebar
                  }
                >
                  {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={startNewBill}
                className={`sidebar-primary-action ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
                aria-label={siteText.createNewBill}
              >
                <Plus size={16} />
                {!isSidebarCollapsed && (
                  <span className="sidebar-text-reveal sidebar-action-label">
                    {siteText.newBill}
                  </span>
                )}
              </button>

              {!isSidebarCollapsed && (
                <div className="sidebar-panel-header sidebar-block-reveal">
                  <span className="sidebar-kicker">{siteText.savedBillsSection}</span>
                  <h2 className="section-title">{siteText.yourBills}</h2>
                  <p className="sidebar-note">{siteText.savedBillsHelp}</p>
                </div>
              )}

              <nav className="sidebar-sections" aria-label={siteText.savedBills}>
                {!isSidebarCollapsed && (
                  <div className="sidebar-section-heading sidebar-block-reveal">
                    <span>{siteText.savedBills}</span>
                    <span className="saved-bills-count">{savedBills.length}</span>
                  </div>
                )}

                {!storageReady ? (
                  <div
                    className={`empty-state ${isSidebarCollapsed ? 'empty-state-compact' : ''}`}
                    title={siteText.loadingSavedBills}
                    aria-label={siteText.loadingSavedBills}
                  >
                    {isSidebarCollapsed ? <LoaderCircle size={16} /> : siteText.loadingSavedBills}
                  </div>
                ) : savedBills.length === 0 ? (
                  <div
                    className={`empty-state ${isSidebarCollapsed ? 'empty-state-compact' : ''}`}
                    title={siteText.noSavedBills}
                    aria-label={siteText.noSavedBills}
                  >
                    {isSidebarCollapsed ? <FileText size={16} /> : siteText.noSavedBills}
                  </div>
                ) : (
                  <div
                    className={`saved-bills-list ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
                  >
                    {savedBills.map((bill) => (
                      <div
                        key={bill.id}
                        className={`saved-bill-card ${bill.id === activeBillId ? 'is-active' : ''}`}
                      >
                        <button
                          type="button"
                          onClick={() => loadBill(bill.id)}
                          className="saved-bill-link"
                          aria-label={siteText.openBill(bill.name)}
                        >
                          <span className="saved-bill-icon">
                            <FileText size={16} />
                          </span>
                          {!isSidebarCollapsed && (
                            <span className="saved-bill-copy sidebar-text-reveal">
                              <span className="saved-bill-title">{bill.name}</span>
                              <span className="saved-bill-meta">
                                {formatStamp(bill.updatedAt)}
                              </span>
                            </span>
                          )}
                        </button>

                        {!isSidebarCollapsed && (
                          <button
                            type="button"
                            onClick={() => deleteBill(bill.id)}
                            className="saved-bill-delete"
                            aria-label={siteText.deleteBill(bill.name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </nav>

              <div className="sidebar-footer">
                {!isSidebarCollapsed && (
                  <div className="sidebar-cloud-shell sidebar-block-reveal">
                    <button
                      type="button"
                      className="sidebar-cloud-toggle"
                      onClick={() =>
                        setIsCloudPanelExpanded((currentValue) => !currentValue)
                      }
                      aria-expanded={isCloudPanelExpanded}
                      aria-controls="sidebar-cloud-panel"
                    >
                      <span className="sidebar-cloud-toggle-main">
                        <Cloud size={16} />
                        <span>{cloudText.sectionTitle}</span>
                      </span>
                      <span className="sidebar-cloud-toggle-actions">
                        <span className={`status-badge ${cloudStatusClassName}`}>
                          {cloudStatusLabel}
                        </span>
                        <ChevronRight
                          size={16}
                          className={`sidebar-cloud-chevron ${
                            isCloudPanelExpanded ? 'is-open' : ''
                          }`}
                        />
                      </span>
                    </button>

                    {isCloudPanelExpanded && (
                      <section
                        id="sidebar-cloud-panel"
                        className="sidebar-cloud-panel"
                        aria-label={cloudText.sectionTitle}
                      >
                        {!isSupabaseConfigured ? (
                          <p className="sidebar-cloud-note">{cloudText.setupNote}</p>
                        ) : cloudUser ? (
                          <>
                            <p className="sidebar-cloud-note">{cloudText.signedInAs}</p>
                            <div className="cloud-user-chip">{cloudUser.email}</div>
                            <button
                              type="button"
                              className="ghost-button cloud-action-button"
                              onClick={signOutCloudAccount}
                            >
                              <LogOut size={14} />
                              <span>{cloudText.signOut}</span>
                            </button>
                          </>
                        ) : (
                          <div className="sidebar-cloud-form">
                            <p className="sidebar-cloud-note">{cloudText.connectNote}</p>
                            <label className="field-label sidebar-field-label" htmlFor="cloud-email">
                              {cloudText.emailLabel}
                            </label>
                            <input
                              id="cloud-email"
                              type="email"
                              value={cloudEmail}
                              onChange={(event) => setCloudEmail(event.target.value)}
                              placeholder={cloudText.emailPlaceholder}
                              className="text-input sidebar-auth-input"
                            />
                            <button
                              type="button"
                              className="primary-button cloud-action-button"
                              onClick={sendCloudMagicLink}
                              disabled={cloudSyncState === 'sending' || !cloudEmail.trim()}
                            >
                              {cloudSyncState === 'sending' ? (
                                <LoaderCircle size={15} className="cloud-loader" />
                              ) : (
                                <Cloud size={15} />
                              )}
                              <span>
                                {cloudSyncState === 'sending'
                                  ? cloudText.sendingLink
                                  : cloudText.sendMagicLink}
                              </span>
                            </button>
                            {cloudSyncState === 'link-sent' && (
                              <p className="cloud-inline-message is-success">
                                {cloudText.linkSent}
                              </p>
                            )}
                            {cloudSyncState === 'error' && (
                              <p className="cloud-inline-message is-error">
                                {cloudText.localOnlyNote}
                              </p>
                            )}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}

                <div className="theme-menu-shell sidebar-settings-shell" ref={themeMenuRef}>
                  <button
                    type="button"
                    className={`sidebar-settings-button ${isSidebarCollapsed ? 'is-collapsed' : ''}`}
                    onClick={() => setIsThemeMenuOpen((currentValue) => !currentValue)}
                    aria-label={siteText.settings}
                    aria-expanded={isThemeMenuOpen}
                  >
                    <Settings2 size={16} />
                    {!isSidebarCollapsed && (
                      <span className="sidebar-text-reveal sidebar-settings-label">
                        {siteText.settings}
                      </span>
                    )}
                  </button>

                  {isThemeMenuOpen && (
                    <div className="theme-menu theme-menu-sidebar" aria-label={siteText.settings}>
                      <div className="theme-menu-section">
                        <button
                          type="button"
                          className="theme-menu-section-toggle"
                          onClick={() => toggleSettingsSection('siteLanguage')}
                          aria-expanded={expandedSettingsSections.siteLanguage}
                        >
                          <span className="theme-menu-title">{siteText.websiteLanguage}</span>
                          <ChevronRight
                            size={16}
                            className={`theme-menu-section-chevron ${
                              expandedSettingsSections.siteLanguage ? 'is-open' : ''
                            }`}
                          />
                        </button>

                        {expandedSettingsSections.siteLanguage && (
                          <div className="theme-menu-section-content">
                            <div className="rule-scope-toggle">
                              <button
                                type="button"
                                className={`rule-scope-button ${siteLanguage === 'en' ? 'is-active' : ''}`}
                                onClick={() => setSiteLanguage('en')}
                              >
                                {siteText.english}
                              </button>
                              <button
                                type="button"
                                className={`rule-scope-button ${siteLanguage === 'te' ? 'is-active' : ''}`}
                                onClick={() => setSiteLanguage('te')}
                              >
                                {siteText.telugu}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="theme-menu-section">
                        <button
                          type="button"
                          className="theme-menu-section-toggle"
                          onClick={() => toggleSettingsSection('appearance')}
                          aria-expanded={expandedSettingsSections.appearance}
                        >
                          <span className="theme-menu-title">{siteText.appearance}</span>
                          <ChevronRight
                            size={16}
                            className={`theme-menu-section-chevron ${
                              expandedSettingsSections.appearance ? 'is-open' : ''
                            }`}
                          />
                        </button>

                        {expandedSettingsSections.appearance && (
                          <div className="theme-menu-section-content">
                            {themeOptions.map(({ id, label, Icon }) => (
                              <button
                                key={id}
                                type="button"
                                className={`theme-option ${themeMode === id ? 'is-active' : ''}`}
                                onClick={() => {
                                  setThemeMode(id);
                                  setIsThemeMenuOpen(false);
                                }}
                                role="menuitemradio"
                                aria-checked={themeMode === id}
                              >
                                <span className="theme-option-icon">
                                  <Icon size={16} />
                                </span>
                                <span>{label}</span>
                                {id === 'system' && (
                                  <span className="theme-option-note">{resolvedThemeLabel}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="theme-menu-section">
                        <button
                          type="button"
                          className="theme-menu-section-toggle"
                          onClick={() => toggleSettingsSection('calcRules')}
                          aria-expanded={expandedSettingsSections.calcRules}
                        >
                          <span className="theme-menu-title">{siteText.calculationRules}</span>
                          <ChevronRight
                            size={16}
                            className={`theme-menu-section-chevron ${
                              expandedSettingsSections.calcRules ? 'is-open' : ''
                            }`}
                          />
                        </button>

                        {expandedSettingsSections.calcRules && (
                          <div className="theme-menu-section-content">
                            <div className="rule-scope-toggle">
                              <button
                                type="button"
                                className={`rule-scope-button ${billRuleMode === 'global' ? 'is-active' : ''}`}
                                onClick={() => setBillRuleMode('global')}
                              >
                                {siteText.globalDefault}
                              </button>
                              <button
                                type="button"
                                className={`rule-scope-button ${billRuleMode === 'custom' ? 'is-active' : ''}`}
                                onClick={() => {
                                  if (billRuleMode !== 'custom') {
                                    setBillCalcRules(calcRules);
                                  }
                                  setBillRuleMode('custom');
                                }}
                              >
                                {siteText.thisBillOnly}
                              </button>
                            </div>

                            <label className="rule-setting">
                              <span className="rule-setting-label">{siteText.calcRulePrincipal}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={calcRules.principalMultiplier}
                                onChange={(event) =>
                                  updateCalcRule(
                                    'principalMultiplier',
                                    event.target.value,
                                    DEFAULT_CALC_RULES.principalMultiplier
                                  )
                                }
                                className="rule-setting-input"
                              />
                              <span className="rule-setting-label">{siteText.calcRulePrincipalSuffix}</span>
                            </label>

                            <label className="rule-setting">
                              <span className="rule-setting-label">{siteText.calcRuleDaily}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={calcRules.dailyMultiplier}
                                onChange={(event) =>
                                  updateCalcRule(
                                    'dailyMultiplier',
                                    event.target.value,
                                    DEFAULT_CALC_RULES.dailyMultiplier
                                  )
                                }
                                className="rule-setting-input"
                              />
                              <span className="rule-setting-label"></span>
                            </label>

                            <label className="rule-setting">
                              <span className="rule-setting-label">{siteText.calcRuleDays}</span>
                              <input
                                type="number"
                                step="1"
                                value={calcRules.dayOffset}
                                onChange={(event) =>
                                  updateCalcRule(
                                    'dayOffset',
                                    event.target.value,
                                    DEFAULT_CALC_RULES.dayOffset
                                  )
                                }
                                className="rule-setting-input"
                              />
                              <span className="rule-setting-label"></span>
                            </label>

                            <p className="rule-setting-note">{siteText.calcRulesNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </aside>

          <main
            ref={mainColumnRef}
            className={`main-column ${isEditorOpening ? 'is-opening' : ''}`}
          >
            <section className="panel">
              <div className="header-row">
                <div className="header-main">
                  <div className="header-icon">
                    <IndianRupee
                      className="hero-rupee-mark"
                      strokeWidth={2.35}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h1 className="page-title">{siteText.pageTitle}</h1>
                    <p className="page-subtitle">{siteText.pageSubtitle({
                      principalMultiplier: formatNumber(calcRules.principalMultiplier),
                      dailyMultiplier: formatNumber(calcRules.dailyMultiplier),
                      dayOffset: formatNumber(calcRules.dayOffset)
                    })}</p>
                  </div>
                </div>

              </div>
            </section>

            <section className="panel">
              <label className="field-label" htmlFor="bill-name">
                {siteText.billName}
              </label>
              <input
                id="bill-name"
                type="text"
                value={billName}
                onChange={(event) => setBillName(event.target.value)}
                placeholder={siteText.billNamePlaceholder}
                className="text-input"
              />

              <div className="bill-actions">
                <button
                  type="button"
                  onClick={() => saveBill()}
                  className="primary-button rect-action-button"
                >
                  {siteText.saveBill}
                </button>
                <button
                  type="button"
                  onClick={() => saveBill({ asCopy: true })}
                  className="secondary-button rect-action-button"
                >
                  {siteText.saveAsCopy}
                </button>
                <button
                  type="button"
                  onClick={startNewBill}
                  className="ghost-button rect-action-button"
                >
                  {siteText.newBill}
                </button>
              </div>

              <div className="bill-meta-list">
                <div className="bill-meta-item">
                  <span className="bill-meta-label">{siteText.created}</span>
                  <span className="bill-meta-value">
                    {activeSavedBill ? formatStamp(activeSavedBill.createdAt) : siteText.notSavedYet}
                  </span>
                </div>
                <div className="bill-meta-item">
                  <span className="bill-meta-label">{siteText.lastModified}</span>
                  <span className="bill-meta-value">
                    {activeSavedBill ? formatStamp(activeSavedBill.updatedAt) : siteText.notSavedYet}
                  </span>
                </div>
                <div className="bill-meta-item">
                  <span className="bill-meta-label">{siteText.status}</span>
                  <span
                    className={`status-badge bill-meta-status-value ${
                      hasUnsavedChanges ? 'status-draft' : 'status-saved'
                    }`}
                  >
                    {hasUnsavedChanges ? siteText.unsavedChanges : siteText.saved}
                  </span>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="end-date-header">
                <label className="field-label field-label-inline" htmlFor="end-date">
                  {siteText.endDate}
                </label>
                <label className="inline-toggle" htmlFor="row-end-dates-toggle">
                  <input
                    id="row-end-dates-toggle"
                    type="checkbox"
                    checked={useEntryEndDates}
                    onChange={(event) => setUseEntryEndDates(event.target.checked)}
                  />
                  <span className="inline-toggle-track" aria-hidden="true">
                    <span className="inline-toggle-thumb" />
                  </span>
                  <span className="inline-toggle-text">
                    {rowEndDateText.toggleLabel}
                  </span>
                </label>
              </div>

              {useEntryEndDates ? (
                <p className="section-note">
                  {rowEndDateText.note}
                </p>
              ) : (
                <div className="field-input-stack">
                  <input
                    id="end-date"
                    type="text"
                    value={endDate}
                    onChange={(event) => setEndDate(formatDateInputValue(event.target.value))}
                    placeholder={siteText.endDatePlaceholder}
                    className={`text-input date-input ${globalEndDateError ? 'is-invalid' : ''}`}
                  />
                  {globalEndDateError && (
                    <p className="field-inline-message warning-text">{globalEndDateError}</p>
                  )}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="section-header entries-section-header">
                <div className="entries-title-group">
                  <h2 className="section-title">{siteText.entries}</h2>
                  <div className="info-tooltip">
                    <button
                      type="button"
                      className="info-icon-button"
                      aria-label={siteText.entriesInfoLabel}
                      title={entriesInfoText}
                    >
                      <CircleHelp size={16} />
                    </button>
                    <div className="info-tooltip-content" role="tooltip">
                      {entriesInfoText}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addEntry}
                  className="primary-button rect-action-button"
                >
                  <Plus size={18} />
                  <span>{siteText.addEntry}</span>
                </button>
              </div>

              <div className="table-scroll">
                <table className="entry-table">
                  <thead>
                    <tr>
                      <th>{siteText.date}</th>
                      {useEntryEndDates && <th>{rowEndDateText.columnLabel}</th>}
                      <th className="number-heading">{siteText.amountUnits}</th>
                      <th className="number-heading">
                        <span className="entry-table-heading">
                          <span>{siteText.daily}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setIsDailyColumnEditable((currentValue) => !currentValue)
                            }
                            className={`entry-heading-button ${
                              isDailyColumnEditable ? 'is-active' : ''
                            }`}
                            aria-label={`${siteText.editValue} ${siteText.daily}`}
                            title={`${siteText.editValue} ${siteText.daily}`}
                          >
                            <Pencil size={14} />
                          </button>
                        </span>
                      </th>
                      <th className="number-heading">
                        <span className="entry-table-heading">
                          <span>{siteText.days}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setIsDaysColumnEditable((currentValue) => !currentValue)
                            }
                            className={`entry-heading-button ${
                              isDaysColumnEditable ? 'is-active' : ''
                            }`}
                            aria-label={`${siteText.editValue} ${siteText.days}`}
                            title={`${siteText.editValue} ${siteText.days}`}
                          >
                            <Pencil size={14} />
                          </button>
                        </span>
                      </th>
                      <th className="number-heading">{siteText.dailyTimesDays}</th>
                      <th className="number-heading">{siteText.interest}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const calc = entryCalculationsById.get(entry.id) || {};
                      const rowDateError =
                        entry.date.trim() &&
                        !isDateInputValid(
                          entry.date,
                          'start',
                          useEntryEndDates ? entry.endDate : endDate
                        )
                          ? invalidDateLabel
                          : '';
                      const rowEndDateError =
                        useEntryEndDates &&
                        entry.endDate.trim() &&
                        (!isDateInputValid(entry.endDate, 'end', entry.date)
                          ? invalidDateLabel
                          : hasEndDateBeforeStartDate(entry.date, entry.endDate)
                            ? endBeforeStartLabel
                            : '');

                      return (
                        <tr key={entry.id}>
                          <td>
                            <div className="table-input-stack">
                              <input
                                type="text"
                                value={entry.date}
                                onChange={(event) =>
                                  updateEntry(
                                    entry.id,
                                    'date',
                                    formatDateInputValue(event.target.value)
                                  )
                                }
                                placeholder="DD-MM"
                                className={`table-input ${rowDateError ? 'is-invalid' : ''}`}
                              />
                              {rowDateError && (
                                <span className="field-inline-message warning-text">
                                  {rowDateError}
                                </span>
                              )}
                            </div>
                          </td>
                          {useEntryEndDates && (
                            <td>
                              <div className="table-input-stack">
                                <input
                                  type="text"
                                  value={entry.endDate}
                                  onChange={(event) =>
                                    updateEntry(
                                      entry.id,
                                      'endDate',
                                      formatDateInputValue(event.target.value)
                                    )
                                  }
                                  placeholder="DD-MM"
                                  className={`table-input ${rowEndDateError ? 'is-invalid' : ''}`}
                                />
                                {rowEndDateError && (
                                  <span className="field-inline-message warning-text">
                                    {rowEndDateError}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              value={entry.amount}
                              onChange={(event) =>
                                updateEntry(entry.id, 'amount', event.target.value)
                              }
                              placeholder="0"
                              className="table-input table-input-number"
                            />
                          </td>
                          <td>
                            {isDailyColumnEditable ? (
                              <input
                                type="number"
                                step="0.1"
                                value={entry.daily}
                                onChange={(event) =>
                                  updateEntry(entry.id, 'daily', event.target.value)
                                }
                                placeholder={
                                  calc.amount
                                    ? formatNumber(calc.amount * calcRules.dailyMultiplier)
                                    : siteText.auto
                                }
                                className="table-input table-input-number"
                              />
                            ) : (
                              <span className="entry-static-value">
                                {entry.daily !== '' ? entry.daily : siteText.auto}
                              </span>
                            )}
                          </td>
                          <td>
                            {isDaysColumnEditable ? (
                              <input
                                type="number"
                                step="1"
                                value={entry.days}
                                onChange={(event) =>
                                  updateEntry(entry.id, 'days', event.target.value)
                                }
                                placeholder={
                                  entry.date
                                    ? formatNumber(
                                        calculateDays(
                                          entry.date,
                                          useEntryEndDates ? entry.endDate : endDate
                                        )
                                      )
                                    : siteText.auto
                                }
                                className="table-input table-input-number"
                              />
                            ) : (
                              <span className="entry-static-value">
                                {entry.days !== '' ? entry.days : siteText.auto}
                              </span>
                            )}
                          </td>
                          <td className="number-cell">
                            {calc.dailyInterest
                              ? `${formatNumber(calc.dailyInterest)}x${calc.days}`
                              : '-'}
                          </td>
                          <td className="number-cell emphasis-cell">
                            {calc.interest ? formatNumber(calc.interest) : '-'}
                          </td>
                          <td className="action-cell">
                            <button
                              type="button"
                              onClick={() => removeEntry(entry.id)}
                              disabled={entries.length === 1}
                              className="icon-button"
                              aria-label={siteText.removeEntry}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="panel-grid">
              <section className="panel">
                <h2 className="section-title">{siteText.summary}</h2>

                <div className="summary-list">
                  <div className="summary-row">
                    <span>{siteText.totalUnits}</span>
                    <strong>{formatNumber(calculations.totalUnits)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{siteText.principal}</span>
                    <strong>{formatCurrency(calculations.principal)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{siteText.interest}</span>
                    <strong>{formatCurrency(calculations.totalInterest)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>{siteText.subtotal}</span>
                    <strong>{formatCurrency(calculations.subtotal)}</strong>
                  </div>
                  <div className="summary-row summary-input-row">
                    <label htmlFor="rounding-adjustment">{siteText.roundOff}</label>
                    <input
                      id="rounding-adjustment"
                      type="number"
                      min="0"
                      value={roundingAdjustment}
                      onChange={(event) =>
                        setRoundingAdjustment(normalizeRoundingAdjustment(event.target.value))
                      }
                      className="text-input summary-input"
                    />
                  </div>

                  {calculations.suggestedRounding !== 0 && (
                    <div className="suggestion-box">
                      <p>
                        {siteText.suggestedRoundOff}:{' '}
                        <strong>
                          {formatSignedStatementNumber(calculations.suggestedRounding)}
                        </strong>
                      </p>
                      <button
                        type="button"
                        onClick={applySuggestedRounding}
                        className="secondary-button"
                      >
                        {siteText.applySuggestedValue}
                      </button>
                    </div>
                  )}

                  <div className="summary-row total-row">
                    <span>{siteText.total}</span>
                    <strong>{formatCurrency(calculations.finalAmount)}</strong>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="verification-header">
                  {allVerified ? (
                    <CheckCircle size={22} className="status-icon success" />
                  ) : (
                    <AlertCircle size={22} className="status-icon warning" />
                  )}
                  <h2 className="section-title">{siteText.verification}</h2>
                </div>

                <div className="verification-list">
                  {Object.entries({
                    [siteText.unitsTotalMatch]: verification.unitsMatch,
                    [siteText.interestTotalMatch]: verification.interestMatch,
                    [siteText.allRowsValid]: verification.rowsValid,
                    [siteText.principalValid]: verification.principalValid,
                    [siteText.finalAmountValid]: verification.finalValid
                  }).map(([label, isValid]) => (
                    <div key={label} className="verification-item">
                      {isValid ? (
                        <CheckCircle size={18} className="status-icon success" />
                      ) : (
                        <AlertCircle size={18} className="status-icon warning" />
                      )}
                      <span className={isValid ? '' : 'warning-text'}>{label}</span>
                    </div>
                  ))}
                </div>

                {allVerified && (
                  <div className="verification-success">{siteText.allCalculationsVerified}</div>
                )}
              </section>
            </div>

            <section className="panel statement-panel">
              {copyAutoSaveToastVisible && (
                <div className="statement-auto-save-toast" role="status" aria-live="polite">
                  {autoSavedToastLabel}
                </div>
              )}
              <div className="section-header statement-header">
                <div>
                  <h2 className="section-title">{siteText.statementOutput}</h2>
                  <p className="section-note">{siteText.statementPreviewNote}</p>
                </div>
                <div className="statement-header-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setStatementLanguage((currentValue) =>
                        currentValue === 'te' ? 'en' : 'te'
                      )
                    }
                    className="secondary-button statement-language-button"
                    aria-label={siteText.switchStatementLanguageTo(
                      statementLanguage === 'te' ? siteText.english : siteText.telugu
                    )}
                    title={siteText.switchStatementLanguageTo(
                      statementLanguage === 'te' ? siteText.english : siteText.telugu
                    )}
                  >
                    <Languages size={16} />
                    <span>{statementLabels.languageLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyStatementText}
                    className="secondary-button"
                  >
                    {siteText.copyStatementText}
                  </button>
                </div>
              </div>

              <div className="statement-preview">
                <div className="statement-card-shell">
                  <div className="statement-sheet" ref={statementSheetRef}>
                    <h3 className="statement-title">{statementTitle}</h3>
                    {statementTitleDate && (
                      <p className="statement-date-note">
                        {statementLabels.uptoDateLabel}: {statementTitleDate}
                      </p>
                    )}
                    <p className="statement-slip-note">
                      {statementLabels.totalSlipsLabel}: {statementSlipCount}
                    </p>

                    <table className="statement-table">
                      <tbody>
                        {statementRows.map((row) => (
                          <tr key={row.id}>
                            <td className="statement-cell-left">{row.serial}</td>
                            <td className="statement-cell-left">{row.date}</td>
                            {statementHasEndDateColumn && (
                              <td className="statement-cell-left">{row.resolvedEndDate}</td>
                            )}
                            <td className="statement-cell-right">
                              {formatStatementNumber(row.amount)}
                            </td>
                            <td className="statement-cell-right">
                              {formatStatementNumber(row.dailyInterest)}x{row.days}
                            </td>
                            <td className="statement-cell-right">
                              {formatStatementNumber(row.interest)}
                            </td>
                          </tr>
                        ))}
                        <tr className="statement-total-row">
                          <td
                            className="statement-total-label statement-cell-left"
                            colSpan={statementHasEndDateColumn ? 3 : 2}
                          >
                            {statementLabels.total}
                          </td>
                          <td className="statement-cell-right">
                            {formatStatementNumber(calculations.totalUnits)}
                          </td>
                          <td className="statement-cell-right"></td>
                          <td className="statement-cell-right">
                            {formatStatementNumber(calculations.totalInterest)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="statement-summary-table">
                      <tbody>
                        <tr>
                          <td>{statementLabels.principal}</td>
                          <td>{formatStatementNumber(calculations.principal)}</td>
                        </tr>
                        <tr>
                          <td>{statementLabels.interest}</td>
                          <td>{formatSignedStatementNumber(calculations.totalInterest)}</td>
                        </tr>
                        <tr>
                          <td>{statementLabels.subtotal}</td>
                          <td>{formatStatementNumber(calculations.subtotal)}</td>
                        </tr>
                        <tr>
                          <td>{statementLabels.roundOff}</td>
                          <td>{formatSignedStatementNumber(roundingAdjustment)}</td>
                        </tr>
                        <tr className="statement-grand-total">
                          <td>{statementLabels.total}</td>
                          <td>{formatStatementNumber(calculations.finalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={copyStatementImage}
                    className={`statement-image-copy-button ${
                      statementImageCopyState === 'copied'
                        ? 'is-copied'
                        : statementImageCopyState === 'failed'
                          ? 'is-failed'
                          : ''
                    }`}
                    aria-label={statementImageCopyLabel}
                    title={statementImageCopyLabel}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
