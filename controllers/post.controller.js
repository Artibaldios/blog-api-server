import ImageKit from "imagekit";
import { getSupabase } from "../lib/supabase.js";
import { sanitizePostContent } from "../lib/sanitize-content.js";
import { getClerkUserId, HttpError, isAdmin, normalizePost, requireText, requireUuid, throwDatabaseError, toSlug } from "../lib/api.js";

const postSelect = "*, user:users!posts_user_id_fkey(id, username, img)";
const defaultLimit = 2;
const maxLimit = 50;

const getPageOptions = (query) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const requestedLimit = Number.parseInt(query.limit, 10) || defaultLimit;
  if (page < 1 || requestedLimit < 1) throw new HttpError(400, "page and limit must be positive numbers");
  return { page, limit: Math.min(requestedLimit, maxLimit) };
};

const getUserByClerkId = async (clerkUserId) => {
  const { data, error } = await getSupabase().from("users").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  throwDatabaseError(error);
  return data;
};

const getUniqueSlug = async (title) => {
  const baseSlug = toSlug(title);
  let slug = baseSlug;
  let counter = 2;
  const supabase = getSupabase();
  while (true) {
    const { data, error } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
    throwDatabaseError(error);
    if (!data) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

export const getPosts = async (req, res) => {
  const { page, limit } = getPageOptions(req.query);
  const { cat, author, search: searchQuery, sort, featured } = req.query;
  const supabase = getSupabase();
  let query = supabase.from("posts").select(postSelect, { count: "exact" });
  if (cat) query = query.eq("category", cat);
  if (searchQuery) query = query.ilike("title", `%${searchQuery}%`);
  if (featured === "true") query = query.eq("is_featured", true);

  if (author) {
    const { data: user, error } = await supabase.from("users").select("id").eq("username", author).maybeSingle();
    throwDatabaseError(error);
    if (!user) return res.status(404).json("No post found!");
    query = query.eq("user_id", user.id);
  }

  if (sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (sort === "popular") query = query.order("visit", { ascending: false });
  else if (sort === "trending") query = query.order("created_at", { ascending: false }).order("visit", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const from = (page - 1) * limit;
  const { data, error, count } = await query.range(from, from + limit - 1);
  throwDatabaseError(error);
  return res.status(200).json({ posts: data.map(normalizePost), hasMore: page * limit < (count ?? 0) });
};

export const getPost = async (req, res) => {
  const { data, error } = await getSupabase().from("posts").select(postSelect).eq("slug", req.params.slug).maybeSingle();
  throwDatabaseError(error);
  if (!data) return res.status(404).json("Post not found!");
  return res.status(200).json(normalizePost(data));
};

export const createPost = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const title = requireText(req.body?.title, "title");
  const content = sanitizePostContent(requireText(req.body?.content, "content"));
  const user = await getUserByClerkId(clerkUserId);
  if (!user) return res.status(404).json("User not found!");

  const slug = await getUniqueSlug(title);
  const post = {
    user_id: user.id,
    slug,
    title,
    content,
    img: typeof req.body.img === "string" ? req.body.img : null,
    description: typeof req.body.desc === "string" ? req.body.desc : null,
    category: typeof req.body.category === "string" && req.body.category.trim() ? req.body.category.trim() : "general",
  };
  const { data, error } = await getSupabase().from("posts").insert(post).select(postSelect).single();
  if (error?.code === "23505") throw new HttpError(409, "A post with this slug already exists. Please retry.");
  throwDatabaseError(error);
  return res.status(200).json(normalizePost(data));
};

export const deletePost = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const postId = requireUuid(req.params.id);
  const supabase = getSupabase();
  let query = supabase.from("posts").delete().eq("id", postId);
  if (!isAdmin(req)) {
    const user = await getUserByClerkId(clerkUserId);
    if (!user) return res.status(404).json("User not found!");
    query = query.eq("user_id", user.id);
  }
  const { data, error } = await query.select("id").maybeSingle();
  throwDatabaseError(error);
  if (!data) {
    return res.status(isAdmin(req) ? 404 : 403).json(isAdmin(req) ? "Post not found!" : "You can delete only your posts!");
  }
  return res.status(200).json("Post has been deleted");
};

export const featurePost = async (req, res) => {
  getClerkUserId(req);
  const postId = requireUuid(req.body?.postId, "postId");
  if (!isAdmin(req)) return res.status(403).json("You cannot feature posts!");
  const supabase = getSupabase();
  const { data: post, error: findError } = await supabase.from("posts").select("is_featured").eq("id", postId).maybeSingle();
  throwDatabaseError(findError);
  if (!post) return res.status(404).json("Post not found!");
  const { data, error } = await supabase.from("posts").update({ is_featured: !post.is_featured }).eq("id", postId).select(postSelect).single();
  throwDatabaseError(error);
  return res.status(200).json(normalizePost(data));
};

const imagekit = new ImageKit({
  urlEndpoint: process.env.IK_URL_ENDPOINT,
  publicKey: process.env.IK_PUBLIC_KEY,
  privateKey: process.env.IK_PRIVATE_KEY,
});

const assertImageKitConfig = () => {
  const requiredEnvironmentVariables = ["IK_URL_ENDPOINT", "IK_PUBLIC_KEY", "IK_PRIVATE_KEY"];
  const missingVariable = requiredEnvironmentVariables.find((variableName) => !process.env[variableName]);
  if (missingVariable) {
    throw new HttpError(500, `${missingVariable} environment variable is required for uploads`);
  }
};

export const uploadAuth = (req, res) => {
  assertImageKitConfig();
  return res.send(imagekit.getAuthenticationParameters());
};