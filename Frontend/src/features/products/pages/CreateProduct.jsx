import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct.js";
import { SidebarContent, Icon, I } from "./Dashboard";
import AuthLoader from "../../auth/components/AuthLoader";
import { getErrorMessage } from "../../../App/api.client";
import { cleanDecimal, selectOnFocus } from "../utils/numeric";

const CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];
const MAX_IMAGES = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TITLE_MAX = 80;
const DESC_MAX = 500;

const formatPrice = (amount, currency) =>
  new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount || 0);

const UploadIcon = <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>;
const DragIcon = <><circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" /></>;

/* ─── Field primitives ───────────────────────────────────────────────── */
const inputBase = "w-full h-12 px-4 rounded-lg border bg-white text-base sm:text-sm text-[#131610] placeholder:text-[#131610]/35 outline-none transition-[border-color,box-shadow] duration-200 ease-out";
const inputState = (err) => err
  ? "border-[#B4534B]/60 focus:border-[#B4534B] focus:ring-4 focus:ring-[#B4534B]/10"
  : "border-black/10 hover:border-black/20 focus:border-[#104292] focus:ring-4 focus:ring-[#104292]/10";

const Field = ({ id, label, required, counter, helper, error, children }) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-widest text-[#131610]/75">
        {label} {required && <span className="text-[#C288A2]">*</span>}
      </label>
      {counter && <span className="text-[11px] tabular-nums text-[#131610]/40">{counter}</span>}
    </div>
    {children}
    {error ? (
      <p id={`${id}-err`} role="alert" className="mt-2 text-xs text-[#B4534B]">{error}</p>
    ) : helper ? (
      <p className="mt-2 text-xs text-[#131610]/45">{helper}</p>
    ) : null}
  </div>
);

const Card = ({ title, eyebrow, delay = 0, children, className = "" }) => (
  <section style={{ animationDelay: `${delay}ms` }} className={`animate-rise bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] p-5 sm:p-7 ${className}`}>
    <div className="flex items-baseline justify-between mb-6">
      <h2 className="font-manrope font-bold text-lg tracking-tight">{title}</h2>
      {eyebrow}
    </div>
    {children}
  </section>
);

