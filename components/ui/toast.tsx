"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";
type Toast = { id: string; type: ToastType; message: string; duration: number };

const icons: Record<ToastType, any> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const colors: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#16a34a", text: "#15803d" },
  error: { bg: "#fef2f2", border: "#dc2626", text: "#b91c1c" },
  warning: { bg: "#fffbeb", border: "#f59e0b", text: "#b45309" },
  info: { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
};

interface ToastContextValue { toast: (type: ToastType, message: string, duration?: number) => void; }
const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const remove = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 380 }}>
        {toasts.map(t => {
          const Icon = icons[t.type];
          const c = colors[t.type];
          return (
            <div key={t.id} style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeft: `4px solid ${c.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 12px rgba(0,0,0,.15)", animation: "slideIn .3s ease", cursor: "pointer" }} onClick={() => remove(t.id)}>
              <Icon size={18} color={c.border} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: c.text }}>{t.message}</span>
              <X size={14} color={c.text} style={{ opacity: .5 }} />
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </ToastContext.Provider>
  );
}
