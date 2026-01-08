// src/utils/pasteHelper.ts

export function htmlToCustomMarkdown(html: string): string {
    // 1. Use DOMParser to create a DOM from the HTML string.
    // This is safer than using regex and allows traversing the structure.
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 2. We only care about the content inside the <body> tag.
    const body = doc.body;

    function processNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            // Replace sequences of whitespace with a single space, but preserve meaningful spaces.
            return node.textContent?.replace(/[ \t]+/g, ' ') || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            let childrenText = '';
            element.childNodes.forEach(child => {
                childrenText += processNode(child);
            });

            // Check for inline styling from Word
            const style = element.style;
            let isBold = style.fontWeight === 'bold' || parseInt(style.fontWeight) > 400;
            const isItalic = style.fontStyle === 'italic';
            const textDecoration = style.textDecorationLine || style.textDecoration;
            const isUnderline = textDecoration.includes('underline');
            const isStrikethrough = textDecoration.includes('line-through');

            // Wrap content based on tags and styles
            if (isBold || element.nodeName === 'B' || element.nodeName === 'STRONG') {
                childrenText = `**${childrenText.trim()}**`;
            }
            if (isItalic || element.nodeName === 'I' || element.nodeName === 'EM') {
                childrenText = `*${childrenText.trim()}*`;
            }
            if (isUnderline || element.nodeName === 'U') {
                childrenText = `<u>${childrenText.trim()}</u>`;
            }
            if (isStrikethrough || element.nodeName === 'S' || element.nodeName === 'STRIKE') {
                childrenText = `<s>${childrenText.trim()}</s>`;
            }


            switch (element.nodeName.toLowerCase()) {
                case 'p':
                case 'div': // Treat divs as paragraphs for layout preservation
                    // Add double newlines after a paragraph for spacing, only if it contains text.
                    return childrenText.trim() ? childrenText.trim() + '\n\n' : '';
                case 'br':
                    return '\n';
                case 'h1':
                    return `# ${childrenText.trim()}\n\n`;
                case 'h2':
                    return `## ${childrenText.trim()}\n\n`;
                case 'h3':
                    return `### ${childrenText.trim()}\n\n`;
                case 'li':
                    const parent = element.parentNode;
                    if (parent && parent.nodeName.toLowerCase() === 'ol') {
                        return `1. ${childrenText.trim()}\n`;
                    }
                    return `* ${childrenText.trim()}\n`;
                case 'ul':
                case 'ol':
                     // Add a newline after the list
                    return childrenText + '\n';
                
                // Ignore these container tags but keep their processed content
                case 'body':
                case 'html':
                case 'span':
                case 'font':
                case 'meta':
                case 'style':
                    return childrenText;
                default:
                    // For unknown tags, just return the children content
                    return childrenText;
            }
        }
        return '';
    }

    // Start processing from the body
    let markdown = processNode(body);

    // Final cleanup:
    // 1. Remove leading/trailing whitespace from each line.
    // 2. Consolidate more than two newlines into just two.
    // 3. Clean up spacing around list items.
    markdown = markdown
        .split('\n')
        .map(line => line.trim())
        .join('\n');
    
    markdown = markdown
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n\s+\*/g, '\n*')
        .replace(/\n\s+\d+\./g, '\n1.');

    return markdown.trim();
}
