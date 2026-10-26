import express from "express";
import { authenticateSeller } from "../middlewares/auth.middleware.js";
import { createProduct, getSellerProducts,getAllProducts } from "../controllers/product.controller.js";
import multer from "multer";
import { createProductValidator } from "../validators/product.validator.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
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
 * @route GET /api/products/seller
 * @desc Get all products
 * @access private (Seller only)
 */
router.get("/seller",authenticateSeller,getSellerProducts);


/**
 * @route GET /api/products
 * @desc Get all products
 * @access Public
 */
router.get("/",getAllProducts);


export default router;
