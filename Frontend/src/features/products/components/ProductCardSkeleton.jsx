const ProductCardSkeleton = () => (
  <div className="bg-white border border-[#050F2A]/8 rounded-2xl overflow-hidden shadow-sm">
    {/* Image skeleton — 4:5 */}
    <div className="animate-shimmer" style={{ aspectRatio: "4/5" }} />
    {/* Content skeleton */}
    <div className="p-4 flex flex-col gap-3">
      <div className="h-4 rounded-lg animate-shimmer w-3/4" />
      <div className="space-y-2">
        <div className="h-3 rounded-lg animate-shimmer w-full" />
        <div className="h-3 rounded-lg animate-shimmer w-5/6" />
      </div>
      <div className="pt-3 border-t border-[#050F2A]/6 flex items-center justify-between">
        <div className="h-5 rounded-lg animate-shimmer w-24" />
        <div className="h-3 rounded-lg animate-shimmer w-8" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
