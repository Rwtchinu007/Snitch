import { Outlet, ScrollRestoration } from "react-router";

// Wraps every route so navigation always starts at the top of the page
const RootLayout = () => (
  <>
    <ScrollRestoration />
    <Outlet />
  </>
);

export default RootLayout;
