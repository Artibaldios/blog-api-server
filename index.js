import express from "express";
import { assertSupabaseConfig } from "./lib/supabase.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRouter from "./routes/comment.route.js";
import webhookRouter from "./routes/webhook.route.js";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";

const app = express();

app.set("etag", false);
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error("CLIENT_URL environment variable is required");
}

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(clerkMiddleware());
app.use("/webhooks", webhookRouter);
app.use(express.json());

app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

app.use((error, req, res, next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }

  const response = {
    message: error.message || "Something went wrong!",
    status,
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  res.status(status).json(response);
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  assertSupabaseConfig();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
});