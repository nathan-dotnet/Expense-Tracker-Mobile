export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "PHP", symbol: "\u20b1", name: "Philippine Peso" },
  { code: "EUR", symbol: "\u20ac", name: "Euro" },
  { code: "GBP", symbol: "\u00a3", name: "British Pound" },
  { code: "JPY", symbol: "\u00a5", name: "Japanese Yen" },
  { code: "INR", symbol: "\u20b9", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
];

export const getCurrencySymbol = (code = "USD") => {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
};

export const formatCurrency = (amount, currencyCode = "USD") => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
};
