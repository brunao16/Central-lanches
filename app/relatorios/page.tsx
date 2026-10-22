"use client";

import AdminShell from "@/components/layout/AdminShell";
import { Download, FileText, FileSpreadsheet, CheckCircle2 } from "lucide-react";

export default function RelatoriosPage() {
  function downloadCsv(type: string) {
    window.open(`/api/reports?type=${type}`, "_blank");
  }

  return (
    <AdminShell>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Relatórios & Exportação</h1>
          <p className="text-xs text-gray-500">Exporte dados completos em formato CSV para Excel e planilhas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit">
                <FileSpreadsheet size={24} />
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

          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit">
                <FileSpreadsheet size={24} />
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
