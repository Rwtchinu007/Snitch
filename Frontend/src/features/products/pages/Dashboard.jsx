import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { useAuth } from "../../auth/hook/useAuth";
import { getErrorMessage } from "../../../App/api.client";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "asc", label: "Price low → high" },
  { value: "desc", label: "Price high → low" },
];

const formatPrice = (amount, currency = "INR", decimals = 2) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount || 0);

// Mongo ObjectIds encode their creation time in the first 4 bytes
const createdAt = (p) => {
  if (p.createdAt) return new Date(p.createdAt);
  const ts = parseInt(String(p._id).slice(0, 8), 16);
  return Number.isFinite(ts) && String(p._id).length === 24 ? new Date(ts * 1000) : null;
};

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

const useCountUp = (target, run, duration = 900) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf;
    const start = performance.now() - (reduced ? duration : 0);
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return value;
};

/* ─── Sidebar ────────────────────────────────────────────────────────── */
const NAV = [
  { key: "overview", label: "Overview", to: "/seller/dashboard" },
  { key: "products", label: "Products", to: "/seller/dashboard#products" },
  { key: "add", label: "Add Product", to: "/seller/create-product" },
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
                if (n.key === "products") document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
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

/* ─── Stat card ──────────────────────────────────────────────────────── */
const StatCard = ({ label, value, format, note, accent, index, run }) => {
  const animated = useCountUp(typeof value === "number" ? value : 0, run);
  return (
    <div
      style={{ animationDelay: `${120 + index * 80}ms` }}
      className="animate-rise bg-white rounded-xl border border-black/10 border-t-2 border-t-[#131610] shadow-[0_1px_2px_rgba(19,22,16,0.04)] p-5 sm:p-6"
    >
      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-[#131610]/50">{label}</p>
      <p className={`mt-3 font-manrope font-bold text-2xl sm:text-3xl tracking-tight tabular-nums truncate ${accent ? "text-[#104292]" : "text-[#131610]"}`}>
        {typeof value === "number" ? format(animated) : value}
      </p>
      <p className="mt-1.5 text-xs text-[#131610]/45 truncate">{note}</p>
    </div>
  );
};

/* ─── Product card (grid) ────────────────────────────────────────────── */
const SellerCard = ({ product, index, onEdit, onDelete }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const images = product.images?.length ? product.images : [{ url: "" }];
  const hasSecond = images.length > 1;

  return (
    <article
      ref={ref}
      style={{ transitionDelay: `${(index % 4) * 70}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group h-full flex flex-col bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] overflow-hidden transition-all duration-500 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#D4CFC8]">
        <img src={images[0].url || undefined} alt={product.title} loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${hasSecond ? (hovered ? "opacity-0" : "opacity-100") : "group-hover:scale-[1.04]"}`} />
        {hasSecond && (
          <img src={images[1].url} alt="" loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${hovered ? "opacity-100 scale-[1.04]" : "opacity-0"}`} />
        )}

        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full border border-white/60 bg-white/85 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-widest text-[#131610]">
          {product.images?.length || 0} {product.images?.length === 1 ? "Photo" : "Photos"}
        </span>

        <div className="absolute top-2 right-2 flex gap-1 lg:opacity-0 lg:translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:focus-within:opacity-100 transition-all duration-200 ease-out">
          {[
            { label: "Edit", icon: I.edit, fn: onEdit },
            { label: "Delete", icon: I.trash, fn: onDelete },
          ].map((a) => (
            <button key={a.label} onClick={() => a.fn(product)} aria-label={`${a.label} ${product.title}`} className="btn-press w-11 h-11 grid place-items-center">
              <span className="w-9 h-9 rounded-full bg-white shadow-sm grid place-items-center text-[#131610] hover:text-[#104292] transition-colors">
                <Icon d={a.icon} className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>

        {hasSecond && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 5).map((im, i) => (
              <span key={im._id || i} className={`h-1.5 rounded-full transition-all duration-300 ${(hovered ? 1 : 0) === i ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-manrope font-semibold text-[15px] text-[#131610] truncate"><Link to={`/product/${product._id}`} className="title-underline">{product.title}</Link></h3>
        <p className="mt-1 text-[13px] leading-relaxed text-[#131610]/55 line-clamp-2 min-h-[2.6em]">{product.description}</p>
        <div className="mt-auto pt-4">
          <div className="pt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-sm font-semibold tabular-nums text-[#131610]">{formatPrice(product.price?.amount, product.price?.currency)}</span>
            <StatusChip />
          </div>
        </div>
      </div>
    </article>
  );
};

const StatusChip = () => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#C288A2]/40 text-[10px] font-semibold uppercase tracking-widest text-[#C288A2]">
    <span className="w-1.5 h-1.5 rounded-full bg-[#C288A2]" /> Live
  </span>
);

/* ─── Product table (list) ───────────────────────────────────────────── */
const ProductTable = ({ products, onEdit, onDelete }) => (
  <div className="animate-rise bg-white rounded-xl border border-black/10 shadow-[0_1px_2px_rgba(19,22,16,0.04)] overflow-x-auto">
    <table className="w-full text-left min-w-[640px]">
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-black/10">
          {["Product", "Description", "Price", "Images", "Status", ""].map((h, i) => (
            <th key={i} className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-widest text-[#131610]/50 ${h === "Price" ? "text-right" : ""}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {products.map((p) => (
          <tr key={p._id} className="group hover:bg-[#FAFAFA] transition-colors">
            <td className="px-5 py-3">
              <div className="flex items-center gap-3">
                <img src={p.images?.[0]?.url} alt="" className="w-12 h-[60px] rounded-md object-cover bg-[#D4CFC8] shrink-0" />
                <span className="font-manrope font-semibold text-sm text-[#131610] truncate max-w-[180px]"><Link to={`/product/${p._id}`} className="title-underline">{p.title}</Link></span>
              </div>
            </td>
            <td className="px-5 py-3 text-[13px] text-[#131610]/55 max-w-[280px]"><span className="line-clamp-2">{p.description}</span></td>
            <td className="px-5 py-3 text-sm font-semibold tabular-nums text-right whitespace-nowrap">{formatPrice(p.price?.amount, p.price?.currency)}</td>
            <td className="px-5 py-3 text-sm tabular-nums text-[#131610]/70">{p.images?.length || 0}</td>
            <td className="px-5 py-3"><StatusChip /></td>
            <td className="px-3 py-3">
              <div className="flex justify-end">
                <button onClick={() => onEdit(p)} aria-label={`Edit ${p.title}`} className="btn-press w-11 h-11 grid place-items-center rounded-lg text-[#131610]/60 hover:text-[#104292] transition-colors"><Icon d={I.edit} className="w-4 h-4" /></button>
                <button onClick={() => onDelete(p)} aria-label={`Delete ${p.title}`} className="btn-press w-11 h-11 grid place-items-center rounded-lg text-[#131610]/60 hover:text-[#131610] transition-colors"><Icon d={I.trash} className="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-black/10 overflow-hidden">
    <div className="aspect-[4/5] shimmer" />
    <div className="p-4">
      <div className="h-4 w-3/4 rounded shimmer" />
      <div className="h-3 w-full mt-2 rounded shimmer" />
      <div className="h-3 w-2/3 mt-1.5 rounded shimmer" />
      <div className="h-px bg-black/10 mt-4" />
      <div className="h-4 w-1/3 mt-3 rounded shimmer" />
    </div>
  </div>
);

/* ─── Dashboard ──────────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { handleGetSellerProducts, handleDeleteProduct } = useProduct();
  const sellerProducts = useSelector((state) => state.products.sellerProducts);
  const user = useSelector((state) => state.auth?.user);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [activeNav, setActiveNav] = useState("overview");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    handleGetSellerProducts()
      .catch((err) => setLoadError(getErrorMessage(err, "Couldn't load your products.")))
      .finally(() => setLoading(false));
  }, [handleGetSellerProducts]);

  useEffect(() => {
    document.body.style.overflow = drawer || toDelete ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer, toDelete]);

  useEffect(() => {
    if (!toDelete) return;
    const onKey = (e) => e.key === "Escape" && !deleting && setToDelete(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toDelete, deleting]);

  // The API returns newest first
  const products = useMemo(() => sellerProducts || [], [sellerProducts]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter((p) => !q || `${p.title} ${p.description}`.toLowerCase().includes(q));
    if (sort === "asc") list = [...list].sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
    else if (sort === "desc") list = [...list].sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
    return list;
  }, [products, search, sort]);

  const totalValue = products.reduce((s, p) => s + (p.price?.amount || 0), 0);
  const avgPrice = products.length ? totalValue / products.length : 0;
  const latest = products[0];
  const latestDate = latest && createdAt(latest);

  const firstName = (user?.fullname || user?.name || "").split(" ")[0];
  const goAdd = () => navigate("/seller/create-product");

  const closeDelete = () => {
    if (deleting) return;
    setToDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await handleDeleteProduct(toDelete._id);
      setToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Couldn't delete this piece. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{DASHBOARD_STYLES}</style>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-white border-r border-black/10 z-30">
        <SidebarContent active={activeNav} setActive={setActiveNav} user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-16 px-4 flex items-center justify-between bg-white/85 backdrop-blur-md border-b border-black/10">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="btn-press w-11 h-11 -ml-2 grid place-items-center"><Icon d={I.menu} /></button>
        <span className="font-manrope font-extrabold text-lg tracking-[0.35em]">SNITCH</span>
        <button onClick={goAdd} aria-label="Add product" className="btn-press w-11 h-11 -mr-2 grid place-items-center"><Icon d={I.plus} /></button>
      </header>

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed inset-0 z-50 ${drawer ? "" : "pointer-events-none"}`}>
        <div onClick={() => setDrawer(false)} className={`absolute inset-0 bg-[#131610]/40 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute inset-y-0 left-0 w-[80%] max-w-[280px] bg-white transition-transform duration-300 ease-out ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute top-2.5 right-2 w-11 h-11 grid place-items-center z-10"><Icon d={I.close} /></button>
          <SidebarContent active={activeNav} setActive={setActiveNav} user={user} onNavigate={() => setDrawer(false)} />
        </aside>
      </div>

      <main className="lg:pl-60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
          {/* Header */}
          <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> Seller Studio
              </p>
              <h1 className="animate-rise [animation-delay:60ms] mt-3 font-cormorant font-light text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
                {firstName ? `Welcome back, ${firstName}` : "Your Collection"}
              </h1>
              <p className="animate-rise [animation-delay:120ms] mt-3 text-[15px] text-[#131610]/55">Manage your pieces, pricing and imagery in one place.</p>
            </div>
            <button onClick={goAdd} className="animate-rise [animation-delay:180ms] btn-press w-full md:w-auto h-12 px-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292] focus-visible:ring-offset-2">
              <Icon d={I.plus} className="w-4 h-4" /> Add Product
            </button>
          </section>

          {/* Stats */}
          <section className="mt-10 lg:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[124px] sm:h-[136px] rounded-xl shimmer" />)
            ) : (
              <>
                <StatCard index={0} run label="Total Products" value={products.length} format={(v) => Math.round(v)} note="Pieces listed" />
                <StatCard index={1} run accent label="Inventory Value" value={totalValue} format={(v) => formatPrice(v, "INR", 0)} note="Sum of listed prices" />
                <StatCard index={2} run label="Average Price" value={avgPrice} format={(v) => formatPrice(v, "INR", 0)} note="Per piece" />
                <StatCard index={3} label="Latest Upload"
                  value={latestDate ? latestDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                  note={latest?.title || "Nothing yet"} />
              </>
            )}
          </section>

          {/* Products */}
          <section id="products" className="mt-12 lg:mt-16 scroll-mt-20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-5 border-b border-black/10">
              <div className="flex items-baseline gap-3">
                <h2 className="font-manrope font-bold text-2xl tracking-tight">Products</h2>
                <span className="text-[12px] font-semibold uppercase tracking-widest text-[#131610]/45 tabular-nums">{loading ? "—" : visible.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <label className="relative flex-1 min-w-[180px] sm:flex-none">
                  <Icon d={I.search} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#131610]/40 pointer-events-none" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pieces…" aria-label="Search products"
                    className="w-full sm:w-60 h-11 pl-9 pr-3 rounded-lg border border-black/10 bg-white text-sm outline-none placeholder:text-[#131610]/40 focus:border-[#104292] focus:ring-2 focus:ring-[#104292]/20 transition" />
                </label>
                <div className="relative">
                  <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"
                    className="appearance-none h-11 pl-4 pr-9 rounded-lg border border-black/10 bg-white text-[12px] font-medium uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-[#104292]/20 focus:border-[#104292]">
                    {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <Icon d={I.chevron} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#131610]/50" />
                </div>
                <div className="flex h-11 p-1 rounded-lg border border-black/10 bg-white" role="group" aria-label="View mode">
                  {["grid", "list"].map((v) => (
                    <button key={v} onClick={() => setView(v)} aria-pressed={view === v} aria-label={`${v} view`}
                      className={`w-10 grid place-items-center rounded-md transition-colors duration-200 ${view === v ? "bg-[#131610] text-white" : "text-[#131610]/50 hover:text-[#131610]"}`}>
                      <Icon d={I[v]} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8">
              {loading ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10">
                  {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-dashed border-[#D4CFC8]">
                  <h3 className="font-manrope font-bold text-2xl tracking-tight">Couldn't load your pieces</h3>
                  <p className="mt-2 max-w-sm text-sm text-[#131610]/55">{loadError}</p>
                  <button onClick={() => window.location.reload()} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Try again</button>
                </div>
              ) : visible.length === 0 ? (
                <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-dashed border-[#D4CFC8]">
                  <Icon d={search ? I.search : I.hanger} className="w-12 h-12 text-[#D4CFC8]" />
                  <h3 className="mt-6 font-manrope font-bold text-2xl tracking-tight">{search ? "No pieces match" : "No pieces listed yet"}</h3>
                  <p className="mt-2 max-w-sm text-sm text-[#131610]/55">
                    {search ? `Nothing matches “${search}”. Try a different search.` : "Your collection is a blank canvas. List your first piece to start selling on Snitch."}
                  </p>
                  {search ? (
                    <button onClick={() => setSearch("")} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Clear search</button>
                  ) : (
                    <button onClick={goAdd} className="btn-press mt-8 h-12 px-8 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">Add your first product</button>
                  )}
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-6 gap-y-10">
                  {visible.map((p, i) => (
                    <SellerCard key={p._id} product={p} index={i} onEdit={(x) => navigate(`/seller/edit-product/${x._id}`)} onDelete={setToDelete} />
                  ))}
                </div>
              ) : (
                <ProductTable products={visible} onEdit={(x) => navigate(`/seller/edit-product/${x._id}`)} onDelete={setToDelete} />
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Delete modal */}
      {toDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div onClick={closeDelete} className="absolute inset-0 bg-[#131610]/45 backdrop-blur-[2px] animate-fade" />
          <div className="animate-rise relative w-full max-w-sm bg-white rounded-xl border border-black/10 shadow-xl p-6 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#131610]/45 inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C288A2]" /> Remove piece
            </p>
            <h3 id="delete-title" className="mt-3 font-manrope font-bold text-xl tracking-tight">Delete “{toDelete.title}”?</h3>
            <p className="mt-2 text-sm text-[#131610]/55 leading-relaxed">This piece will be removed from your collection and the storefront. This can’t be undone.</p>
            {deleteError && <p role="alert" className="mt-3 text-xs text-[#B4534B]">{deleteError}</p>}
            <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
              <button autoFocus onClick={closeDelete} disabled={deleting} className="btn-press flex-1 h-11 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="btn-press flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest disabled:opacity-60">{deleting && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}{deleting ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
