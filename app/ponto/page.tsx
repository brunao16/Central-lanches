"use client";

import { useEffect, useState } from "react";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";

type ClockRecord = { id: string; employee: string; clock_in: string; clock_out: string | null; branch: string; day: string };

const brl = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v / 100);
const now = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

export default function PontoPage() {
  const [employee, setEmployee] = useState("");
  const [records, setRecords] = useState<ClockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cl_ponto_employee");
    if (saved) setEmployee(saved);
    const timer = setInterval(() => setCurrentTime(now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!employee) return;
    localStorage.setItem("cl_ponto_employee", employee);
    setLoading(true);
    fetch(`/api/services?action=time-clock&employee=${encodeURIComponent(employee)}`)
      .then(r => r.json()).then(d => { setRecords(d.records || []); setLoading(false); });
  }, [employee]);

  async function clockIn() {
    if (!employee) return alert("Digite seu nome");
    setBusy(true);
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock-in", employee }),
    });
    setBusy(false);
    setLoading(true);
    fetch(`/api/services?action=time-clock&employee=${encodeURIComponent(employee)}`)
      .then(r => r.json()).then(d => { setRecords(d.records || []); setLoading(false); });
  }

  async function clockOut(id: string) {
    setBusy(true);
    await fetch("/api/services", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock-out", id }),
    });
    setBusy(false);
    setLoading(true);
    fetch(`/api/services?action=time-clock&employee=${encodeURIComponent(employee)}`)
      .then(r => r.json()).then(d => { setRecords(d.records || []); setLoading(false); });
  }

  const activeRecord = records.find(r => !r.clock_out);
  const totalHours = records.filter(r => r.clock_out).reduce((sum, r) => {
    const diff = new Date(r.clock_out!).getTime() - new Date(r.clock_in).getTime();
    return sum + diff / 3600000;
  }, 0);

  return (
    <div style={{ fontFamily: "Arial", background: "#f3f5f7", minHeight: "100vh" }}>
      <header style={{ background: "#1d2532", color: "white", padding: "20px 24px" }}>
        <div style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
          <Clock size={32} color="#d84416" />
          <h1 style={{ fontSize: 24, marginTop: 8 }}>Relógio de Ponto</h1>
          <p style={{ color: "#999", fontSize: 32, fontFamily: "monospace", marginTop: 8 }}>{currentTime}</p>
        </div>
      </header>

      <main style={{ maxWidth: 500, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Seu nome</label>
          <input value={employee} onChange={e => setEmployee(e.target.value)} placeholder="Ex.: João" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #dce2e8", fontSize: 16, marginBottom: 12 }} />

          {activeRecord ? (
            <button onClick={() => clockOut(activeRecord.id)} disabled={busy} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "#c32626", color: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogOut size={22} /> Bater Saída
            </button>
          ) : (
            <button onClick={clockIn} disabled={busy || !employee} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "#16a34a", color: "white", fontSize: 18, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogIn size={22} /> Bater Entrada
            </button>
          )}
        </div>

        <div style={{ background: "white", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#657184", fontSize: 14 }}>Horas hoje</span>
            <strong style={{ fontSize: 18 }}>{totalHours.toFixed(1)}h</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#657184", fontSize: 14 }}>Batidas</span>
            <strong>{records.length}</strong>
          </div>
        </div>

        <h3 style={{ marginBottom: 8 }}><Calendar size={16} /> Histórico de Hoje</h3>
        {loading ? <p className="notice">Carregando…</p> : records.length === 0 ? (
          <p className="hint">Nenhuma batida hoje.</p>
        ) : records.map(r => {
          const start = new Date(r.clock_in);
          const end = r.clock_out ? new Date(r.clock_out) : null;
          const hours = end ? ((end.getTime() - start.getTime()) / 3600000).toFixed(1) : "…";

          return (
            <div key={r.id} style={{ background: "white", borderRadius: 8, padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{r.employee}</strong>
                <p style={{ fontSize: 12, color: "#657184" }}>
                  {start.toLocaleTimeString("pt-BR")} → {end ? end.toLocaleTimeString("pt-Br") : "Em aberto"}
                </p>
              </div>
              <span style={{ fontWeight: 700, color: r.clock_out ? "#16a34a" : "#f59e0b" }}>{hours}h</span>
            </div>
          );
        })}
      </main>
    </div>
  );
}
