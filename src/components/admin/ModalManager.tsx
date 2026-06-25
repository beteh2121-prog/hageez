'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import MerchForm from '@/components/admin/forms/MerchForm';
import DownloadForm from '@/components/admin/forms/DownloadForm';
import BookForm from '@/components/admin/forms/BookForm';
import type { Download, KdpBook, Merch } from '@/types';

export type ModalType = 'AddMerch' | 'EditMerch' | 'AddDownload' | 'EditDownload' | 'AddBook' | 'EditBook';

interface ModalManagerProps {
  modalType: ModalType;
  initialData: Merch | Download | KdpBook | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const MODAL_TITLES: Record<ModalType, string> = {
  AddMerch: 'Add Product',
  EditMerch: 'Edit Product',
  AddDownload: 'Add Download',
  EditDownload: 'Edit Download',
  AddBook: 'Add Book',
  EditBook: 'Edit Book',
};

export default function ModalManager({ modalType, initialData, onClose, onSuccess }: ModalManagerProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-brand-md bg-white p-6 shadow-gold-md">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-serif text-xl text-brown">{MODAL_TITLES[modalType]}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="text-charcoal/50 hover:text-charcoal">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {(modalType === 'AddMerch' || modalType === 'EditMerch') && (
            <MerchForm initialData={initialData as Merch | null} onClose={onClose} onSuccess={onSuccess} />
          )}
          {(modalType === 'AddDownload' || modalType === 'EditDownload') && (
            <DownloadForm initialData={initialData as Download | null} onClose={onClose} onSuccess={onSuccess} />
          )}
          {(modalType === 'AddBook' || modalType === 'EditBook') && (
            <BookForm initialData={initialData as KdpBook | null} onClose={onClose} onSuccess={onSuccess} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
