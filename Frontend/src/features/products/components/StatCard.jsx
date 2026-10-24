import { useEffect, useRef, useState } from "react";

/* eslint-disable react/prop-types */
const StatCard = ({ icon, label, value, prefix = "", trend, trendUp, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  // Intersection observer for staggered entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Count-up animation
  useEffect(() => {
    if (!visible) return;
    const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
    const duration = 1200;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const increment = numericValue / steps;

    const timer = setInterval(() => {
      current = Math.min(current + increment, numericValue);
      setDisplayValue(current);
      if (current >= numericValue) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [visible, value]);

  const formatValue = (val) => {
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
    if (num >= 100000) return (val / 100000).toFixed(1) + "L";
    if (num >= 1000) return (val / 1000).toFixed(1) + "K";
    return Math.round(val).toString();
  };

  return (
    <div
      ref={ref}
      className="card-hover bg-white border border-[#050F2A]/8 rounded-2xl p-5 flex flex-col gap-4 shadow-sm animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {/* Icon circle */}
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-[#7BBBFF]/30 text-white flex-shrink-0">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-inter font-medium px-2.5 py-1 rounded-full flex items-center gap-1
            ${trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"}`}>
            {trendUp ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06L8.75 4.56v8.69A.75.75 0 018 14z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v8.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V2.75A.75.75 0 018 2z" clipRule="evenodd" />
              </svg>
            )}
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="font-clash font-semibold text-3xl text-[#050F2A] tabular-nums leading-none">
          {prefix}{visible ? formatValue(displayValue) : "0"}
        </p>
        <p className="text-xs uppercase tracking-[0.1em] text-[#050F2A]/45 font-inter font-medium mt-2">{label}</p>
      </div>

      {/* Accent bar */}
      <div className="h-0.5 w-full rounded-full overflow-hidden bg-[#050F2A]/5">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-[1200ms] ease-out"
          style={{ width: visible ? "60%" : "0%" }}
        />
      </div>
    </div>
  );
};

export default StatCard;
