import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../supabase/migrations/20261023000000_create_blog_schema.sql", import.meta.url);

test("migration defines relational blog tables, cascades, RLS, and atomic visit RPC", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const table of ["users", "posts", "comments", "saved_posts"]) {
    assert.match(sql, new RegExp(`create table public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(sql, /references public\.users\(id\) on delete cascade/);
  assert.match(sql, /references public\.posts\(id\) on delete cascade/);
  assert.match(sql, /primary key \(user_id, post_id\)/);
  assert.match(sql, /create or replace function public\.increment_post_visit/);
  assert.match(sql, /set visit = visit \+ 1/);
});