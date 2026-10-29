import { useEffect, useMemo, useRef, useState } from "react";
import { useProduct } from "../hook/useProduct.js";
import { Icon } from "../pages/Dashboard";
import { getErrorMessage } from "../../../App/api.client";
import { cleanInt, cleanDecimal, toStock, selectOnFocus } from "../utils/numeric";

const MAX_IMAGES = 7;
const MAX_ATTRIBUTES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOW_STOCK = 5;
const KEY_SUGGESTIONS = ["Size", "Color", "Fit", "Material"];

const formatPrice = (amount, currency = "INR") =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount) || 0);

let rowSeq = 0;
const newRow = (key = "", value = "") => ({ id: ++rowSeq, key, value });

// Variant attributes arrive as a plain object; tolerate a missing value or legacy array shapes
const attributesOf = (variant) => {
  const a = variant?.attributes;
  if (!a) return {};
  if (Array.isArray(a)) return Object.fromEntries(a.filter((x) => x?.key).map((x) => [x.key, x.value]));
  return typeof a === "object" ? a : {};
};

const rowsToObject = (rows) => {
  const seen = new Set();
  return Object.fromEntries(rows.filter((r) => {
    const k = r.key.trim().toLowerCase();
    if (!k || !r.value.trim() || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map((r) => [r.key.trim(), r.value.trim()]));
};

// Per-row errors: empty halves and case-insensitive duplicate keys
const validateRows = (rows) => {
  const errors = {};
  const seen = new Map();
  rows.forEach((r) => {
    const k = r.key.trim().toLowerCase();
    if (!r.key.trim() && !r.value.trim()) errors[r.id] = "Fill in or remove this row";
    else if (!r.key.trim()) errors[r.id] = "Key is required";
    else if (!r.value.trim()) errors[r.id] = "Value is required";
    else if (seen.has(k)) errors[r.id] = `Duplicate key "${r.key.trim()}"`;
    if (k && !seen.has(k)) seen.set(k, r.id);
  });
  return errors;
};

const I = {
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-9 8" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  check: <path d="m5 12 5 5 9-10" />,
};

const btnPrimary = "btn-press inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed";
const btnSecondary = "btn-press inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-white border border-black/15 text-[#131610] text-[12px] font-semibold uppercase tracking-widest hover:border-black/30 disabled:opacity-40";
const iconBtn = "btn-press w-11 h-11 grid place-items-center rounded-lg border border-transparent text-[#131610]/55 hover:text-[#131610] hover:border-black/10 disabled:opacity-40";
const inputBase = "w-full h-12 px-4 rounded-lg border bg-white text-base sm:text-sm text-[#131610] placeholder:text-[#131610]/35 outline-none transition-[border-color,box-shadow] duration-200 ease-out";
const inputState = (err) => err
  ? "border-[#B4534B]/60 focus:border-[#B4534B] focus:ring-4 focus:ring-[#B4534B]/10"
  : "border-black/10 hover:border-black/20 focus:border-[#104292] focus:ring-4 focus:ring-[#104292]/10";
const labelCls = "text-[11px] font-semibold uppercase tracking-widest text-[#131610]/70";

const Spinner = () => <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />;

const Chip = ({ k, v }) => (
  <span title={`${k}: ${v}`} className="chip-in inline-flex items-center max-w-full h-7 px-2.5 rounded-full border border-black/10 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#131610]/75 whitespace-nowrap">
    <span className="shrink-0">{k}</span><span className="mx-1.5 text-[#131610]/30 shrink-0">·</span><span className="text-[#131610] truncate">{v}</span>
  </span>
);

const StockStatus = ({ stock }) => {
  const pill = "inline-flex items-center whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider";
  if (stock <= 0) return <span className={`${pill} bg-black/5 text-[#131610]/45`}>Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className={`${pill} bg-[#C288A2]/15 text-[#9A5C78]`}>Low stock</span>;
  return <span className={`${pill} border border-black/15 text-[#131610]/70`}>In stock</span>;
};

/* ─── Variant card ───────────────────────────────────────────────────── */
const VariantCard = ({ variant, product, index, isNew, busy, onEdit, onDelete, onStock }) => {
  const attrs = Object.entries(attributesOf(variant));
  const images = Array.isArray(variant.images) ? variant.images.filter((i) => i?.url) : [];
  const currency = variant.price?.currency || product.price?.currency || "INR";
  const amount = variant.price?.amount ?? product.price?.amount;
  const isBase = Number(amount) === Number(product.price?.amount);
  const stock = Number(variant.stock) || 0;

  // Kept as a string so typing over "0" gives "5", not "05"; the field may be empty mid-edit
  const [draft, setDraft] = useState(String(stock));
  const [bump, setBump] = useState(false);
  const timer = useRef();
  const [prevStock, setPrevStock] = useState(stock);
  if (prevStock !== stock) { setPrevStock(stock); setDraft(String(stock)); }
  useEffect(() => () => clearTimeout(timer.current), []);
  const draftNum = toStock(draft);

  // Stepper and inline edits commit after a short pause so rapid clicks become one request
  const change = (next) => {
    const text = cleanInt(next);
    setDraft(text);
    setBump((b) => !b);
    clearTimeout(timer.current);
    if (text === "") return; // wait for a value or blur
    const n = toStock(text);
    timer.current = setTimeout(() => { if (n !== stock) onStock(variant, n, () => setDraft(String(stock))); }, 600);
  };

  return (
    <article style={{ animationDelay: isNew ? "0ms" : `${index * 40}ms` }}
      className={`${isNew ? "animate-scale-in" : "animate-rise"} variant-row overflow-hidden flex flex-wrap items-center gap-x-4 gap-y-3 px-3 sm:px-4 py-3 ${busy ? "opacity-70" : ""}`}>
      <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-[#D4CFC8]/40 grid place-items-center">
        {images[0] ? <img src={images[0].url} alt="" loading="lazy" className="w-full h-full object-cover" /> : <Icon d={I.image} className="w-5 h-5 text-[#131610]/30" />}
        {images.length > 1 && <span className="absolute bottom-0.5 right-0.5 h-4 px-1 rounded-full bg-white/90 text-[9px] font-semibold tabular-nums grid place-items-center">+{images.length - 1}</span>}
      </div>
      <div className="flex-1 min-w-[140px]">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {attrs.length ? attrs.map(([k, v]) => <Chip key={k} k={k} v={v} />) : <span className="text-xs text-[#131610]/40">No attributes</span>}
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="font-manrope font-bold text-sm tabular-nums">{formatPrice(amount, currency)}</span>
          {isBase && <span className="text-[10px] font-semibold uppercase tracking-widest text-[#131610]/40">Base price</span>}
          <StockStatus stock={draftNum} />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <div className="flex items-center rounded-lg border border-black/10">
          <button type="button" onClick={() => change(String(Math.max(0, draftNum - 1)))} disabled={busy || draftNum <= 0} aria-label="Decrease stock" className="btn-press w-11 h-11 grid place-items-center text-[#131610]/60 hover:text-[#131610] disabled:opacity-30"><Icon d={I.minus} className="w-4 h-4" /></button>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={draft} disabled={busy} aria-label="Stock"
            onChange={(e) => change(e.target.value)} onFocus={selectOnFocus} onBlur={() => draft === "" && change("0")}
            className={`${bump ? "num-bump-a" : "num-bump-b"} w-12 h-11 text-center text-base sm:text-sm font-semibold tabular-nums outline-none bg-transparent focus:ring-2 focus:ring-[#104292]/30 rounded`} />
          <button type="button" onClick={() => change(String(draftNum + 1))} disabled={busy} aria-label="Increase stock" className="btn-press w-11 h-11 grid place-items-center text-[#131610]/60 hover:text-[#131610] disabled:opacity-30"><Icon d={I.plus} className="w-4 h-4" /></button>
        </div>
        <button type="button" onClick={() => onEdit(variant)} disabled={busy} aria-label="Edit variant" className={iconBtn}><Icon d={I.edit} className="w-[18px] h-[18px]" /></button>
        <button type="button" onClick={() => onDelete(variant)} disabled={busy} aria-label="Delete variant" className={`${iconBtn} hover:!text-[#B4534B]`}><Icon d={I.trash} className="w-[18px] h-[18px]" /></button>
      </div>
    </article>
  );
};

const SkeletonCard = () => (
  <div className="flex items-center gap-4 px-4 py-3">
    <div className="skeleton w-14 h-14 rounded-md" />
    <div className="flex-1 space-y-2"><div className="skeleton h-5 w-1/2 rounded-full" /><div className="skeleton h-4 w-1/4 rounded" /></div>
    <div className="skeleton h-11 w-32 rounded-lg" />
  </div>
);

// Rows grouped under their colour value (variants without a colour go under "Other")
const groupByColor = (variants) => {
  const groups = new Map();
  variants.forEach((v) => {
    const entry = Object.entries(attributesOf(v)).find(([k]) => /^colou?r$/i.test(k.trim()));
    const key = entry ? entry[1] : "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  });
  return [...groups.entries()];
};

/* ─── Create / edit form ─────────────────────────────────────────────── */
const VariantForm = ({ product, variant, onSaved, onClose, toast, onDirty }) => {
  const { handleCreateVariant, handleUpdateVariant } = useProduct();
  const isEdit = Boolean(variant);
  const productId = product._id;

  const initialRows = useMemo(() => {
    const entries = Object.entries(attributesOf(variant));
    return entries.length ? entries.map(([k, v]) => newRow(k, v)) : [newRow()];
  }, [variant]);
  const isBasePrice = !variant || Number(variant.price?.amount) === Number(product.price?.amount);

  const [rows, setRows] = useState(initialRows);
  const [leaving, setLeaving] = useState(null);
  const [images, setImages] = useState(() =>
    (variant?.images || []).filter((i) => i?.url).map((i) => ({ id: i._id, url: i.url, existing: true })));
  const [stock, setStock] = useState(String(variant?.stock ?? 0));
  const [price, setPrice] = useState(variant && !isBasePrice ? String(variant.price?.amount ?? "") : "");
  const [touched, setTouched] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(null);
  const fileRef = useRef();

  useEffect(() => () => images.forEach((i) => i.file && URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const rowErrors = validateRows(rows);
  const attrObject = rowsToObject(rows);
  const validAttrCount = Object.keys(attrObject).length;
  const stockNum = toStock(stock); // an empty field counts as 0
  const stockError = "";
  const priceError = price !== "" && !(Number(price) > 0) ? "Price must be greater than zero" : "";
  const canSave = validAttrCount > 0 && !Object.keys(rowErrors).length && !stockError && !priceError && !submitting;

  const dirty = useMemo(() => {
    const sameRows = JSON.stringify(rowsToObject(rows)) === JSON.stringify(rowsToObject(initialRows)) && rows.length === initialRows.length;
    const sameImages = images.length === (variant?.images?.length || 0) && images.every((i) => i.existing);
    return !(sameRows && sameImages && String(variant?.stock ?? 0) === stock && (variant && !isBasePrice ? String(variant.price?.amount) : "") === price);
  }, [rows, images, stock, price, initialRows, variant, isBasePrice]);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);

  const setRow = (id, field, value) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRow = (key = "") => rows.length < MAX_ATTRIBUTES && setRows((rs) => [...rs, newRow(key)]);
  const removeRow = (id) => {
    setLeaving(id);
    setTimeout(() => {
      setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : [newRow()]));
      setLeaving(null);
    }, 180);
  };
  const usedKeys = new Set(rows.map((r) => r.key.trim().toLowerCase()));
  const addSuggestion = (key) => {
    const blank = rows.find((r) => !r.key.trim() && !r.value.trim());
    if (blank) setRow(blank.id, "key", key);
    else addRow(key);
  };

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    setImageError("");
    const room = MAX_IMAGES - images.length;
    if (files.length > room) setImageError(`Up to ${MAX_IMAGES} images — ${room <= 0 ? "remove one to add more" : `only ${room} more allowed`}`);
    const ok = [];
    for (const f of files.slice(0, Math.max(room, 0))) {
      if (!ALLOWED_TYPES.includes(f.type)) { setImageError("Only JPG, PNG or WEBP images are allowed"); continue; }
      if (f.size > MAX_FILE_SIZE) { setImageError(`"${f.name}" is over 5MB`); continue; }
      ok.push({ id: `new-${++rowSeq}`, url: URL.createObjectURL(f), file: f });
    }
    if (ok.length) setImages((im) => [...im, ...ok]);
  };
  const removeImage = (id) => setImages((im) => {
    const target = im.find((i) => i.id === id);
    if (target?.file) URL.revokeObjectURL(target.url);
    return im.filter((i) => i.id !== id);
  });

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSave) return;
    const fd = new FormData();
    fd.append("attributes", JSON.stringify(attrObject));
    fd.append("stock", String(stockNum));
    fd.append("priceAmount", price);
    images.filter((i) => i.file).forEach((i) => fd.append("images", i.file));
    if (isEdit) fd.append("imageOrder", JSON.stringify(images.map((i) => (i.existing ? i.id : "new"))));

    setSubmitting(true);
    const hasUploads = images.some((i) => i.file);
    const onProgress = hasUploads ? (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100)) : undefined;
    try {
      const saved = isEdit
        ? await handleUpdateVariant(productId, variant._id, fd, onProgress)
        : await handleCreateVariant(productId, fd, onProgress);
      onSaved(saved, isEdit);
    } catch (err) {
      toast(getErrorMessage(err, "Couldn't save this variant. Please try again."), "error");
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  const showRowErr = (r) => (touched || (r.key && r.value) || leaving) && rowErrors[r.id];

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-manrope font-bold text-lg tracking-tight">{isEdit ? "Edit Variant" : "Create Variant"}</h3>
      </div>

      <fieldset disabled={submitting} className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
        {/* Attributes */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <span className={labelCls}>Attributes <span className="text-[#C288A2]">*</span></span>
            <span className="text-[11px] tabular-nums text-[#131610]/40">{rows.length} / {MAX_ATTRIBUTES}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {KEY_SUGGESTIONS.map((k) => (
              <button key={k} type="button" onClick={() => addSuggestion(k)} disabled={usedKeys.has(k.toLowerCase()) || (rows.length >= MAX_ATTRIBUTES && !rows.some((r) => !r.key && !r.value))}
                className="btn-press h-9 px-3 rounded-full border border-dashed border-black/15 text-[11px] font-semibold uppercase tracking-widest text-[#131610]/60 hover:border-[#C288A2] hover:text-[#131610] disabled:opacity-30 disabled:cursor-not-allowed">
                + {k}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {rows.map((r, i) => (
              <div key={r.id} className={leaving === r.id ? "row-out" : "row-in"}>
                <div className="flex gap-2 items-start">
                  <input value={r.key} onChange={(e) => setRow(r.id, "key", e.target.value)} placeholder={i === 0 ? "Key, e.g. Size" : "Key"} aria-label="Attribute key" maxLength={30}
                    className={`${inputBase} ${inputState(showRowErr(r) && (!r.key.trim() || rowErrors[r.id]?.startsWith("Duplicate")))} flex-1 min-w-0`} />
                  <input value={r.value} onChange={(e) => setRow(r.id, "value", e.target.value)} placeholder={i === 0 ? "Value, e.g. M" : "Value"} aria-label="Attribute value" maxLength={40}
                    className={`${inputBase} ${inputState(showRowErr(r) && !r.value.trim())} flex-1 min-w-0`} />
                  <button type="button" onClick={() => removeRow(r.id)} aria-label="Remove attribute" className={`${iconBtn} shrink-0`}><Icon d={I.close} className="w-4 h-4" /></button>
                </div>
                {showRowErr(r) && <p role="alert" className="mt-1.5 text-xs text-[#B4534B]">{rowErrors[r.id]}</p>}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => addRow()} disabled={rows.length >= MAX_ATTRIBUTES}
            className="btn-press mt-3 h-11 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#131610]/70 hover:text-[#104292] disabled:opacity-30 disabled:cursor-not-allowed">
            <Icon d={I.plus} className="w-4 h-4" /> Add attribute
          </button>

          {/* Live preview */}
          <div className="mt-4 rounded-lg bg-[#FAFAFA] border border-black/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#131610]/40 mb-2">Preview</p>
            {validAttrCount
              ? <div className="flex flex-wrap gap-1.5">{Object.entries(attrObject).map(([k, v]) => <Chip key={k} k={k} v={v} />)}</div>
              : <p className="text-xs text-[#131610]/40">Add a key and value to see the variant.</p>}
            <code className="block mt-2 text-[11px] text-[#131610]/50 break-all font-mono">{JSON.stringify(attrObject)}</code>
          </div>
        </div>

        {/* Images, stock, price */}
        <div className="min-w-0 flex flex-col gap-6">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className={labelCls}>Images <span className="normal-case tracking-normal font-normal text-[#131610]/40">(optional)</span></span>
              <span className="text-[11px] tabular-nums text-[#131610]/40">{images.length} / {MAX_IMAGES}</span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => images.length < MAX_IMAGES && fileRef.current?.click()}
              className={`rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors duration-200 ${dragOver ? "border-[#C288A2] bg-[#C288A2]/8" : "border-[#D4CFC8] hover:border-[#131610]/30"} ${images.length >= MAX_IMAGES ? "opacity-50 cursor-not-allowed" : ""}`}>
              <Icon d={I.upload} className="w-6 h-6 mx-auto text-[#131610]/40" />
              <p className="mt-2 text-sm text-[#131610]/70">Drag and drop or <span className="text-[#104292] font-medium underline underline-offset-2">browse</span></p>
              <p className="mt-1 text-xs text-[#131610]/40">JPG, PNG or WEBP · up to 5MB each</p>
              <input ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} className="hidden"
                onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {imageError && <p role="alert" className="mt-2 text-xs text-[#B4534B]">{imageError}</p>}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="animate-pop-in relative aspect-[4/5] rounded-lg overflow-hidden bg-[#D4CFC8]/40">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(img.id)} aria-label="Remove image"
                      className="btn-press absolute top-1 right-1 w-7 h-7 rounded-full bg-white/90 grid place-items-center shadow-sm after:absolute after:-inset-2"><Icon d={I.close} className="w-3.5 h-3.5" /></button>
                    {img.file && progress !== null && (
                      <div className="absolute inset-x-1.5 bottom-1.5 h-1 rounded-full bg-white/60 overflow-hidden">
                        <div className="h-full bg-[#131610] transition-[width] duration-200" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="v-stock" className={`${labelCls} block mb-2`}>Initial stock</label>
              <input id="v-stock" type="text" inputMode="numeric" pattern="[0-9]*" value={stock} onChange={(e) => setStock(cleanInt(e.target.value))}
                onFocus={selectOnFocus} onBlur={() => stock === "" && setStock("0")}
                className={`${inputBase} ${inputState(stockError)} no-spin tabular-nums`} />
              {stockError && <p role="alert" className="mt-1.5 text-xs text-[#B4534B]">{stockError}</p>}
            </div>
            <div>
              <label htmlFor="v-price" className={`${labelCls} block mb-2`}>Price <span className="normal-case tracking-normal font-normal text-[#131610]/40">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#131610]/50 pointer-events-none">₹</span>
                <input id="v-price" type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(cleanDecimal(e.target.value))} onFocus={selectOnFocus}
                  placeholder={`Defaults to base price ${formatPrice(product.price?.amount, product.price?.currency)}`}
                  className={`${inputBase} ${inputState(priceError)} no-spin pl-8 tabular-nums`} />
              </div>
              {priceError
                ? <p role="alert" className="mt-1.5 text-xs text-[#B4534B]">{priceError}</p>
                : <p className="mt-1.5 text-xs text-[#131610]/45">Leave empty to use the product's base price.</p>}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Actions — sticky on mobile */}
      <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-7 md:mx-0 mt-8 px-5 sm:px-7 md:px-0 py-4 md:py-0 bg-white/95 backdrop-blur border-t border-black/10 md:border-0 md:static flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" onClick={onClose} disabled={submitting} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={!canSave} className={btnPrimary}>
          {submitting ? <><Spinner /> Saving…</> : "Save variant"}
        </button>
      </div>
    </form>
  );
};

/* ─── Section ────────────────────────────────────────────────────────── */
const VariantsInventory = ({ product, loading, onVariantsChange, onDirtyChange, firstVariant }) => {
  const { handleUpdateVariant, handleDeleteVariant } = useProduct();
  const variants = useMemo(() => (Array.isArray(product?.variants) ? product.variants : []), [product]);

  // Opens straight away when arriving from Create Product
  const [form, setForm] = useState(() => (firstVariant ? { variant: null, key: ++rowSeq } : null)); // null | { variant, key }
  const [expanded, setExpanded] = useState(Boolean(firstVariant));
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [newId, setNewId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const formRef = useRef();

  const toast = (message, type = "success") => {
    const id = ++rowSeq;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };
  const setBusy = (id, on) => setBusyIds((s) => { const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });

  useEffect(() => { onDirtyChange?.(Boolean(form) && dirty); }, [form, dirty, onDirtyChange]);

  useEffect(() => {
    if (!form || !dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form, dirty]);

  // Lock page scroll behind the delete modal
  useEffect(() => {
    if (!confirmDelete) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [confirmDelete]);

  const openForm = (variant = null) => {
    if (form && dirty && !window.confirm("Discard your unsaved changes?")) return;
    setDirty(false);
    if (!form) setExpanded(false);
    setForm({ variant, key: ++rowSeq });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const closeForm = () => {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setDirty(false);
    setExpanded(false);
    setForm(null);
  };

  const onSaved = (saved, isEdit) => {
    onVariantsChange(isEdit ? variants.map((v) => (v._id === saved._id ? saved : v)) : [...variants, saved]);
    if (!isEdit) setNewId(saved._id);
    setDirty(false);
    setExpanded(false);
    setForm(null);
    toast(isEdit ? "Variant updated" : "Variant created");
  };

  const onStock = async (variant, stock, revert) => {
    const fd = new FormData();
    fd.append("attributes", JSON.stringify(attributesOf(variant)));
    fd.append("stock", String(stock));
    fd.append("priceAmount", String(variant.price?.amount ?? ""));
    setBusy(variant._id, true);
    try {
      const saved = await handleUpdateVariant(product._id, variant._id, fd);
      onVariantsChange(variants.map((v) => (v._id === saved._id ? saved : v)));
      toast("Stock updated");
    } catch (err) {
      revert();
      toast(getErrorMessage(err, "Couldn't update stock."), "error");
    } finally {
      setBusy(variant._id, false);
    }
  };

  const doDelete = async () => {
    const variant = confirmDelete;
    setBusy(variant._id, true);
    try {
      await handleDeleteVariant(product._id, variant._id);
      onVariantsChange(variants.filter((v) => v._id !== variant._id));
      if (form?.variant?._id === variant._id) { setDirty(false); setForm(null); }
      setConfirmDelete(null);
      toast("Variant deleted");
    } catch (err) {
      toast(getErrorMessage(err, "Couldn't delete this variant."), "error");
    } finally {
      setBusy(variant._id, false);
    }
  };

  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const formEl = form && (
    <VariantForm key={form.key} product={product} variant={form.variant} onSaved={onSaved} onClose={closeForm} toast={toast} onDirty={setDirty} />
  );

  return (
    <section className="mt-12 lg:mt-16" aria-labelledby="variants-title">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> Inventory
          </p>
          <h2 id="variants-title" className="mt-2 font-cormorant font-light text-4xl sm:text-5xl leading-none tracking-tight">Variants &amp; Inventory</h2>
          <p className="mt-2 text-sm text-[#131610]/55 tabular-nums">
            {loading ? "Loading…" : variants.length
              ? `${variants.length} ${variants.length === 1 ? "variant" : "variants"} · ${totalStock.toLocaleString("en-IN")} in stock`
              : "Sizes, colours and stock for each version of this piece."}
          </p>
        </div>
        <button type="button" onClick={() => openForm()} disabled={loading || (form && !form.variant)} className={`${btnPrimary} w-full sm:w-auto`}>
          <Icon d={I.plus} className="w-4 h-4" /> Add variant
        </button>
      </div>

      {firstVariant && !variants.length && (
        <p className="mt-6 inline-flex items-center gap-2 h-9 px-3 rounded-full bg-[#C288A2]/12 text-[12px] font-medium text-[#131610]/75">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C288A2]" /> Product published — add your first variant to set sizes and stock.
        </p>
      )}

      {/* Inline form — overflow is clipped only while animating so the mobile save bar can stick */}
      <div ref={formRef} onTransitionEnd={(e) => e.target === e.currentTarget && form && setExpanded(true)}
        className={`grid scroll-mt-20 transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${form ? "grid-rows-[1fr] opacity-100 mt-8" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
        <div className={expanded && form ? "" : "overflow-hidden"}>
          {formEl && (
            <div className="bg-white rounded-xl border border-black/10 shadow-[0_8px_30px_rgba(19,22,16,0.06)] p-5 sm:p-7">{formEl}</div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-8">
        {loading ? (
          <div className="bg-white rounded-xl border border-black/10 divide-y divide-black/5">{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</div>
        ) : variants.length ? (
          <div className="flex flex-col gap-4">
            {groupByColor(variants).map(([color, list]) => (
              <div key={color} className="bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] overflow-hidden">
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#131610]/45">{color}</p>
                <div className="divide-y divide-black/5">
                  {list.map((v) => (
                    <VariantCard key={v._id} variant={v} product={product} index={variants.indexOf(v)} isNew={v._id === newId} busy={busyIds.has(v._id)}
                      onEdit={openForm} onDelete={setConfirmDelete} onStock={onStock} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !form && (
          <div className="animate-rise bg-white rounded-xl border border-black/10 py-16 px-6 text-center">
            <Icon d={I.layers} className="w-10 h-10 mx-auto text-[#131610]/25" />
            <h3 className="mt-4 font-manrope font-bold text-lg tracking-tight">No variants yet</h3>
            <p className="mt-1.5 text-sm text-[#131610]/55 max-w-sm mx-auto">Use Add variant above to list sizes, colours or fits so shoppers can pick exactly what they want.</p>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div onClick={() => !busyIds.has(confirmDelete._id) && setConfirmDelete(null)} className="absolute inset-0 bg-[#131610]/40 animate-fade" />
          <div role="alertdialog" aria-modal="true" aria-labelledby="del-title" className="animate-scale-in relative w-full max-w-sm bg-white rounded-xl border border-black/10 shadow-xl p-6">
            <h3 id="del-title" className="font-manrope font-bold text-lg tracking-tight">Delete this variant?</h3>
            <p className="mt-2 text-sm text-[#131610]/55">
              {Object.entries(attributesOf(confirmDelete)).map(([k, v]) => `${k}: ${v}`).join(", ") || "This variant"} will be removed from the product. This can't be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={busyIds.has(confirmDelete._id)} className={btnSecondary}>Cancel</button>
              <button type="button" onClick={doDelete} disabled={busyIds.has(confirmDelete._id)} className={btnPrimary}>
                {busyIds.has(confirmDelete._id) ? <><Spinner /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed z-[70] bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 items-stretch sm:items-end pointer-events-none" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-rise pointer-events-auto flex items-center gap-2.5 px-4 h-12 rounded-lg bg-[#131610] text-white text-sm shadow-lg">
            <span className={`w-1.5 h-1.5 rounded-full ${t.type === "error" ? "bg-[#C288A2]" : "bg-white"}`} />
            {t.message}
          </div>
        ))}
      </div>
    </section>
  );
};

const STYLES = `
.variant-row { transition: background-color .2s ease-out; }
.variant-row:hover { background: #FAFAFA; }
.variant-card { transition: transform .25s ease-out, box-shadow .25s ease-out, border-color .25s ease-out; }
.variant-card:hover { transform: translateY(-2px); border-color: rgba(0,0,0,.2); box-shadow: 0 10px 30px rgba(19,22,16,.06); }
@keyframes scale-in { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: none; } }
.animate-scale-in { animation: scale-in .28s ease-out both; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.animate-fade { animation: fade .2s ease-out both; }
.chip-in { animation: fade .25s ease-out both; }
@keyframes row-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.row-in { animation: row-in .22s ease-out both; }
@keyframes row-out { to { opacity: 0; transform: translateX(12px); } }
.row-out { animation: row-out .18s ease-out forwards; }
@keyframes num-bump { 0% { transform: translateY(-3px); opacity: .5; } 100% { transform: none; opacity: 1; } }
.num-bump-a { animation: num-bump .2s ease-out; }
.num-bump-b { animation: num-bump-b .2s ease-out; }
@keyframes num-bump-b { 0% { transform: translateY(-3px); opacity: .5; } 100% { transform: none; opacity: 1; } }
.skeleton { background: linear-gradient(90deg, #EEECE9 25%, #F6F5F3 50%, #EEECE9 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .variant-card:hover { transform: none; }
  .skeleton { animation: none; }
}
`;

export default VariantsInventory;
