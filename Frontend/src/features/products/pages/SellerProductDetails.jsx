import { useCallback, useEffect, useRef, useState } from "react";
import {
  Link,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { useProduct } from "../hook/useProduct";
import { getErrorMessage } from "../../../App/api.client";
import { PATHS } from "../../../App/paths";
import { STYLES } from "./CreateProduct";
import { SellerShell, Toast, Icon, I } from "./Dashboard";
import VariantsInventory from "../components/VariantsInventory";
import { cleanDecimal, selectOnFocus } from "../utils/numeric";

const MAX_IMAGES = 7;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const symbolOf = (currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency })
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value || "₹";

const inputCls =
  "w-full h-12 px-4 rounded-lg border border-black/10 bg-white text-base sm:text-sm outline-none transition-[border-color,box-shadow] duration-200 hover:border-black/20 focus:border-[#104292] focus:ring-4 focus:ring-[#104292]/10";
const labelCls =
  "block mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#131610]/70";
const btnPrimary =
  "btn-press h-12 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black disabled:opacity-40";
const btnSecondary =
  "btn-press h-12 px-6 inline-flex items-center justify-center rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest hover:border-black/30 disabled:opacity-40";

const draftFrom = (p) => ({
  title: p?.title || "",
  description: p?.description || "",
  price: p?.price?.amount != null ? String(p.price.amount) : "",
  images: (p?.images || [])
    .filter((i) => i?.url)
    .map((i) => ({ id: i._id, url: i.url })),
});
let fileSeq = 0;

