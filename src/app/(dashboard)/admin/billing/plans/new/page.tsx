import { NewPlanForm } from "./new-plan-form";

export default function NewPlanPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo plano</h1>
        <p className="text-sm text-slate-500 mt-1">Defina os detalhes do plano de serviço</p>
      </div>
      <NewPlanForm />
    </div>
  );
}
