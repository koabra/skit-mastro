import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  className?: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function AutoResizeTextarea({ value, className, onChange, ...props }: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        adjustHeight();
        onChange(e);
      }}
      rows={1}
      className={clsx("resize-none overflow-hidden", className)}
      {...props}
    />
  );
}
