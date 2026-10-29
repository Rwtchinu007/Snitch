import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { useAuth } from "../../auth/hook/useAuth";
import { getErrorMessage } from "../../../App/api.client";
import { PATHS } from "../../../App/paths";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "asc", label: "Price low → high" },
  { value: "desc", label: "Price high → low" },
];

const formatPrice = (amount, currency = "INR", decimals = 2) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount || 0);

/* ─── Icons ──────────────────────────────────────────────────────────── */
export const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
// eslint-disable-next-line react-refresh/only-export-components
export const I = {
  overview: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  products: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  add: <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>,
  orders: <><path d="M6 4h12v16l-3-2-3 2-3-2-3 2V4Z" /><path d="M9 9h6M9 13h4" /></>,
  analytics: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4M6 12h10" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></>,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  hanger: <><path d="M12 7a2 2 0 1 1 2-2" /><path d="M12 7v2L3 16h18l-9-7" /></>,
};

/* ─── Hooks ──────────────────────────────────────────────────────────── */
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
};

/* ─── Sidebar ────────────────────────────────────────────────────────── */
const NAV = [
  { key: "products", label: "Products", to: PATHS.sellerDashboard },
  { key: "add", label: "Add Product", to: PATHS.createProduct },
  { key: "orders", label: "Orders" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" },
];
const NAV_ITEM_H = 44;

export const SidebarContent = ({ active, setActive, user, onNavigate }) => {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  const activeIndex = NAV.findIndex((n) => n.key === active);
  const name = user?.fullname || user?.name || "Seller";

  return (
    <div className="h-full flex flex-col">
      <Link to="/" className="px-6 h-16 flex items-center font-manrope font-extrabold text-xl tracking-[0.35em] text-[#131610]">SNITCH</Link>
      <p className="px-6 mt-6 mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#131610]/40">Studio</p>
      <nav className="relative px-3">
        <span
          className="absolute left-3 right-3 rounded-lg bg-[#D4CFC8]/35 transition-transform duration-300 ease-out"
          style={{ height: NAV_ITEM_H, transform: `translateY(${activeIndex * NAV_ITEM_H}px)` }}
        >
          <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#104292]" />
        </span>
        {NAV.map((n) => {
          const isActive = n.key === active;
          return (
            <button
              key={n.key}
              onClick={() => {
                setActive(n.key);
                if (n.to) navigate(n.to);
                onNavigate?.();
              }}
              style={{ height: NAV_ITEM_H }}
              className={`relative w-full flex items-center gap-3 px-4 rounded-lg text-[13px] font-manrope font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] ${isActive ? "text-[#104292]" : "text-[#131610]/65 hover:text-[#131610]"}`}
            >
              <Icon d={I[n.key]} className="w-[18px] h-[18px]" />
              {n.label}
              {!n.to && <span className="ml-auto text-[9px] font-inter font-semibold uppercase tracking-widest text-[#131610]/30">Soon</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-black/10">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-full bg-[#131610] text-white grid place-items-center font-manrope font-bold uppercase">{name.charAt(0)}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-manrope font-bold truncate">{name}</p>
            <p className="text-[11px] text-[#131610]/50 truncate">{user?.email || "Seller account"}</p>
          </div>
          <button aria-label="Log out" onClick={async () => { await handleLogout(); navigate("/login", { replace: true }); }} className="btn-press w-11 h-11 grid place-items-center rounded-lg text-[#131610]/60 hover:text-[#131610] hover:bg-[#D4CFC8]/30 transition-colors">
            <Icon d={I.logout} className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Seller shell (sidebar + mobile top bar) ────────────────────────── */
export const SellerShell = ({ active, children }) => {
  const user = useSelector((state) => state.auth?.user);
  const [drawer, setDrawer] = useState(false);
  const [current, setCurrent] = useState(active);

  useEffect(() => {
    if (!drawer) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{DASHBOARD_STYLES}</style>
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-white border-r border-black/10 z-30">
        <SidebarContent active={current} setActive={setCurrent} user={user} />
      </aside>
      <header className="lg:hidden sticky top-0 z-30 h-16 px-4 flex items-center justify-between bg-white/85 backdrop-blur-md border-b border-black/10">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="btn-press w-11 h-11 -ml-2 grid place-items-center"><Icon d={I.menu} /></button>
        <span className="font-manrope font-extrabold text-lg tracking-[0.35em]">SNITCH</span>
        <span className="w-11" />
      </header>
      <div className={`lg:hidden fixed inset-0 z-50 ${drawer ? "" : "pointer-events-none"}`}>
        <div onClick={() => setDrawer(false)} className={`absolute inset-0 bg-[#131610]/40 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-[80%] max-w-[280px] bg-white transition-transform duration-300 ease-out ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute top-2.5 right-2 w-11 h-11 grid place-items-center z-10"><Icon d={I.close} /></button>
          <SidebarContent active={current} setActive={setCurrent} user={user} onNavigate={() => setDrawer(false)} />
        </aside>
      </div>
      <main className="lg:pl-60">{children}</main>
    </div>
  );
};

export const Toast = ({ message }) => (
  <div className="fixed z-[70] bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 pointer-events-none" aria-live="polite">
    {message && (
      <div className="animate-rise flex items-center gap-2.5 px-4 h-12 rounded-lg bg-[#131610] text-white text-sm shadow-lg">
        <span className="w-1.5 h-1.5 rounded-full bg-white" /> {message}
      </div>
    )}
  </div>
);

// eslint-disable-next-line react-refresh/only-export-components
export const stockSummary = (p) => {
  const count = p.variants?.length || 0;
  if (!count) return null;
  const stock = p.totalStock ?? p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  return `${count} ${count === 1 ? "variant" : "variants"} · ${stock.toLocaleString("en-IN")} in stock`;
};

/* ─── Product card ───────────────────────────────────────────────────── */
const SellerCard = ({ product, index }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const images = product.images?.length ? product.images : [{ url: "" }];
  const hasSecond = images.length > 1;
  const summary = stockSummary(product);
  const soldOut = product.hasVariants && !product.inStock;

  return (
    <Link
      ref={ref}
      to={PATHS.sellerProduct(product._id)}
      style={{ transitionDelay: `${(index % 4) * 70}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group h-full flex flex-col bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] overflow-hidden transition-all duration-500 ease-out hover:-translate-y-0.5 hover:border-black/20 hover:shadow-[0_10px_30px_rgba(19,22,16,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#D4CFC8]">
        <img src={images[0].url || undefined} alt={product.title} loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${hasSecond ? (hovered ? "opacity-0" : "opacity-100") : "group-hover:scale-[1.04]"}`} />
        {hasSecond && (
          <img src={images[1].url} alt="" loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${hovered ? "opacity-100 scale-[1.04]" : "opacity-0"}`} />
        )}
      </div>
      <div className="flex flex-col flex-1 p-3">
        <h3 className="font-manrope font-semibold text-[13px] sm:text-sm text-[#131610] truncate"><span className="title-underline">{product.title}</span></h3>
        <p className={`mt-1 text-[12px] ${summary ? "text-[#131610]/65" : "text-[#131610]/40"}`}>{summary || "No variants yet"}</p>
        <div className="mt-auto pt-4">
          <div className="pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2 min-w-0">
            <span className="text-sm font-semibold tabular-nums text-[#131610]">{formatPrice(product.minPrice ?? product.price?.amount, product.price?.currency)}</span>
            <StatusChip soldOut={soldOut} />
          </div>
        </div>
      </div>
    </Link>
  );
};

const StatusChip = ({ soldOut }) => soldOut ? (
  <span className="inline-flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-[10px] font-semibold uppercase tracking-widest text-[#131610]/45">Sold out</span>
) : (
  <span className="inline-flex items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full border border-[#104292]/20 text-[10px] font-semibold uppercase tracking-widest text-[#104292]">
    <span className="w-1.5 h-1.5 rounded-full bg-[#104292]" /> Live
  </span>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
    <div className="aspect-[3/4] shimmer" />
    <div className="p-4">
      <div className="h-4 w-3/4 rounded shimmer" />
      <div className="h-3 w-1/2 mt-2 rounded shimmer" />
      <div className="h-px bg-black/10 mt-4" />
      <div className="h-4 w-1/3 mt-3 rounded shimmer" />
    </div>
  </div>
);

/* ─── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGetSellerProducts } = useProduct();
  const sellerProducts = useSelector((state) => state.products.sellerProducts);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [toast, setToast] = useState(location.state?.toast || "");

  // Always refetch so variant and stock changes made on the product page show up here
  useEffect(() => {
    handleGetSellerProducts()
      .catch((err) => setLoadError(getErrorMessage(err, "Couldn't load your products.")))
      .finally(() => setLoading(false));
  }, [handleGetSellerProducts]);

  // Show a toast handed over by the previous page once, then drop it from history state
  useEffect(() => {
    if (!location.state?.toast) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // The API returns newest first
  const products = useMemo(() => sellerProducts || [], [sellerProducts]);
  const priceOf = (p) => p.minPrice ?? p.price?.amount ?? 0;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => !q || `${p.title} ${p.description}`.toLowerCase().includes(q));
    if (sort === "asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    return list;
  }, [products, search, sort]);

  const totalStock = products.reduce((s, p) => s + (p.totalStock || 0), 0);
  const goAdd = () => navigate(PATHS.createProduct);

  return (
    <SellerShell active="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        {/* Header */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> Seller Studio
            </p>
            <h1 className="animate-rise [animation-delay:60ms] mt-3 font-cormorant font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">Products</h1>
            <p className="animate-rise [animation-delay:120ms] mt-3 text-sm text-[#131610]/55 tabular-nums">
              {loading ? "Loading…" : `${products.length} ${products.length === 1 ? "product" : "products"} · ${totalStock.toLocaleString("en-IN")} in stock`}
            </p>
          </div>
          <button onClick={goAdd} className="animate-rise [animation-delay:180ms] btn-press w-full md:w-auto h-12 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2">
            <Icon d={I.plus} className="w-4 h-4" /> Add Product
          </button>
        </section>

        {/* Toolbar */}
        <section className="mt-10 flex flex-col sm:flex-row gap-3 pb-5 border-b border-black/10">
          <label className="relative flex-1 sm:max-w-xs">
            <Icon d={I.search} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#131610]/40 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" aria-label="Search products"
              className="w-full h-11 pl-9 pr-3 rounded-lg border border-black/10 bg-white text-base sm:text-sm outline-none placeholder:text-[#131610]/40 focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20 transition" />
          </label>
          <div className="relative sm:ml-auto">
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"
              className="w-full appearance-none h-11 pl-4 pr-9 rounded-lg border border-black/10 bg-white text-[12px] font-medium uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-[#104292]/20 focus:border-[#104292]">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Icon d={I.chevron} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#131610]/50" />
          </div>
        </section>

        <section className="pt-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-dashed border-[#D4CFC8]">
              <h3 className="font-manrope font-bold text-2xl tracking-tight">Couldn't load your products</h3>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">{loadError}</p>
              <button onClick={() => window.location.reload()} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Try again</button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-dashed border-[#D4CFC8]">
              <Icon d={search ? I.search : I.hanger} className="w-12 h-12 text-[#D4CFC8]" />
              <h3 className="mt-6 font-manrope font-bold text-2xl tracking-tight">{search ? "No products match" : "No products yet"}</h3>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">
                {search ? `Nothing matches “${search}”. Try a different search.` : "Use Add Product above to list your first piece."}
              </p>
              {search && (
                <button onClick={() => setSearch("")} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Clear search</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8">
              {visible.map((p, i) => <SellerCard key={p._id} product={p} index={i} />)}
            </div>
          )}
        </section>
      </div>
      <Toast message={toast} />
    </SellerShell>
  );
};

const DASHBOARD_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@500;600;700;800&display=swap');
.font-manrope { font-family: 'Manrope', 'Inter', sans-serif; }
.font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
.font-inter { font-family: 'Inter', sans-serif; }

@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.animate-rise { opacity: 0; animation: rise .6s cubic-bezier(.16,1,.3,1) forwards; }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
.animate-fade { animation: fade .2s ease-out; }

.btn-press { transition: transform .2s ease-out, background-color .2s ease-out, color .2s ease-out; }
.btn-press:active { transform: scale(.96); }

@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.shimmer {
  background: #D4CFC8 linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 100%) no-repeat;
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.title-underline {
  background-image: linear-gradient(#C288A2, #C288A2);
  background-size: 0 1px; background-position: 0 100%; background-repeat: no-repeat;
  transition: background-size .3s ease-out; padding-bottom: 2px;
}
.group:hover .title-underline { background-size: 100% 1px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; transition-delay: 0ms !important; }
  .animate-rise { opacity: 1; }
}
`;

export default Dashboard;
