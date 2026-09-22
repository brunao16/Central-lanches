"use client";

export function Skeleton({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={{ borderRadius: 8, background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite", ...style }} />;
}

export function SkeletonCard() {
  return (
    <div style={{ background: "var(--panel)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Skeleton style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 16, width: "60%", marginBottom: 8 }} />
          <Skeleton style={{ height: 12, width: "40%" }} />
        </div>
        <Skeleton style={{ height: 24, width: 80, borderRadius: 12 }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
          <Skeleton style={{ height: 14, flex: 2 }} />
          <Skeleton style={{ height: 14, flex: 1 }} />
          <Skeleton style={{ height: 14, flex: 1 }} />
          <Skeleton style={{ height: 14, width: 80 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "var(--panel)", borderRadius: 12, padding: 12 }}>
          <Skeleton style={{ height: 80, borderRadius: 8, marginBottom: 8 }} />
          <Skeleton style={{ height: 16, width: "70%", marginBottom: 6 }} />
          <Skeleton style={{ height: 12, width: "50%" }} />
        </div>
      ))}
    </div>
  );
}
