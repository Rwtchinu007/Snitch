import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
// import cors from "cors";
import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import { config } from "./config/config.js";
import multer from "multer";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(cors({ origin: "http://localhost:5173", 
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true }));
app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);

// Unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Route not found", success: false });
});

// Central error handler — always respond with JSON
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Each image must be 5MB or smaller"
      : err.code === "LIMIT_UNEXPECTED_FILE" ? "Up to 7 images allowed"
      : err.message;
    return res.status(400).json({ message, success: false });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: err.message, success: false });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: "Something went wrong. Please try again.", success: false });
});

export default app;
