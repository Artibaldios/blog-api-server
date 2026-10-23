import { getSupabase } from "../lib/supabase.js";
import { getClerkUserId, requireUuid, throwDatabaseError } from "../lib/api.js";

export const getUserSavedPosts = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const supabase = getSupabase();
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  throwDatabaseError(userError);
  if (!user) return res.status(200).json([]);

  const { data, error } = await supabase.from("saved_posts").select("post_id").eq("user_id", user.id);
  throwDatabaseError(error);
  return res.status(200).json(data.map(({ post_id: postId }) => postId));
};

export const savePost = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const postId = requireUuid(req.body?.postId, "postId");
  const supabase = getSupabase();
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  throwDatabaseError(userError);
  if (!user) return res.status(404).json("User not found!");

  const { data: savedPost, error: lookupError } = await supabase.from("saved_posts").select("user_id").eq("user_id", user.id).eq("post_id", postId).maybeSingle();
  throwDatabaseError(lookupError);

  if (savedPost) {
    const { error } = await supabase.from("saved_posts").delete().eq("user_id", user.id).eq("post_id", postId);
    throwDatabaseError(error);
    return res.status(200).json("Post unsaved");
  }

  const { error } = await supabase.from("saved_posts").insert({ user_id: user.id, post_id: postId });
  throwDatabaseError(error);
  return res.status(200).json("Post saved");
};