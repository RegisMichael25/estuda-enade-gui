import { Outlet, NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, ListFilter, Users, GraduationCap, LogOut, School } from 'lucide-react';
import { useConfirmacao } from '@/components/ui/Confirmacao';

interface ItemMenu {
  para: string;
  rotulo: string;
  /** Rótulo curto da barra inferior do celular; sem ele, o item não aparece lá. */
  rotuloCurto?: string;
  icone: LucideIcon;
  exata?: boolean;
}

/** Atividades e resultados ficam dentro de cada turma (Turmas → turma → abas). */
const MENU: ItemMenu[] = [
  { para: '/professor', rotulo: 'Início', rotuloCurto: 'Início', icone: Home, exata: true },
  { para: '/professor/turmas', rotulo: 'Turmas', rotuloCurto: 'Turmas', icone: School },
  { para: '/professor/questoes', rotulo: 'Banco de Questões', rotuloCurto: 'Questões', icone: ListFilter },
  { para: '/professor/cursos', rotulo: 'Cursos', icone: GraduationCap },
  { para: '/professor/docentes', rotulo: 'Gestão Docente', icone: Users },
];

export function ProfessorLayout() {
  const { usuario, sair } = useAuth();
  const confirmar = useConfirmacao();

  async function handleSair() {
    const ok = await confirmar({
      titulo: 'Sair da conta?',
      mensagem: 'Para entrar de novo, você vai precisar de um novo código de acesso enviado ao seu e-mail.',
      rotuloConfirmar: 'Sair',
    });
    if (ok) sair();
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

        <button
          onClick={handleSair}
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

        {/* Navegação principal */}
        <nav className="flex flex-col gap-1.5 flex-1 mt-2">
          {MENU.map(({ para, rotulo, icone: Icone, exata }) => (
            <NavLink
              key={para}
              to={para}
              end={exata}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                    : 'border-transparent text-ink hover:bg-bg'
                }`
              }
            >
              <Icone className="w-4 h-4 flex-none" />
              {rotulo}
            </NavLink>
          ))}
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
            onClick={handleSair}
            title="Sair"
            className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Navegação Mobile Inferior */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper border-t-[2.5px] border-ink p-2 flex items-center justify-around shadow-brutal">
        {MENU.filter((m) => m.rotuloCurto).map(({ para, rotuloCurto, icone: Icone, exata }) => (
          <NavLink
            key={para}
            to={para}
            end={exata}
            className={({ isActive }) =>
              `flex-1 py-1 px-2 rounded-xl border-2 flex flex-col items-center gap-0.5 text-[11px] font-bold transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`
            }
          >
            <Icone className="w-4 h-4" />
            {rotuloCurto}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
