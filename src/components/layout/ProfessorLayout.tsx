import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/client';
import type { Turma, Curso } from '@/api/models';
import {
  Home,
  ListFilter,
  FileText,
  BarChart2,
  Users,
  GraduationCap,
  LogOut,
  Plus
} from 'lucide-react';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export function ProfessorLayout() {
  const { usuario, sair } = useAuth();
  const { toast } = useToast();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);

  // Modal Criar Turma
  const [modalCriarTurmaAberta, setModalCriarTurmaAberta] = useState(false);
  const [nomeTurma, setNomeTurma] = useState('');
  const [periodoTurma, setPeriodoTurma] = useState('2026.2');
  const [cursoTurmaId, setCursoTurmaId] = useState('');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [criandoTurma, setCriandoTurma] = useState(false);

  async function carregarTurmas() {
    try {
      const lista = await api.professor.obterTurmas();
      setTurmas(lista);
      if (lista.length > 0) {
        const salva = localStorage.getItem('estuda_enade_turma_ativa');
        const encontrada = lista.find((t) => t.id === salva) || lista[0];
        setTurmaSelecionada(encontrada);
      }
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    }
  }

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function abrirModalCriarTurma() {
    setModalCriarTurmaAberta(true);
    try {
      const listaCursos = await api.catalogo.obterCursos();
      setCursos(listaCursos);
      if (listaCursos.length > 0) setCursoTurmaId(listaCursos[0].id);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCriarTurma(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeTurma.trim() || !cursoTurmaId) {
      toast('Informe o nome da turma e selecione o curso.');
      return;
    }

    setCriandoTurma(true);
    try {
      const nova = await api.professor.criarTurma({
        nome: nomeTurma.trim(),
        periodo: periodoTurma.trim() || undefined,
        cursoId: cursoTurmaId
      });

      toast('Turma criada com sucesso!');
      setModalCriarTurmaAberta(false);
      setNomeTurma('');
      setPeriodoTurma('2026.2');

      await carregarTurmas();
      handleTrocarTurma(nova);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao criar turma.');
    } finally {
      setCriandoTurma(false);
    }
  }

  function handleTrocarTurma(t: Turma) {
    setTurmaSelecionada(t);
    if (t.id) {
      localStorage.setItem('estuda_enade_turma_ativa', t.id);
    }
    window.dispatchEvent(new CustomEvent('estuda-enade-turma-trocada', { detail: t }));
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col lg:flex-row">
      {/* Barra superior Mobile (escondida no desktop) */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper border-b-[2.5px] border-ink px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange border-2 border-ink flex items-center justify-center text-white font-title font-extrabold text-sm shadow-brutal-sm">
            e
          </div>
          <span className="font-title font-extrabold text-ink text-base">
            estuda<span className="text-orange">.enade</span>
          </span>
        </div>

        {turmaSelecionada && (
          <Tag color="lilac" className="text-xs">
            {turmaSelecionada.nome}
          </Tag>
        )}

        <button
          onClick={sair}
          title="Sair"
          className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Sidebar Desktop (fixa à esquerda) */}
      <aside className="hidden lg:flex w-64 bg-paper border-r-[3px] border-ink flex-col p-5 gap-4 shrink-0 h-screen sticky top-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-orange border-[2.5px] border-ink flex items-center justify-center text-white font-title font-extrabold text-lg shadow-brutal-sm">
            e
          </div>
          <span className="font-title font-extrabold text-ink text-xl">
            estuda<span className="text-orange">.enade</span>
          </span>
        </div>

        {/* Card Seletor de Turma */}
        <div className="bg-lilac border-[2.5px] border-ink rounded-xl p-3 shadow-brutal-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink/70">
              Turma Ativa
            </span>
            <button
              onClick={abrirModalCriarTurma}
              title="Nova Turma"
              className="text-[10px] font-bold text-ink underline hover:text-orange cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              Nova
            </button>
          </div>

          {turmas.length > 0 ? (
            <div className="relative">
              <select
                value={turmaSelecionada?.id || ''}
                onChange={(e) => {
                  const encontrada = turmas.find((t) => t.id === e.target.value);
                  if (encontrada) handleTrocarTurma(encontrada);
                }}
                className="w-full bg-paper border-2 border-ink rounded-lg px-2.5 py-1.5 text-xs font-bold text-ink cursor-pointer focus:outline-none"
              >
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.periodo ? `(${t.periodo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={abrirModalCriarTurma}>
              <Plus className="w-3.5 h-3.5" />
              Criar primeira turma
            </Button>
          )}
        </div>

        {/* Navegação principal */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-2">
          <NavLink
            to="/professor"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <Home className="w-4 h-4 flex-none" />
            Início
          </NavLink>

          <NavLink
            to="/professor/questoes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <ListFilter className="w-4 h-4 flex-none" />
            Banco de Questões
          </NavLink>

          <NavLink
            to="/professor/atividades"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <FileText className="w-4 h-4 flex-none" />
            Atividades & Simulados
          </NavLink>

          <NavLink
            to="/professor/resultados"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <BarChart2 className="w-4 h-4 flex-none" />
            Resultados da Turma
          </NavLink>

          <NavLink
            to="/professor/cursos"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <GraduationCap className="w-4 h-4 flex-none" />
            Cursos
          </NavLink>

          <NavLink
            to="/professor/docentes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-ink hover:bg-bg'
              }`
            }
          >
            <Users className="w-4 h-4 flex-none" />
            Gestão Docente
          </NavLink>
        </nav>

        {/* Rodapé do usuário */}
        <div className="pt-3 border-t-2 border-ink flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-pink border-2 border-ink flex items-center justify-center font-title font-extrabold text-xs text-ink flex-none shadow-brutal-sm">
              {usuario?.nome?.substring(0, 2).toUpperCase() || 'PR'}
            </div>
            <div className="truncate text-xs font-bold text-ink">
              {usuario?.nome || 'Professor'}
            </div>
          </div>

          <button
            onClick={sair}
            title="Sair"
            className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <Outlet context={{ turmaSelecionada, turmas, setTurmas }} />
      </main>

      {/* Navegação Mobile Inferior */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper border-t-[2.5px] border-ink p-2 flex items-center justify-around shadow-brutal">
        <NavLink
          to="/professor"
          end
          className={({ isActive }) =>
            `flex-1 py-1 px-2 rounded-xl border-2 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          <Home className="w-4 h-4" />
          Início
        </NavLink>

        <NavLink
          to="/professor/questoes"
          className={({ isActive }) =>
            `flex-1 py-1 px-2 rounded-xl border-2 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          <ListFilter className="w-4 h-4" />
          Questões
        </NavLink>

        <NavLink
          to="/professor/atividades"
          className={({ isActive }) =>
            `flex-1 py-1 px-2 rounded-xl border-2 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          <FileText className="w-4 h-4" />
          Atividades
        </NavLink>

        <NavLink
          to="/professor/resultados"
          className={({ isActive }) =>
            `flex-1 py-1 px-2 rounded-xl border-2 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`
          }
        >
          <BarChart2 className="w-4 h-4" />
          Resultados
        </NavLink>
      </nav>

      {/* Modal Criar Turma */}
      <Modal
        aberto={modalCriarTurmaAberta}
        aoFechar={() => setModalCriarTurmaAberta(false)}
        titulo="Criar Nova Turma"
      >
        <form onSubmit={handleCriarTurma} className="flex flex-col gap-4">
          <Input
            label="Nome da Turma"
            placeholder="Ex: ADS — Turma B"
            value={nomeTurma}
            onChange={(e) => setNomeTurma(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Período / Semestre"
            placeholder="Ex: 2026.2"
            value={periodoTurma}
            onChange={(e) => setPeriodoTurma(e.target.value)}
          />

          <Select
            label="Curso"
            value={cursoTurmaId}
            onChange={(e) => setCursoTurmaId(e.target.value)}
            required
          >
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          {cursos.length === 0 ? (
            <p className="text-xs text-muted -mt-2">
              Nenhum curso cadastrado.{' '}
              <Link
                to="/professor/cursos"
                onClick={() => setModalCriarTurmaAberta(false)}
                className="font-bold text-ink underline hover:text-orange"
              >
                Cadastre um curso
              </Link>{' '}
              antes de criar a turma.
            </p>
          ) : (
            <p className="text-xs text-muted -mt-2">
              Não encontrou o curso?{' '}
              <Link
                to="/professor/cursos"
                onClick={() => setModalCriarTurmaAberta(false)}
                className="font-bold text-ink underline hover:text-orange"
              >
                Gerencie em Cursos
              </Link>
              .
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-ink/20">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalCriarTurmaAberta(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              carregando={criandoTurma}
            >
              Criar turma
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
