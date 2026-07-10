import { useState } from "react";
import { CSVUpload } from "../components/CSVUpload";
import { ImageSelector } from "../components/ImageSelector";
import { obterToken } from "../services/auth";
import { UsuariosAdmin } from "../components/UsuariosAdmin";
import { LogsAuditoria } from "../components/LogsAuditoria";
import {
  BoiaConfig,
  EnvironmentalData,
  SensorConfig,
  SensoresBoia,
} from "../types";
interface Props {
  boias: BoiaConfig[];
  setBoias: (boias: BoiaConfig[]) => void;
  data: EnvironmentalData[];
  addData: (data: EnvironmentalData[]) => void;
  clearDataByBoia: (boiaId: string) => void;
  onLogout: () => void;
  theme?: "light" | "dark";
}

const API_URL = import.meta.env.VITE_API_URL || "";

const sensoresPadrao: SensoresBoia = {
  tempAgua: {
    ativo: true,
    nome: "Temperatura da água",
    unidade: "°C",
    maxAlerta: 30,
    maxCritico: 35,
  },
  phAgua: {
    ativo: true,
    nome: "pH da água",
    unidade: "pH",
    minAlerta: 6.5,
    maxAlerta: 8.5,
    minCritico: 6,
    maxCritico: 9,
  },
  turbidez: {
    ativo: true,
    nome: "Turbidez",
    unidade: "NTU",
    maxAlerta: 15,
    maxCritico: 30,
  },
  condutivEC: {
    ativo: true,
    nome: "Condutividade",
    unidade: "µS/cm",
  },
  tempAr: {
    ativo: true,
    nome: "Temperatura do ar",
    unidade: "°C",
  },
  umidAr: {
    ativo: true,
    nome: "Umidade do ar",
    unidade: "%",
  },
  pressao: {
    ativo: true,
    nome: "Pressão atmosférica",
    unidade: "hPa",
  },
  indiceUV: {
    ativo: true,
    nome: "Índice UV",
    unidade: "",
  },
  chuvaAcum: {
    ativo: true,
    nome: "Chuva acumulada",
    unidade: "mm",
  },
  ventoVel: {
    ativo: true,
    nome: "Velocidade do vento",
    unidade: "km/h",
  },
  ventoDir: {
    ativo: true,
    nome: "Direção do vento",
    unidade: "°",
  },
};

const listaSensores: {
  chave: keyof SensoresBoia;
  titulo: string;
}[] = [
    { chave: "tempAgua", titulo: "Temperatura da água" },
    { chave: "phAgua", titulo: "pH da água" },
    { chave: "turbidez", titulo: "Turbidez" },
    { chave: "condutivEC", titulo: "Condutividade" },
    { chave: "tempAr", titulo: "Temperatura do ar" },
    { chave: "umidAr", titulo: "Umidade do ar" },
    { chave: "pressao", titulo: "Pressão atmosférica" },
    { chave: "indiceUV", titulo: "Índice UV" },
    { chave: "chuvaAcum", titulo: "Chuva acumulada" },
    { chave: "ventoVel", titulo: "Velocidade do vento" },
    { chave: "ventoDir", titulo: "Direção do vento" },
  ];

