import DOMPurify from 'dompurify';

// Create a DOMPurify instance
const getSanitizer = () => {
    if (typeof window !== 'undefined') {
        return DOMPurify(window);
    }

    // For server-side sanitization, we would need jsdom, but 
    // since we are rendering on the client or using iframes, 
    // we can return a dummy or handle it differently to avoid 
    // bundling jsdom (which uses child_process) to the client.

    // If we absolutely need server-side sanitization later, 
    // we should use a separate file for server-only logic.
    return {
        sanitize: (html: string) => html // Fallback for server-side (shouldn't happen for client components)
    } as any;
};

const sanitizer = getSanitizer();

export const sanitizeHtml = (html: string): string => {
    return sanitizer.sanitize(html, {
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'base', 'head', 'link', 'meta', 'title'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup', 'ondblclick', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'oncontextmenu'],
        ALLOW_DATA_ATTR: false,
        ADD_TAGS: ['style'], // Allow style tags for email rendering
        ADD_ATTR: ['target'], // Allow target="_blank" for links
        FORCE_BODY: true, // Ensure we only get body content
    });
};

export const sanitizeMarkdown = (html: string): string => {
    return sanitizer.sanitize(html);
};
