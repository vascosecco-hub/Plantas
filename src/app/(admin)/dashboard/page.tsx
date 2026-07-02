import { createServiceClient } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - Plantas",
};

export interface Atendimento {
  id: number;
  telefone: string;
  nome: string | null;
  email: string | null;
  endereco: string | null;
  produto_interesse: string | null;
  sku: string | null;
  status: string;
  resumo: string | null;
  criado_em: string;
}

async function getAtendimentos(): Promise<Atendimento[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("atendimentos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as Atendimento[];
}

export default async function DashboardPage() {
  const atendimentos = await getAtendimentos();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Métricas e insights</p>
      </header>

      {/* Content */}
      <div className="p-8">
        <DashboardClient atendimentos={atendimentos} />
      </div>
    </div>
  );
}
