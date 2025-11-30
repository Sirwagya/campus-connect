export type EmailContentType = 'html' | 'markdown' | 'text' | 'empty';

export const detectContentType = (
    bodyHtml?: string | null,
    bodyText?: string | null
): EmailContentType => {
    if (bodyHtml && bodyHtml.trim().length > 0) {
        return 'html';
    }

    if (bodyText && bodyText.trim().length > 0) {
        // Check if text is actually HTML (fallback for misclassified content)
        const trimmed = bodyText.trim();
        if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('</div>') || trimmed.includes('</body>')) {
            return 'html';
        }

        // Simple heuristic for markdown: check for common markdown syntax
        // This is optional as we might just treat text as markdown or plain text
        const hasMarkdown = /^# |^## |^### |\*\*|__|\[.*\]\(.*\)|```/m.test(bodyText);
        if (hasMarkdown) {
            return 'markdown';
        }
        return 'text';
    }

    return 'empty';
};
