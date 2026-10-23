import { Webhook } from "svix";
import { getSupabase } from "../lib/supabase.js";
import { throwDatabaseError } from "../lib/api.js";

const clerkUserValues = (data) => ({
  clerk_user_id: data.id,
  username: data.username || data.email_addresses?.[0]?.email_address,
  email: data.email_addresses?.[0]?.email_address,
  img: data.profile_img_url || null,
});

export const clerkWebHook = async (req, res) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Webhook secret needed!");

  let event;
  try {
    event = new Webhook(webhookSecret).verify(req.body, req.headers);
  } catch {
    return res.status(400).json({ message: "Webhook verification failed!" });
  }

  const supabase = getSupabase();
  if (event.type === "user.created" || event.type === "user.updated") {
    const values = clerkUserValues(event.data);
    if (!values.username || !values.email) {
      return res.status(400).json({ message: "Clerk user requires a username and email" });
    }
    const { error } = await supabase.from("users").upsert(values, { onConflict: "clerk_user_id" });
    throwDatabaseError(error);
  }

  if (event.type === "user.deleted" && event.data.id) {
    const { error } = await supabase.from("users").delete().eq("clerk_user_id", event.data.id);
    throwDatabaseError(error);
  }

  return res.status(200).json({ message: "Webhook received" });
};