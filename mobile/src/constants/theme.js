export const COLORS = {
  primary: '#6C63FF',
  primaryDark: '#564FD8',
  secondary: '#00C9A7',
  background: '#F7F8FC',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
};

export const CATEGORY_COLORS = {
  'Food & Dining':   '#FF6B6B',
  'Transportation':  '#4ECDC4',
  'Shopping':        '#FFD93D',
  'Entertainment':   '#A78BFA',
  'Healthcare':      '#FF8FA3',
  'Housing':         '#6C63FF',
  'Utilities':       '#54A0FF',
  'Education':       '#5CDB95',
  'Travel':          '#FF9F43',
  'Personal Care':   '#EE82EE',
  'Subscriptions':   '#00C9A7',
  'Other':           '#9CA3AF',
};

export const CATEGORY_ICONS = {
  'Food & Dining':   'restaurant',
  'Transportation':  'car',
  'Shopping':        'bag',
  'Entertainment':   'film',
  'Healthcare':      'medkit',
  'Housing':         'home',
  'Utilities':       'flash',
  'Education':       'school',
  'Travel':          'airplane',
  'Personal Care':   'heart',
  'Subscriptions':   'repeat',
  'Other':           'ellipsis-horizontal',
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);

export const PAYMENT_METHODS = [
  { label: 'Cash',           value: 'cash' },
  { label: 'Credit Card',    value: 'credit_card' },
  { label: 'Debit Card',     value: 'debit_card' },
  { label: 'Bank Transfer',  value: 'bank_transfer' },
  { label: 'Digital Wallet', value: 'digital_wallet' },
  { label: 'Other',          value: 'other' },
];
