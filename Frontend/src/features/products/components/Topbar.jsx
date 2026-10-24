/* eslint-disable react/prop-types */
const Topbar = ({ onMenuClick }) => {
  return (
    <header className="glass-topbar sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center gap-4">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-[#050F2A] hover:bg-[#7BBBFF]/15 transition-colors"
        aria-label="Open navigation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#050F2A]/30 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            placeholder="Search products, orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#050F2A]/10 bg-white/60 text-sm font-inter text-[#050F2A] placeholder-[#050F2A]/35
              focus:outline-none focus:ring-2 focus:ring-[#7BBBFF]/50 focus:border-[#7BBBFF]/50 transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-xl text-[#050F2A]/60 hover:text-[#050F2A] hover:bg-[#7BBBFF]/10 transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.297-1.206A6.978 6.978 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
          </svg>
          {/* Badge */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#B8A9FF] ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <button className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-clash font-semibold text-sm shadow-sm hover:shadow-md hover:shadow-[#7BBBFF]/30 transition-all duration-200">
          KS
        </button>
      </div>
    </header>
  );
};

export default Topbar;
