"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import QRCode from "qrcode";
import { QrCode as QrIcon, Printer, ExternalLink } from "lucide-react";

export default function QrMesasPage() {
  const [tables, setTables] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [qrCodes, setQrCodes] = useState<{ [table: number]: string }>({});
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://central-lanches-theta.vercel.app";

  useEffect(() => {
    async function generateQrs() {
      const qrs: { [table: number]: string } = {};
      for (const t of tables) {
        const url = `${baseUrl}/menu?mesa=${t}`;
        qrs[t] = await QRCode.toDataURL(url, { width: 300, margin: 1 });
      }
      setQrCodes(qrs);
    }
    generateQrs();
  }, [tables, baseUrl]);

  function handlePrint() {
    window.print();
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-primary rounded-xl">
              <QrIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 leading-none">
                QR Codes das Mesas
              </h1>
              <span className="text-xs text-gray-500 mt-1 block">
                Imprima as plaquinhas e cole nas mesas para os clientes pedirem pelo celular.
              </span>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-red-200 active:scale-95"
          >
            <Printer size={18} />
            <span>Imprimir Plaquinhas</span>
          </button>
        </div>

        {/* Grade de QR Codes para Visualização e Impressão */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
          {tables.map((t) => (
            <div
              key={t}
              className="bg-white rounded-3xl p-6 border-2 border-gray-200 text-center space-y-3 shadow-xs print:border-black print:rounded-2xl print:page-break-inside-avoid"
            >
              <div className="text-xs uppercase font-black tracking-widest text-primary print:text-black">
                CENTRAL LANCHES
              </div>
              <div className="text-3xl font-black text-gray-900 print:text-black">
                MESA {t}
              </div>
              <p className="text-xs text-gray-500 print:text-gray-800">
                Aponte a câmera do seu celular para fazer seu pedido
              </p>

              {qrCodes[t] ? (
                <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100 inline-block print:border-black">
                  <img src={qrCodes[t]} alt={`QR Mesa ${t}`} className="w-44 h-44 mx-auto" />
                </div>
              ) : (
                <div className="w-44 h-44 bg-gray-100 rounded-2xl animate-pulse mx-auto" />
              )}

              <div className="text-[11px] font-semibold text-gray-400 print:text-black flex items-center justify-center gap-1">
                <span>{baseUrl}/menu?mesa={t}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
