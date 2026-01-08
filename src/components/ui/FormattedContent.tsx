import React from 'react';

interface FormattedContentProps {
    content: string;
}

const FormattedContent: React.FC<FormattedContentProps> = ({ content }) => {

    const formatContent = (text: string) => {
        // 1. Convert our custom markdown and block formats to HTML
        let html = text
            // Block formats
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\s*>\s(.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^\s*\*\s(.*$)/gim, '<ul><li>$1</li></ul>') // Handle lists
            .replace(/^\s*\d+\.\s(.*$)/gim, '<ol><li>$1</li></ol>')
            // Custom alignment tags
            .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align: center;">$1</div>')
            .replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div style="text-align: right;">$1</div>')
            // Inline formats
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // @-mentions
            .replace(/@(\w+)/g, '<strong class="text-green-600 dark:text-green-400">@$1</strong>');
            
        // Consolidate adjacent list items
        html = html.replace(/<\/ul>\s*<ul>/g, '').replace(/<\/ol>\s*<ol>/g, '');
        // Replace newlines with <br> inside paragraphs (basic implementation)
        html = html.replace(/\n/g, '<br />');

        // 2. Sanitize the generated/pasted HTML using DOMParser
        const sanitize = (htmlString: string) => {
            const allowedTags = ['strong', 'em', 'u', 's', 'p', 'br', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'div', 'a', 'span'];
            const allowedAttributes = ['href', 'target', 'rel', 'style', 'class'];
            const doc = new DOMParser().parseFromString(htmlString, 'text/html');

            const cleanNode = (node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as HTMLElement;

                    if (!allowedTags.includes(element.tagName.toLowerCase())) {
                        // Replace disallowed tags with their text content instead of removing them
                        element.replaceWith(document.createTextNode(element.textContent || ''));
                        return;
                    }
                    
                    const attributes = Array.from(element.attributes);
                    for (const attr of attributes) {
                        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
                            element.removeAttribute(attr.name);
                        }
                        // Security check for style attributes
                        if (attr.name.toLowerCase() === 'style') {
                             if (!/text-align:\s*(center|right|left);?/.test(attr.value)) {
                                element.removeAttribute('style');
                             }
                        }
                        // Security check for links
                        if (attr.name.toLowerCase() === 'href' && !attr.value.startsWith('http')) {
                           element.removeAttribute('href');
                        }
                    }
                }
                
                // Recursively clean child nodes.
                // FIX: Iterate over a static copy of the child nodes. Modifying the live
                // NodeList from `childNodes` while iterating over it causes runtime errors.
                Array.from(node.childNodes).forEach(child => cleanNode(child));
            };
            
            if (doc.body) {
                // Sanitize the *children* of the body, not the body tag itself.
                Array.from(doc.body.childNodes).forEach(child => cleanNode(child));
                return doc.body.innerHTML;
            }

            return ''; // Return an empty string if body doesn't exist.
        };

        return { __html: sanitize(html) };
    };

    return <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={formatContent(content || '')} />;
};

export default FormattedContent;