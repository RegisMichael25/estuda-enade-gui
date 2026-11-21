import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmacaoProvider } from '@/components/ui/Confirmacao';
import { PrivateRoute } from '@/components/layout/PrivateRoute';
import { AlunoLayout } from '@/components/layout/AlunoLayout';
import { ProfessorLayout } from '@/components/layout/ProfessorLayout';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { CadastroPendentePage } from '@/pages/auth/CadastroPendentePage';

// Aluno Pages
import { AlunoInicioPage } from '@/pages/aluno/AlunoInicioPage';
import { AlunoPraticaPage } from '@/pages/aluno/AlunoPraticaPage';
import { AlunoAtividadeDetalhePage } from '@/pages/aluno/AlunoAtividadeDetalhePage';
import { AlunoTentativaPage } from '@/pages/aluno/AlunoTentativaPage';
import { AlunoResultadoPage } from '@/pages/aluno/AlunoResultadoPage';
import { AlunoDesempenhoPage } from '@/pages/aluno/AlunoDesempenhoPage';
import { AlunoTurmasPage } from '@/pages/aluno/AlunoTurmasPage';

// Professor Pages
import { ProfessorInicioPage } from '@/pages/professor/ProfessorInicioPage';
import { ProfessorQuestoesPage } from '@/pages/professor/ProfessorQuestoesPage';
import { ProfessorNovaQuestaoPage } from '@/pages/professor/ProfessorNovaQuestaoPage';
import { ProfessorAtividadesPage } from '@/pages/professor/ProfessorAtividadesPage';
import { ProfessorResultadosPage } from '@/pages/professor/ProfessorResultadosPage';
import { ProfessorDocentesPage } from '@/pages/professor/ProfessorDocentesPage';
import { ProfessorCursosPage } from '@/pages/professor/ProfessorCursosPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1
    }
  }
});

function RootRedirect() {
  const { usuario, autenticado, carregando } = useAuth();

  if (carregando) return null;
  if (!autenticado || !usuario) return <Navigate to="/login" replace />;

  if (usuario.papel === 'PROFESSOR') {
    if (!usuario.aprovado) return <Navigate to="/professor/pendente" replace />;
    return <Navigate to="/professor" replace />;
  }

  return <Navigate to="/aluno" replace />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <ConfirmacaoProvider>
              <Routes>
                {/* Rota Raiz com Redirecionamento por Papel */}
                <Route path="/" element={<RootRedirect />} />

                {/* Autenticação Pública */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/professor/pendente" element={<CadastroPendentePage />} />

                {/* Rotas Protegidas do Aluno */}
                <Route element={<PrivateRoute papel="ALUNO" />}>
                  <Route path="/aluno" element={<AlunoLayout />}>
                    <Route index element={<AlunoInicioPage />} />
                    <Route path="pratica" element={<AlunoPraticaPage />} />
                    <Route path="atividade/:id" element={<AlunoAtividadeDetalhePage />} />
                    <Route path="tentativa/:id" element={<AlunoTentativaPage />} />
                    <Route path="tentativa/:id/resultado" element={<AlunoResultadoPage />} />
                    <Route path="desempenho" element={<AlunoDesempenhoPage />} />
                    <Route path="turmas" element={<AlunoTurmasPage />} />
                  </Route>
                </Route>

                {/* Rotas Protegidas do Professor */}
                <Route element={<PrivateRoute papel="PROFESSOR" />}>
                  <Route path="/professor" element={<ProfessorLayout />}>
                    <Route index element={<ProfessorInicioPage />} />
                    <Route path="questoes" element={<ProfessorQuestoesPage />} />
                    <Route path="questoes/nova" element={<ProfessorNovaQuestaoPage />} />
                    <Route path="atividades" element={<ProfessorAtividadesPage />} />
                    <Route path="atividades/:id/resultados" element={<ProfessorResultadosPage />} />
                    <Route path="resultados" element={<ProfessorResultadosPage />} />
                    <Route path="cursos" element={<ProfessorCursosPage />} />
                    <Route path="docentes" element={<ProfessorDocentesPage />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ConfirmacaoProvider>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;

