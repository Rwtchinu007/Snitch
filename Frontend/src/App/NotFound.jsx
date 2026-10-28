import { Link, useRouteError } from "react-router";

const NotFound = () => {
  const error = useRouteError();
  if (error) console.error(error);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#FAFAFA] text-[#131610] font-['Inter',sans-serif]">
      <Link to="/" className="font-['Manrope',sans-serif] font-extrabold text-xl tracking-[0.35em]">SNITCH</Link>
      <p className="mt-16 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#131610]/50 inline-flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#131610]" /> {error ? "Something went wrong" : "Error 404"}
      </p>
      <h1 className="mt-4 font-['Cormorant_Garamond',Georgia,serif] font-light text-5xl sm:text-6xl tracking-tight">
        {error ? "Unexpected error" : "Page not found"}
      </h1>
      <p className="mt-4 max-w-sm text-[15px] text-[#131610]/55">
        {error ? "We hit a snag loading this page. Please try again." : "The page you're looking for doesn't exist or has moved."}
      </p>
      <Link to="/" className="mt-10 h-12 px-8 inline-flex items-center rounded-lg bg-[#131610] text-white text-[12px] font-semibold uppercase tracking-widest active:scale-[0.96] transition-transform">
        Back to home
      </Link>
    </div>
  );
};

export default NotFound;
