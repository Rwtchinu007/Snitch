import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { Navbar, Footer, HOME_STYLES } from "./Home";
import { PATHS } from "../../../App/paths";
import { attributesOf, optionGroups, isColorKey, hasPriceRange } from "../utils/variants";

const LOW_STOCK = 5;

const formatPrice = (price) => {
  if (typeof price?.amount !== "number") return "—";
  const currency = price.currency || "INR";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price.amount);
};

/* ─── Icons ──────────────────────────────────────────────────────────── */
const Icon = ({ d, className = "w-5 h-5", fill = "none" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const HEART = <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />;
const CHECK = <path d="M5 12.5l4.5 4.5L19 7.5" />;
const HANGER = <><path d="M12 7a2 2 0 1 1 2-2" /><path d="M12 7v2L3 16h18l-9-7" /></>;

const Eyebrow = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#131610]/50 inline-flex items-center gap-2">
    <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> {children}
  </p>
);

/* ─── Gallery ────────────────────────────────────────────────────────── */
const ARROW_L = <path d="m15 6-6 6 6 6" />;
const ARROW_R = <path d="m9 6 6 6-6 6" />;

const Gallery = ({ images, title }) => {
  const [active, setActive] = useState(0);
  const touchX = useRef(null);
  const thumbsRef = useRef(null);
  const count = images.length;
  const current = count ? Math.min(active, count - 1) : 0; // never index past the end
  const go = (dir) => count > 1 && setActive((a) => (Math.min(a, count - 1) + dir + count) % count);

  // Keyboard ← / → anywhere on the page, unless the user is typing
  useEffect(() => {
    if (count < 2) return;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") setActive((a) => (Math.min(a, count - 1) - 1 + count) % count);
      if (e.key === "ArrowRight") setActive((a) => (Math.min(a, count - 1) + 1) % count);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);

  // Keep the active thumbnail in view and warm the next image
  useEffect(() => {
    thumbsRef.current?.children[current]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (count > 1) new Image().src = images[(current + 1) % count].url;
  }, [current, count, images]);

  if (count === 0) {
    return (
      <div className="aspect-[4/5] rounded-xl bg-[#D4CFC8]/60 grid place-items-center">
        <Icon d={HANGER} className="w-12 h-12 text-[#131610]/25" />
      </div>
    );
  }

  const arrow = "btn-press absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 border border-black/10 shadow-[0_2px_8px_rgba(19,22,16,0.12)] grid place-items-center text-[#131610] transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292]";

  return (
    <div className="flex flex-col md:flex-row-reverse md:justify-end gap-3">
      <div
        className="group relative w-full md:flex-1 md:max-w-md min-w-0 aspect-[4/5] max-h-[70vh] rounded-xl overflow-hidden bg-[#D4CFC8]"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {images.map((im, i) => (
          <img key={im._id || i} src={im.url} alt={i === current ? title : ""} aria-hidden={i !== current}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[250ms] ease-out ${i === current ? "opacity-100" : "opacity-0"}`} />
        ))}
        {count > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image" className={`${arrow} left-3`}><Icon d={ARROW_L} className="w-5 h-5" /></button>
            <button onClick={() => go(1)} aria-label="Next image" className={`${arrow} right-3`}><Icon d={ARROW_R} className="w-5 h-5" /></button>
            <span className="absolute bottom-3 right-3 h-6 px-2 rounded-full bg-white/90 text-[11px] font-semibold tabular-nums grid place-items-center" aria-live="polite">{current + 1} / {count}</span>
            <div className="md:hidden absolute bottom-4 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((im, i) => (
                <span key={im._id || i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {count > 1 && (
        <div ref={thumbsRef} className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[70vh] md:w-14 shrink-0 snap-x md:snap-y no-scrollbar">
          {images.map((im, i) => (
            <button key={im._id || i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === current}
              className={`btn-press snap-start shrink-0 w-14 aspect-[4/5] rounded-md overflow-hidden bg-[#D4CFC8] border-2 transition-[border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] ${i === current ? "border-[#131610]" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={im.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Option selectors ───────────────────────────────────────────────── */
const lowerKeys = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
const inStock = (v) => Number(v.stock) > 0;

// The variant whose attributes equal the selection (keys compared case-insensitively)
const findVariant = (variants, selection) => {
  const sel = lowerKeys(selection);
  return variants.find((v) => {
    const a = lowerKeys(attributesOf(v));
    const keys = Object.keys(a);
    return keys.length > 0 && keys.length === Object.keys(sel).length && keys.every((k) => sel[k] === a[k]);
  });
};

// Does some in-stock variant have this value (and, unless primary, agree with the other chosen options)?
// The primary group stays clickable so choosing it can switch the other options.
const isAvailable = (variants, selection, key, value, primary = false) =>
  variants.some((v) => {
    const a = attributesOf(v);
    return inStock(v) && a[key] === value && (primary || Object.entries(selection).every(([k, val]) => k === key || a[k] === undefined || a[k] === val));
  });

// Best variant to represent a tile: one matching the other selections, else any with that value
const variantFor = (variants, selection, key, value) =>
  findVariant(variants, { ...selection, [key]: value }) || variants.find((v) => attributesOf(v)[key] === value && inStock(v)) || variants.find((v) => attributesOf(v)[key] === value);

const TILES_PER_PAGE = 8;

const ImageTiles = ({ group, selected, onSelect, variants, selection, product, primary }) => {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(group.values.length / TILES_PER_PAGE);
  const base = Number(product.price?.amount) || 0;
  return (
    <div>
      {/* Mobile: one row with snap scrolling. Desktop: a wrapped grid, paged when long */}
      <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 no-scrollbar" role="radiogroup" aria-label={group.key}>
        {group.values.map((value, i) => {
          const v = variantFor(variants, selection, group.key, value);
          const img = v?.images?.find((im) => im?.url)?.url || product.images?.find((im) => im?.url)?.url;
          const price = Number(v?.price?.amount) || base;
          const active = selected === value;
          const available = isAvailable(variants, selection, group.key, value, primary);
          const onPage = Math.floor(i / TILES_PER_PAGE) === page;
          return (
            <button key={value} role="radio" aria-checked={active} aria-label={`${value}${available ? "" : " (unavailable)"}`} title={value}
              disabled={!available && !active} onClick={() => onSelect(group.key, value)}
              className={`btn-press snap-start shrink-0 w-[30%] min-w-[96px] sm:w-auto sm:min-w-0 ${onPage ? "" : "sm:hidden"} text-left rounded-lg bg-white border-2 overflow-hidden transition-[border-color,transform,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2 disabled:cursor-not-allowed ${active ? "border-[#104292]" : "border-black/10 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(19,22,16,0.08)]"} ${available || active ? "" : "opacity-45 border-dashed"}`}>
              <div className="aspect-square bg-[#D4CFC8]/50">{img && <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />}</div>
              <div className="px-2 py-1.5 border-t border-black/5">
                <p className="text-[12px] font-semibold tabular-nums">{formatPrice({ amount: price, currency: product.price?.currency })}</p>
                {price < base && <p className="text-[11px] tabular-nums text-[#131610]/40 line-through">{formatPrice(product.price)}</p>}
                {!available && <p className="text-[10px] uppercase tracking-wider text-[#131610]/45">Unavailable</p>}
              </div>
            </button>
          );
        })}
      </div>
      {pages > 1 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-3">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} aria-label="Previous options" className="btn-press w-11 h-11 rounded-lg border border-black/10 bg-white grid place-items-center disabled:opacity-35"><Icon d={ARROW_L} className="w-4 h-4" /></button>
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} aria-current={i === page} className={`btn-press w-11 h-11 rounded-lg border text-sm tabular-nums ${i === page ? "border-[#104292] text-[#104292] bg-[#104292]/5" : "border-black/10 bg-white"}`}>{i + 1}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} aria-label="More options" className="btn-press w-11 h-11 rounded-lg border border-black/10 bg-white grid place-items-center disabled:opacity-35"><Icon d={ARROW_R} className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

const Pills = ({ group, selected, onSelect, variants, selection, primary }) => (
  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={group.key}>
    {group.values.map((value) => {
      const active = selected === value;
      // here: in stock with the current options; elsewhere: in stock in another combination (click switches); neither: disabled
      const here = isAvailable(variants, selection, group.key, value, primary);
      const elsewhere = here || isAvailable(variants, selection, group.key, value, true);
      return (
        <button key={value} role="radio" aria-checked={active} aria-label={`${value}${here ? "" : elsewhere ? " (other colour)" : " (unavailable)"}`}
          disabled={!elsewhere} onClick={() => onSelect(group.key, value)}
          className={`btn-press relative overflow-hidden min-w-[52px] h-11 px-4 rounded-lg border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2 disabled:cursor-not-allowed ${active ? "bg-[#131610] border-[#131610] text-white" : here ? "bg-white border-black/15 hover:border-[#131610]" : elsewhere ? "bg-white border-dashed border-black/25 text-[#131610]/45 hover:border-[#131610]" : "bg-white border-dashed border-black/15 text-[#131610]/25"}`}>
          {value}
          {!here && !active && <span aria-hidden="true" className="absolute left-1/2 top-1/2 w-[140%] h-px bg-[#131610]/25 -translate-x-1/2 -translate-y-1/2 -rotate-[20deg]" />}
        </button>
      );
    })}
  </div>
);

const OptionGroup = (props) => {
  const { group, selected, variants } = props;
  // Colour gets picture tiles when its variants carry their own images; everything else is pills
  // Picture tiles only when the variants carrying this key have their own images; otherwise pills
  const tiles = isColorKey(group.key) && variants.some((v) => attributesOf(v)[group.key] !== undefined && v.images?.some((im) => im?.url));
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest">
        {group.key}: <span className="font-manrope normal-case tracking-normal text-[13px] font-bold">{selected || "Select"}</span>
      </p>
      {tiles ? <ImageTiles {...props} /> : <Pills {...props} />}
    </div>
  );
};

const StockLine = ({ stock }) => {
  if (stock <= 0) return <p className="text-xs font-semibold uppercase tracking-widest text-[#131610]/45">Out of stock</p>;
  if (stock <= LOW_STOCK) return <p className="text-xs font-semibold uppercase tracking-widest text-[#9A5C78] inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C288A2]" /> Only {stock} left</p>;
  return <p className="text-xs font-semibold uppercase tracking-widest text-[#104292] inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#104292]" /> In stock</p>;
};

/* ─── Accordion ──────────────────────────────────────────────────────── */
const Accordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-black/10">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.title}>
            <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
              className="w-full min-h-[52px] flex items-center justify-between text-left text-[12px] font-semibold uppercase tracking-widest focus-visible:outline-none focus-visible:text-[#104292]">
              {it.title}
              <span className="relative w-3.5 h-3.5 shrink-0" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                <span className={`absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 ease-out ${isOpen ? "scale-y-0" : "scale-y-100"}`} />
              </span>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="pb-5 text-sm leading-relaxed text-[#131610]/60">{it.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Related card ───────────────────────────────────────────────────── */
const RelatedCard = ({ product }) => {
  const img = product.images?.[0]?.url;
  return (
    <Link to={PATHS.product(product._id)} className="group block">
      <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#D4CFC8]">
        {img && <img src={img} alt={product.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />}
      </div>
      <p className="mt-3 font-manrope font-semibold text-sm truncate"><span className="title-underline">{product.title}</span></p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[#131610]/80">
        {hasPriceRange(product) ? `From ${formatPrice({ amount: product.minPrice, currency: product.price?.currency })}` : formatPrice(product.price)}
      </p>
    </Link>
  );
};

/* ─── Skeleton ───────────────────────────────────────────────────────── */
const DetailsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12" aria-busy="true">
    <div className="aspect-[4/5] rounded-xl shimmer" />
    <div className="flex flex-col gap-4 md:pt-4">
      <div className="h-3 w-28 rounded shimmer" />
      <div className="h-9 w-3/4 rounded shimmer" />
      <div className="h-6 w-32 rounded shimmer" />
      <div className="h-14 w-full rounded shimmer mt-4" />
      <div className="h-12 w-full rounded-lg shimmer mt-8" />
    </div>
  </div>
);

/* ─── Page ───────────────────────────────────────────────────────────── */
const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { handleGetProductById, handleGetAllProducts } = useProduct();
  const allProducts = useSelector((state) => state.products.products);
  const user = useSelector((state) => state.auth?.user);

  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | missing | error
  const [selection, setSelection] = useState({});
  const [switchNote, setSwitchNote] = useState("");
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState("");

  // Reset when navigating between products (state-during-render pattern)
  const [prevId, setPrevId] = useState(productId);
  if (prevId !== productId) {
    setPrevId(productId);
    setStatus("loading");
    setQty(1);
    setAdded(false);
    setSelection({});
  }

  useEffect(() => {
    let cancelled = false;
    handleGetProductById(productId)
      .then((p) => {
        if (cancelled) return;
        setProduct(p || null);
        setStatus(p ? "ready" : "missing");
        // Preselect the first in-stock variant (or the first variant if all are sold out)
        const list = p?.variants || [];
        const first = list.find(inStock) || list[0];
        setSelection(first ? { ...attributesOf(first) } : {});
      })
      .catch((err) => { if (!cancelled) setStatus(err?.response?.status === 404 ? "missing" : "error"); });
    return () => { cancelled = true; };
  }, [productId, handleGetProductById]);

  // Related items come from the storefront list; refetch so they reflect the latest seller changes
  useEffect(() => {
    handleGetAllProducts().catch(() => {});
  }, [handleGetAllProducts]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const related = useMemo(
    () => (allProducts || []).filter((p) => p._id !== productId).slice(0, 4),
    [allProducts, productId]
  );

  const variants = useMemo(() => (Array.isArray(product?.variants) ? product.variants : []), [product]);
  const groups = useMemo(() => optionGroups(variants), [variants]);
  const hasVariants = variants.length > 0;
  const matched = hasVariants ? findVariant(variants, selection) : null;
  const soldOut = hasVariants && !variants.some((v) => Number(v.stock) > 0);
  const canAdd = !hasVariants || (matched && Number(matched.stock) > 0);
  const maxQty = matched ? Math.min(10, Number(matched.stock) || 1) : 10;
  const missing = groups.filter((g) => !selection[g.key]).map((g) => g.key.toLowerCase());

  // Keep the other options when that combination exists in stock; otherwise jump to the first in-stock variant with this value
  const choose = (key, value) => {
    const next = { ...selection, [key]: value };
    const exact = findVariant(variants, next);
    setQty(1);
    if (!(exact && inStock(exact))) {
      const fallback = variants.find((v) => attributesOf(v)[key] === value && inStock(v)) || variants.find((v) => attributesOf(v)[key] === value);
      if (fallback) {
        const attrs = { ...attributesOf(fallback) };
        // Tell the buyer which other option changed, e.g. "Showing Brown, where L is available"
        const changed = Object.keys(attrs).filter((k) => k !== key && selection[k] !== undefined && selection[k] !== attrs[k]);
        setSwitchNote(groups[0]?.key !== key && changed.length && inStock(fallback) ? `Showing ${changed.map((k) => attrs[k]).join(", ")}, where ${value} is available` : "");
        setSelection(attrs);
        return;
      }
    }
    setSwitchNote("");
    setSelection(next);
  };

  const addToCart = () => {
    if (!canAdd) return;
    setCartCount((c) => c + qty);
    setAdded(true);
  };

  // The gallery follows the chosen variant's images, falling back to the product's
  const variantImages = (matched?.images || []).filter((im) => im?.url);
  const images = variantImages.length ? variantImages : Array.isArray(product?.images) ? product.images.filter((im) => im?.url) : [];
  const displayPrice = matched?.price?.amount > 0 ? matched.price : product?.price;
  const priceLabel = !matched && hasPriceRange(product)
    ? `From ${formatPrice({ amount: product.minPrice, currency: product.price?.currency })}`
    : formatPrice(displayPrice);
  const sellerName = typeof product?.seller === "object" ? product.seller?.fullname : null;

  const addLabel = added
    ? <><Icon d={CHECK} className="w-4 h-4 animate-pop" /> Added</>
    : soldOut ? "Sold out" : hasVariants && !matched ? "Select options" : "Add to cart";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{HOME_STYLES}</style>
      <Navbar user={user} cartCount={cartCount} wishCount={wished ? 1 : 0} search={search} setSearch={setSearch} />

      <main className={`flex-1 ${status === "ready" ? "pb-24 md:pb-0" : ""}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="pt-6 text-xs text-[#131610]/50 flex items-center gap-2 min-w-0">
            <Link to="/" className="hover:text-[#104292] transition-colors shrink-0">Home</Link><span aria-hidden="true">›</span>
            <Link to="/shop" className="hover:text-[#104292] transition-colors shrink-0">Shop</Link><span aria-hidden="true">›</span>
            <span className="text-[#131610]/75 truncate">{status === "ready" ? product.title : status === "loading" ? "…" : "Not found"}</span>
          </nav>

          <section className="pt-8 pb-16 lg:pb-24">
            {status === "loading" ? (
              <DetailsSkeleton />
            ) : status === "missing" || status === "error" ? (
              <div className="flex flex-col items-center text-center py-20">
                <Icon d={HANGER} className="w-12 h-12 text-[#D4CFC8]" />
                <h1 className="mt-6 font-manrope font-semibold text-2xl sm:text-3xl tracking-tight">
                  {status === "missing" ? "This piece is no longer available" : "Couldn't load this piece"}
                </h1>
                <p className="mt-2 max-w-sm text-sm text-[#131610]/55">
                  {status === "missing" ? "It may have sold out or been removed. There's plenty more in the collection." : "Check your connection and try again."}
                </p>
                <button onClick={() => navigate("/")} className="btn-press mt-8 h-12 px-8 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">Back to shop</button>
              </div>
            ) : (
              <div className="animate-rise grid grid-cols-1 md:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
                <div className="md:sticky md:top-24">
                  <Gallery key={variantImages.length ? matched._id : product._id} images={images} title={product.title} />
                </div>

                <div className="flex flex-col gap-6 md:pt-2">
                  {/* Title + price */}
                  <div>
                    <Eyebrow>New Arrival</Eyebrow>
                    <h1 className="mt-3 font-manrope font-semibold text-3xl lg:text-4xl leading-tight tracking-tight break-words">{product.title}</h1>
                    <p className="mt-4 text-2xl font-semibold tabular-nums">{priceLabel}</p>
                    <p className="mt-1 text-xs text-[#131610]/45">Inclusive of all taxes</p>
                    {(matched || soldOut) && <div className="mt-3"><StockLine stock={matched ? Number(matched.stock) || 0 : 0} /></div>}
                  </div>

                  {product.description && (
                    <p className="text-[15px] leading-relaxed text-[#131610]/60 line-clamp-3">{product.description}</p>
                  )}

                  <hr className="border-black/10" />

                  {/* Options + quantity */}
                  <div className="flex flex-col gap-5">
                    {switchNote && <p className="animate-fade -mb-2 text-xs text-[#131610]/50" role="status">{switchNote}</p>}
                    {groups.map((g, i) => (
                      <OptionGroup key={g.key} group={g} selected={selection[g.key]} onSelect={choose} variants={variants} selection={selection} product={product} primary={i === 0} />
                    ))}
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest">Quantity</p>
                      <div className="inline-flex items-center h-11 rounded-lg border border-black/10 bg-white">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-11 h-full text-lg disabled:text-[#131610]/25">−</button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                        <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity" className="w-11 h-full text-lg disabled:text-[#131610]/25">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Primary action */}
                  <div className="flex gap-3">
                    <button onClick={addToCart} disabled={!canAdd}
                      className="btn-press flex-1 h-12 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2">
                      {addLabel}
                    </button>
                    <button onClick={() => setWished((w) => !w)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                      className="btn-press w-12 h-12 shrink-0 grid place-items-center rounded-lg border border-black/10 bg-white hover:border-[#131610] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292]">
                      <Icon key={String(wished)} d={HEART} fill={wished ? "currentColor" : "none"} className={`w-5 h-5 ${wished ? "text-[#C288A2] animate-pop" : ""}`} />
                    </button>
                  </div>

                  {hasVariants && !soldOut && !matched && missing.length > 0 && (
                    <p className="-mt-3 text-xs text-[#131610]/50">Select a {missing.join(" and ")} to add this to your cart.</p>
                  )}

                  <hr className="border-black/10" />

                  <Accordion items={[
                    { title: "Description", body: product.description || "A considered essential from the Snitch collection." },
                    { title: "Shipping & Returns", body: "Free shipping on all orders, dispatched within 48 hours. Easy 15-day returns on unworn pieces with tags attached." },
                  ]} />

                  {sellerName && (
                    <p className="text-xs text-[#131610]/50">Sold by <span className="font-medium text-[#131610]/80">{sellerName}</span></p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* You might also like */}
        {status === "ready" && related.length > 0 && (
          <section className="border-t border-black/10 py-16 lg:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-cormorant font-light text-3xl sm:text-4xl tracking-tight">You might also like</h2>
              <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                {related.map((p) => <RelatedCard key={p._id} product={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Mobile sticky bar */}
      {status === "ready" && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-black/10 px-4 py-3 flex items-center gap-4">
          <p className="text-lg font-semibold tabular-nums truncate">{priceLabel}</p>
          <button onClick={addToCart} disabled={!canAdd} className="btn-press disabled:opacity-40 ml-auto flex-1 max-w-[220px] h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
