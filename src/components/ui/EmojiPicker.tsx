import React, { useEffect, useRef } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const emojis = [
  '😀', '😂', '😍', '🤔', '👍', '❤️', '🔥', '🎉',
  '👏', '🙏', '💯', '🤯', '😢', '😠', '👀', '✨',
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-20">
      <div className="grid grid-cols-4 gap-1">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-2xl p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Select emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
