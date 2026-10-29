import mongoose from "mongoose";
import productModel from "../models/product.model.js";
import { uploadFile } from "../services/storage.service.js";

const MAX_IMAGES = 7;

const uploadImages = (files = []) =>
  Promise.all(
    files.map((file) =>
      uploadFile({
        buffer: file.buffer,
        fileName: file.originalname,
      }),
    ),
  );

// Finds a product owned by the logged-in seller, or sends the right error response
async function findOwnedProduct(req, res) {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    res.status(404).json({ message: "Product not found", success: false });
    return null;
  }
  const product = await productModel.findById(productId);
  if (!product) {
    res.status(404).json({ message: "Product not found", success: false });
    return null;
  }
  if (!product.seller.equals(req.user._id)) {
    res
      .status(403)
      .json({
        message: "You can only manage your own products",
        success: false,
      });
    return null;
  }
  return product;
}

export async function createProduct(req, res) {
  const { title, description, priceAmount, priceCurrency } = req.body;
  const seller = req.user;

  if (!req.files?.length) {
    return res
      .status(400)
      .json({ message: "At least one image is required", success: false });
  }

  const images = await uploadImages(req.files);

  const product = new productModel({
    title,
    description,
    price: {
      amount: priceAmount,
      currency: priceCurrency || "INR",
    },
    images,
    seller: seller._id,
  });

  await product.save();

  res
    .status(201)
    .json({ message: "Product created successfully", success: true, product: withStats(product), data: withStats(product) });
}

/**
 * Body: title, description, priceAmount, priceCurrency and imageOrder —
 * a JSON array where each entry is either an existing image _id or "new",
 * which consumes the next uploaded file in order.
 */
export async function updateProduct(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const { title, description, priceAmount, priceCurrency } = req.body;

  let imageOrder;
  try {
    imageOrder = req.body.imageOrder ? JSON.parse(req.body.imageOrder) : null;
  } catch {
    return res
      .status(400)
      .json({ message: "Invalid image order", success: false });
  }

  let images = product.images;
  if (Array.isArray(imageOrder)) {
    const uploaded = await uploadImages(req.files);
    const existing = new Map(
      product.images.map((img) => [String(img._id), img]),
    );
    images = imageOrder
      .map((entry) =>
        entry === "new" ? uploaded.shift() : existing.get(String(entry)),
      )
      .filter(Boolean);
  } else if (req.files?.length) {
    images = [...product.images, ...(await uploadImages(req.files))];
  }

  if (!images.length) {
    return res
      .status(400)
      .json({ message: "At least one image is required", success: false });
  }
  if (images.length > MAX_IMAGES) {
    return res
      .status(400)
      .json({ message: `Up to ${MAX_IMAGES} images allowed`, success: false });
  }

  // Variants that inherited the old base price follow the new one
  const oldAmount = product.price.amount;
  product.title = title;
  product.description = description ?? "";
  product.price = {
    amount: priceAmount,
    currency: priceCurrency || product.price.currency,
  };
  product.variants.forEach((v) => {
    if (v.price?.amount === oldAmount) v.price = { amount: product.price.amount, currency: product.price.currency };
  });
  product.images = images;
  await product.save();

  res
    .status(200)
    .json({ message: "Product updated successfully", success: true, product: withStats(product), data: withStats(product) });
}

export async function deleteProduct(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  await product.deleteOne();
  res
    .status(200)
    .json({ message: "Product deleted successfully", success: true, data: { _id: product._id } });
}

// Adds the fields listing pages need: minPrice, hasVariants, inStock and totalStock
function withStats(doc) {
  const product = typeof doc.toJSON === "function" ? doc.toJSON() : doc;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const base = Number(product.price?.amount) || 0;
  const prices = variants.map((v) => Number(v.price?.amount)).filter((n) => n > 0);
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  return {
    ...product,
    minPrice: prices.length ? Math.min(base, ...prices) : base,
    hasVariants: variants.length > 0,
    inStock: variants.length === 0 || variants.some((v) => Number(v.stock) > 0),
    totalStock,
  };
}

export async function getSellerProducts(req, res) {
  const seller = req.user;

  const products = (
    await productModel.find({ seller: seller._id }).sort({ _id: -1 })
  ).map(withStats);
  res.status(200).json({
    message: "Products fetched successfully",
    success: true,
    products,
    data: products,
  });
}

export async function getAllProducts(req, res) {
  const products = (await productModel.find().sort({ _id: -1 })).map(withStats);
  return res.status(200).json({
    message: "Products fetched successfully",
    success: true,
    products,
    data: products,
  });
}

export async function getProductDetails(req, res) {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return res
      .status(404)
      .json({ message: "Product not found", success: false });
  }
  const product = await productModel
    .findById(productId)
    .populate("seller", "fullname");
  if (!product) {
    return res.status(404).json({
      message: "Product not found",
      success: false,
    });
  }

  const data = withStats(product);
  return res.status(200).json({
    message: "Product fetched successfully",
    success: true,
    product: data,
    data,
  });
}


const MAX_ATTRIBUTES = 6;

