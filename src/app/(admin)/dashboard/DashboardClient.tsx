"use client";

import { useState, useMemo } from "react";
import type { Atendimento } from "./page";

interface DashboardClientProps {
  atendimentos: Atendimento[];
}

// ============ SVG Bar Chart ============
function BarChart({ data, title }: { data: { label: string; value: number }[]; title: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-8">Sem dados disponíveis</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(60, Math.floor((500 - data.length * 8) / data.length));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-6">{title}</h3>
      <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
        {data.map((item, i) => {
          const heightPercent = (item.value / maxValue) * 100;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-500 mb-1">{item.value}</span>
              <div
                className="rounded-t transition-all"
                style={{
                  height: `${heightPercent}%`,
                  width: barWidth,
                  backgroundColor: "#0E3B2C",
                  minHeight: item.value > 0 ? 4 : 0,
                }}
              />
              <span
                className="text-xs text-gray-600 mt-2 max-w-full truncate"
                title={item.label}
              >
                {item.label.length > 10 ? item.label.slice(0, 10) + "..." : item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ SVG Donut Chart ============
function DonutChart({ data, title }: { data: { label: string; value: number; color: string }[]; title?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-8">Sem dados disponíveis</p>
      </div>
    );
  }

  const cx = 100;
  const cy = 100;
  const radius = 70;
  const innerRadius = 45;

  let currentAngle = -90;
  const paths = data.map((item, i) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(startRad);
    const iy1 = cy + innerRadius * Math.sin(startRad);
    const ix2 = cx + innerRadius * Math.cos(endRad);
    const iy2 = cy + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`,
      color: item.color,
      label: item.label,
      value: item.value,
    };
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      <div className="flex items-center justify-center gap-8">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {paths.map((path, i) => (
            <path key={i} d={path.d} fill={path.color} />
          ))}
          <text x="100" y="95" textAnchor="middle" className="text-2xl font-semibold fill-gray-800">
            {total}
          </text>
          <text x="100" y="115" textAnchor="middle" className="text-xs fill-gray-500">
            Total
          </text>
        </svg>
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600">
                {item.label} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SVG Line Chart ============
function LineChart({ data, title }: { data: { date: string; value: number }[]; title?: string }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
        <p className="text-sm text-gray-400 text-center py-8">Sem dados disponíveis</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const height = 180;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((item, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding + chartHeight - (item.value / maxValue) * chartHeight,
    date: item.date,
    value: item.value,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${points[points.length - 1]?.x || padding} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      <svg width="100%" height="200" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding}
            y1={padding + chartHeight * (1 - ratio)}
            x2={width - padding}
            y2={padding + chartHeight * (1 - ratio)}
            stroke="#E5E7EB"
            strokeDasharray="4,4"
          />
        ))}

        {/* Area */}
        <path d={areaPath} fill="#0E3B2C" fillOpacity="0.1" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#0E3B2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#0E3B2C" />
        ))}

        {/* X labels */}
        {points.map((p, i) => {
          if (i % Math.ceil(data.length / 7) !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="text-xs fill-gray-500"
            >
              {p.date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============ Main Component ============
export default function DashboardClient({ atendimentos }: DashboardClientProps) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const filteredAtendimentos = useMemo(() => {
    return atendimentos.filter((item) => {
      const date = new Date(item.criado_em);

      const matchesStart = !dateStart || date >= new Date(dateStart);
      const matchesEnd = !dateEnd || date <= new Date(dateEnd + "T23:59:59");
      const matchesProduct =
        !productSearch ||
        (item.produto_interesse?.toLowerCase().includes(productSearch.toLowerCase()) ?? false);

      return matchesStart && matchesEnd && matchesProduct;
    });
  }, [atendimentos, dateStart, dateEnd, productSearch]);

  const kpis = useMemo(() => {
    const total = filteredAtendimentos.length;
    const novos = filteredAtendimentos.filter((a) => a.status.toLowerCase() === "novo").length;
    const interessados = filteredAtendimentos.filter((a) => a.status.toLowerCase() === "interessado").length;
    const compraram = filteredAtendimentos.filter((a) => a.status.toLowerCase() === "comprou").length;

    return { total, novos, interessados, compraram };
  }, [filteredAtendimentos]);

  const topProdutos = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAtendimentos.forEach((item) => {
      const produto = item.produto_interesse?.trim() || "Não informado";
      counts[produto] = (counts[produto] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }));
  }, [filteredAtendimentos]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAtendimentos.forEach((item) => {
      const status = item.status.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      novo: "#0F6E56",
      interessado: "#854D0E",
      comprou: "#166534",
      perdido: "#991B1B",
    };

    return Object.entries(counts).map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      color: colors[label] || "#6B7280",
    }));
  }, [filteredAtendimentos]);

  const conversasPorDia = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split("T")[0];
      days[key] = 0;
    }

    filteredAtendimentos.forEach((item) => {
      const key = item.criado_em.split("T")[0];
      if (key in days) {
        days[key]++;
      }
    });

    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value,
      }));
  }, [filteredAtendimentos]);

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
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">De:</label>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Até:</label>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <input
          type="text"
          placeholder="Buscar por produto..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart data={topProdutos} title="Produtos mais perguntados (Top 8)" />
        <DonutChart data={statusDistribution} title="Distribuição por status" />
      </div>

      {/* Charts Row 2 */}
      <LineChart data={conversasPorDia} title="Conversas por dia (últimos 14 dias)" />
    </div>
  );
}
