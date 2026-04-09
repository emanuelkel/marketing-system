"use client";

import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Download } from "lucide-react";

function downloadCSV(rows: string[][], filename: string) {
  const content = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

interface Props {
  postsByStatus: Array<{ name: string; value: number }>;
  postsByNetwork: Array<{ name: string; value: number }>;
  monthlyData: Array<{ month: string; posts: number }>;
  approvalRate: number;
  totalApprovals: number;
  approvedCount: number;
  topClients: Array<{ name: string; posts: number }>;
  artByStatus: Array<{ name: string; value: number }>;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AnalyticsCharts({ postsByStatus, postsByNetwork, monthlyData, approvalRate, totalApprovals, approvedCount, topClients, artByStatus }: Props) {
  const totalPosts = postsByStatus.reduce((sum, s) => sum + s.value, 0);
  const publishedCount = postsByStatus.find((s) => s.name === "Publicado")?.value ?? 0;

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            downloadCSV(
              [
                ["Métrica", "Valor"],
                ["Total de posts", String(totalPosts)],
                ["Posts publicados", String(publishedCount)],
                ["Taxa de aprovação", `${approvalRate}%`],
                ...monthlyData.map((m) => [`Posts em ${m.month}`, String(m.posts)]),
                ...postsByStatus.map((s) => [`Status: ${s.name}`, String(s.value)]),
                ...postsByNetwork.map((n) => [`Rede: ${n.name}`, String(n.value)]),
                ...topClients.map((c) => [`Cliente: ${c.name}`, String(c.posts)]),
              ],
              "analytics.csv"
            );
          }}
          className="flex items-center gap-2 text-sm font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de posts" value={totalPosts} />
        <StatCard label="Posts publicados" value={publishedCount} sub={`${totalPosts > 0 ? Math.round((publishedCount / totalPosts) * 100) : 0}% do total`} />
        <StatCard label="Taxa de aprovação" value={`${approvalRate}%`} sub={`${approvedCount} de ${totalApprovals} aprovações`} />
        <StatCard label="Top cliente" value={topClients[0]?.name ?? "—"} sub={topClients[0] ? `${topClients[0].posts} posts` : undefined} />
      </div>

      {/* Posts por mês */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Posts por mês (últimos 6 meses)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="posts" fill="#6366f1" radius={[4, 4, 0, 0]} name="Posts" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts por status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Posts por status</h2>
          {postsByStatus.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum dado ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={postsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {postsByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Posts por rede social */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Posts por rede social</h2>
          {postsByNetwork.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum dado ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={postsByNetwork} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clientes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Top clientes por posts</h2>
          {topClients.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum cliente ainda</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 truncate">{c.name}</span>
                      <span className="text-slate-500 ml-2 flex-shrink-0">{c.posts}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${topClients[0].posts > 0 ? (c.posts / topClients[0].posts) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Art requests por status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Solicitações de arte por status</h2>
          {artByStatus.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma solicitação ainda</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={artByStatus} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">
                  {artByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
