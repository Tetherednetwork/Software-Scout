import React from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, ListUlIcon, ListOlIcon, QuoteIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, ImageIcon } from './Icons';

interface EditorToolbarProps {
    onCommand: (command: string, value?: string) => void;
    activeFormats: Record<string, boolean | string>;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onCommand, activeFormats }) => {
    
    const getButtonClass = (format: string) => {
        return `p-2 rounded transition-colors ${
            activeFormats[format] 
                ? 'bg-gray-200 dark:bg-gray-900 text-green-600 dark:text-green-400' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-600'
        }`;
    };
    
    const blockType = (activeFormats.h1 && 'h1') || (activeFormats.h2 && 'h2') || (activeFormats.h3 && 'h3') || 'p';

    return (
        <div className="flex flex-col p-2 border-b border-gray-200 dark:border-gray-600">
            {/* Row 1 */}
            <div className="flex items-center gap-1 flex-wrap">
                <select 
                    value={blockType}
                    onChange={(e) => onCommand('block', e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1.5 text-sm focus:ring-green-500 focus:border-green-500"
                >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                </select>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                <button type="button" onClick={() => onCommand('bold')} title="Bold (Ctrl+B)" className={getButtonClass('bold')}><BoldIcon /></button>
                <button type="button" onClick={() => onCommand('italic')} title="Italic (Ctrl+I)" className={getButtonClass('italic')}><ItalicIcon /></button>
                <button type="button" onClick={() => onCommand('underline')} title="Underline (Ctrl+U)" className={getButtonClass('underline')}><UnderlineIcon /></button>
                <button type="button" onClick={() => onCommand('strikethrough')} title="Strikethrough" className={getButtonClass('strikethrough')}><StrikethroughIcon /></button>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                <button type="button" onClick={() => onCommand('ul')} title="Bulleted List" className={getButtonClass('ul')}><ListUlIcon /></button>
                <button type="button" onClick={() => onCommand('ol')} title="Numbered List" className={getButtonClass('ol')}><ListOlIcon /></button>
                <button type="button" onClick={() => onCommand('quote')} title="Blockquote" className={getButtonClass('quote')}><QuoteIcon /></button>
                 <button type="button" onClick={() => onCommand('image')} title="Insert Image" className={getButtonClass('image')}><ImageIcon /></button>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                 <button type="button" onClick={() => onCommand('align', 'left')} title="Align Left" className={getButtonClass('align-left')}><AlignLeftIcon /></button>
                <button type="button" onClick={() => onCommand('align', 'center')} title="Align Center" className={getButtonClass('align-center')}><AlignCenterIcon /></button>
                <button type="button" onClick={() => onCommand('align', 'right')} title="Align Right" className={getButtonClass('align-right')}><AlignRightIcon /></button>
            </div>
        </div>
    );
};

export default EditorToolbar;