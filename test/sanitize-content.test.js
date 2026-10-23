import assert from "node:assert/strict";
import test from "node:test";
import { sanitizePostContent } from "../lib/sanitize-content.js";

test("sanitizes unsafe post HTML while keeping supported Quill formatting", () => {
  const content = sanitizePostContent(
    '<p class="ql-align-center">Safe <strong>formatting</strong></p><script>alert(1)</script><a href="javascript:alert(1)" target="_blank">bad link</a><image src="https://ik.imagekit.io/example/image.png" onerror="alert(1)">'
  );

  assert.match(content, /<p class="ql-align-center">Safe <strong>formatting<\/strong><\/p>/);
  assert.doesNotMatch(content, /script|alert\(1\)|onerror|javascript:/);
  assert.match(content, /rel="noopener noreferrer"/);
  assert.match(content, /<img src="https:\/\/ik\.imagekit\.io\/example\/image\.png" \/>/);
});