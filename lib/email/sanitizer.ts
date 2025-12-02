"use client";

import DOMPurify from 'dompurify';

// Lazy initialization for client-side only
let sanitizerInstance: typeof DOMPurify | null = null;

const getSanitizer = (): typeof DOMPurify | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!sanitizerInstance) {
        sanitizerInstance = DOMPurify;
    }
    return sanitizerInstance;
};

export const sanitizeHtml = (html: string): string => {
    const sanitizer = getSanitizer();
    if (!sanitizer) {
        // During SSR, return empty content
        return '';
    }
    
    return sanitizer.sanitize(html, {
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'base', 'head', 'link', 'meta', 'title'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup', 'ondblclick', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeypress', 'onkeyup', 'oncontextmenu'],
        ALLOW_DATA_ATTR: false,
        ADD_TAGS: ['style'],
        ADD_ATTR: ['target'],
        FORCE_BODY: true,
    });
};

export const sanitizeMarkdown = (html: string): string => {
    const sanitizer = getSanitizer();
    if (!sanitizer) {
        return '';
    }
    
    return sanitizer.sanitize(html);
};
