import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hook/useAuth";
import GoogleButton from "../components/GoogleButton";

const Register = () => {
  const { handleRegister } = useAuth();
  const navigate = useNavigate();
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contact: "",
    password: "",
    isSeller: false,
  });

  // Validation errors & UI states
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Generic change handler for all controlled inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear individual field error as user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Client-side form validation
  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Contact number validation (at least 10 digits)
    const rawDigits = formData.contact.replace(/\D/g, "");
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
    } else if (rawDigits.length < 10) {
      newErrors.contact = "Enter a valid 10-digit mobile number";
    }

    // Password validation (min 8 characters)
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const user = await handleRegister({
        email: formData.email,
        contact: formData.contact,
        password: formData.password,
        fullname: formData.fullName,
        isSeller: formData.isSeller,
      });
      const destination = user?.role === "seller" ? "/seller/dashboard" : "/";
      navigate(destination, { replace: true });
      // Simulate network latency / dispatch
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSuccess(true);
    } catch (err) {
      console.error("Registration failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] text-neutral-900 font-['Inter',sans-serif] selection:bg-neutral-900 selection:text-white overflow-x-hidden">
      {/* Google Fonts Preconnect & Import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
      `}</style>

      {/* ========================================================================= */}
      {/* MOBILE TOP BRAND BAR (Visible only on screens < lg)                       */}
      {/* ========================================================================= */}
      <header className="lg:hidden w-full flex items-center justify-between px-5 py-3 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 focus:outline-none"
        >
          <span className="font-['Manrope',sans-serif] text-sm font-extrabold tracking-[0.2em] uppercase text-neutral-950">
            SNITCH
          </span>
        </Link>
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-neutral-500 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full">
          Sign Up
        </span>
      </header>

      {/* ========================================================================= */}
      {/* LEFT EDITORIAL IMAGE PANEL (Desktop only, 50% split)                       */}
      {/* ========================================================================= */}
      <section
        aria-label="Brand Showcase"
        className="group relative hidden lg:flex lg:w-1/2 lg:h-screen lg:sticky lg:top-0 overflow-hidden select-none shrink-0 bg-neutral-950"
        style={{ isolation: "isolate", contain: "paint", clipPath: "inset(0)" }}
      >
        {/* Dedicated Background Image Wrapper - Strictly Clipped */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop"
            alt="High fashion streetwear editorial model"
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            loading="eager"
            draggable={false}
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-at-t from-transparent via-transparent to-black/40 pointer-events-none" />
        </div>

        {/* Content Overlays */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-8 lg:p-10 pointer-events-auto">
          {/* Top Header / Wordmark */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="group/brand inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded"
            >
              <span className="font-['Manrope',sans-serif] text-base sm:text-lg tracking-[0.25em] font-extrabold uppercase text-white drop-shadow-sm transition-opacity group-hover/brand:opacity-90">
                SNITCH
              </span>
            </Link>
            <span className="text-[9px] font-semibold tracking-[0.16em] uppercase text-neutral-300 border border-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/5">
              Autumn / Winter
            </span>
          </div>

          {/* Bottom Tagline & Brand Narrative */}
          <div className="max-w-sm">
            <p className="text-[9px] tracking-[0.22em] uppercase font-semibold text-neutral-300/80 mb-1">
              Signature Aesthetics
            </p>
            <h2 className="font-['Manrope',sans-serif] text-lg sm:text-xl lg:text-[22px] font-bold tracking-tight text-white leading-snug">
              Wear your attitude.
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-300/80 mt-1 font-normal leading-relaxed max-w-xs">
              Curated streetwear and luxury minimalist silhouettes engineered for the uninhibited generation.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT REGISTRATION FORM PANEL                                            */}
      {/* ========================================================================= */}
      <main className="w-full lg:w-1/2 min-h-[calc(100vh-65px)] lg:min-h-screen lg:h-screen lg:overflow-y-auto flex flex-col justify-center items-center px-6 py-5 sm:px-10 lg:px-12 bg-[#FAFAFA]">
        <div className="w-full max-w-[310px] sm:max-w-[325px] my-auto py-2">
          {/* Header Group */}
          <header className="mb-3.5">
            <div className="inline-flex items-center gap-1.5 mb-1">
              <span className="h-1 w-1 rounded-full bg-neutral-900" />
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-400 font-['Manrope',sans-serif]">
                Create Account
              </span>
            </div>
            <h1 className="font-['Manrope',sans-serif] text-lg sm:text-xl font-bold tracking-tight text-neutral-950 leading-tight">
              Join Snitch
            </h1>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-normal font-normal">
              Sign up to discover the latest drops, member privileges, and exclusive styles.
            </p>
          </header>

          {/* Registration Feedback / Toast Notification */}
          {isSuccess && (
            <div
              role="alert"
              className="mb-3.5 p-2.5 rounded-lg bg-neutral-900 text-white flex items-start gap-2 transition-all animate-fadeIn"
            >
              <svg
                className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div className="text-[11px]">
                <p className="font-semibold text-white">
                  Account created successfully!
                </p>
                <p className="text-neutral-300 mt-0.5 leading-relaxed">
                  Welcome to the Snitch community. Redirecting you to your wardrobe...
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-2.5"
          >
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.06em] mb-1"
              >
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Alex Morgan"
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                className={`w-full h-8 sm:h-8.5 rounded-md border bg-white px-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 placeholder:text-[11px] font-normal transition-all duration-200 outline-none ${errors.fullName
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-neutral-300 hover:border-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  }`}
              />
              {errors.fullName && (
                <p
                  id="fullName-error"
                  className="mt-0.5 text-[10px] text-red-600 font-medium flex items-center gap-1.5"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-red-600 shrink-0" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* 2. Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.06em] mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@snitch.co"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full h-8 sm:h-8.5 rounded-md border bg-white px-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 placeholder:text-[11px] font-normal transition-all duration-200 outline-none ${errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-neutral-300 hover:border-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  }`}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-0.5 text-[10px] text-red-600 font-medium flex items-center gap-1.5"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-red-600 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 3. Contact Number */}
            <div>
              <label
                htmlFor="contact"
                className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.06em] mb-1"
              >
                Contact Number
              </label>
              <input
                id="contact"
                name="contact"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                value={formData.contact}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                aria-invalid={errors.contact ? "true" : "false"}
                aria-describedby={errors.contact ? "contact-error" : undefined}
                className={`w-full h-8 sm:h-8.5 rounded-md border bg-white px-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 placeholder:text-[11px] font-normal transition-all duration-200 outline-none ${errors.contact
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-neutral-300 hover:border-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10"
                  }`}
              />
              {errors.contact && (
                <p
                  id="contact-error"
                  className="mt-0.5 text-[10px] text-red-600 font-medium flex items-center gap-1.5"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-red-600 shrink-0" />
                  {errors.contact}
                </p>
              )}
            </div>

            {/* 4. Password with Toggle Icon */}
            <div>
              <label
                htmlFor="password"
                className="block text-[10px] font-semibold text-neutral-600 uppercase tracking-[0.06em] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={`w-full h-8 sm:h-8.5 rounded-md border bg-white pl-2.5 pr-8 text-xs text-neutral-900 placeholder:text-neutral-400 placeholder:text-[11px] font-normal transition-all duration-200 outline-none ${errors.password
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-neutral-300 hover:border-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-neutral-400 hover:text-neutral-700 transition-colors focus:outline-none focus:text-neutral-900 cursor-pointer"
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-0.5 text-[10px] text-red-600 font-medium flex items-center gap-1.5"
                >
                  <span className="inline-block w-1 h-1 rounded-full bg-red-600 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 5. Checkbox: Register as Seller */}
            <div className="pt-0.5">
              <label className="flex items-start gap-2 p-2 rounded-md border border-neutral-200/90 bg-white hover:border-neutral-300 transition-colors cursor-pointer select-none group">
                <input
                  id="isSeller"
                  name="isSeller"
                  type="checkbox"
                  checked={formData.isSeller}
                  onChange={handleChange}
                  className="mt-0.5 h-3 w-3 rounded border-neutral-300 text-black accent-black focus:ring-2 focus:ring-black/20 focus:ring-offset-1 transition cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[10.5px] font-semibold text-neutral-900 group-hover:text-black transition-colors tracking-tight">
                    I want to register as a seller
                  </span>
                  <span className="text-[9.5px] text-neutral-500 mt-0.5 leading-tight font-normal">
                    Sellers can list and manage their own products on Snitch.
                  </span>
                </div>
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 h-8 sm:h-8.5 rounded-md bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white px-4 text-[11px] font-bold tracking-[0.08em] uppercase font-['Manrope',sans-serif] transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs hover:shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="w-full border-t border-neutral-200" />
            <div className="absolute bg-[#FAFAFA] px-2.5">
              <span className="text-[9px] uppercase tracking-widest font-semibold text-neutral-400 font-['Manrope',sans-serif]">
                or
              </span>
            </div>
          </div>

          {/* Google Auth Button */}
          <GoogleButton
            text="Continue with Google"
            href="/api/auth/google"
          />

          {/* Footer Navigation */}
          <footer className="mt-3.5 space-y-1 text-center">
            <p className="text-[10.5px] text-neutral-600 font-normal">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-neutral-950 underline underline-offset-4 hover:text-black transition-colors"
              >
                Sign in
              </Link>
            </p>

            <p className="text-[9.5px] text-neutral-400 max-w-xs mx-auto leading-relaxed">
              By signing up, you agree to our{" "}
              <a
                href="#terms"
                className="underline text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
              >
                Terms
              </a>{" "}
              &{" "}
              <a
                href="#privacy"
                className="underline text-neutral-500 hover:text-neutral-900 transition-colors font-medium"
              >
                Privacy Policy
              </a>
              .
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Register;
