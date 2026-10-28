// Shown while the initial session check (/api/auth/me) is in flight
const AuthLoader = () => (
  <div className="min-h-screen grid place-items-center bg-[#FAFAFA]" role="status" aria-label="Loading">
    <span className="w-6 h-6 rounded-full border-2 border-[#D4CFC8] border-t-[#131610] animate-spin" />
  </div>
);

export default AuthLoader;
