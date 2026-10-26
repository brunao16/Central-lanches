"use client";

import { useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Download, FileSpreadsheet, Calendar, DollarSign, TrendingUp, Layers } from "lucide-react";

export default function RelatoriosPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function downloadCsv(type: string) {
    let url = `/api/reports?type=${type}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.open(url, "_blank");
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Relatórios & Exportação Financeira</h1>
            <p className="text-xs text-gray-500">Exporte vendas, despesas e DRE consolidado em formato CSV / Excel</p>
          </div>

          {/* Filtro por Período */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold px-1">
              <Calendar size={14} className="text-primary" />
              <span>Período:</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
            />
            <span className="text-xs text-gray-400">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* DRE Financeiro Consolidado */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">DRE / Lucro Real</h3>
              <p className="text-xs text-gray-500">
                Comparativo de Faturamento Bruto vs Gastos com cálculo de Lucro Líquido Real do período.
              </p>
            </div>
            <button
              onClick={() => downloadCsv("financial")}
              className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Download size={14} />
              Baixar DRE Financeiro
            </button>
          </div>

          {/* Relatório de Vendas */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-red-50 text-primary rounded-xl w-fit">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Relatório de Vendas</h3>
              <p className="text-xs text-gray-500">
                Histórico completo com código, cliente, tipo (balcão, mesa, delivery), forma de pagamento e total em R$.
              </p>
            </div>
            <button
              onClick={() => downloadCsv("sales")}
              className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Download size={14} />
              Baixar CSV de Vendas
            </button>
          </div>

          {/* Relatório de Gastos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <DollarSign size={24} />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Relatório de Gastos</h3>
              <p className="text-xs text-gray-500">
                Lançamentos de despesas categorizadas (insumos, aluguel, energia, funcionários) com datas e valores.
              </p>
            </div>
            <button
              onClick={() => downloadCsv("expenses")}
              className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Download size={14} />
              Baixar CSV de Gastos
            </button>
          </div>

          {/* Catálogo de Produtos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <Layers size={24} />
              </div>
              <h3 className="font-extrabold text-base text-gray-900">Catálogo de Produtos</h3>
              <p className="text-xs text-gray-500">
                Relação de itens do cardápio, categoria, preços de venda e custos cadastrados para margem de lucro.
              </p>
            </div>
            <button
              onClick={() => downloadCsv("products")}
              className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Download size={14} />
              Baixar CSV de Produtos
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
