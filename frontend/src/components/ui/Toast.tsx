import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";
import { ToastContext, type ToastType } from "./useToast";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

const TOAST_STYLE: Record<ToastType, { icon: React.ReactNode; bar: string }> = {
  success: {
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
    bar: "bg-success",
  },
  error: {
    icon: <XCircle className="h-4 w-4 text-danger" />,
    bar: "bg-danger",
  },
  info: {
    icon: <Info className="h-4 w-4 text-info" />,
    bar: "bg-info",
  },
  warning: {
    icon: <Info className="h-4 w-4 text-warning" />,
    bar: "bg-warning",
  },
};

const AutoDismiss = 4500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, title, description }]);
      timers.current[id] = setTimeout(() => remove(id), AutoDismiss);
    },
    [remove],
  );

  const value = {
    toast,
    success: (t: string, d?: string) => toast("success", t, d),
    error: (t: string, d?: string) => toast("error", t, d),
    info: (t: string, d?: string) => toast("info", t, d),
    warning: (t: string, d?: string) => toast("warning", t, d),
  };

  useEffect(() => {
    const remaining = timers.current;
    return () => Object.values(remaining).forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="glass-strong pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg border py-3 pl-4 pr-3"
            >
              <span
                className={`absolute left-0 top-0 bottom-0 w-1 ${TOAST_STYLE[t.type].bar}`}
              />
              <span className="mt-0.5 flex-none">{TOAST_STYLE[t.type].icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="flex-none rounded-md p-1 text-ink-subtle transition-colors hover:bg-surface-2 hover:text-ink"
                aria-label="Fermer la notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};