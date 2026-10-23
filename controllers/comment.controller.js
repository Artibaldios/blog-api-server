import { getSupabase } from "../lib/supabase.js";
import { getClerkUserId, isAdmin, normalizeComment, requireText, requireUuid, throwDatabaseError } from "../lib/api.js";

const commentSelect = "*, user:users!comments_user_id_fkey(id, username, img)";

export const getPostComments = async (req, res) => {
  const postId = requireUuid(req.params.postId, "postId");
  const { data, error } = await getSupabase().from("comments").select(commentSelect).eq("post_id", postId).order("created_at", { ascending: false });
  throwDatabaseError(error);
  return res.status(200).json(data.map(normalizeComment));
};

export const addComment = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const postId = requireUuid(req.params.postId, "postId");
  const description = requireText(req.body?.desc, "desc");
  const supabase = getSupabase();
  const { data: user, error: userError } = await supabase.from("users").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  throwDatabaseError(userError);
  if (!user) return res.status(401).json("Can't find the user");

  const { data, error } = await supabase.from("comments").insert({ description, user_id: user.id, post_id: postId }).select(commentSelect).single();
  throwDatabaseError(error);
  return res.status(201).json(normalizeComment(data));
};

export const deleteComment = async (req, res) => {
  const clerkUserId = getClerkUserId(req);
  const commentId = requireUuid(req.params.id);
  const supabase = getSupabase();

  if (isAdmin(req)) {
    const { data, error } = await supabase.from("comments").delete().eq("id", commentId).select("id").maybeSingle();
    throwDatabaseError(error);
    if (!data) return res.status(404).json("Comment not found!");
    return res.status(200).json("Comment has been deleted");
  }

  const { data: user, error: userError } = await supabase.from("users").select("id").eq("clerk_user_id", clerkUserId).maybeSingle();
  throwDatabaseError(userError);
  if (!user) return res.status(403).json("Cant find the user!");

  const { data, error } = await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id).select("id").maybeSingle();
  throwDatabaseError(error);
  if (!data) return res.status(403).json("You can delete only your comment!");
  return res.status(200).json("Comment deleted");
};