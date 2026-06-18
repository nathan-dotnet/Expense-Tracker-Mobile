export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
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
