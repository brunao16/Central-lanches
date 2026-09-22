"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { X, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type ConfirmOptions = { title: string; message: string; confirmText?: string; cancelText?: string; variant?: "danger" | "warning" | "info" };
type ConfirmContextValue = { confirm: (opts: ConfirmOptions) => Promise<boolean>; };

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: async () => false });

export function useConfirm() { return useContext(ConfirmContext); }

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolve, setResolve] = useState<(v: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((res) => { setOpts(options); setResolve(() => res); });
  }, []);

  const handleResult = (v: boolean) => { setOpts(null); resolve(v); };

  const variantConfig = {
    danger: { icon: AlertTriangle, iconColor: "#dc2626", btnBg: "#dc2626", btnHover: "#b91c1c" },
    warning: { icon: AlertTriangle, iconColor: "#f59e0b", btnBg: "#f59e0b", btnHover: "#d97706" },
    info: { icon: Info, iconColor: "#3b82f6", btnBg: "#3b82f6", btnHover: "#2563eb" },
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {opts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }} onClick={() => handleResult(false)}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,.2)", animation: "modalIn .2s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {(() => { const v = variantConfig[opts.variant || "danger"]; const Icon = v.icon; return <Icon size={24} color={v.iconColor} />; })()}
              <h3 style={{ fontSize: 18, margin: 0 }}>{opts.title}</h3>
            </div>
            <p style={{ color: "#657184", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>{opts.message}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => handleResult(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #dce2e8", background: "white", cursor: "pointer", fontSize: 14 }}>{opts.cancelText || "Cancelar"}</button>
              <button onClick={() => handleResult(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: variantConfig[opts.variant || "danger"].btnBg, color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>{opts.confirmText || "Confirmar"}</button>
            </div>
          </div>
          <style>{`@keyframes modalIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
