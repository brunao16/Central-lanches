"use client";

import { Utensils, ShoppingBag, Receipt, Package, Users, FileText } from "lucide-react";

type EmptyProps = {
  icon?: "utensils" | "shopping" | "receipt" | "package" | "users" | "file";
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

const icons = { utensils: Utensils, shopping: ShoppingBag, receipt: Receipt, package: Package, users: Users, file: FileText };

export function EmptyState({ icon = "utensils", title, description, action }: EmptyProps) {
  const Icon = icons[icon];
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#657184" }}>
      <div style={{ width: 80, height: 80, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <Icon size={36} color="#94a3b8" />
      </div>
      <h3 style={{ fontSize: 18, color: "#1d2532", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, maxWidth: 300, margin: "0 auto 16px" }}>{description}</p>
      {action && (
        <button onClick={action.onClick} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#d84416", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{action.label}</button>
      )}
    </div>
  );
}
