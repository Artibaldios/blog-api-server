import sanitizeHtml from "sanitize-html";

const imageKitHostname = (() => {
  try {
    return new URL(process.env.IK_URL_ENDPOINT).hostname;
  } catch {
    return null;
  }
})();

const allowedIframeHostnames = [
  "www.youtube.com",
  "www.youtube-nocookie.com",
  imageKitHostname,
].filter(Boolean);

export const sanitizePostContent = (content) => {
  const normalizedContent = content
    .replace(/<\s*image\b/gi, "<img")
    .replace(/<\s*\/\s*image\s*>/gi, "");

  return sanitizeHtml(normalizedContent, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "code",
      "pre",
      "ol",
      "ul",
      "li",
      "span",
      "a",
      "img",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
      li: ["data-list"],
      "*": ["class"],
    },
    allowedClasses: {
      "*": ["ql-align-*", "ql-direction-*", "ql-indent-*", "ql-size-*", "ql-font-*", "ql-video", "ql-syntax"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames,
    allowIframeRelativeUrls: false,
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attributes) => ({
        tagName,
        attribs:
          attributes.target === "_blank"
            ? { ...attributes, rel: "noopener noreferrer" }
            : attributes,
      }),
    },
  });
};