
export const GoogleIcon = ({ className = "w-3.5 h-3.5 shrink-0" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const GoogleButton = ({
  text = "Continue with Google",
  href = "/api/auth/google",
  onClick,
  className = "",
  variant = "light",
}) => {
  const isDark = variant === "dark";

  const baseStyles =
    "w-full rounded-md h-8 sm:h-8.5 px-3 text-[11px] font-semibold font-['Manrope',sans-serif] transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex items-center justify-center gap-2 cursor-pointer select-none no-underline";

  const themeStyles = isDark
    ? "bg-neutral-900 hover:bg-neutral-850 active:bg-black text-white border border-neutral-800 shadow-xs hover:shadow-sm focus-visible:ring-black"
    : "bg-white hover:bg-neutral-50/90 active:bg-neutral-100 text-neutral-800 hover:text-neutral-950 border border-neutral-300 hover:border-neutral-400 shadow-xs hover:shadow-sm focus-visible:ring-neutral-400";

  if (href) {
    return (
      <a
        href={href}
        className={`${baseStyles} ${themeStyles} ${className}`}
        aria-label={text}
      >
        <GoogleIcon />
        <span>{text}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseStyles} ${themeStyles} ${className}`}
      aria-label={text}
    >
      <GoogleIcon />
      <span>{text}</span>
    </button>
  );
};

export default GoogleButton;
