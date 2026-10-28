import { useSelector } from "react-redux";
import { useProduct } from "../hook/useProduct";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../auth/hook/useAuth";
import { getErrorMessage } from "../../../App/api.client";

const CATEGORIES = ["All", "T-shirts", "Hoodies", "Pants", "Jackets"];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "asc", label: "Price low → high" },
  { value: "desc", label: "Price high → low" },
];
const PAGE_SIZE = 8;

const formatPrice = (price) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: price?.currency || "INR", maximumFractionDigits: 0 }).format(price?.amount ?? 0);

// Real products have no category field yet, so infer one from the title
const getCategory = (p) => {
  if (p.category) return p.category;
  const t = `${p.title} ${p.description}`.toLowerCase();
  if (/hood/.test(t)) return "Hoodies";
  if (/jacket|bomber|coat/.test(t)) return "Jackets";
  if (/pant|trouser|jean|cargo/.test(t)) return "Pants";
  if (/tee|t-shirt|tshirt|shirt/.test(t)) return "T-shirts";
  return "Other";
};

/* ─── Icons ──────────────────────────────────────────────────────────── */
const Icon = ({ d, className = "w-5 h-5", fill = "none" }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const SearchIcon = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;
const HeartIcon = (p) => <Icon {...p} d={<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />} />;
const BagIcon = (p) => <Icon {...p} d={<><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>} />;
const MenuIcon = (p) => <Icon {...p} d={<path d="M4 7h16M4 12h16M4 17h16" />} />;
const CloseIcon = (p) => <Icon {...p} d={<path d="M6 6l12 12M18 6 6 18" />} />;
const PlusIcon = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
const ChevronIcon = (p) => <Icon {...p} d={<path d="m6 9 6 6 6-6" />} />;

/* ─── Reveal on scroll ───────────────────────────────────────────────── */
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
};

/* ─── Navbar ─────────────────────────────────────────────────────────── */
const NAV_LINKS = ["New In", "Men", "Women", "Collections"];

