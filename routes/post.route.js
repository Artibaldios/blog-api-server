import express from "express";
import {
  getPosts,
  getPost,
  createPost,
  deletePost,
  uploadAuth,
  featurePost,
} from "../controllers/post.controller.js";
import increaseVisit from "../middlewares/increaseVisit.js";
import { getClerkUserId } from "../lib/api.js";

const router = express.Router();

const requireAuthenticatedUser = (req, res, next) => {
  try {
    getClerkUserId(req);
    next();
  } catch (error) {
    next(error);
  }
};

router.get("/upload-auth", requireAuthenticatedUser, uploadAuth);

router.get("/", getPosts);
router.get("/:slug", increaseVisit, getPost);
router.post("/", createPost);
router.delete("/:id", deletePost);
router.patch("/feature", featurePost);

export default router;