function gerarId(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function criarBoiaVazia(): BoiaConfig {
  return {
    id: "",
    nome: "",
    descricao: "",
    instituicao: "",
    responsavel: "",
    imagem: "/assets/boias/medusa.png",
    local: "",
    latitude: -27.603671,
    longitude: -48.552147,
    gpsIntegrado: false,
    habilitada: true,
    status: "offline",
    alertaAtivo: false,
    alertaTipo: undefined,
    comunicacao: {
      mqtt: false,
      mqttTopico: "",
      lora: false,
    },
    sensores: sensoresPadrao,
  };
}

function getDadosDaBoia(data: EnvironmentalData[], boiaId: string) {
  return data.filter((leitura) => leitura.boiaId === boiaId);
}

function numeroOuUndefined(valor: string) {
  if (valor.trim() === "") return undefined;
  return Number(valor);
}

function normalizarBoiaResposta(boia: any): BoiaConfig {
  return {
    id: boia.id,
    nome: boia.nome || boia.id,
    descricao: boia.descricao || "",
    instituicao: boia.instituicao || "Não informado",
    responsavel: boia.responsavel || "",
    imagem: boia.imagem || "/assets/boias/medusa.png",
    local: boia.local || "Não informado",
    latitude: boia.latitude ?? -27.603671,
    longitude: boia.longitude ?? -48.552147,
    gpsIntegrado: boia.gpsIntegrado ?? false,
    habilitada: boia.habilitada ?? true,
    status: boia.status || "offline",
    alertaAtivo: boia.alertaAtivo ?? false,
    alertaTipo: boia.alertaTipo || null,
    comunicacao: boia.comunicacao || {
      mqtt: boia.mqtt ?? false,
      mqttTopico: boia.mqttTopico || "",
      lora: boia.lora ?? false,
    },
    sensores: boia.sensores || sensoresPadrao,
  };
}

export function Admin({
  boias,
  setBoias,
  data,
  addData,
  clearDataByBoia,
  onLogout,
  theme
}: Props) {
  const [form, setForm] = useState<BoiaConfig>(criarBoiaVazia());
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [abaAtual, setAbaAtual] = useState<"boias" | "usuarios" | "logs">("boias");

  const atualizarCampo = <K extends keyof BoiaConfig>(
    campo: K,
    valor: BoiaConfig[K]
  ) => {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  };

  const atualizarComunicacao = (
    campo: keyof BoiaConfig["comunicacao"],
    valor: boolean | string
  ) => {
    setForm((atual) => ({
      ...atual,
      comunicacao: {
        ...atual.comunicacao,
        [campo]: valor,
      },
    }));
  };

  const atualizarSensor = (
    chave: keyof SensoresBoia,
    campo: keyof SensorConfig,
    valor: boolean | string | number | undefined
  ) => {
    setForm((atual) => {
      const sensorAtual = atual.sensores[chave] || sensoresPadrao[chave];

      return {
        ...atual,
        sensores: {
          ...atual.sensores,
          [chave]: {
            ...sensorAtual,
            [campo]: valor,
          },
        },
      };
    });
  };

  const limparFormulario = () => {
    setForm(criarBoiaVazia());
    setEditandoId(null);
  };

  async function salvarBoiaBackend(boia: BoiaConfig) {
    try {
      const resposta = await fetch(`${API_URL}/api/boias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify(boia),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao salvar boia");
      }

      return normalizarBoiaResposta(await resposta.json());
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar boia no backend");
      return null;
    }
  }

  async function atualizarBoiaBackend(boia: BoiaConfig) {
    try {
      const resposta = await fetch(`${API_URL}/api/boias/${boia.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${obterToken()}`,
        },
        body: JSON.stringify(boia),
      });

      if (!resposta.ok) {
        throw new Error("Erro ao atualizar boia");
      }

      return normalizarBoiaResposta(await resposta.json());
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar boia no backend");
      return null;
    }
  }

  async function excluirBoiaBackend(id: string) {
    try {
      const resposta = await fetch(`${API_URL}/api/boias/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      if (!resposta.ok) {
        throw new Error("Erro ao excluir boia");
      }

      return true;
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir boia no backend");
      return false;
    }
  }

  const salvarBoia = async () => {
    if (!form.nome.trim()) {
      alert("Informe o nome da boia.");
      return;
    }

    const idFinal = editandoId || gerarId(form.nome);

    if (!idFinal) {
      alert("Não foi possível gerar um ID para a boia.");
      return;
    }

    const boiaFinal: BoiaConfig = {
      ...form,
      id: idFinal,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      status: form.status || "offline",
    };

    if (editandoId) {
      const boiaAtualizada = await atualizarBoiaBackend(boiaFinal);

      if (!boiaAtualizada) return;

      setBoias(
        boias.map((boia) =>
          boia.id === boiaAtualizada.id ? boiaAtualizada : boia
        )
      );
    } else {
      const jaExiste = boias.some((boia) => boia.id === idFinal);

      if (jaExiste) {
        alert("Já existe uma boia com esse nome/ID.");
        return;
      }

      const boiaSalva = await salvarBoiaBackend(boiaFinal);

      if (!boiaSalva) return;

      setBoias([...boias, boiaSalva]);
    }

    limparFormulario();
  };

  const editarBoia = (boia: BoiaConfig) => {
    setForm({
      ...boia,
      sensores: {
        ...sensoresPadrao,
        ...boia.sensores,
      },
      comunicacao: {
        ...boia.comunicacao,
      },
    });

    setEditandoId(boia.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const alternarBoia = async (id: string) => {
    const boiaAtual = boias.find((boia) => boia.id === id);

    if (!boiaAtual) return;

    const boiaAtualizada: BoiaConfig = {
      ...boiaAtual,
      habilitada: !boiaAtual.habilitada,
    };

    const resposta = await atualizarBoiaBackend(boiaAtualizada);

    if (!resposta) return;

    setBoias(
      boias.map((boia) => (boia.id === id ? resposta : boia))
    );
  };

  const excluirBoia = async (id: string) => {
    const confirmar = confirm(
      "Deseja realmente excluir esta boia? Os dados carregados dela também serão removidos."
    );

    if (!confirmar) return;

    const sucesso = await excluirBoiaBackend(id);

    if (!sucesso) return;

    setBoias(boias.filter((boia) => boia.id !== id));
    clearDataByBoia(id);

    if (editandoId === id) {
      limparFormulario();
    }
  };

  const limparAlerta = async (id: string) => {
    try {
      const resposta = await fetch(`${API_URL}/api/boias/${id}/acknowledge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${obterToken()}`,
        },
      });

      if (!resposta.ok) {
        throw new Error("Erro ao limpar alerta");
      }

      const boiaAtualizada = normalizarBoiaResposta(await resposta.json());
      setBoias(boias.map(b => b.id === id ? boiaAtualizada : b));
    } catch (error) {
      console.error(error);
      alert("Erro ao limpar alerta no servidor.");
    }
  };

  const usuarioLogado = JSON.parse(
    localStorage.getItem("hydra_usuario") || "{}"
  );

  const isAdmin = usuarioLogado.role === "ADMIN";

  return (
    <div className="p-8 lg:p-12 space-y-12 bg-slate-50 dark:bg-black min-h-screen transition-colors duration-500">
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-200 dark:border-gold-500/20 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-gold-500 tracking-tight uppercase">Administração</h1>
          <p className="text-slate-500 dark:text-gold-500/50 font-medium">
            Gestão estratégica de estações, parâmetros e infraestrutura de dados.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onLogout}
            className="bg-red-600 dark:bg-red-900/40 text-white dark:text-red-400 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            Encerrar Sessão
          </button>
        </div>
      </div>

      {localStorage.getItem("hydra_usuario") &&
        JSON.parse(localStorage.getItem("hydra_usuario") || "{}").role === "ADMIN" && (
          <div className="flex gap-10 border-b border-slate-100 dark:border-gold-500/10 pb-4 mb-6">
            {[
              { id: "boias", label: "Estações" },
              { id: "usuarios", label: "Usuários" },
              { id: "logs", label: "Auditoria" }
            ].map((aba) => (
              <button
                key={aba.id}
                onClick={() => setAbaAtual(aba.id as any)}
                className={`font-black uppercase text-[10px] tracking-[0.2em] pb-4 transition-all relative ${abaAtual === aba.id ? "text-blue-600 dark:text-gold-500" : "text-slate-400 dark:text-gold-500/30"}`}
              >
                {aba.label}
                {abaAtual === aba.id && <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 dark:bg-gold-500 rounded-full"></span>}
              </button>
            ))}
          </div>
        )}

      {abaAtual === "usuarios" && <UsuariosAdmin />}
      {abaAtual === "logs" && <LogsAuditoria />}

      {abaAtual === "boias" && (
        <>
          <div className="bg-blue-50 dark:bg-gold-500/5 border border-blue-200 dark:border-gold-500/20 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
        <h2 className="font-black text-xl text-blue-900 dark:text-gold-500 uppercase tracking-tight">
          Guia de Integração Hydra
        </h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-sm">
          <div className="bg-white dark:bg-black rounded-3xl p-6 border border-blue-100 dark:border-gold-500/10">
            <h3 className="font-black text-blue-900 dark:text-gold-400 uppercase text-xs mb-3 tracking-widest">1. Cadastro da Estação</h3>
            <p className="text-slate-600 dark:text-gold-500/60 leading-relaxed">
              Informe os dados institucionais, geolocalização e defina se a estação enviará coordenadas via GPS integrado ou se manterá posição estática.
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-3xl p-6 border border-blue-100 dark:border-gold-500/10">
            <h3 className="font-black text-blue-900 dark:text-gold-400 uppercase text-xs mb-3 tracking-widest">2. Matriz de Sensores</h3>
            <p className="text-slate-600 dark:text-gold-500/60 leading-relaxed">
              Habilite apenas os sensores físicos presentes na boia. A plataforma abstrai a tecnologia de transmissão, focando na normalização dos dados.
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-3xl p-6 border border-blue-100 dark:border-gold-500/10">
            <h3 className="font-black text-blue-900 dark:text-gold-400 uppercase text-xs mb-3 tracking-widest">3. Formato CSV</h3>
            <pre className="bg-slate-900 dark:bg-black text-green-400 dark:text-gold-500 p-5 rounded-2xl border border-slate-800 dark:border-gold-500/20 overflow-auto text-xs mt-3">
              {`timestamp;tempAr;umidAr;pressao;...
2026-05-01 10:00;25.3;70;1012;...`}
            </pre>
          </div>

          <div className="bg-white dark:bg-black rounded-3xl p-6 border border-blue-100 dark:border-gold-500/10">
            <h3 className="font-black text-blue-900 dark:text-gold-400 uppercase text-xs mb-3 tracking-widest">4. Payload MQTT</h3>
            <pre className="bg-slate-900 dark:bg-black text-green-400 dark:text-gold-500 p-5 rounded-2xl border border-slate-800 dark:border-gold-500/20 overflow-auto text-xs mt-3">
              {`{
  "timestamp": "2026-06-02 16:25",
  "lat": -27.593708,
  "lon": -48.542835,
  "alt": 16.6,
  "tempAr": 25.3,
  "umidAr": 70,
  "pressao": 1012,
  "indiceUV": 5,
  "chuvaAcum": 0,
  "ventoVel": 12,
  "ventoDir": 180,
  "tempAgua": 22.1,
  "phAgua": 7.2,
  "condutivEC": 980,
  "turbidez": 12
}`}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-[3rem] shadow-xl dark:shadow-gold-500/5 border border-slate-100 dark:border-gold-500/20 p-10 space-y-10">
        <div>
          <h2 className="font-black text-2xl text-slate-900 dark:text-gold-500 uppercase tracking-tight">
            {editandoId ? "Editar Estação" : "Cadastrar Nova Estação"}
          </h2>
          <p className="text-sm text-slate-400 dark:text-gold-500/50 mt-1">
            Configuração técnica de hardware, comunicação e limites operacionais.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Nome da Boia</label>
              <input
                value={form.nome}
                onChange={(e) => atualizarCampo("nome", e.target.value)}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
                placeholder="Ex: Hydra-01 Florianópolis"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Instituição</label>
              <input
                value={form.instituicao}
                onChange={(e) => atualizarCampo("instituicao", e.target.value)}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
                placeholder="IFSC, UFSC, etc"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Responsável</label>
              <input
                value={form.responsavel || ""}
                onChange={(e) => atualizarCampo("responsavel", e.target.value)}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
                placeholder="Equipe de Engenharia"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Local de Instalação</label>
              <input
                value={form.local}
                onChange={(e) => atualizarCampo("local", e.target.value)}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
                placeholder="Baía Sul, Lagoa..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => atualizarCampo("latitude", Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => atualizarCampo("longitude", Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50">Descrição Detalhada</label>
              <textarea
                value={form.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-2xl px-4 py-3 text-slate-700 dark:text-gold-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-gold-500 outline-none transition-all"
                rows={4}
                placeholder="Finalidade científica e contexto operacional..."
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-gold-500/5 border border-slate-100 dark:border-gold-500/10 rounded-[2.5rem] p-8">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50 mb-6">Assinatura Visual</label>
            <ImageSelector
              value={form.imagem}
              onChange={(novaImagem) => atualizarCampo("imagem", novaImagem)}
            />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-gold-500/5 border border-slate-200 dark:border-gold-500/20 rounded-[2.5rem] p-8 space-y-6">
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-gold-500">Matriz de Comunicação</h3>

          <div className="flex flex-wrap gap-8">
            {[
              { id: "mqtt", label: "Procolo MQTT", checked: form.comunicacao.mqtt },
              { id: "lora", label: "Rádio LoRa", checked: form.comunicacao.lora },
              { id: "gps", label: "GPS Integrado", checked: form.gpsIntegrado },
              { id: "sticky", label: "Alertas Persistentes (Sticky)", checked: form.alertaAtivo }
            ].map((com) => (
              <label key={com.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={com.checked as any}
                  onChange={(e) => {
                    if (com.id === "gps") atualizarCampo("gpsIntegrado", e.target.checked);
                    else if (com.id === "sticky") atualizarCampo("alertaAtivo", e.target.checked);
                    else atualizarComunicacao(com.id as any, e.target.checked);
                  }}
                  className="w-5 h-5 rounded-lg border-slate-300 dark:border-gold-500/30 text-blue-600 dark:text-gold-500 focus:ring-blue-500 dark:focus:ring-gold-500 bg-white dark:bg-black"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-gold-500/80 group-hover:text-slate-900 dark:group-hover:text-gold-400 transition-colors">{com.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/50 mb-2">Tópico MQTT (Stream de Dados)</label>
            <input
              value={form.comunicacao.mqttTopico || ""}
              onChange={(e) => atualizarComunicacao("mqttTopico", e.target.value)}
              className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-xl px-4 py-3 text-slate-700 dark:text-gold-500 outline-none focus:border-blue-500 dark:focus:border-gold-500 transition-all"
              placeholder="Hydra/ifsc-baia-sul"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-black uppercase text-xs tracking-widest text-slate-800 dark:text-gold-500">Parâmetros de Sensores e Limites Críticos</h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {listaSensores.map(({ chave, titulo }) => {
              const sensorAtual = form.sensores[chave] || sensoresPadrao[chave];

              return (
                <div key={chave} className="bg-slate-50 dark:bg-gold-500/5 border border-slate-200 dark:border-gold-500/20 rounded-3xl p-6 space-y-6 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sensorAtual?.ativo || false}
                      onChange={(e) =>
                        atualizarSensor(chave, "ativo", e.target.checked)
                      }
                      className="w-5 h-5 rounded-lg border-slate-300 dark:border-gold-500/30 text-blue-600 dark:text-gold-500 focus:ring-blue-500 dark:focus:ring-gold-500 bg-white dark:bg-black"
                    />
                    <span className="font-black uppercase text-[10px] tracking-widest text-slate-800 dark:text-gold-500">{titulo}</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Nome Exibido</label>
                      <input
                        value={sensorAtual?.nome || ""}
                        onChange={(e) =>
                          atualizarSensor(chave, "nome", e.target.value)
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Unidade</label>
                      <input
                        value={sensorAtual?.unidade || ""}
                        onChange={(e) =>
                          atualizarSensor(chave, "unidade", e.target.value)
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Mín. Alerta</label>
                      <input
                        type="number"
                        step="any"
                        value={sensorAtual?.minAlerta ?? ""}
                        onChange={(e) =>
                          atualizarSensor(
                            chave,
                            "minAlerta",
                            numeroOuUndefined(e.target.value)
                          )
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Máx. Alerta</label>
                      <input
                        type="number"
                        step="any"
                        value={sensorAtual?.maxAlerta ?? ""}
                        onChange={(e) =>
                          atualizarSensor(
                            chave,
                            "maxAlerta",
                            numeroOuUndefined(e.target.value)
                          )
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Mín. Crítico</label>
                      <input
                        type="number"
                        step="any"
                        value={sensorAtual?.minCritico ?? ""}
                        onChange={(e) =>
                          atualizarSensor(
                            chave,
                            "minCritico",
                            numeroOuUndefined(e.target.value)
                          )
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-gold-500/40">Máx. Crítico</label>
                      <input
                        type="number"
                        step="any"
                        value={sensorAtual?.maxCritico ?? ""}
                        onChange={(e) =>
                          atualizarSensor(
                            chave,
                            "maxCritico",
                            numeroOuUndefined(e.target.value)
                          )
                        }
                        className="w-full bg-white dark:bg-black border border-slate-200 dark:border-gold-500/20 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-gold-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-8">
          <button
            onClick={salvarBoia}
            className="bg-blue-600 dark:bg-gold-500 text-white dark:text-black px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:scale-105 transition-all shadow-xl dark:shadow-gold-500/10"
          >
            {editandoId ? "Atualizar Registro" : "Publicar Estação"}
          </button>

          <button
            onClick={limparFormulario}
            className="bg-slate-200 dark:bg-gold-500/5 text-slate-600 dark:text-gold-500 px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-slate-300 dark:border-gold-500/20 hover:bg-slate-300 dark:hover:bg-gold-500/10 transition-all"
          >
            Resetar Formulário
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-[3rem] shadow-xl dark:shadow-gold-500/5 border border-slate-100 dark:border-gold-500/20 p-10">
        <h2 className="font-black text-2xl text-slate-900 dark:text-gold-500 mb-8 uppercase tracking-tight">Frota de Estações Ativas</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {boias.map((boia) => {
            const dadosBoia = getDadosDaBoia(data, boia.id);
            const ultima = dadosBoia[dadosBoia.length - 1];

            return (
              <div key={boia.id} className="bg-slate-50 dark:bg-gold-500/5 border border-slate-200 dark:border-gold-500/20 rounded-[2.5rem] p-8 space-y-6 hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all group">
                <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 bg-white dark:bg-gold-500/10 rounded-3xl p-4 shadow-inner border border-slate-100 dark:border-gold-500/20 group-hover:scale-105 transition-transform">
                    <img
                      src={boia.imagem}
                      alt={boia.nome}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 dark:text-gold-500 uppercase text-sm tracking-tight">{boia.nome}</h3>

                    <p className="text-[10px] font-bold text-slate-400 dark:text-gold-500/40 uppercase tracking-widest mt-1">
                      {boia.instituicao}
                    </p>

                    <p className="text-[10px] font-black text-blue-600 dark:text-gold-600 uppercase tracking-widest mt-3">
                      Lote: {dadosBoia.length} registros
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-gold-500/10 flex flex-wrap gap-3">
                  {boia.alertaAtivo && (
                    <button
                      onClick={() => limparAlerta(boia.id)}
                      className="bg-sky-500 text-white dark:text-black dark:bg-gold-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                    >
                      Acknowledge
                    </button>
                  )}

                  <button
                    onClick={() => alternarBoia(boia.id)}
                    className={
                      boia.habilitada
                        ? "bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        : "bg-slate-300 dark:bg-gold-500/5 text-slate-600 dark:text-gold-500/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    }
                  >
                    {boia.habilitada ? "ATIVO" : "OFF"}
                  </button>

                  <button
                    onClick={() => editarBoia(boia)}
                    className="bg-slate-900 dark:bg-gold-500 text-white dark:text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                  >
                    Editar
                  </button>

                  <button
                    onClick={async () => {
                      const confirmar = confirm("Deseja apagar todos os dados desta boia?");

                      if (!confirmar) return;

                      const resposta = await fetch(`/api/leituras/${boia.id}`, {
                        method: "DELETE",
                        headers: {
                          Authorization: `Bearer ${obterToken()}`,
                        },
                      });

                      if (!resposta.ok) {
                        alert("Erro ao apagar dados no backend.");
                        return;
                      }

                      clearDataByBoia(boia.id);
                    }}
                    className="bg-amber-500 dark:bg-amber-900/30 text-white dark:text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Wipe
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => excluirBoia(boia.id)}
                      className="bg-red-600 dark:bg-red-900/30 text-white dark:text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-black rounded-[3rem] shadow-xl dark:shadow-gold-500/5 border border-slate-100 dark:border-gold-500/20 p-10">
        <h2 className="font-black text-2xl text-slate-900 dark:text-gold-500 mb-8 uppercase tracking-tight">Ingestão de Dados em Massa (CSV)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {boias
            .filter((boia) => boia.habilitada)
            .map((boia) => {
              const dadosBoia = getDadosDaBoia(data, boia.id);

              return (
                <div key={boia.id} className="bg-slate-50 dark:bg-gold-500/5 border border-slate-200 dark:border-gold-500/20 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white dark:bg-gold-500/10 rounded-2xl p-3 shadow-inner">
                        <img
                          src={boia.imagem}
                          alt={boia.nome}
                          className="w-full h-full object-contain"
                        />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900 dark:text-gold-500 uppercase text-xs tracking-widest">{boia.nome}</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-gold-500/40 uppercase tracking-widest mt-1">
                        {dadosBoia.length} entradas
                      </p>
                    </div>
                  </div>

                  <CSVUpload boiaId={boia.id} onDataLoaded={addData} />
                </div>
              );
            })}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
