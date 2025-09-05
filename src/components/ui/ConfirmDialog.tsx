import React from 'react';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-400" />;
      default:
        return <Check className="w-6 h-6 text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          button: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          button: 'bg-orange-500 hover:bg-orange-600'
        };
      default:
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const colors = getColors();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
    >
      <div className="p-6">
        <div className={`w-16 h-16 ${colors.bg} ${colors.border} border rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          {getIcon()}
        </div>
        
        <p className="text-white/70 text-center mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${colors.button} text-white px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}