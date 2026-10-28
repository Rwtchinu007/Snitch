import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { Navbar, Footer, HOME_STYLES } from "./Home";

/* UI-only for now — sizes and wishlist are not stored on the product yet */
const SIZES = ["S", "M", "L", "XL"];

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
const Gallery = ({ images, title }) => {
  const [active, setActive] = useState(0);
  const touchX = useRef(null);
  const count = images.length;

  if (count === 0) {
    return (
      <div className="aspect-[4/5] rounded-xl bg-[#D4CFC8]/60 grid place-items-center">
        <Icon d={HANGER} className="w-12 h-12 text-[#131610]/25" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#D4CFC8]"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) setActive((a) => (a + (dx < 0 ? 1 : -1) + count) % count);
          touchX.current = null;
        }}
      >
        {images.map((im, i) => (
          <img key={im._id || i} src={im.url} alt={i === active ? title : ""} aria-hidden={i !== active}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-out ${i === active ? "opacity-100" : "opacity-0"}`} />
        ))}
        {count > 1 && (
          <div className="sm:hidden absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      {count > 1 && (
        <div className="hidden sm:grid grid-cols-7 gap-3 mt-4">
          {images.slice(0, 7).map((im, i) => (
            <button key={im._id || i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === active}
              className={`btn-press aspect-[4/5] rounded-md overflow-hidden bg-[#D4CFC8] border transition-[border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] ${i === active ? "border-[#131610]" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <img src={im.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
    <Link to={`/product/${product._id}`} className="group block">
      <div className="aspect-[4/5] rounded-lg overflow-hidden bg-[#D4CFC8]">
        {img && <img src={img} alt={product.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]" />}
      </div>
      <p className="mt-3 font-manrope font-semibold text-sm truncate"><span className="title-underline">{product.title}</span></p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-[#131610]/80">{formatPrice(product.price)}</p>
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
  const [size, setSize] = useState("M");
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
  }

  useEffect(() => {
    let cancelled = false;
    handleGetProductById(productId)
      .then((p) => { if (!cancelled) { setProduct(p || null); setStatus(p ? "ready" : "missing"); } })
      .catch((err) => { if (!cancelled) setStatus(err?.response?.status === 404 ? "missing" : "error"); });
    return () => { cancelled = true; };
  }, [productId, handleGetProductById]);

  // Related items come from the storefront list; fetch it when the page is opened directly
  const hasProducts = allProducts?.length > 0;
  useEffect(() => {
    if (!hasProducts) handleGetAllProducts().catch(() => {});
  }, [hasProducts, handleGetAllProducts]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const related = useMemo(
    () => (allProducts || []).filter((p) => p._id !== productId).slice(0, 4),
    [allProducts, productId]
  );

  const addToCart = () => {
    setCartCount((c) => c + qty);
    setAdded(true);
  };

  const images = Array.isArray(product?.images) ? product.images.filter((im) => im?.url) : [];
  const sellerName = typeof product?.seller === "object" ? product.seller?.fullname : null;

  const addLabel = added
    ? <><Icon d={CHECK} className="w-4 h-4 animate-pop" /> Added</>
    : "Add to cart";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{HOME_STYLES}</style>
      <Navbar user={user} cartCount={cartCount} wishCount={wished ? 1 : 0} search={search} setSearch={setSearch} />

      <main className={`flex-1 ${status === "ready" ? "pb-24 md:pb-0" : ""}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="pt-6 text-xs text-[#131610]/50 flex items-center gap-2 min-w-0">
            <Link to="/" className="hover:text-[#104292] transition-colors shrink-0">Home</Link><span aria-hidden="true">›</span>
            <Link to="/" className="hover:text-[#104292] transition-colors shrink-0">Shop</Link><span aria-hidden="true">›</span>
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
              <div className="animate-rise grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12 items-start">
                <div className="md:sticky md:top-24">
                  <Gallery key={product._id} images={images} title={product.title} />
                </div>

                <div className="flex flex-col gap-6 md:pt-2">
                  {/* Title + price */}
                  <div>
                    <Eyebrow>New Arrival</Eyebrow>
                    <h1 className="mt-3 font-manrope font-semibold text-3xl lg:text-4xl leading-tight tracking-tight break-words">{product.title}</h1>
                    <p className="mt-4 text-2xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
                    <p className="mt-1 text-xs text-[#131610]/45">Inclusive of all taxes</p>
                  </div>

                  {product.description && (
                    <p className="text-[15px] leading-relaxed text-[#131610]/60 line-clamp-3">{product.description}</p>
                  )}

                  <hr className="border-black/10" />

                  {/* Size + quantity */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest">Size <span className="text-[#131610]/45">— {size}</span></p>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                        {SIZES.map((s) => (
                          <button key={s} role="radio" aria-checked={s === size} onClick={() => setSize(s)}
                            className={`btn-press min-w-[52px] h-11 px-4 rounded-full border text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2 ${s === size ? "bg-[#131610] border-[#131610] text-white" : "bg-white border-black/10 hover:border-[#131610]"}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest">Quantity</p>
                      <div className="inline-flex items-center h-11 rounded-lg border border-black/10 bg-white">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-11 h-full text-lg disabled:text-[#131610]/25">−</button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                        <button onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10} aria-label="Increase quantity" className="w-11 h-full text-lg disabled:text-[#131610]/25">+</button>
                      </div>
                    </div>
                  </div>

                  {/* Primary action */}
                  <div className="flex gap-3">
                    <button onClick={addToCart}
                      className="btn-press flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2">
                      {addLabel}
                    </button>
                    <button onClick={() => setWished((w) => !w)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                      className="btn-press w-12 h-12 shrink-0 grid place-items-center rounded-lg border border-black/10 bg-white hover:border-[#131610] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292]">
                      <Icon key={String(wished)} d={HEART} fill={wished ? "currentColor" : "none"} className={`w-5 h-5 ${wished ? "text-[#C288A2] animate-pop" : ""}`} />
                    </button>
                  </div>

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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <p className="text-lg font-semibold tabular-nums truncate">{formatPrice(product.price)}</p>
          <button onClick={addToCart} className="btn-press ml-auto flex-1 max-w-[220px] h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">
            {addLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
