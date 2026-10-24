import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProduct } from "../hook/useProduct";
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";

/* ─── Mock data (shown when API returns nothing / while offline) ─── */
const MOCK_PRODUCTS = [
  {
    _id: "mock001",
    title: "Oversized Tshirts",
    description: "300 GSM, oversized fit, pure cotton. Breathable and durable for everyday wear.",
    price: { amount: 1200.04, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&q=80", _id: "i1" },
      { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80", _id: "i2" },
      { url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80", _id: "i3" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock002",
    title: "Slim Fit Chinos",
    description: "Mid-rise slim fit chinos in stretch cotton twill. Perfect for smart-casual looks.",
    price: { amount: 1849.00, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80", _id: "i4" },
      { url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80", _id: "i5" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock003",
    title: "Relaxed Linen Shirt",
    description: "100% linen, breathable and light. Relaxed boxy cut, perfect for summer.",
    price: { amount: 2199.99, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80", _id: "i6" },
      { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=500&q=80", _id: "i7" },
      { url: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=500&q=80", _id: "i8" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock004",
    title: "Cargo Joggers",
    description: "Multi-pocket cargo joggers in heavy French terry. Street-ready and comfortable.",
    price: { amount: 1599.50, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80", _id: "i9" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock005",
    title: "Washed Denim Jacket",
    description: "Classic washed denim jacket with a vintage look. Slightly oversized, soft interior.",
    price: { amount: 3299.00, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=500&q=80", _id: "i10" },
      { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80", _id: "i11" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock006",
    title: "Acid Wash Hoodie",
    description: "Premium 400 GSM acid wash hoodie with kangaroo pocket. Unisex fit.",
    price: { amount: 2450.00, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&q=80", _id: "i12" },
      { url: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=500&q=80", _id: "i13" },
      { url: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=500&q=80", _id: "i14" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock007",
    title: "Graphic Print Tee",
    description: "240 GSM drop-shoulder tee with a bold screen-printed graphic on the front.",
    price: { amount: 899.00, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=500&q=80", _id: "i15" },
      { url: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&q=80", _id: "i16" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
  {
    _id: "mock008",
    title: "Corduroy Overshirt",
    description: "Wide-wale corduroy overshirt in a relaxed fit. Can be worn as a shirt or jacket.",
    price: { amount: 2799.00, currency: "INR" },
    images: [
      { url: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500&q=80", _id: "i17" },
      { url: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=500&q=80", _id: "i18" },
      { url: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=500&q=80", _id: "i19" },
    ],
    seller: "6acf262f1ebe358370a76f85",
  },
];

/* ─── Icon components ─────────────────────────────────────────────── */
const IconBox = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
    <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);
const IconRupee = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.902 7.098a3.75 3.75 0 013.903-.884.75.75 0 10.498-1.415A5.25 5.25 0 0010.5 9h-.75A.75.75 0 009 9.75v.75H8.25a.75.75 0 000 1.5H9v.75a.75.75 0 00.75.75h.75a3.75 3.75 0 013.75 3.75v.093c0 .476-.066.95-.196 1.41A.75.75 0 0015 18v1.5a.75.75 0 001.5 0V18a.75.75 0 00-.75-.75c-.084 0-.165.005-.245.017A5.25 5.25 0 009 12.75H8.25a.75.75 0 000 1.5H9v-.75A.75.75 0 009.75 12.75h.15a5.25 5.25 0 012.35.55.75.75 0 00.65-1.35 6.75 6.75 0 00-2.802-.652h-.35V12h.25c.34 0 .676-.034 1.002-.1a.75.75 0 10-.287-1.47 3.74 3.74 0 01-.715.07H9.75v-.75h.348a.75.75 0 000-1.5H9.75V8.25a.75.75 0 00-1.5 0V9.75H7.5a.75.75 0 000 1.5h.75V12H7.5a.75.75 0 000 1.5h1.098z" clipRule="evenodd" />
  </svg>
);
const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39 1.186 3.548.428a18.849 18.849 0 005.441-5.44c.758-1.16.492-2.629-.428-3.548l-9.58-9.581a3 3 0 00-2.121-.879H5.25zM6.375 7.5a1.125 1.125 0 100-2.25 1.125 1.125 0 000 2.25z" clipRule="evenodd" />
  </svg>
);
const IconSpark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
  </svg>
);

/* ─── Dashboard ───────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { handleGetSellerProducts } = useProduct();
  const sellerProducts = useSelector((state) => state.products.sellerProducts);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* Fetch products */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await handleGetSellerProducts();
      } catch {
        // API failed — mock data will be used below
      } finally {
        // Simulate skeleton for a beat even if fast
        setTimeout(() => setLoading(false), 900);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Use real data if available, fallback to mock */
  const baseProducts = sellerProducts?.length > 0 ? sellerProducts : MOCK_PRODUCTS;

  /* Search + sort */
  const displayProducts = useMemo(() => {
    let list = [...baseProducts];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "price-asc") list.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
    if (sortBy === "price-desc") list.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
    if (sortBy === "name") list.sort((a, b) => a.title?.localeCompare(b.title || "") || 0);
    return list;
  }, [baseProducts, search, sortBy]);

  /* Stats */
  const totalInventoryValue = baseProducts.reduce((sum, p) => sum + (p.price?.amount || 0), 0);
  const avgPrice = baseProducts.length ? totalInventoryValue / baseProducts.length : 0;
  const recentAdditions = baseProducts.slice(-3).length;

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(160deg, #F2FDFF 0%, #EDE9FF22 100%)" }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto w-full">

          {/* ── Welcome Header ─────────────────────────────────────── */}
          <section
            className="relative overflow-hidden rounded-2xl p-6 sm:p-8 gradient-primary animate-fade-slide-up shadow-lg shadow-[#7BBBFF]/30"
            style={{ animationDelay: "0ms" }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 right-24 w-32 h-32 rounded-full bg-[#B8A9FF]/30 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-white/70 font-inter text-sm mb-1">Good morning ☀️</p>
                <h1 className="font-clash font-semibold text-2xl sm:text-3xl text-white leading-tight">
                  Welcome back, Kshiitiz
                </h1>
                <p className="text-white/65 font-inter text-sm mt-1.5">
                  Your store is performing well. Here's your overview for today.
                </p>
              </div>
              <button
                onClick={() => navigate("/seller/create-product")}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-inter font-semibold text-sm border border-white/25 backdrop-blur-sm transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add Product
              </button>
            </div>
          </section>

          {/* ── Stats Row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<IconBox />}
              label="Total Products"
              value={baseProducts.length}
              trend="+12%"
              trendUp
              delay={100}
            />
            <StatCard
              icon={<IconRupee />}
              label="Inventory Value"
              prefix="₹"
              value={totalInventoryValue}
              trend="+8%"
              trendUp
              delay={200}
            />
            <StatCard
              icon={<IconTag />}
              label="Average Price"
              prefix="₹"
              value={avgPrice}
              delay={300}
            />
            <StatCard
              icon={<IconSpark />}
              label="Recent Additions"
              value={recentAdditions}
              trend="This week"
              trendUp
              delay={400}
            />
          </div>

          {/* ── Products Section ───────────────────────────────────── */}
          <section
            className="animate-fade-slide-up"
            style={{ animationDelay: "200ms", animationFillMode: "both" }}
          >
            {/* Section header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
              <div className="flex-1">
                <h2 className="font-clash font-semibold text-xl text-[#050F2A]">Your Products</h2>
                <p className="text-xs text-[#050F2A]/45 font-inter mt-0.5 uppercase tracking-[0.08em]">
                  {displayProducts.length} item{displayProducts.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#050F2A]/30 pointer-events-none">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-3 py-2 text-xs font-inter rounded-xl border border-[#050F2A]/10 bg-white text-[#050F2A] placeholder-[#050F2A]/30
                      focus:outline-none focus:ring-2 focus:ring-[#7BBBFF]/40 focus:border-[#7BBBFF]/40 transition-all w-40"
                  />
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-xs font-inter rounded-xl border border-[#050F2A]/10 bg-white text-[#050F2A]
                    focus:outline-none focus:ring-2 focus:ring-[#7BBBFF]/40 transition-all cursor-pointer"
                >
                  <option value="default">Sort: Default</option>
                  <option value="name">Name A–Z</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                </select>

                {/* View toggle */}
                <div className="flex items-center bg-white border border-[#050F2A]/10 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === "grid" ? "bg-[#7BBBFF] text-white shadow-sm" : "text-[#050F2A]/40 hover:text-[#050F2A]"}`}
                    aria-label="Grid view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zM9 2.5A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zM1 10.5A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zM9 10.5A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition-all duration-200 ${viewMode === "list" ? "bg-[#7BBBFF] text-white shadow-sm" : "text-[#050F2A]/40 hover:text-[#050F2A]"}`}
                    aria-label="List view"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 3.5A.75.75 0 012.75 7.5h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 8.25zm0 3.5a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid / Skeleton / Empty */}
            {loading ? (
              <div className={`grid gap-4 ${viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"}`}>
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : displayProducts.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-slide-up">
                <div className="w-20 h-20 rounded-2xl gradient-primary/20 flex items-center justify-center mb-5 border border-[#7BBBFF]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={1.5} className="w-10 h-10 text-[#7BBBFF]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <h3 className="font-clash font-semibold text-xl text-[#050F2A] mb-2">
                  {search ? "No products found" : "No products yet"}
                </h3>
                <p className="text-sm text-[#050F2A]/45 font-inter mb-6 max-w-sm">
                  {search
                    ? `We couldn't find anything matching "${search}". Try a different search.`
                    : "Start building your Snitch store by adding your first product."}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/seller/create-product")}
                    className="gradient-primary-btn flex items-center gap-2 px-6 py-3 rounded-xl text-white font-inter font-semibold text-sm shadow-md transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                    Add Your First Product
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-4 ${viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                {displayProducts.map((product, i) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    delay={i * 60}
                    onEdit={(p) => navigate(`/seller/edit-product/${p._id}`)}
                    onDelete={(p) => setDeleteConfirm(p)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050F2A]/50 backdrop-blur-sm animate-overlay-fade"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-rose-500">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-clash font-semibold text-lg text-[#050F2A] mb-1">Delete Product?</h3>
            <p className="text-sm text-[#050F2A]/55 font-inter mb-5">
              Are you sure you want to delete <span className="font-semibold text-[#050F2A]">{deleteConfirm.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#050F2A]/12 text-sm font-inter font-medium text-[#050F2A] hover:bg-[#050F2A]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: wire to delete API
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-sm font-inter font-medium text-white transition-colors active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
