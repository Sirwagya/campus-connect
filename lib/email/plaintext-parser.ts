/**
 * Converts plain text to HTML with auto-linked URLs
 */
export const parsePlainText = (text: string): string => {
    if (!text) return '';

    // Escape HTML characters first to prevent XSS
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Replace URLs with anchor tags
    return escaped.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
    });
};