export const Navbar = ({ user, cartCount, wishCount, search, setSearch }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    setMenuOpen(false);
    await handleLogout();
    navigate("/", { replace: true });
  };
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawer]);

  const iconBtn = "relative grid place-items-center w-11 h-11 rounded-full text-[#131610] hover:text-[#104292] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#104292]";

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/10 transition-shadow duration-300 ${scrolled ? "shadow-[0_4px_20px_-12px_rgba(19,22,16,0.25)]" : ""}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button className={`${iconBtn} md:hidden -ml-2`} onClick={() => setDrawer(true)} aria-label="Open menu">
              <MenuIcon />
            </button>
            <Link to="/" className="font-manrope font-extrabold text-lg sm:text-xl tracking-[0.35em] text-[#131610]">SNITCH</Link>
          </div>

          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <li key={l}>
                <a href="#collection" className="link-underline text-[13px] font-medium tracking-wide text-[#131610]/80 hover:text-[#131610] transition-colors">{l}</a>
              </li>
            ))}
          </ul>

          <div className="flex items-center">
            <div className={`hidden sm:flex items-center overflow-hidden transition-all duration-300 ease-out ${searchOpen ? "w-48 lg:w-56 border border-black/10 rounded-lg bg-white mr-1" : "w-0"}`}>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => !search && setSearchOpen(false)}
                placeholder="Search pieces…"
                className="w-full h-9 px-3 text-sm bg-transparent outline-none placeholder:text-[#131610]/40"
              />
            </div>
            <button className={iconBtn} onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
              <SearchIcon />
            </button>
            <button className={`${iconBtn} hidden sm:grid`} aria-label="Wishlist">
              <HeartIcon />
              {wishCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C288A2]" />}
            </button>
            <button className={iconBtn} aria-label={`Cart, ${cartCount} items`}>
              <BagIcon />
              {cartCount > 0 && (
                <span key={cartCount} className="animate-pop absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C288A2] text-white text-[10px] font-semibold grid place-items-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
            {user ? (
              <div className="relative ml-1">
                <button onClick={() => setMenuOpen((o) => !o)} onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                  aria-label="Account menu" aria-expanded={menuOpen} className="w-11 h-11 grid place-items-center">
                  <span className="w-9 h-9 rounded-full bg-[#131610] text-white grid place-items-center text-sm font-semibold uppercase">
                    {(user.fullname || user.name || user.email || "U").charAt(0)}
                  </span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-lg bg-white border border-black/10 shadow-[0_8px_24px_-12px_rgba(19,22,16,0.25)]">
                    <p className="px-4 pb-2 mb-1 border-b border-black/10 text-xs text-[#131610]/55 truncate">{user.email}</p>
                    {user.role === "seller" && (
                      <Link to="/seller/dashboard" className="flex items-center h-11 px-4 text-sm hover:bg-[#FAFAFA] hover:text-[#104292]">Seller dashboard</Link>
                    )}
                    <button onMouseDown={(e) => e.preventDefault()} onClick={logout} className="w-full text-left flex items-center h-11 px-4 text-sm hover:bg-[#FAFAFA] hover:text-[#104292]">Log out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex ml-3 items-center h-9 text-[12px] font-semibold uppercase tracking-widest text-[#131610] link-underline">
                Sign in
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile search */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pieces…"
              className="w-full h-11 px-4 text-sm rounded-lg border border-black/10 bg-white outline-none focus:ring-2 focus:ring-[#104292]"
            />
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${drawer ? "" : "pointer-events-none"}`}>
        <div onClick={() => setDrawer(false)} className={`absolute inset-0 bg-[#131610]/40 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`} />
        <aside className={`absolute left-0 top-0 h-full w-[80%] max-w-xs bg-[#FAFAFA] p-6 flex flex-col transition-transform duration-300 ease-out ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex items-center justify-between mb-10">
            <span className="font-manrope font-extrabold text-lg tracking-[0.35em]">SNITCH</span>
            <button className={iconBtn} onClick={() => setDrawer(false)} aria-label="Close menu"><CloseIcon /></button>
          </div>
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l}>
                <a href="#collection" onClick={() => setDrawer(false)} className="flex items-center h-12 font-manrope text-2xl font-bold tracking-tight text-[#131610]">{l}</a>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3">
            {!user && (
              <Link to="/login" className="btn-press flex items-center justify-center h-12 rounded-lg bg-[#131610] text-white text-sm font-semibold uppercase tracking-widest">Sign in</Link>
            )}
            {user?.role === "seller" && (
              <Link to="/seller/dashboard" className="btn-press flex items-center justify-center h-12 rounded-lg bg-[#131610] text-white text-sm font-semibold uppercase tracking-widest">Seller dashboard</Link>
            )}
            {user && (
              <button onClick={() => { setDrawer(false); logout(); }} className="btn-press flex items-center justify-center h-12 rounded-lg border border-black/15 bg-white text-sm font-semibold uppercase tracking-widest">Log out</button>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

/* ─── Product card ───────────────────────────────────────────────────── */
export const ProductCard = ({ product, index, wished, onWish, onAdd }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const images = product.images?.length ? product.images : [{ url: "" }];
  const hasSecond = images.length > 1;
  const isNew = index < 3;

  return (
    <article
      ref={ref}
      style={{ transitionDelay: `${(index % 4) * 80}ms` }}
      className={`group flex flex-col transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[#D4CFC8]">
        <Link to={`/detail/${product._id}`} aria-label={product.title} className="absolute inset-0">
          <img
            src={images[0].url || undefined}
            alt={product.title}
            loading="lazy"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${hasSecond ? (hovered ? "opacity-0" : "opacity-100") : "group-hover:scale-[1.04]"}`}
          />
          {hasSecond && (
            <img
              src={images[1].url}
              alt=""
              loading="lazy"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out ${hovered ? "opacity-100 scale-[1.04]" : "opacity-0 scale-100"}`}
            />
          )}
        </Link>

        {isNew && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#C288A2] text-white text-[10px] font-semibold uppercase tracking-widest">New</span>
        )}

        <button
          onClick={() => onWish(product._id)}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wished}
          className="btn-press absolute top-2 right-2 w-11 h-11 grid place-items-center"
        >
          <span className="w-9 h-9 rounded-full bg-white/95 grid place-items-center shadow-sm">
            <HeartIcon
              key={wished ? "on" : "off"}
              className={`w-[18px] h-[18px] ${wished ? "text-[#C288A2] animate-pop" : "text-[#131610]"}`}
              fill={wished ? "currentColor" : "none"}
            />
          </span>
        </button>

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 transition-opacity duration-300 lg:group-hover:opacity-0">
            {images.slice(0, 4).map((im, i) => (
              <span key={im._id || i} className={`h-1.5 rounded-full transition-all duration-300 ${(hovered ? 1 : 0) === i ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}

        {/* Desktop quick add */}
        <button
          onClick={() => onAdd(product)}
          className="hidden lg:flex absolute inset-x-3 bottom-3 h-11 items-center justify-center rounded-lg bg-[#131610] text-white text-[11px] font-semibold uppercase tracking-widest translate-y-[calc(100%+12px)] group-hover:translate-y-0 focus-visible:translate-y-0 transition-transform duration-300 ease-out active:scale-[0.98]"
        >
          Quick Add
        </button>
      </div>

      <div className="flex flex-col flex-1 pt-4">
        <Link to={`/detail/${product._id}`} className="min-w-0">
          <h3 className="font-manrope font-semibold text-[15px] text-[#131610] truncate">
            <span className="title-underline">{product.title}</span>
          </h3>
        </Link>
        <p className="mt-1 text-[13px] leading-relaxed text-[#131610]/55 line-clamp-2 min-h-[2.6em]">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold tabular-nums tracking-wide text-[#131610] group-hover:text-[#104292] transition-colors duration-200">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={() => onAdd(product)}
            aria-label={`Add ${product.title} to cart`}
            className="btn-press lg:hidden w-11 h-11 -mr-2 grid place-items-center"
          >
            <span className="w-8 h-8 rounded-full border border-black/10 bg-white grid place-items-center"><PlusIcon className="w-4 h-4" /></span>
          </button>
        </div>
      </div>
    </article>
  );
};

const SkeletonCard = () => (
  <div className="flex flex-col">
    <div className="aspect-[4/5] rounded-md shimmer" />
    <div className="h-4 w-3/4 mt-4 rounded shimmer" />
    <div className="h-3 w-full mt-2 rounded shimmer" />
    <div className="h-3 w-1/3 mt-4 rounded shimmer" />
  </div>
);

/* ─── Footer ─────────────────────────────────────────────────────────── */
const FOOTER_COLS = [
  { title: "Shop", links: ["New In", "Men", "Women", "Collections"] },
  { title: "Help", links: ["Shipping", "Returns", "Size Guide", "Contact"] },
  { title: "Company", links: ["About", "Careers", "Sell on Snitch", "Press"] },
];

export const Footer = () => (
  <footer className="bg-[#131610] text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <p className="font-manrope font-extrabold text-2xl tracking-[0.35em]">SNITCH</p>
          <p className="mt-4 max-w-xs text-sm text-white/55 leading-relaxed">Curated streetwear and luxury minimalist silhouettes for the uninhibited generation.</p>
        </div>
        {FOOTER_COLS.map((c) => (
          <div key={c.title}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">{c.title}</p>
            <ul className="mt-4 space-y-3">
              {c.links.map((l) => (
                <li key={l}><a href="#" className="text-sm text-white/75 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-white/40">
        <span>© {new Date().getFullYear()} Snitch. All rights reserved.</span>
        <span>Designed to elevate. Made to last.</span>
      </div>
    </div>
  </footer>
);

/* ─── Page ───────────────────────────────────────────────────────────── */
const Home = () => {
  const products = useSelector((state) => state.products.products);
  const user = useSelector((state) => state.auth?.user);
  const { handleGetAllProducts } = useProduct();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    handleGetAllProducts()
      .catch((err) => setLoadError(getErrorMessage(err, "Couldn't load the collection.")))
      .finally(() => setLoading(false));
  }, [handleGetAllProducts]);

  const source = useMemo(() => products || [], [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = source.filter((p) =>
      (category === "All" || getCategory(p) === category) &&
      (!q || `${p.title} ${p.description}`.toLowerCase().includes(q))
    );
    if (sort === "asc") list = [...list].sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
    if (sort === "desc") list = [...list].sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
    return list;
  }, [source, category, sort, search]);

  // Reset pagination whenever filters change (state-during-render pattern)
  const filterKey = `${category}|${sort}|${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(PAGE_SIZE);
  }

  const toggleWish = (id) =>
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearFilters = () => {
    setCategory("All");
    setSearch("");
    setSort("newest");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#131610] font-inter overflow-x-hidden">
      <style>{HOME_STYLES}</style>

      <Navbar user={user} cartCount={cartCount} wishCount={wishlist.size} search={search} setSearch={setSearch} />

      <main id="collection" className="flex-1">
        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 md:pt-20 md:pb-14 text-center">
          <p className="animate-rise text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> The Collection
          </p>
          <h1 className="animate-rise [animation-delay:80ms] mt-4 font-cormorant font-light text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            Curated Archive
          </h1>
          <p className="animate-rise [animation-delay:160ms] mt-5 mx-auto max-w-[560px] text-[15px] leading-relaxed text-[#131610]/55">
            Premium minimalist pieces, designed for effortless elegance and enduring quality.
          </p>
        </section>

        {/* Toolbar */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-4 border-y border-black/10">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-[#131610]/60 tabular-nums">
              {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "Piece" : "Pieces"}`}
            </p>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 flex-1 min-w-0">
                {CATEGORIES.map((c) => {
                  const active = c === category;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      aria-pressed={active}
                      className={`btn-press shrink-0 h-10 px-4 rounded-full text-[12px] font-medium uppercase tracking-widest border transition-colors duration-200 ${active ? "bg-[#131610] border-[#131610] text-white" : "bg-white border-black/10 text-[#131610]/70 hover:border-[#104292] hover:text-[#104292]"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <div className="relative shrink-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort products"
                  className="appearance-none h-10 pl-4 pr-9 rounded-lg border border-black/10 bg-white text-[12px] font-medium uppercase tracking-widest text-[#131610] outline-none focus:ring-2 focus:ring-[#104292] cursor-pointer"
                >
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <ChevronIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#131610]/60" />
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center text-center py-20">
              <h2 className="font-manrope font-bold text-2xl tracking-tight">Couldn't load the collection</h2>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">{loadError}</p>
              <button onClick={() => window.location.reload()} className="btn-press mt-8 h-12 px-8 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center text-center py-20">
              <SearchIcon className="w-12 h-12 text-[#D4CFC8]" />
              <h2 className="mt-6 font-manrope font-bold text-2xl tracking-tight">No pieces found</h2>
              <p className="mt-2 max-w-sm text-sm text-[#131610]/55">Try another category or search term — the archive is always growing.</p>
              <button onClick={clearFilters} className="btn-press mt-8 h-12 px-8 rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-12">
                {filtered.slice(0, visibleCount).map((p, i) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    index={i}
                    wished={wishlist.has(p._id)}
                    onWish={toggleWish}
                    onAdd={() => setCartCount((c) => c + 1)}
                  />
                ))}
              </div>
              {visibleCount < filtered.length && (
                <div className="mt-16 flex justify-center">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="btn-press h-12 px-10 rounded-lg border border-black/15 bg-white text-[12px] font-semibold uppercase tracking-widest text-[#131610] hover:border-[#131610] transition-colors"
                  >
                    View More
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export const HOME_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Manrope:wght@500;600;700;800&display=swap');
.font-manrope { font-family: 'Manrope', 'Inter', sans-serif; }
.font-cormorant { font-family: 'Cormorant Garamond', Georgia, serif; }
.font-inter { font-family: 'Inter', sans-serif; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }

@keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.animate-rise { opacity: 0; animation: rise .7s cubic-bezier(.16,1,.3,1) forwards; }

@keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.3); } 100% { transform: scale(1); } }
.animate-pop { animation: pop .3s ease-out; }

.btn-press { transition: transform .2s ease-out; }
.btn-press:active { transform: scale(.96); }

@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
.shimmer {
  background: #D4CFC8 linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,.35) 50%, rgba(255,255,255,0) 100%) no-repeat;
  background-size: 400px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.title-underline, .link-underline {
  background-image: linear-gradient(#C288A2, #C288A2);
  background-size: 0 1px; background-position: 0 100%; background-repeat: no-repeat;
  transition: background-size .3s ease-out; padding-bottom: 2px;
}
.group:hover .title-underline, .link-underline:hover { background-size: 100% 1px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; transition-delay: 0ms !important; }
  .animate-rise { opacity: 1; }
}
`;

export default Home;
