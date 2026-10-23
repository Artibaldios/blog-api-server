const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const isUuid = (value) => typeof value === "string" && uuidPattern.test(value);

export const requireUuid = (value, fieldName = "id") => {
  if (!isUuid(value)) {
    throw new HttpError(400, `${fieldName} must be a valid UUID`);
  }
  return value;
};

export const requireText = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  return value.trim();
};

export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    _id: user.id,
    clerkUserId: user.clerk_user_id,
    username: user.username,
    email: user.email,
    img: user.img,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

export const normalizePost = (post) => {
  if (!post) return null;

  return {
    _id: post.id,
    user: normalizeUser(post.user),
    img: post.img,
    title: post.title,
    slug: post.slug,
    desc: post.description,
    category: post.category,
    content: post.content,
    isFeatured: post.is_featured,
    visit: post.visit,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
};

export const normalizeComment = (comment) => {
  if (!comment) return null;

  return {
    _id: comment.id,
    user: normalizeUser(comment.user),
    post: comment.post_id,
    desc: comment.description,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  };
};

export const toSlug = (title) =>
  title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

export const getClerkUserId = (req) => {
  const clerkUserId = req.auth?.userId;
  if (!clerkUserId) {
    throw new HttpError(401, "Not authenticated!");
  }
  return clerkUserId;
};

export const isAdmin = (req) =>
  (req.auth?.sessionClaims?.metadata?.role || "user") === "admin";

export const throwDatabaseError = (error) => {
  if (error) {
    console.error("Supabase database error:", error);
    throw new HttpError(500, "Database operation failed");
  }
};