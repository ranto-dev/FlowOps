import React from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  loading = false,
  icon,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      icon={
        icon ?? (
          <div
            className={`p-2 rounded-xl ${
              danger
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-purple-50 text-purple-600 border border-purple-100"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        )
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-xs text-slate-600 leading-relaxed">{description}</div>
    </Modal>
  );
};