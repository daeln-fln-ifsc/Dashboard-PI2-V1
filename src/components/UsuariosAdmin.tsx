import { useEffect, useState } from "react";
import { obterToken } from "../services/auth";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
  ativo: boolean;
  createdAt: string;
}

export function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<Usuario["role"]>("OPERATOR");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarUsuarios() {
    try {
      const resposta = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      if (!resposta.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      setUsuarios(await resposta.json());
    } catch (error) {
      console.error(error);
      setErro("Erro ao carregar usuários.");
    }
  }

  async function criarUsuario(event: React.FormEvent) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify({
          nome,
          email,
          senha,
          role,
        }),
      });

      if (!resposta.ok) {
        const erroApi = await resposta.json();
        throw new Error(erroApi.error || "Erro ao criar usuário");
      }

      setNome("");
      setEmail("");
      setSenha("");
      setRole("OPERATOR");

      await carregarUsuarios();
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro("Erro ao criar usuário.");
      }
    } finally {
      setCarregando(false);
    }
  }

  async function desativarUsuario(id: string) {
    const confirmar = confirm("Deseja desativar este usuário?");

    if (!confirmar) return;

    try {
      const resposta = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      if (!resposta.ok) {
        throw new Error("Erro ao desativar usuário");
      }

      await carregarUsuarios();
    } catch (error) {
      console.error(error);
      setErro("Erro ao desativar usuário.");
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <div className="bg-white dark:bg-black rounded-[2.5rem] shadow-xl dark:shadow-gold-500/5 p-10 space-y-10 border border-slate-100 dark:border-gold-500/20 transition-all duration-500">
      <div>
        <h2 className="font-black text-xl text-slate-900 dark:text-gold-500 uppercase tracking-tight">Usuários do Sistema</h2>
        <p className="text-sm text-slate-400 dark:text-gold-500/50 mt-1">
          Gestão de credenciais e níveis de acesso operacional.
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl border border-red-200 dark:border-red-900/50">
          {erro}
        </div>
      )}

      <form onSubmit={criarUsuario} className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Nome Completo</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all"
            placeholder="Nome"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Endereço de E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all"
            placeholder="E-mail"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Chave de Acesso</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all"
            placeholder="Senha"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Nível de Permissão</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Usuario["role"])}
            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all appearance-none cursor-pointer"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="OPERATOR">OPERATOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-slate-900 dark:bg-gold-500 text-white dark:text-black py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 disabled:opacity-30 transition-all shadow-lg dark:shadow-gold-500/10"
          >
            {carregando ? "Sincronizando..." : "Registrar"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-gold-500/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-gold-500/10 text-slate-400 dark:text-gold-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200 dark:border-gold-500/20">
              <th className="py-5 px-6">Identificação</th>
              <th className="py-5 px-6">Comunicação</th>
              <th className="py-5 px-6">Privilégios</th>
              <th className="py-5 px-6">Status</th>
              <th className="py-5 px-6">Gestão</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-gold-500/10 text-slate-700 dark:text-gold-500/80">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-slate-50/50 dark:hover:bg-gold-500/5 transition-colors">
                <td className="py-4 px-6 font-bold text-xs">{usuario.nome}</td>
                <td className="py-4 px-6 text-xs">{usuario.email}</td>
                <td className="py-4 px-6">
                   <span className="px-3 py-1 bg-white dark:bg-gold-500/10 rounded-full border border-slate-100 dark:border-gold-500/20 text-[9px] font-black uppercase tracking-widest">{usuario.role}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${usuario.ativo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`}></div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        {usuario.ativo ? "Operacional" : "Inativo"}
                     </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {usuario.ativo && (
                    <button
                      onClick={() => desativarUsuario(usuario.id)}
                      className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100 dark:border-red-900/50 hover:bg-red-600 hover:text-white transition-all"
                    >
                      Revogar
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 dark:text-gold-500/30 font-black uppercase text-[10px] tracking-[0.2em] italic">
                   Nenhuma credencial ativa detectada na base.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
