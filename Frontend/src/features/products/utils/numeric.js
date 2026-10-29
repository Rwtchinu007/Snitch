// Numeric fields keep their value as a string while typing (type="text" + inputMode)
// so "0" then "5" becomes "5", not "05", and the field may be briefly empty.

// Whole numbers: digits only, no leading zeros ("05" → "5", "0" stays "0")
export const cleanInt = (value) => String(value ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");

// Prices: digits and one decimal point, up to 2 decimals ("007.5" → "7.5", "0.5" stays)
export const cleanDecimal = (value) => {
  const [whole, ...rest] = String(value ?? "").replace(/[^\d.]/g, "").split(".");
  const w = whole.replace(/^0+(?=\d)/, "");
  return rest.length ? `${w}.${rest.join("").slice(0, 2)}` : w;
};

// Integer ≥ 0 for the API; empty or invalid becomes 0
export const toStock = (value) => Math.max(0, parseInt(value, 10) || 0);

// Typing replaces the current value instead of appending to "0"
export const selectOnFocus = (e) => e.target.select();
