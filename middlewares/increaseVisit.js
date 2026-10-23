import { getSupabase } from "../lib/supabase.js";
import { throwDatabaseError } from "../lib/api.js";

const increaseVisit = async (req, res, next) => {
  const { error } = await getSupabase().rpc("increment_post_visit", { post_slug: req.params.slug });
  throwDatabaseError(error);
  next();
};

export default increaseVisit;