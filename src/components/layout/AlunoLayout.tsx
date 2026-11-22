import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { Home, Play, BarChart2, Users, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const LINKS: { to: string; rotulo: string; icone: LucideIcon; end?: boolean }[] = [
  { to: '/aluno', rotulo: 'Início', icone: Home, end: true },
  { to: '/aluno/pratica', rotulo: 'Praticar', icone: Play },
  { to: '/aluno/desempenho', rotulo: 'Desempenho', icone: BarChart2 },
  { to: '/aluno/turmas', rotulo: 'Turmas', icone: Users }
];

export function AlunoLayout() {
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
  const location = useLocation();

  // Ocultar navegação durante uma tentativa de simulado
  const emTentativa = location.pathname.includes('/aluno/tentativa/');
  const iniciais = usuario?.nome?.substring(0, 2).toUpperCase() || 'AL';

  return (
    <div className={`min-h-screen bg-bg flex flex-col ${emTentativa ? '' : 'lg:flex-row'}`}>
      {/* Barra superior: mobile/app sempre; desktop só durante a tentativa */}
      <header
        className={`${emTentativa ? '' : 'lg:hidden'} sticky top-0 z-30 bg-paper border-b-[2.5px] border-ink px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange border-2 border-ink flex items-center justify-center text-white font-title font-extrabold text-sm shadow-brutal-sm">
            e
          </div>
          <span className="font-title font-extrabold text-ink text-base">
            estuda<span className="text-orange">.enade</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue border-2 border-ink flex items-center justify-center font-title font-extrabold text-xs text-ink shadow-brutal-sm">
            {iniciais}
          </div>
          <button
            onClick={handleSair}
            title="Sair da conta"
            className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all cursor-pointer text-ink"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop (fixa à esquerda, escondida em tentativa) */}
      {!emTentativa && (
        <aside className="hidden lg:flex w-64 bg-paper border-r-[3px] border-ink flex-col p-5 gap-4 shrink-0 h-screen sticky top-0">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-orange border-[2.5px] border-ink flex items-center justify-center text-white font-title font-extrabold text-lg shadow-brutal-sm">
              e
            </div>
            <div>
              <span className="font-title font-extrabold text-ink text-xl">
                estuda<span className="text-orange">.enade</span>
              </span>
              <div className="text-[11px] font-bold text-muted -mt-1">Portal do Aluno</div>
            </div>
          </div>

          {/* Navegação principal */}
          <nav className="flex flex-col gap-1.5 flex-1 mt-2">
            {LINKS.map(({ to, rotulo, icone: Icone, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
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
              <div className="w-8 h-8 rounded-full bg-blue border-2 border-ink flex items-center justify-center font-title font-extrabold text-xs text-ink flex-none shadow-brutal-sm">
                {iniciais}
              </div>
              <div className="truncate text-xs font-bold text-ink">
                {usuario?.nome || 'Estudante'}
              </div>
            </div>

            <button
              onClick={handleSair}
              title="Sair da conta"
              className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Conteúdo principal */}
      <main className={`flex-1 w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 ${emTentativa ? '' : 'pb-24'} lg:pb-8 overflow-y-auto`}>
        <Outlet />
      </main>

      {/* Abas inferiores no mobile/app (quando não em tentativa) */}
      {!emTentativa && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper border-t-[2.5px] border-ink p-2 flex items-center justify-around shadow-brutal">
          {LINKS.map(({ to, rotulo, icone: Icone, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 py-1.5 px-2 rounded-xl border-2 flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`
              }
            >
              <Icone className="w-5 h-5" />
              {rotulo}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
