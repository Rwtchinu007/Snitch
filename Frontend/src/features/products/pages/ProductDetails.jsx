import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { Navbar, Footer, ProductCard, HOME_STYLES } from "./Home";

/* ─── UI-only placeholders (not in the product data yet) ─────────────── */
const SIZES = [
  { label: "XS", available: true },
  { label: "S", available: true },
  { label: "M", available: true },
  { label: "L", available: true },
  { label: "XL", available: false },
];
const STOCK_LEFT = 4;

const formatPrice = (price) =>
  new Intl.NumberFormat(price?.currency === "INR" || !price?.currency ? "en-IN" : "en-US", {
    style: "currency", currency: price?.currency || "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(price?.amount ?? 0);

/* ─── Icons ──────────────────────────────────────────────────────────── */
const Icon = ({ d, className = "w-5 h-5", fill = "none" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const P = {
  left: <path d="m15 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  truck: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17" cy="17.5" r="1.5" /></>,
  returns: <><path d="M4 9h11a5 5 0 0 1 0 10H9" /><path d="m8 5-4 4 4 4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  hanger: <><path d="M12 7a2 2 0 1 1 2-2" /><path d="M12 7v2L3 16h18l-9-7" /></>,
};

/* ─── Gallery ────────────────────────────────────────────────────────── */
const Gallery = ({ images, title }) => {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(null); // { x, y } in %
  const touchX = useRef(null);
  const count = images.length;
  const go = (i) => setActive((i + count) % count);

  return (
    <div className="animate-rise flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnails (desktop / tablet) */}
      {count > 1 && (
        <div className="hidden sm:flex lg:flex-col gap-3 lg:w-20 shrink-0 overflow-x-auto lg:overflow-visible no-scrollbar">
          {images.slice(0, 7).map((im, i) => (
            <button key={im._id || i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} aria-current={i === active}
              className={`btn-press shrink-0 w-16 lg:w-20 aspect-[4/5] rounded-md overflow-hidden bg-[#D4CFC8] border transition-colors duration-200 ${i === active ? "border-[#131610]" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={im.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Main stage with arched backdrop */}
      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-x-[6%] top-[4%] bottom-0 rounded-t-full bg-[#D4CFC8]/70" aria-hidden="true" />
        <div
          className="relative aspect-[4/5] mx-auto w-[88%] mt-[8%] rounded-t-[999px] rounded-b-xl overflow-hidden bg-[#D4CFC8] cursor-zoom-in"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
            touchX.current = null;
          }}
        >
          {images.map((im, i) => (
            <img key={im._id || i} src={im.url} alt={i === active ? title : ""} aria-hidden={i !== active}
              style={zoom && i === active ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-300 ease-out ${i === active ? "opacity-100" : "opacity-0"} ${zoom && i === active ? "lg:scale-[1.6]" : "scale-100"}`} />
          ))}

          {count > 1 && (
            <>
              {[{ dir: -1, icon: P.left, label: "Previous image", pos: "left-2" }, { dir: 1, icon: P.right, label: "Next image", pos: "right-2" }].map((a) => (
                <button key={a.dir} onClick={() => go(active + a.dir)} aria-label={a.label}
                  className={`btn-press absolute ${a.pos} top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center`}>
                  <span className="w-9 h-9 rounded-full bg-white/90 shadow-sm grid place-items-center text-[#131610]"><Icon d={a.icon} className="w-4 h-4" /></span>
                </button>
              ))}
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-semibold tabular-nums tracking-wider">{active + 1} / {count}</span>
              <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />)}
              </div>
            </>
          )}
        </div>

        {/* Social-proof chips */}
        <div className="hidden lg:flex absolute left-0 top-[22%] float-chip items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_8px_24px_-12px_rgba(19,22,16,0.25)]">
          <span className="w-7 h-7 rounded-full bg-[#131610] text-white grid place-items-center"><Icon d={P.bag} className="w-3.5 h-3.5" /></span>
          <span className="text-xs font-medium">Someone just purchased this</span>
        </div>
        <div className="hidden lg:flex absolute right-0 bottom-[18%] float-chip [animation-delay:-2s] items-center gap-2.5 pl-2 pr-4 py-2 rounded-full bg-white/70 backdrop-blur-md border border-white/80 shadow-[0_8px_24px_-12px_rgba(19,22,16,0.25)]">
          <span className="w-7 h-7 rounded-full bg-[#C288A2] text-white grid place-items-center"><Icon d={P.heart} className="w-3.5 h-3.5" fill="currentColor" /></span>
          <span className="text-xs font-medium tabular-nums">12 people liked this piece</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Accordion ──────────────────────────────────────────────────────── */
const Accordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t border-black/10">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.title} className="border-b border-black/10">
            <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen}
              className="w-full min-h-[56px] flex items-center justify-between text-left text-[12px] font-semibold uppercase tracking-widest text-[#131610] hover:text-[#104292] transition-colors">
              {it.title}
              <span className="relative w-4 h-4 shrink-0" aria-hidden="true">
                <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                <span className={`absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 ease-out ${isOpen ? "scale-y-0" : "scale-y-100"}`} />
              </span>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <div className="pb-5 text-sm leading-relaxed text-[#131610]/60">{it.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Skeleton / not found ───────────────────────────────────────────── */
const DetailsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-16">
    <div className="aspect-[4/5] rounded-t-[999px] rounded-b-xl shimmer w-[88%] mx-auto" />
    <div className="flex flex-col gap-4 pt-4">
      <div className="h-3 w-24 rounded shimmer" />
      <div className="h-12 w-4/5 rounded shimmer" />
      <div className="h-8 w-40 rounded shimmer" />
      <div className="h-16 w-full rounded shimmer mt-2" />
      <div className="flex gap-2 mt-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="w-12 h-12 rounded-lg shimmer" />)}</div>
      <div className="h-12 w-full rounded-lg shimmer mt-6" />
      <div className="h-12 w-full rounded-lg shimmer" />
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
  const railRef = useRef(null);

  // Reset to loading whenever the route changes (state-during-render pattern)
  const [prevId, setPrevId] = useState(productId);
  if (prevId !== productId) {
    setPrevId(productId);
    setStatus("loading");
    setQty(1);
  }

  useEffect(() => {
    let cancelled = false;
    window.scrollTo({ top: 0 });
    handleGetProductById(productId)
      .then((p) => { if (!cancelled) { setProduct(p || null); setStatus(p ? "ready" : "missing"); } })
      .catch((err) => { if (!cancelled) setStatus(err?.response?.status === 404 ? "missing" : "error"); });
    return () => { cancelled = true; };
  }, [productId, handleGetProductById]);

  // Related products come from the storefront list; fetch it if this page was opened directly
  const hasProducts = allProducts?.length > 0;
  useEffect(() => {
    if (!hasProducts) handleGetAllProducts().catch(() => {});
  }, [hasProducts, handleGetAllProducts]);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(t);
  }, [added]);

  const related = useMemo(() => {
    const pool = allProducts || [];
    return pool.filter((p) => p._id !== productId).slice(0, 8);
  }, [allProducts, productId]);

  const addToCart = () => {
    setCartCount((c) => c + qty);
    setAdded(true);
  };

  const scrollRail = (dir) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const images = product?.images?.length ? product.images : [{ url: "" }];
  const oldPrice = product ? { ...product.price, amount: Math.round(product.price.amount * 1.25) } : null;
  const [firstWord, ...restWords] = (product?.title || "").split(" ");

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{HOME_STYLES}{STYLES}</style>
      <Navbar user={user} cartCount={cartCount} wishCount={wished ? 1 : 0} search={search} setSearch={setSearch} />

      <main className="flex-1 pb-24 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
          <nav aria-label="Breadcrumb" className="text-xs text-[#131610]/50 flex items-center gap-2 min-w-0">
            <Link to="/" className="hover:text-[#104292] transition-colors shrink-0">Home</Link><span>›</span>
            <Link to="/" className="hover:text-[#104292] transition-colors shrink-0">Shop</Link><span>›</span>
            <span className="text-[#131610]/80 truncate">{product?.title || "…"}</span>
          </nav>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pb-24">
          {status === "loading" ? (
            <DetailsSkeleton />
          ) : status === "error" ? (
            <div className="flex flex-col items-center text-center py-24">
              <h1 className="font-manrope font-bold text-2xl sm:text-3xl tracking-tight">Couldn't load this piece</h1>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">Check your connection and try again.</p>
              <button onClick={() => window.location.reload()} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Try again</button>
            </div>
          ) : status === "missing" ? (
            <div className="flex flex-col items-center text-center py-24">
              <Icon d={P.hanger} className="w-12 h-12 text-[#D4CFC8]" />
              <h1 className="mt-6 font-manrope font-bold text-2xl sm:text-3xl tracking-tight">This piece is no longer available</h1>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">It may have sold out or been removed by the seller. There's plenty more in the archive.</p>
              <button onClick={() => navigate("/")} className="btn-press mt-8 h-12 px-8 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">Back to shop</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-10 lg:gap-16 items-start">
              <div className="lg:sticky lg:top-24"><Gallery key={product._id} images={images} title={product.title} /></div>

              {/* Info */}
              <div className="animate-rise [animation-delay:120ms] flex flex-col">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> New Drop
                  </p>
                  <span className="px-2.5 py-1 rounded-full border border-[#C288A2]/50 text-[#C288A2] text-[10px] font-semibold uppercase tracking-widest">Best Seller</span>
                </div>

                <h1 className="mt-4 font-manrope font-extrabold text-4xl sm:text-5xl lg:text-[56px] leading-[1.02] tracking-[-0.03em] break-words">
                  <span className="relative inline-block">
                    {firstWord}
                    <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute -inset-x-3 -inset-y-2 w-[calc(100%+24px)] h-[calc(100%+16px)] text-[#104292] pointer-events-none" aria-hidden="true">
                      <path d="M10 32C12 12 70 6 110 7s82 9 82 25-48 23-96 22S6 48 12 26c4-12 30-18 60-20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="scribble" />
                    </svg>
                  </span>
                  {restWords.length > 0 && ` ${restWords.join(" ")}`}
                </h1>

                <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                  <span className="font-manrope font-bold text-3xl tabular-nums">{formatPrice(product.price)}</span>
                  <span className="text-base text-[#131610]/40 line-through tabular-nums">{formatPrice(oldPrice)}</span>
                </div>
                <p className="mt-1 text-xs text-[#131610]/45">Inclusive of all taxes</p>

                <p className="mt-6 text-[15px] leading-relaxed text-[#131610]/60 line-clamp-3">{product.description}</p>

                {/* Size */}
                <div className="mt-8">
                  <div className="flex items-baseline justify-between mb-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest">Size — <span className="text-[#131610]/55">{size}</span></p>
                    <button className="text-xs text-[#104292] underline underline-offset-4 min-h-[44px] sm:min-h-0">Size guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                    {SIZES.map((s) => {
                      const selected = s.label === size;
                      return (
                        <button key={s.label} role="radio" aria-checked={selected} disabled={!s.available} onClick={() => setSize(s.label)}
                          className={`btn-press min-w-[52px] h-12 px-4 rounded-lg border text-sm font-medium transition-colors duration-200
                            ${selected ? "bg-[#131610] border-[#131610] text-white" : s.available ? "bg-white border-black/10 hover:border-[#131610]" : "bg-transparent border-black/10 text-[#131610]/30 line-through cursor-not-allowed"}`}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="inline-flex items-center h-12 rounded-lg border border-black/10 bg-white">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="w-12 h-full text-lg disabled:text-[#131610]/25">−</button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(STOCK_LEFT, q + 1))} disabled={qty >= STOCK_LEFT} aria-label="Increase quantity" className="w-12 h-full text-lg disabled:text-[#131610]/25">+</button>
                  </div>
                  <p className="text-xs text-[#131610]/50 inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#C288A2]" /> Only a few left</p>
                </div>

                {/* Actions */}
                <div className="mt-8 flex gap-3">
                  <button onClick={addToCart}
                    className="btn-press flex-1 h-14 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2">
                    {added ? <><Icon d={P.check} className="w-4 h-4 animate-pop" /> Added</> : "Add to cart"}
                  </button>
                  <button onClick={() => setWished((w) => !w)} aria-pressed={wished} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                    className={`btn-press w-14 h-14 shrink-0 grid place-items-center rounded-lg border bg-white transition-colors ${wished ? "border-[#C288A2]/60" : "border-black/10 hover:border-[#131610]"}`}>
                    <Icon key={String(wished)} d={P.heart} fill={wished ? "currentColor" : "none"} className={`w-5 h-5 ${wished ? "text-[#C288A2] animate-pop" : ""}`} />
                  </button>
                </div>
                <button onClick={() => { addToCart(); }} className="btn-press mt-3 h-14 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest hover:border-[#131610] transition-colors">Buy now</button>

                {/* Trust */}
                <ul className="mt-8 grid grid-cols-3 gap-2 py-5 border-y border-black/10">
                  {[{ i: P.truck, t: "Free shipping" }, { i: P.returns, t: "Easy returns" }, { i: P.lock, t: "Secure payment" }].map((x) => (
                    <li key={x.t} className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left text-xs text-[#131610]/65">
                      <Icon d={x.i} className="w-5 h-5 text-[#131610]" /> {x.t}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Accordion items={[
                    { title: "Description", body: product.description || "A considered essential from the Snitch archive." },
                    { title: "Fabric & Care", body: "Premium natural fibres. Machine wash cold, inside out, with similar colours. Do not tumble dry. Iron on low heat." },
                    { title: "Shipping & Returns", body: "Free shipping on all orders, dispatched within 48 hours. Easy 15-day returns and exchanges on unworn pieces with tags attached." },
                  ]} />
                </div>

                {/* Seller */}
                <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-white border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)]">
                  <span className="w-11 h-11 shrink-0 rounded-full bg-[#131610] text-white grid place-items-center font-manrope font-bold">S</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#131610]/45">Sold by</p>
                    <p className="font-manrope font-bold text-sm truncate">Snitch Studio Seller</p>
                  </div>
                  <Link to="/" className="text-xs font-medium text-[#104292] underline underline-offset-4 min-h-[44px] inline-flex items-center">View all pieces</Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Related */}
        {status !== "missing" && related.length > 0 && (
          <section className="border-t border-black/10 py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> Curated for you</p>
                  <h2 className="mt-3 font-cormorant font-light text-4xl sm:text-5xl tracking-tight">You might also like</h2>
                </div>
                <div className="hidden sm:flex gap-2">
                  {[{ d: -1, i: P.left, l: "Scroll left" }, { d: 1, i: P.right, l: "Scroll right" }].map((b) => (
                    <button key={b.d} onClick={() => scrollRail(b.d)} aria-label={b.l} className="btn-press w-11 h-11 rounded-full border border-black/15 bg-white grid place-items-center hover:border-[#131610] transition-colors">
                      <Icon d={b.i} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
              <div ref={railRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
                {related.map((p, i) => (
                  <div key={p._id} className="snap-start shrink-0 w-[70%] min-[480px]:w-[45%] md:w-[31%] lg:w-[calc(25%-18px)]">
                    <ProductCard product={p} index={i + 3} wished={false} onWish={() => {}} onAdd={() => setCartCount((c) => c + 1)} />
                  </div>
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <button onClick={() => navigate("/")} className="btn-press h-12 px-10 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest hover:border-[#131610] transition-colors">View more</button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Mobile sticky bar */}
      {status === "ready" && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-black/10 px-4 py-3 flex items-center gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#131610]/45">Price</p>
            <p className="font-manrope font-bold text-lg tabular-nums truncate">{formatPrice(product.price)}</p>
          </div>
          <button onClick={addToCart} className="btn-press ml-auto flex-1 max-w-[240px] h-12 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">
            {added ? <><Icon d={P.check} className="w-4 h-4" /> Added</> : "Add to cart"}
          </button>
        </div>
      )}
    </div>
  );
};

const STYLES = `
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.float-chip { animation: float 5s ease-in-out infinite, rise .8s cubic-bezier(.16,1,.3,1) both; }
@keyframes scribble { from { stroke-dashoffset: 520; } to { stroke-dashoffset: 0; } }
.scribble { stroke-dasharray: 520; stroke-dashoffset: 520; animation: scribble 1.1s .4s ease-out forwards; }
@media (prefers-reduced-motion: reduce) { .scribble { stroke-dashoffset: 0; } }
`;

export default ProductDetails;
