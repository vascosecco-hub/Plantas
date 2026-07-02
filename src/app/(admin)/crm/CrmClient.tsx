"use client";

import { useState, useMemo } from "react";
import type { Atendimento } from "./page";

interface CrmClientProps {
  atendimentos: Atendimento[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  novo: { bg: "#E1F5EE", text: "#0F6E56" },
  interessado: { bg: "#FEF9C3", text: "#854D0E" },
  comprou: { bg: "#DCFCE7", text: "#166534" },
  perdido: { bg: "#FEE2E2", text: "#991B1B" },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.novo;
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {label}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CrmClient({ atendimentos }: CrmClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredAtendimentos = useMemo(() => {
    return atendimentos.filter((item) => {
      const matchesSearch =
        search === "" ||
        (item.nome?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        item.telefone.includes(search);

      const matchesStatus =
        statusFilter === "todos" ||
        item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [atendimentos, search, statusFilter]);

  const kpis = useMemo(() => {
    const total = atendimentos.length;
    const novos = atendimentos.filter((a) => a.status.toLowerCase() === "novo").length;
    const interessados = atendimentos.filter((a) => a.status.toLowerCase() === "interessado").length;
    const compraram = atendimentos.filter((a) => a.status.toLowerCase() === "comprou").length;

    return { total, novos, interessados, compraram };
  }, [atendimentos]);

  function exportCsv() {
    const headers = ["Data/Hora", "Cliente", "Telefone", "Status", "Endereço", "Produto", "Resumo"];
    const rows = filteredAtendimentos.map((item) => [
      formatDate(item.criado_em),
      item.nome || "-",
      item.telefone,
      item.status,
      item.endereco || "-",
      item.produto_interesse || "-",
      item.resumo || "-",
    ]);

    // Usa ; como separador (padrão brasileiro para Excel) e \r\n para linha nova
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\r\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `atendimentos_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{kpis.total}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Novos</p>
          <p className="text-3xl font-semibold mt-1" style={{ color: "#0F6E56" }}>{kpis.novos}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Interessados</p>
          <p className="text-3xl font-semibold mt-1" style={{ color: "#854D0E" }}>{kpis.interessados}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Compraram</p>
          <p className="text-3xl font-semibold mt-1" style={{ color: "#166534" }}>{kpis.compraram}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        >
          <option value="todos">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="interessado">Interessado</option>
          <option value="comprou">Comprou</option>
          <option value="perdido">Perdido</option>
        </select>

        <button
          onClick={exportCsv}
          className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: "#0E3B2C" }}
        >
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resumo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAtendimentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum atendimento encontrado
                  </td>
                </tr>
              ) : (
                filteredAtendimentos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.criado_em)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.nome || "-"}</div>
                      <div className="text-sm text-gray-500">{item.telefone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      {item.endereco || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.produto_interesse || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {item.resumo || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 text-right">
        Mostrando {filteredAtendimentos.length} de {atendimentos.length} atendimentos
      </p>
    </div>
  );
}
