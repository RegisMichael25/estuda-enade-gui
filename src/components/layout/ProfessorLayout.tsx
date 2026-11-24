import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, ListFilter, Users, GraduationCap, LogOut, School, MoreHorizontal, X } from 'lucide-react';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { ModalSenha, BotaoSenha } from '@/components/auth/ModalSenha';
import { AvisoSemSenha } from '@/components/auth/AvisoSemSenha';

interface ItemMenu {
  para: string;
  rotulo: string;
  rotuloCurto?: string;
  icone: LucideIcon;
  exata?: boolean;
}

/** Itens visíveis diretamente na bottombar mobile */
const MENU_PRINCIPAL: ItemMenu[] = [
  { para: '/professor', rotulo: 'Início', rotuloCurto: 'Início', icone: Home, exata: true },
  { para: '/professor/turmas', rotulo: 'Turmas', rotuloCurto: 'Turmas', icone: School },
  { para: '/professor/questoes', rotulo: 'Banco de Questões', rotuloCurto: 'Questões', icone: ListFilter },
];

/** Itens que ficam no menu "Mais" (Bottom Sheet no mobile) */
const MENU_MAIS: ItemMenu[] = [
  { para: '/professor/cursos', rotulo: 'Cursos', icone: GraduationCap },
  { para: '/professor/docentes', rotulo: 'Gestão Docente', icone: Users },
];

/** Todos os itens para a sidebar no desktop */
const TODOS_MENUS = [...MENU_PRINCIPAL, ...MENU_MAIS];

export function ProfessorLayout() {
  const { usuario, sair } = useAuth();
  const confirmar = useConfirmacao();
  const location = useLocation();
  const [modalSenha, setModalSenha] = useState(false);
  const [sheetAberta, setSheetAberta] = useState(false);

  const iniciais = usuario?.nome?.substring(0, 2).toUpperCase() || 'PR';

  async function handleSair() {
    const ok = await confirmar({
      titulo: 'Sair da conta?',
      mensagem: 'Para entrar de novo, use seu e-mail e senha.',
      rotuloConfirmar: 'Sair',
    });
    if (ok) sair();
  }

  // Fecha o Bottom Sheet ao trocar de rota
  useEffect(() => {
    setSheetAberta(false);
  }, [location.pathname]);

  // Fecha no ESC e bloqueia scroll enquanto aberto
  useEffect(() => {
    function lidarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setSheetAberta(false);
    }
    if (sheetAberta) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', lidarTecla);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', lidarTecla);
    };
  }, [sheetAberta]);

  const isMaisAtivo = MENU_MAIS.some((item) =>
    item.exata ? location.pathname === item.para : location.pathname.startsWith(item.para)
  );

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

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-pink border-2 border-ink flex items-center justify-center font-title font-extrabold text-xs text-ink shadow-brutal-sm">
            {iniciais}
          </div>
          <BotaoSenha aoClicar={() => setModalSenha(true)} />
          <button
            onClick={handleSair}
            title="Sair da conta"
            className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
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
          {TODOS_MENUS.map(({ para, rotulo, icone: Icone, exata }) => (
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
              {iniciais}
            </div>
            <div className="truncate text-xs font-bold text-ink">
              {usuario?.nome || 'Professor'}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <BotaoSenha aoClicar={() => setModalSenha(true)} />
            <button
              onClick={handleSair}
              title="Sair da conta"
              className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-pink/20 transition-all text-ink cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 overflow-y-auto max-w-6xl mx-auto w-full">
        <AvisoSemSenha aoCriarSenha={() => setModalSenha(true)} className="mb-4" />
        <Outlet />
      </main>

      <ModalSenha aberto={modalSenha} aoFechar={() => setModalSenha(false)} />

      {/* Backdrop do Bottom Sheet Mobile */}
      {sheetAberta && (
        <div
          className="lg:hidden fixed inset-0 bg-ink/50 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-150"
          onClick={() => setSheetAberta(false)}
        />
      )}

      {/* Bottom Sheet com opções do "Mais" */}
      {sheetAberta && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t-[3px] border-ink rounded-t-2xl p-5 pb-8 shadow-brutal-xl animate-in slide-in-from-bottom duration-200"
        >
          {/* Alça visual do Bottom Sheet */}
          <div className="w-10 h-1.5 bg-ink/30 rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between pb-3 border-b-2 border-ink mb-4">
            <h3 className="text-base font-extrabold font-title text-ink">Mais opções</h3>
            <button
              type="button"
              onClick={() => setSheetAberta(false)}
              className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-bg cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-ink" />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {MENU_MAIS.map(({ para, rotulo, icone: Icone, exata }) => (
              <NavLink
                key={para}
                to={para}
                end={exata}
                onClick={() => setSheetAberta(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl border-[2.5px] font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                      : 'border-ink/20 bg-bg/40 text-ink hover:border-ink hover:bg-bg'
                  }`
                }
              >
                <div className="w-8 h-8 rounded-lg bg-paper border-2 border-ink flex items-center justify-center text-ink flex-none shadow-brutal-xs">
                  <Icone className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-ink">{rotulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Navegação Mobile Inferior */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-paper border-t-[2.5px] border-ink p-2 flex items-center justify-around shadow-brutal">
        {MENU_PRINCIPAL.map(({ para, rotulo, rotuloCurto, icone: Icone, exata }) => (
          <NavLink
            key={para}
            to={para}
            end={exata}
            className={({ isActive }) =>
              `flex-1 py-1.5 px-2 rounded-xl border-2 flex flex-col items-center gap-1 text-[11px] font-bold transition-all ${
                isActive
                  ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
                  : 'border-transparent text-muted hover:text-ink'
              }`
            }
          >
            <Icone className="w-4 h-4" />
            {rotuloCurto || rotulo}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setSheetAberta((prev) => !prev)}
          className={`flex-1 py-1.5 px-2 rounded-xl border-2 flex flex-col items-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
            isMaisAtivo || sheetAberta
              ? 'bg-yellow border-ink shadow-brutal-sm text-ink'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          Mais
        </button>
      </nav>
    </div>
  );
}
