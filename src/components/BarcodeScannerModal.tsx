import React from 'react';
import { Product } from '../types';
import { CleanCameraBarcodeScannerModal } from './CleanCameraBarcodeScannerModal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

/**
 * Clean camera barcode scanner modal that opens camera automatically
 * without unnecessary clutter or fake scanner cards.
 */
export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  return (
    <CleanCameraBarcodeScannerModal
      isOpen={isOpen}
      onClose={onClose}
      products={products}
    />
  );
};
