"use client";

import { useTransition } from "react";
import { FileText, Loader2, Send } from "lucide-react";
import { resendInvoiceEmail } from "@/app/actions/billing";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invoice {
  id: string;
  seuNumero: string;
  status: string;
  amount: number;
  dueDate: string;
  referenceMonth: string;
  paidAt: string | null;
  sentAt: string | null;
  errorMessage: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-slate-100 text-slate-500" },
  BOLETO_CREATED: { label: "Boleto gerado", className: "bg-blue-100 text-blue-700" },
  SENT: { label: "Enviado", className: "bg-indigo-100 text-indigo-700" },
  PAID: { label: "Pago", className: "bg-green-100 text-green-700" },
  OVERDUE: { label: "Vencido", className: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Cancelado", className: "bg-slate-100 text-slate-400" },
  EXPIRED: { label: "Expirado", className: "bg-red-100 text-red-600" },
};

function ResendButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => resendInvoiceEmail(invoiceId))}
      disabled={isPending}
      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
      Reenviar
    </button>
  );
}

export function InvoicesList({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-4">Histórico de faturas</h2>

      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Nenhuma fatura emitida ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const st = statusConfig[inv.status] ?? statusConfig.PENDING;
            const monthStr = format(new Date(inv.referenceMonth + "-02"), "MMMM/yyyy", { locale: ptBR });
            const amountStr = inv.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            const canResend = ["BOLETO_CREATED", "SENT", "OVERDUE"].includes(inv.status);

            return (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">{monthStr}</p>
                    <p className="text-xs text-slate-400">
                      Venc. {format(new Date(inv.dueDate), "dd/MM/yyyy")}
                      {inv.paidAt && ` · Pago em ${format(new Date(inv.paidAt), "dd/MM/yyyy")}`}
                    </p>
                    {inv.errorMessage && (
                      <p className="text-xs text-red-500 mt-0.5">{inv.errorMessage}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">{amountStr}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.className}`}>
                    {st.label}
                  </span>
                  {canResend && <ResendButton invoiceId={inv.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
