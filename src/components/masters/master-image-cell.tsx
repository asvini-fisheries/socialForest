'use client';

import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { DialogRoot, DialogContent } from '@/components/ui/dialog';

interface MasterImageCellProps {
  url?: string | null;
  alt?: string;
}

export function MasterImageCell({ url, alt = 'Attachment' }: MasterImageCellProps) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-300">
        <ImageIcon className="w-4 h-4" />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-shadow"
        title="View image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="w-full h-full object-cover" />
      </button>
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent title={alt} className="max-w-2xl">
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="max-h-[70vh] rounded-lg object-contain" />
          </div>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
