import { useEffect, useState } from "react";
import { obterToken } from "../services/auth";

const API_URL = import.meta.env.VITE_API_URL || "";

interface AuditLog {
  id: string;
  usuarioId: string | null;
  acao: string;
  detalhes: any;
  ip: string | null;
  createdAt: string;
}

export function LogsAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarLogs() {
    try {
      const resposta = await fetch(`${API_URL}/audit`, {
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      if (!resposta.ok) {
        throw new Error("Erro ao carregar logs do sistema");
      }

      setLogs(await resposta.json());
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar logs.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  return (
    <div className="bg-white dark:bg-black rounded-[2.5rem] shadow-xl dark:shadow-gold-500/5 p-10 space-y-10 border border-slate-100 dark:border-gold-500/20 transition-all duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-black text-xl text-slate-900 dark:text-gold-500 uppercase tracking-tight">Rastreador de Auditoria</h2>
          <p className="text-sm text-slate-400 dark:text-gold-500/50 mt-1">
            Logs imutáveis de operações críticas e alterações de sistema.
          </p>
        </div>
        <button
          onClick={carregarLogs}
          className="bg-slate-900 dark:bg-gold-500 text-white dark:text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md dark:shadow-gold-500/10"
        >
          Sincronizar Logs
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl border border-red-200 dark:border-red-900/50">
          {erro}
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-gold-500/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-gold-500/10 text-slate-400 dark:text-gold-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-gold-500/20">
              <th className="py-5 px-6">Registro Temporal</th>
              <th className="py-5 px-6">Operação</th>
              <th className="py-5 px-6">Originador</th>
              <th className="py-5 px-6">Endereço IP</th>
              <th className="py-5 px-6">Objeto de Dados</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-gold-500/10 text-slate-700 dark:text-gold-500/80">
            {carregando ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 dark:text-gold-500/30 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">
                  Descriptografando registros...
                </td>
              </tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-gold-500/5 transition-colors">
                <td className="py-4 px-6 font-bold text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="py-4 px-6">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-gold-400">{log.acao}</span>
                </td>
                <td className="py-4 px-6 text-xs">
                  {log.usuarioId || "Kernel / System"}
                </td>
                <td className="py-4 px-6 text-xs font-mono opacity-60">
                  {log.ip || "0.0.0.0"}
                </td>
                <td className="py-4 px-6">
                   <div className="max-w-xs truncate bg-slate-900 dark:bg-black p-3 rounded-xl border border-slate-800 dark:border-gold-500/20 font-mono text-[9px] text-emerald-400 dark:text-gold-500">
                      {log.detalhes ? JSON.stringify(log.detalhes) : "{}"}
                   </div>
                </td>
              </tr>
            ))}

            {!carregando && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 dark:text-gold-500/30 font-black uppercase text-[10px] tracking-[0.2em] italic">
                   Nenhum log operacional registrado no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