/* ─── Page ───────────────────────────────────────────────────────────── */
const CreateProduct = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEdit = Boolean(productId);
  const { handleCreateProduct, handleUpdateProduct, handleGetProductById } = useProduct();
  const user = useSelector((state) => state.auth?.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("INR");
  const [images, setImages] = useState([]); // { id, file, url, removing }
  const [touched, setTouched] = useState({});
  const [imageError, setImageError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [activeNav, setActiveNav] = useState(isEdit ? "products" : "add");
  const [editStatus, setEditStatus] = useState(isEdit ? "loading" : "ready"); // loading | ready | error
  const [editError, setEditError] = useState("");
  const fileRef = useRef(null);
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);

  // Release object URLs on unmount (existing images are remote URLs, not blobs)
  useEffect(() => () => imagesRef.current.forEach((i) => !i.existingId && URL.revokeObjectURL(i.url)), []);

  // Edit mode: prefill the form with the product being edited
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    handleGetProductById(productId)
      .then((p) => {
        if (cancelled) return;
        if (!p) throw new Error("missing");
        if (user && String(p.seller?._id ?? p.seller) !== String(user.id)) {
          setEditError("You can only edit your own products.");
          setEditStatus("error");
          return;
        }
        setTitle(p.title || "");
        setDescription(p.description || "");
        setPriceAmount(String(p.price?.amount ?? ""));
        setPriceCurrency(p.price?.currency || "INR");
        setImages((p.images || []).map((img) => ({ id: img._id, existingId: img._id, url: img.url })));
        setEditStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setEditError(err?.response?.status === 404 || err?.message === "missing" ? "This product doesn't exist anymore." : getErrorMessage(err, "Couldn't load this product."));
        setEditStatus("error");
      });
    return () => { cancelled = true; };
  }, [productId, handleGetProductById, user]);

  useEffect(() => {
    document.body.style.overflow = drawer || success ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer, success]);

  const liveImages = images.filter((i) => !i.removing);
  const atLimit = liveImages.length >= MAX_IMAGES;
  const price = parseFloat(priceAmount);

  const errors = {
    title: !title.trim() ? "Add a title for this piece." : title.length > TITLE_MAX ? `Keep it under ${TITLE_MAX} characters.` : "",
    description: description.length > DESC_MAX ? `Keep it under ${DESC_MAX} characters.` : "",
    price: !priceAmount ? "Enter a price." : !(price > 0) ? "Price must be greater than zero." : "",
    images: liveImages.length === 0 ? "Add at least one image." : "",
  };
  const isValid = !errors.title && !errors.description && !errors.price && !errors.images;
  const show = (k) => touched[k] && errors[k];

  const addFiles = (fileList) => {
    setImageError("");
    const room = MAX_IMAGES - liveImages.length;
    const accepted = [];
    for (const f of Array.from(fileList)) {
      if (!ALLOWED_TYPES.includes(f.type)) { setImageError(`${f.name} isn't a JPG, PNG or WEBP.`); continue; }
      if (f.size > MAX_FILE_SIZE) { setImageError(`${f.name} is larger than 5MB.`); continue; }
      if (accepted.length >= room) { setImageError(`Only ${MAX_IMAGES} images allowed — extras were skipped.`); break; }
      accepted.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
    }
    if (accepted.length) setImages((prev) => [...prev, ...accepted]);
    setTouched((t) => ({ ...t, images: true }));
  };

  const removeImage = (id) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, removing: true } : i)));
    setTimeout(() => {
      setImages((prev) => {
        const gone = prev.find((i) => i.id === id);
        if (gone && !gone.existingId) URL.revokeObjectURL(gone.url);
        return prev.filter((i) => i.id !== id);
      });
    }, 200);
  };

  const reorder = (from, to) => {
    if (from === null || from === to) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const resetForm = () => {
    images.forEach((i) => !i.existingId && URL.revokeObjectURL(i.url));
    setTitle(""); setDescription(""); setPriceAmount(""); setPriceCurrency("INR");
    setImages([]); setTouched({}); setImageError(""); setProgress(null); setSubmitError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true, price: true, images: true });
    if (!isValid || submitting) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("priceAmount", String(price));
    formData.append("priceCurrency", priceCurrency);
    liveImages.forEach((img) => img.file && formData.append("images", img.file));
    // Tells the backend the final order: kept image ids, with "new" for each uploaded file
    if (isEdit) formData.append("imageOrder", JSON.stringify(liveImages.map((img) => img.existingId || "new")));

    setSubmitting(true);
    setSubmitError("");
    setProgress(0);
    try {
      const onProgress = (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100));
      const saved = isEdit
        ? await handleUpdateProduct(productId, formData, onProgress)
        : await handleCreateProduct(formData, onProgress);
      setProgress(100);
      // The product page is where variants and stock are managed next
      if (saved?._id) {
        navigate(`/seller/product/${saved._id}`, { replace: true, state: isEdit ? { toast: "Changes saved" } : { firstVariant: true } });
        return;
      }
      setSuccess(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err, isEdit ? "Couldn't save your changes. Please try again." : "Couldn't publish this piece. Please try again."));
      setProgress(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (editStatus === "loading") return <AuthLoader />;
  if (editStatus === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#FAFAFA] text-[#131610] font-inter">
        <style>{STYLES}</style>
        <h1 className="font-manrope font-bold text-2xl tracking-tight">Can't edit this piece</h1>
        <p className="mt-2 max-w-sm text-sm text-[#131610]/55">{editError}</p>
        <Link to="/seller/dashboard" className="btn-press mt-8 h-12 px-8 inline-flex items-center rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">Back to products</Link>
      </div>
    );
  }

  const symbol = CURRENCIES.find((c) => c.code === priceCurrency)?.symbol;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{STYLES}</style>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-white border-r border-black/10 z-30">
        <SidebarContent active={activeNav} setActive={setActiveNav} user={user} />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="lg:hidden sticky top-0 z-30 h-16 px-4 flex items-center justify-between bg-white/85 backdrop-blur-md border-b border-black/10">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="btn-press w-11 h-11 -ml-2 grid place-items-center"><Icon d={I.menu} /></button>
        <span className="font-manrope font-extrabold text-lg tracking-[0.35em]">SNITCH</span>
        <span className="w-11" />
      </header>
      <div className={`lg:hidden fixed inset-0 z-50 ${drawer ? "" : "pointer-events-none"}`}>
        <div onClick={() => setDrawer(false)} className={`absolute inset-0 bg-[#131610]/40 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-[80%] max-w-[280px] bg-white transition-transform duration-300 ease-out ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute top-2.5 right-2 w-11 h-11 grid place-items-center z-10"><Icon d={I.close} /></button>
          <SidebarContent active={activeNav} setActive={setActiveNav} user={user} onNavigate={() => setDrawer(false)} />
        </aside>
      </div>

      <form onSubmit={onSubmit} noValidate className="lg:pl-60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-10 lg:pt-14 pb-40 sm:pb-32">
          {/* Header */}
          <header>
            <Link to="/seller/dashboard" className="animate-rise inline-flex items-center h-11 -mt-3 text-[13px] font-medium text-[#131610]/55 hover:text-[#104292] transition-colors">
              ← Back to products
            </Link>
            <p className="animate-rise [animation-delay:40ms] mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> {isEdit ? "Edit Listing" : "New Listing"}
            </p>
            <h1 className="animate-rise [animation-delay:80ms] mt-3 font-cormorant font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">{isEdit ? "Edit Piece" : "Add a New Piece"}</h1>
            <p className="animate-rise [animation-delay:120ms] mt-3 text-[15px] text-[#131610]/55">{isEdit ? "Update the details, price or imagery — changes go live on the storefront instantly." : "Describe it, price it and upload its imagery — it goes live on the storefront instantly."}</p>
          </header>

          <div className="mt-10 lg:mt-12 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">
            {/* Details */}
            <Card title="Product details" delay={160}>
              <div className="flex flex-col gap-6">
                <Field id="title" label="Product title" required counter={`${title.length} / ${TITLE_MAX}`} error={show("title")}>
                  <input id="title" value={title} maxLength={TITLE_MAX + 20}
                    onChange={(e) => setTitle(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                    placeholder="e.g. Oversized Cotton Tee" aria-invalid={!!show("title")} aria-describedby={show("title") ? "title-err" : undefined}
                    className={`${inputBase} ${inputState(show("title"))}`} />
                </Field>

                <Field id="description" label="Description" counter={`${description.length} / ${DESC_MAX}`} helper="Fabric, fit and feel — what makes this piece special." error={show("description")}>
                  <textarea id="description" rows={5} value={description}
                    onChange={(e) => setDescription(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                    placeholder="300 GSM, oversized fit, pure cotton" aria-invalid={!!show("description")}
                    className={`${inputBase} h-auto py-3 resize-y min-h-[132px] leading-relaxed ${inputState(show("description"))}`} />
                </Field>

                <Field id="price" label="Price" required helper="Enter the selling price for one piece." error={show("price")}>
                  <div className="flex gap-3">
                    <div className="relative shrink-0">
                      <select value={priceCurrency} onChange={(e) => setPriceCurrency(e.target.value)} aria-label="Currency"
                        className={`${inputBase} ${inputState(false)} w-[108px] appearance-none pr-9 cursor-pointer font-medium`}>
                        {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
                      </select>
                      <Icon d={I.chevron} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#131610]/50" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#131610]/45 pointer-events-none">{symbol}</span>
                      <input id="price" type="text" inputMode="decimal" value={priceAmount} onFocus={selectOnFocus}
                        onChange={(e) => setPriceAmount(cleanDecimal(e.target.value))} onBlur={() => setTouched((t) => ({ ...t, price: true }))}
                        placeholder="1,200.00" aria-invalid={!!show("price")} aria-describedby={show("price") ? "price-err" : undefined}
                        className={`${inputBase} pl-9 tabular-nums no-spin ${inputState(show("price"))}`} />
                    </div>
                  </div>
                </Field>
              </div>
            </Card>

            <div className="flex flex-col gap-8">
              {/* Images */}
              <Card title="Product images" delay={220}
                eyebrow={<span className="text-[11px] font-semibold uppercase tracking-widest tabular-nums text-[#131610]/50">{liveImages.length} / {MAX_IMAGES} images</span>}>
                <label
                  htmlFor="images-input"
                  onDragOver={(e) => { e.preventDefault(); if (!atLimit) setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (!atLimit && e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
                  className={`flex flex-col items-center justify-center text-center px-6 py-10 rounded-xl border-2 border-dashed transition-colors duration-200 ease-out
                    ${atLimit ? "border-[#D4CFC8] bg-[#D4CFC8]/20 cursor-not-allowed"
                      : dragOver ? "border-[#C288A2] bg-[#C288A2]/10 cursor-copy"
                      : show("images") ? "border-[#B4534B]/50 bg-[#D4CFC8]/15 cursor-pointer"
                      : "border-[#D4CFC8] bg-[#D4CFC8]/15 hover:border-[#131610]/30 cursor-pointer"}`}
                >
                  <span className={`w-12 h-12 rounded-full bg-white border border-black/10 grid place-items-center transition-transform duration-200 ${dragOver ? "scale-110 text-[#C288A2]" : "text-[#131610]/70"}`}>
                    <Icon d={UploadIcon} />
                  </span>
                  {atLimit ? (
                    <p className="mt-4 text-sm text-[#131610]/45">Maximum {MAX_IMAGES} images reached</p>
                  ) : (
                    <>
                      <p className="mt-4 text-sm text-[#131610]/80">Drag and drop images here, or <span className="text-[#104292] font-medium underline underline-offset-4">browse</span></p>
                      <p className="mt-1.5 text-xs text-[#131610]/45">Up to {MAX_IMAGES} images · JPG, PNG, WEBP · Max 5MB each</p>
                    </>
                  )}
                  <input id="images-input" ref={fileRef} type="file" multiple accept={ALLOWED_TYPES.join(",")} disabled={atLimit} className="sr-only"
                    onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                </label>
                {(imageError || show("images")) && <p role="alert" className="mt-3 text-xs text-[#B4534B]">{imageError || errors.images}</p>}

                <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={img.id}
                      draggable={!submitting}
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); reorder(dragIndex, i); setDragIndex(null); }}
                      onDragEnd={() => setDragIndex(null)}
                      className={`group relative aspect-[4/5] rounded-lg overflow-hidden bg-[#D4CFC8] ${img.removing ? "animate-out" : "animate-pop-in"} ${dragIndex === i ? "opacity-40" : ""}`}
                    >
                      <img src={img.url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#104292] text-white text-[9px] font-semibold uppercase tracking-widest">Cover</span>}
                      <button type="button" onClick={() => removeImage(img.id)} disabled={submitting} aria-label={`Remove image ${i + 1}`}
                        className="btn-press absolute top-0 right-0 w-11 h-11 grid place-items-center">
                        <span className="w-6 h-6 rounded-full bg-white/95 shadow-sm grid place-items-center text-[#131610]"><Icon d={I.close} className="w-3.5 h-3.5" /></span>
                      </button>
                      <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-md bg-white/90 grid place-items-center text-[#131610]/60 cursor-grab opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" title="Drag to reorder">
                        <Icon d={DragIcon} className="w-3.5 h-3.5" />
                      </span>
                      {progress !== null && (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-white/50">
                          <span className="block h-full bg-[#104292] transition-[width] duration-200 ease-out" style={{ width: `${progress}%` }} />
                        </span>
                      )}
                    </div>
                  ))}
                  {!atLimit && (
                    <button type="button" onClick={() => fileRef.current?.click()} aria-label="Add image"
                      className="btn-press aspect-[4/5] rounded-lg bg-[#D4CFC8]/30 border border-dashed border-[#D4CFC8] grid place-items-center text-[#131610]/35 hover:text-[#131610]/60 transition-colors">
                      <Icon d={I.plus} className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {liveImages.length > 1 && <p className="mt-3 text-xs text-[#131610]/45">Drag thumbnails to reorder. The first image is the cover.</p>}
              </Card>

              {/* Live preview */}
              <Card title="Preview" delay={280} className="hidden lg:block"
                eyebrow={<span className="text-[10px] font-semibold uppercase tracking-widest text-[#131610]/40">Storefront</span>}>
                <div className="max-w-[220px] mx-auto">
                  <div className="aspect-[4/5] rounded-md overflow-hidden bg-[#D4CFC8]/50 grid place-items-center">
                    {liveImages[0] ? <img src={liveImages[0].url} alt="" className="w-full h-full object-cover" /> : <Icon d={I.hanger} className="w-10 h-10 text-[#131610]/20" />}
                  </div>
                  <p className="mt-3 font-manrope font-semibold text-[15px] truncate">{title.trim() || <span className="text-[#131610]/30">Product title</span>}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#131610]/55 line-clamp-2 min-h-[2.6em]">{description.trim() || <span className="text-[#131610]/30">Short description</span>}</p>
                  <p className="mt-2 text-sm font-semibold tabular-nums">{price > 0 ? formatPrice(price, priceCurrency) : <span className="text-[#131610]/30">{symbol}0</span>}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="fixed bottom-0 inset-x-0 lg:left-60 z-20 bg-white/85 backdrop-blur-md border-t border-black/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-3 sm:py-4 flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:gap-4">
            <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/seller/dashboard"))}
              className="btn-press h-12 sm:h-11 px-6 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest hover:border-[#131610] transition-colors">
              Cancel
            </button>
            {submitError && <p role="alert" className="text-xs text-[#B4534B] sm:flex-1 sm:text-right">{submitError}</p>}
            <button type="submit" disabled={!isValid || submitting}
              className={`btn-press ${submitError ? "" : "sm:ml-auto"} h-12 px-8 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest transition-opacity disabled:opacity-35 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2`}>
              {submitting && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {submitting ? `${isEdit ? "Saving…" : "Publishing…"}${progress ? ` ${progress}%` : ""}` : isEdit ? "Save Changes" : "Publish Product"}
            </button>
          </div>
        </div>
      </form>

      {/* Success modal */}
      {success && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="absolute inset-0 bg-[#131610]/45 backdrop-blur-[2px]" />
          <div className="animate-rise relative w-full max-w-sm bg-white rounded-xl border border-black/10 shadow-xl p-7 text-center">
            <span className="mx-auto w-14 h-14 rounded-full border border-[#104292]/25 grid place-items-center text-[#104292]">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" className="check-draw" />
              </svg>
            </span>
            <h3 id="success-title" className="mt-5 font-manrope font-bold text-xl tracking-tight">{isEdit ? "Changes saved" : "Product published"}</h3>
            <p className="mt-2 text-sm text-[#131610]/55">“{title.trim()}” {isEdit ? "has been updated on the Snitch storefront." : "is now live on the Snitch storefront."}</p>
            <div className="mt-7 flex flex-col gap-3">
              <button autoFocus onClick={() => navigate("/seller/dashboard")} className="btn-press h-12 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">View Products</button>
              {!isEdit && <button onClick={() => { resetForm(); setSuccess(false); }} className="btn-press h-12 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Add Another</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@500;600;700;800&display=swap');
.font-manrope { font-family: 'Manrope', 'Inter', sans-serif; }
.font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
.font-inter { font-family: 'Inter', sans-serif; }

@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.animate-rise { opacity: 0; animation: rise .6s cubic-bezier(.16,1,.3,1) forwards; }
@keyframes pop-in { from { opacity: 0; transform: scale(.9); } to { opacity: 1; transform: none; } }
.animate-pop-in { animation: pop-in .25s ease-out; }
@keyframes out { to { opacity: 0; transform: scale(.9); } }
.animate-out { animation: out .2s ease-out forwards; pointer-events: none; }
@keyframes draw { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
.check-draw { stroke-dasharray: 24; stroke-dashoffset: 24; animation: draw .5s .15s ease-out forwards; }

.btn-press { transition: transform .2s ease-out, border-color .2s ease-out, opacity .2s ease-out; }
.btn-press:active { transform: scale(.96); }

.no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spin { -moz-appearance: textfield; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; transition-delay: 0ms !important; }
  .animate-rise { opacity: 1; }
  .check-draw { stroke-dashoffset: 0; }
}
`;

export default CreateProduct;
