import { Router } from "express";
import {
  validateRegisterUser,
  validateLoginUser,
} from "../validators/auth.validator.js";
import { register, login, getMe, logout } from "../controllers/auth.controller.js";
import passport from "passport";
import { googleCallback } from "../controllers/auth.controller.js";
import {config} from "../config/config.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post("/register", validateRegisterUser, register);


/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post("/login", validateLoginUser, login);

/**
 * @route GET /api/auth/me
 * @desc Get the current user
 * @access Private
 */
router.get("/me", authenticateUser,getMe);

/**
 * @route POST /api/auth/logout
 * @desc Clear the auth cookie
 * @access Public
 */
router.post("/logout", logout);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false,failureRedirect: `${config.CLIENT_URL}/login` }),
  googleCallback,
);



export default router;
