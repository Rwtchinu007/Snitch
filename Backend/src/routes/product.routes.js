import express from "express";
import { authenticateSeller } from "../middlewares/auth.middleware.js";
import { createProduct, getSellerProducts, getAllProducts, getProductDetails, updateProduct, deleteProduct, addProductVariant, updateProductVariant, deleteProductVariant } from "../controllers/product.controller.js";
import multer from "multer";
import { createProductValidator } from "../validators/product.validator.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(null, true);
    const err = new Error("Only JPG, PNG or WEBP images are allowed");
    err.status = 400;
    cb(err);
  },
});

const router = express.Router();


/**
 * @route POST /api/products
 * @desc Create a new product
 * @access Private (Seller only)
 */
router.post(
  "/",
  authenticateSeller,
  upload.array("images", 7),
  createProductValidator,
  createProduct
);


/**
 * @route GET /api/products/seller/me (alias: /seller)
 * @desc Get products
 * @access private (Seller only)
 */
router.get("/seller/me", authenticateSeller, getSellerProducts);
router.get("/seller", authenticateSeller, getSellerProducts);


/**
 * @route GET /api/products
 * @desc Get products
 * @access Public
 */
router.get("/",getAllProducts);


/**
 * @route GET /api/products/detail/:productId (legacy alias)
 * @desc Get product details by ID
 * @access Public
 */
router.get("/detail/:productId", getProductDetails);


/**
 * @route GET /api/products/:productId
 * @desc Get product details with variants (defined after /seller/me so that path is not read as an id)
 * @access Public
 */
router.get("/:productId", getProductDetails);


/**
 * @route POST /api/products/:productId/variants
 * @desc Add a new variant to a product (owner only)
 * @access Private (Seller only)
 */
router.post("/:productId/variants", authenticateSeller, upload.array("images", 7), addProductVariant);


/**
 * @route PUT /api/products/:productId/variants/:variantId
 * @desc Update a variant's stock, price, attributes and images (owner only)
 * @access Private (Seller only)
 */
router.put("/:productId/variants/:variantId", authenticateSeller, upload.array("images", 7), updateProductVariant);


/**
 * @route DELETE /api/products/:productId/variants/:variantId
 * @desc Remove a variant (owner only)
 * @access Private (Seller only)
 */
router.delete("/:productId/variants/:variantId", authenticateSeller, deleteProductVariant);


/**
 * @route PUT /api/products/:productId
 * @desc Update a product (owner only)
 * @access Private (Seller only)
 */
router.put(
  "/:productId",
  authenticateSeller,
  upload.array("images", 7),
  createProductValidator,
  updateProduct
);


/**
 * @route DELETE /api/products/:productId
 * @desc Delete a product (owner only)
 * @access Private (Seller only)
 */
router.delete("/:productId", authenticateSeller, deleteProduct);


export default router;