const SellerProductDetails = () => {
  const { handleGetProductById, handleUpdateProduct, handleDeleteProduct } =
    useProduct();
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(draftFrom(null));
  const [activeImage, setActiveImage] = useState(0);
  const [editingImages, setEditingImages] = useState(false);
  const [imageError, setImageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [variantsDirty, setVariantsDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(location.state?.toast || "");
  const [firstVariant] = useState(Boolean(location.state?.firstVariant));
  const fileRef = useRef();

  // Hand-over state from Create/Edit is read once, then cleared so a refresh doesn't replay it
  useEffect(() => {
    if (location.state)
      navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Always load from the API so this page reflects the database, not a cached list
  useEffect(() => {
    let cancelled = false;
    handleGetProductById(productId)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setDraft(draftFrom(data));
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "Couldn't load this product."));
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, handleGetProductById]);

  const onVariantsChange = useCallback(
    (variants) => setProduct((p) => ({ ...p, variants })),
    [],
  );

  const base = draftFrom(product);
  const overviewDirty =
    status === "ready" &&
    (draft.title !== base.title ||
      draft.description !== base.description ||
      draft.price !== base.price ||
      draft.images.length !== base.images.length ||
      draft.images.some((im, i) => im.id !== base.images[i]?.id));
  const dirty = overviewDirty || variantsDirty;

  const titleError = !draft.title.trim() ? "Title is required" : "";
  const priceError = !(Number(draft.price) > 0)
    ? "Enter a price greater than zero"
    : "";
  const imagesError = !draft.images.length ? "Keep at least one image" : "";
  const canSave =
    overviewDirty && !titleError && !priceError && !imagesError && !saving;

  // Confirm before leaving with unsaved edits: in-app links, the back button and closing the tab
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !deleting && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (window.confirm("You have unsaved changes. Leave this page?"))
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!overviewDirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [overviewDirty]);

  useEffect(() => {
    if (!confirmDelete) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [confirmDelete]);

  const set = (field) => (e) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  const addFiles = (list) => {
    setImageError("");
    const room = MAX_IMAGES - draft.images.length;
    const files = Array.from(list || []);
    if (files.length > room) setImageError(`Up to ${MAX_IMAGES} images`);
    const ok = [];
    for (const f of files.slice(0, Math.max(room, 0))) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setImageError("Only JPG, PNG or WEBP images are allowed");
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setImageError(`"${f.name}" is over 5MB`);
        continue;
      }
      ok.push({ id: `new-${++fileSeq}`, url: URL.createObjectURL(f), file: f });
    }
    if (ok.length) setDraft((d) => ({ ...d, images: [...d.images, ...ok] }));
  };
  const removeImage = (id) =>
    setDraft((d) => ({ ...d, images: d.images.filter((im) => im.id !== id) }));

  const cancelEdits = () => {
    draft.images.forEach((im) => im.file && URL.revokeObjectURL(im.url));
    setDraft(draftFrom(product));
    setEditingImages(false);
    setImageError("");
    setSaveError("");
    setActiveImage(0);
  };

  const save = async () => {
    if (!canSave) return;
    const fd = new FormData();
    fd.append("title", draft.title.trim());
    fd.append("description", draft.description.trim());
    fd.append("priceAmount", draft.price);
    fd.append("priceCurrency", product.price?.currency || "INR");
    draft.images.forEach((im) => im.file && fd.append("images", im.file));
    fd.append(
      "imageOrder",
      JSON.stringify(draft.images.map((im) => (im.file ? "new" : im.id))),
    );
    setSaving(true);
    setSaveError("");
    try {
      const saved = await handleUpdateProduct(product._id, fd);
      setProduct(saved);
      setDraft(draftFrom(saved));
      setEditingImages(false);
      setActiveImage(0);
      setToast("Changes saved");
    } catch (err) {
      setSaveError(
        getErrorMessage(err, "Couldn't save your changes. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    setDeleting(true);
    try {
      await handleDeleteProduct(product._id);
      navigate(PATHS.sellerDashboard, {
        replace: true,
        state: { toast: `“${product.title}” deleted` },
      });
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
      setToast(getErrorMessage(err, "Couldn't delete this product."));
    }
  };

  if (status === "error") {
    return (
      <SellerShell active="products">
        <style>{STYLES}</style>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-manrope font-bold text-2xl tracking-tight">
            Product unavailable
          </h1>
          <p className="mt-2 max-w-sm text-sm text-[#131610]/55">{error}</p>
          <Link
            to={PATHS.sellerDashboard}
            className="btn-press mt-8 h-12 px-8 inline-flex items-center rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest"
          >
            Back to products
          </Link>
        </div>
      </SellerShell>
    );
  }

  const images = draft.images;
  const shown = images[Math.min(activeImage, images.length - 1)];
  const symbol = symbolOf(product?.price?.currency);

  return (
    <SellerShell active="products">
      <style>{STYLES}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10 pb-24">
        {/* Header */}
        <Link
          to={PATHS.sellerDashboard}
          className="inline-flex items-center h-11 text-[13px] font-medium text-[#131610]/55 hover:text-[#104292] transition-colors"
        >
          ← Products
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
          {status === "loading" ? (
            <div className="h-10 w-64 max-w-full rounded skeleton-block" />
          ) : (
            <h1 className="font-cormorant font-light text-4xl sm:text-5xl leading-[1.05] tracking-tight break-words min-w-0">
              {product.title}
            </h1>
          )}
          {status === "ready" && (
            <span
              className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${dirty ? "bg-[#C288A2]/15 text-[#9A5C78]" : "bg-black/5 text-[#131610]/50"}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${dirty ? "bg-[#C288A2]" : "bg-[#131610]/40"}`}
              />{" "}
              {dirty ? "Unsaved changes" : "Saved"}
            </span>
          )}
        </div>

        {/* Overview */}
        {status === "loading" ? (
          <div className="mt-8 bg-white rounded-xl border border-black/10 p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[4/5] rounded-lg skeleton-block" />
            <div className="space-y-4">
              <div className="h-12 rounded-lg skeleton-block" />
              <div className="h-28 rounded-lg skeleton-block" />
              <div className="h-12 w-1/2 rounded-lg skeleton-block" />
            </div>
          </div>
        ) : (
          <section
            aria-label="Overview"
            className="animate-rise mt-8 bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] p-5 sm:p-7"
          >
            <div className="grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] gap-8 lg:gap-10">
              {/* Gallery */}
              <div className="min-w-0">
                {editingImages ? (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#131610]/70">
                        Images
                      </span>
                      <span className="text-[11px] tabular-nums text-[#131610]/40">
                        {images.length} / {MAX_IMAGES}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {images.map((im, i) => (
                        <div
                          key={im.id}
                          className="animate-pop-in relative aspect-[4/5] rounded-lg overflow-hidden bg-[#D4CFC8]/40"
                        >
                          <img
                            src={im.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {i === 0 && (
                            <span className="absolute bottom-1 left-1 h-5 px-1.5 rounded-full bg-white/90 text-[9px] font-semibold uppercase tracking-widest grid place-items-center">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(im.id)}
                            aria-label="Remove image"
                            className="btn-press absolute top-1 right-1 w-8 h-8 rounded-full bg-white/90 grid place-items-center shadow-sm after:absolute after:-inset-1.5"
                          >
                            <Icon d={I.close} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {images.length < MAX_IMAGES && (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="aspect-[4/5] rounded-lg border-2 border-dashed border-[#D4CFC8] hover:border-[#C288A2] grid place-items-center text-[#131610]/45 hover:text-[#131610] transition-colors"
                        >
                          <span className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase tracking-widest">
                            <Icon d={I.plus} className="w-5 h-5" /> Add
                          </span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      accept={ALLOWED_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    {(imageError || imagesError) && (
                      <p role="alert" className="mt-2 text-xs text-[#B4534B]">
                        {imageError || imagesError}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-[#131610]/45">
                      JPG, PNG or WEBP · up to 5MB each. The first image is the
                      cover.
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditingImages(false)}
                      className="mt-2 h-11 text-[12px] font-semibold uppercase tracking-widest text-[#131610]/60 hover:text-[#104292]"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="aspect-[4/5] max-w-[300px] rounded-lg overflow-hidden bg-[#D4CFC8]/40">
                      {shown && (
                        <img
                          key={shown.url}
                          src={shown.url}
                          alt={draft.title}
                          className="animate-fade-img w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex gap-2 overflow-x-auto min-w-0">
                        {images.length > 1 &&
                          images.map((im, i) => (
                            <button
                              key={im.id}
                              type="button"
                              onClick={() => setActiveImage(i)}
                              aria-label={`Show image ${i + 1}`}
                              className={`btn-press shrink-0 w-12 h-14 rounded-md overflow-hidden border-2 ${i === activeImage ? "border-[#131610]" : "border-transparent opacity-70 hover:opacity-100"}`}
                            >
                              <img
                                src={im.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingImages(true)}
                        className="ml-auto shrink-0 h-11 px-1 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-[#131610]/65 hover:text-[#104292]"
                      >
                        <Icon d={I.edit} className="w-4 h-4" /> Edit images
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="min-w-0 flex flex-col gap-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" />{" "}
                  Overview
                </p>
                <div>
                  <label htmlFor="p-title" className={labelCls}>
                    Title
                  </label>
                  <input
                    id="p-title"
                    value={draft.title}
                    onChange={set("title")}
                    maxLength={80}
                    className={inputCls}
                  />
                  {titleError && (
                    <p role="alert" className="mt-1.5 text-xs text-[#B4534B]">
                      {titleError}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="p-desc" className={labelCls}>
                    Description
                  </label>
                  <textarea
                    id="p-desc"
                    value={draft.description}
                    onChange={set("description")}
                    maxLength={500}
                    rows={4}
                    className={`${inputCls} h-auto py-3 resize-y leading-relaxed`}
                  />
                </div>
                <div>
                  <label htmlFor="p-price" className={labelCls}>
                    Base price
                  </label>
                  <div className="relative sm:max-w-[220px]">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#131610]/50 pointer-events-none">
                      {symbol}
                    </span>
                    <input
                      id="p-price"
                      type="text"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => setDraft((d) => ({ ...d, price: cleanDecimal(e.target.value) }))}
                      onFocus={selectOnFocus}
                      className={`${inputCls} no-spin pl-8 tabular-nums`}
                    />
                  </div>
                  {priceError ? (
                    <p role="alert" className="mt-1.5 text-xs text-[#B4534B]">
                      {priceError}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-[#131610]/45">
                      Variants without their own price use this.
                    </p>
                  )}
                </div>

                {overviewDirty && (
                  <div className="animate-rise sticky bottom-0 z-10 -mx-5 sm:mx-0 px-5 sm:px-0 py-4 sm:py-0 bg-white/95 backdrop-blur border-t border-black/10 sm:border-0 sm:static flex flex-col-reverse sm:flex-row sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={cancelEdits}
                      disabled={saving}
                      className="h-11 px-2 text-[12px] font-semibold uppercase tracking-widest text-[#131610]/55 hover:text-[#104292] disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    {saveError && (
                      <p
                        role="alert"
                        className="text-xs text-[#B4534B] sm:order-first sm:flex-1"
                      >
                        {saveError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={save}
                      disabled={!canSave}
                      className={`${btnPrimary} sm:ml-auto`}
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <VariantsInventory
          product={product}
          loading={status === "loading"}
          onVariantsChange={onVariantsChange}
          onDirtyChange={setVariantsDirty}
          firstVariant={firstVariant}
        />

        {/* Danger zone */}
        {status === "ready" && (
          <section
            aria-label="Danger zone"
            className="mt-16 pt-8 border-t border-[#D4CFC8]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/40">
              Danger zone
            </p>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-[#131610]/55">
                Remove this product, its variants and stock from the storefront.
              </p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="self-start sm:self-auto h-11 text-[12px] font-semibold uppercase tracking-widest text-[#131610]/50 hover:text-[#B4534B] transition-colors"
              >
                Delete product
              </button>
            </div>
          </section>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <div
            onClick={() => !deleting && setConfirmDelete(false)}
            className="absolute inset-0 bg-[#131610]/40"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-product-title"
            className="animate-pop-in relative w-full max-w-sm bg-white rounded-xl border border-black/10 shadow-xl p-6"
          >
            <h3
              id="del-product-title"
              className="font-manrope font-bold text-lg tracking-tight"
            >
              Delete “{product.title}”?
            </h3>
            <p className="mt-2 text-sm text-[#131610]/55">
              It will be removed from your products and the storefront, along
              with {product.variants?.length || 0}{" "}
              {product.variants?.length === 1 ? "variant" : "variants"}. This
              can't be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteProduct}
                disabled={deleting}
                className={btnPrimary}
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
      <style>{`
        .skeleton-block { background: linear-gradient(90deg, #EEECE9 25%, #F6F5F3 50%, #EEECE9 75%); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
        @keyframes fade-img { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-img { animation: fade-img .25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .skeleton-block { animation: none; } }
      `}</style>
    </SellerShell>
  );
};

export default SellerProductDetails;