// Validates the variant form fields and returns { attributes, stock, price } or { error }
function parseVariantBody(body, product) {
  let raw;
  try {
    raw = typeof body.attributes === "string" ? JSON.parse(body.attributes) : body.attributes;
  } catch {
    return { error: "Attributes must be valid JSON" };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: 'Attributes must be an object, e.g. { "Size": "M" }' };
  }

  const attributes = {};
  const seen = new Set();
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k).trim();
    const value = typeof v === "string" || typeof v === "number" ? String(v).trim() : "";
    if (!key || !value) return { error: "Attribute keys and values cannot be empty" };
    if (key.includes(".") || key.startsWith("$")) return { error: `Invalid attribute key "${key}"` };
    if (seen.has(key.toLowerCase())) return { error: `Duplicate attribute "${key}"` };
    seen.add(key.toLowerCase());
    attributes[key] = value;
  }
  const count = Object.keys(attributes).length;
  if (!count) return { error: "Add at least one attribute" };
  if (count > MAX_ATTRIBUTES) return { error: `Up to ${MAX_ATTRIBUTES} attributes allowed` };

  let stock = 0;
  if (body.stock !== undefined && body.stock !== "") {
    stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0) return { error: "Stock must be a whole number of 0 or more" };
  }

  // An empty variant price falls back to the product's base price
  let price = { amount: product.price.amount, currency: product.price.currency };
  if (body.priceAmount !== undefined && body.priceAmount !== "") {
    const amount = Number(body.priceAmount);
    if (!Number.isFinite(amount) || amount <= 0) return { error: "Price must be a number greater than zero" };
    price = { amount, currency: product.price.currency };
  }

  return { attributes, stock, price };
}

// Case-insensitive signature of an attributes object, used to detect duplicate variants
const attributeSignature = (attrs) =>
  Object.entries(attrs instanceof Map ? Object.fromEntries(attrs) : attrs || {})
    .map(([k, v]) => `${k.toLowerCase()}=${String(v).toLowerCase()}`)
    .sort()
    .join("|");

const findDuplicateVariant = (product, attributes, exceptId) => {
  const signature = attributeSignature(attributes);
  return product.variants.find(
    (v) => String(v._id) !== String(exceptId) && attributeSignature(v.attributes) === signature,
  );
};

const toImageUrls = (uploaded) => uploaded.map((img) => ({ url: img.url }));

export async function addProductVariant(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const parsed = parseVariantBody(req.body, product);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error, success: false });
  }
  if (findDuplicateVariant(product, parsed.attributes)) {
    return res
      .status(409)
      .json({ message: "A variant with these attributes already exists", success: false });
  }

  const images = toImageUrls(await uploadImages(req.files));
  product.variants.push({ ...parsed, images });
  await product.save();

  const variant = product.variants[product.variants.length - 1];
  res
    .status(201)
    .json({ message: "Variant created successfully", success: true, variant, product: withStats(product), data: variant });
}

/**
 * Same fields as create, plus imageOrder — a JSON array of existing image _ids
 * and "new" entries (one per uploaded file), like updateProduct.
 */
export async function updateProductVariant(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const variant = mongoose.isValidObjectId(req.params.variantId)
    ? product.variants.id(req.params.variantId)
    : null;
  if (!variant) {
    return res.status(404).json({ message: "Variant not found", success: false });
  }

  const parsed = parseVariantBody(req.body, product);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error, success: false });
  }
  if (findDuplicateVariant(product, parsed.attributes, variant._id)) {
    return res
      .status(409)
      .json({ message: "A variant with these attributes already exists", success: false });
  }

  let imageOrder;
  try {
    imageOrder = req.body.imageOrder ? JSON.parse(req.body.imageOrder) : null;
  } catch {
    return res.status(400).json({ message: "Invalid image order", success: false });
  }

  let images = variant.images;
  if (Array.isArray(imageOrder)) {
    const uploaded = toImageUrls(await uploadImages(req.files));
    const existing = new Map(variant.images.map((img) => [String(img._id), img]));
    images = imageOrder
      .map((entry) => (entry === "new" ? uploaded.shift() : existing.get(String(entry))))
      .filter(Boolean);
  } else if (req.files?.length) {
    images = [...variant.images, ...toImageUrls(await uploadImages(req.files))];
  }
  if (images.length > MAX_IMAGES) {
    return res
      .status(400)
      .json({ message: `Up to ${MAX_IMAGES} images allowed`, success: false });
  }

  variant.set({ ...parsed, images });
  await product.save();

  res
    .status(200)
    .json({ message: "Variant updated successfully", success: true, variant, product: withStats(product), data: variant });
}

export async function deleteProductVariant(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  const variant = mongoose.isValidObjectId(req.params.variantId)
    ? product.variants.id(req.params.variantId)
    : null;
  if (!variant) {
    return res.status(404).json({ message: "Variant not found", success: false });
  }

  variant.deleteOne();
  await product.save();

  res.status(200).json({
    message: "Variant deleted successfully",
    success: true,
    variant: { _id: variant._id },
    product: withStats(product),
    data: { _id: variant._id },
  });
}
