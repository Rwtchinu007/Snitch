import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  price: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"],
      default: "INR",
    },
  },
  images: [
    {
      url: {
        type: String,
        required: true,
      },
    },
  ],
  variants: [
    {
      images: [
        {
          url: {
            type: String,
            required: true,
          },
        },
      ],
      stock: {
        type: Number,
        default: 0,
      },
      attributes: {
        type: Map,
        of: String,
      },
      price: {
        amount: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          enum: ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD"],
          default: "INR",
        },
      },
    },
  ],
}, {
  // Serialize variant attribute Maps as plain objects in API responses
  toJSON: { flattenMaps: true },
  toObject: { flattenMaps: true },
});

const productModel = mongoose.model("product", productSchema);

export default productModel;
