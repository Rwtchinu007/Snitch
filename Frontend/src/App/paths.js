// Route paths used across the seller → buyer flow; keep links in sync with app.routes.jsx
export const PATHS = {
  home: "/",
  shop: "/shop",
  product: (id) => `/product/${id}`,
  sellerDashboard: "/seller/dashboard",
  sellerProduct: (id) => `/seller/product/${id}`,
  createProduct: "/seller/create-product",
  login: "/login",
};
