import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

let sanitizer: any = null;

const getSanitizer = () => {
  if (!sanitizer) {
    const window = new JSDOM('').window;
    sanitizer = DOMPurify(window as any);
  }
  return sanitizer;
};

export const sanitizePostContent = (content: string): string => {
  try {
    const clean = getSanitizer().sanitize(content, {
      ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
        'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'img', 'span', 'div'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'title'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link', 'meta'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
    return clean;
  } catch (error) {
    console.error('Sanitization failed, falling back to escape:', error);
    // Fallback: escape HTML entities to be safe
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
