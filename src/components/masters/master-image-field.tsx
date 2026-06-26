'use client';

import { useRef } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterImageFieldProps {
  label?: string;
  currentUrl?: string | null;
  previewUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  onClear: () => void;
}

export function MasterImageField({
  label = 'Image Attachment',
  currentUrl,
  previewUrl,
  onFileSelect,
  onClear,
}: MasterImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload className="w-4 h-4" />
            Choose image
          </Button>
          {displayUrl && (
            <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={onClear}>
              <X className="w-4 h-4" />
              Remove
            </Button>
          )}
          <p className="text-xs text-gray-400">JPEG, PNG, WebP · max 5 MB</p>
        </div>
      </div>
    </div>
  );
}
