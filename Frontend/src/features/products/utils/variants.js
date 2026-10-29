// Helpers for reading the seller's variants on buyer pages. Variant attributes come
// from the API as plain objects, e.g. { Color: "Brown", Size: "M" }.

export const attributesOf = (variant) => {
  const a = variant?.attributes;
  return a && typeof a === "object" && !Array.isArray(a) ? a : {};
};

export const isColorKey = (key) => /^colou?r$/i.test(String(key).trim());

// Unique values per attribute key, in the order they first appear: { Color: ["Brown", "Black"], Size: ["M", "L"] }
export const optionGroups = (variants = []) => {
  const groups = new Map();
  variants.forEach((v) => {
    Object.entries(attributesOf(v)).forEach(([k, val]) => {
      if (!groups.has(k)) groups.set(k, []);
      if (!groups.get(k).includes(val)) groups.get(k).push(val);
    });
  });
  return [...groups.entries()].map(([key, values]) => ({ key, values }));
};

const NAMED = {
  charcoal: "#36454F", "charcoal grey": "#36454F", "charcoal gray": "#36454F", olive: "#708238", beige: "#D9C7A7",
  cream: "#F3EAD3", "off white": "#F5F2EA", "off-white": "#F5F2EA", camel: "#C19A6B", rust: "#B7410E",
  mustard: "#D4A72C", "sky blue": "#87CEEB", "navy blue": "#000080", wine: "#722F37", maroon: "#800000",
  sand: "#C2B280", stone: "#A8A196", khaki: "#C3B091", mint: "#98FF98", lilac: "#C8A2C8",
};

// A CSS colour for a colour name, or null when it can't be resolved (show a text pill instead)
export const swatchColor = (name) => {
  const n = String(name).trim().toLowerCase();
  if (NAMED[n]) return NAMED[n];
  const compact = n.replace(/\s+/g, "");
  if (typeof CSS !== "undefined" && CSS.supports?.("color", compact)) return compact;
  return null;
};

// Listing summary: colour values for swatches, plus how many options exist overall
export const listingOptions = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const groups = optionGroups(variants);
  const colors = groups.find((g) => isColorKey(g.key))?.values || [];
  return { colors, count: variants.length };
};

export const hasPriceRange = (product) => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const prices = new Set([product?.price?.amount, ...variants.map((v) => v.price?.amount)].filter((n) => n > 0));
  return variants.length > 0 && prices.size > 1;
};
