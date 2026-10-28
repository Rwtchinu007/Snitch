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
    res.status(403).json({ message: "You can only manage your own products", success: false });
    return null;
  }
  return product;
}

export async function createProduct(req, res) {
  const { title, description, priceAmount, priceCurrency } = req.body;
  const seller = req.user;

  if (!req.files?.length) {
    return res.status(400).json({ message: "At least one image is required", success: false });
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
    .json({ message: "Product created successfully", success: true, product });
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
    return res.status(400).json({ message: "Invalid image order", success: false });
  }

  let images = product.images;
  if (Array.isArray(imageOrder)) {
    const uploaded = await uploadImages(req.files);
    const existing = new Map(product.images.map((img) => [String(img._id), img]));
    images = imageOrder
      .map((entry) => (entry === "new" ? uploaded.shift() : existing.get(String(entry))))
      .filter(Boolean);
  } else if (req.files?.length) {
    images = [...product.images, ...(await uploadImages(req.files))];
  }

  if (!images.length) {
    return res.status(400).json({ message: "At least one image is required", success: false });
  }
  if (images.length > MAX_IMAGES) {
    return res.status(400).json({ message: `Up to ${MAX_IMAGES} images allowed`, success: false });
  }

  product.title = title;
  product.description = description ?? "";
  product.price = { amount: priceAmount, currency: priceCurrency || product.price.currency };
  product.images = images;
  await product.save();

  res.status(200).json({ message: "Product updated successfully", success: true, product });
}

export async function deleteProduct(req, res) {
  const product = await findOwnedProduct(req, res);
  if (!product) return;

  await product.deleteOne();
  res.status(200).json({ message: "Product deleted successfully", success: true });
}

export async function getSellerProducts(req, res) {
  const seller = req.user;

  const products = await productModel.find({ seller: seller._id }).sort({ _id: -1 });
  res
    .status(200)
    .json({
      message: "Products fetched successfully",
      success: true,
      products,
    });
}

export async function getAllProducts(req, res) {
  const products = await productModel.find().sort({ _id: -1 });
  return res.status(200).json({
    message: "Products fetched successfully",
    success: true,
    products,
  })
}

export async function getProductDetails(req,res){
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(404).json({ message: "Product not found", success: false });
  }
  const product = await productModel.findById(productId);
  if(!product) {
    return res.status(404).json({
      message: "Product not found",
      success: false,
    })
  }

  return res.status(200).json({
    message: "Product fetched successfully",
    success: true,
    product,
  })
}
