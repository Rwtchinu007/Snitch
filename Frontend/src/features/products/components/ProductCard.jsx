import { useState } from "react";

/* eslint-disable react/prop-types */
const ProductCard = ({ product, onEdit, onDelete, delay = 0 }) => {
  const [activeImg, setActiveImg] = useState(0);
  const { title, description, price, images = [] } = product;

  const priceFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: price?.currency || "INR",
    minimumFractionDigits: 2,
  }).format(price?.amount || 0);

  return (
    <article
      className="card-hover group bg-white border border-[#050F2A]/8 rounded-2xl overflow-hidden shadow-sm flex flex-col animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Image area — 4:5 ratio */}
      <div className="product-image-wrap relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
        {images.length > 0 ? (
          <img
            src={images[activeImg]?.url}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = "https://placehold.co/400x500/F2FDFF/7BBBFF?text=Snitch";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F2FDFF] to-[#EDE9FF]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="w-12 h-12 text-[#B8A9FF]/50">
              <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`dot-indicator ${i === activeImg ? "active" : ""}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo count badge */}
        {images.length > 0 && (
          <span className="absolute top-3 right-3 bg-[#B8A9FF] text-white text-[10px] font-inter font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M2 3a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H9.5a1 1 0 01-.707-.293L8.086 1.293A1 1 0 007.379 1H4.5a1 1 0 00-1 1v.5H2V3z" />
            </svg>
            {images.length} {images.length === 1 ? "photo" : "photos"}
          </span>
        )}

        {/* Action overlay on hover (desktop) / always visible (mobile) */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex justify-end gap-2
          opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200
          bg-gradient-to-t from-black/30 to-transparent">
          <button
            onClick={() => onEdit?.(product)}
            title="Edit product"
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#050F2A] hover:bg-[#7BBBFF] hover:text-white transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M13.488 2.513a1.75 1.75 0 00-2.475 0L6.75 6.774a2.75 2.75 0 00-.596.892l-.848 2.047a.75.75 0 00.98.98l2.047-.848a2.75 2.75 0 00.892-.596l4.261-4.262a1.75 1.75 0 000-2.474zM4.75 7.5A.75.75 0 004 8.25v3a.75.75 0 00.75.75h3a.75.75 0 00.75-.75V9.5A.75.75 0 008 8.75H6.75V7.5a.75.75 0 00-.75-.75h-1.25z" />
              <path d="M3.5 3.75c-.966 0-1.75.784-1.75 1.75v7c0 .966.784 1.75 1.75 1.75h7c.966 0 1.75-.784 1.75-1.75V9a.75.75 0 00-1.5 0v3.25a.25.25 0 01-.25.25h-7a.25.25 0 01-.25-.25v-7a.25.25 0 01.25-.25H7A.75.75 0 007 3.75H3.5z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete?.(product)}
            title="Delete product"
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#050F2A] hover:bg-rose-500 hover:text-white transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 000 1.5h.3l.815 8.15A1.5 1.5 0 005.357 15h5.285a1.5 1.5 0 001.493-1.35l.815-8.15h.3a.75.75 0 000-1.5H11v-.75A2.25 2.25 0 008.75 1h-1.5A2.25 2.25 0 005 3.25zm2.25-.75a.75.75 0 00-.75.75V4h3v-.75a.75.75 0 00-.75-.75h-1.5zM6.05 6a.75.75 0 01.787.713l.275 5.5a.75.75 0 01-1.498.075l-.275-5.5A.75.75 0 016.05 6zm3.9 0a.75.75 0 01.712.787l-.275 5.5a.75.75 0 01-1.498-.075l.275-5.5a.75.75 0 01.786-.711z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-clash font-semibold text-base text-[#050F2A] truncate leading-tight" title={title}>
          {title}
        </h3>
        <p className="text-sm text-[#050F2A]/50 font-inter leading-snug line-clamp-2 flex-1">
          {description}
        </p>
        <div className="flex items-center justify-between mt-1 pt-3 border-t border-[#050F2A]/6">
          <span className="font-clash font-semibold text-lg text-[#050F2A] tabular-nums">
            {priceFormatted}
          </span>
          <span className="text-xs text-[#050F2A]/35 font-inter uppercase tracking-wide">
            {price?.currency || "INR"}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
