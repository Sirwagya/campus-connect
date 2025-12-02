import 'server-only';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Lazy-initialized sanitizer for server-side use
let sanitizer: ReturnType<typeof DOMPurify> | null = null;

const getSanitizer = (): ReturnType<typeof DOMPurify> => {
  if (!sanitizer) {
    const dom = new JSDOM('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sanitizer = DOMPurify(dom.window as any);
  }
  return sanitizer;
};

/**
 * Sanitize post content for safe rendering
 * This is a server-only function
 */
export const sanitizePostContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

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
    console.error('[Sanitizer] Error sanitizing content:', error);
    // Fallback: escape HTML entities to be safe
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
