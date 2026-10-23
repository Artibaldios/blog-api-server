import assert from "node:assert/strict";
import test from "node:test";
import { HttpError, normalizeComment, normalizePost, normalizeUser, requireText, requireUuid, toSlug } from "../lib/api.js";

const id = "550e8400-e29b-41d4-a716-446655440000";

test("normalizes Supabase users to the established API shape", () => {
  assert.deepEqual(normalizeUser({ id, clerk_user_id: "user_123", username: "ada", email: "ada@example.com", img: "https://example.com/ada.png", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" }), {
    _id: id,
    clerkUserId: "user_123",
    username: "ada",
    email: "ada@example.com",
    img: "https://example.com/ada.png",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
  });
});

test("normalizes nested post and comment relations without changing client field names", () => {
  const user = { id, username: "ada", img: null };
  const post = normalizePost({ id, user, title: "Post", slug: "post", content: "<p>Text</p>", img: null, description: null, category: "general", is_featured: false, visit: 3, created_at: "created", updated_at: "updated" });
  const comment = normalizeComment({ id, user, post_id: id, description: "Nice", created_at: "created", updated_at: "updated" });
  assert.equal(post._id, id);
  assert.equal(post.isFeatured, false);
  assert.equal(post.user.username, "ada");
  assert.equal(comment._id, id);
  assert.equal(comment.post, id);
  assert.equal(comment.user.username, "ada");
});

test("validates required text, UUIDs, and creates URL slugs", () => {
  assert.equal(requireUuid(id), id);
  assert.equal(requireText("  body  ", "content"), "body");
  assert.equal(toSlug("  My   First Post "), "my-first-post");
  assert.throws(() => requireUuid("mongo-object-id"), HttpError);
  assert.throws(() => requireText("  ", "title"), HttpError);
});