import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/client';
import type { PainelProfessor, Turma } from '@/api/models';
import { ModalTurma } from '@/components/turma/ModalTurma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { ArrowRight, ClipboardList, Plus, School, Users } from 'lucide-react';

export function ProfessorInicioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [painel, setPainel] = useState<PainelProfessor | null>(null);
  const [modalTurmaAberta, setModalTurmaAberta] = useState(false);

  useEffect(() => {
    api.professor
      .obterPainel()
      .then(setPainel)
      .catch((err) => console.error('Erro ao carregar o painel:', err));
  }, []);

  function handleTurmaCriada(nova: Turma) {
    navigate(`/professor/turmas/${nova.id}`);
  }

  const turmas = painel?.turmas ?? [];
  const atividades = painel?.atividades ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
          Bom dia, <span className="text-orange">{usuario?.nome || 'Professor'}</span>
        </h1>
        <p className="text-xs lg:text-sm font-medium text-muted mt-1">Visão geral das suas turmas ativas.</p>
      </div>

      {/* Números */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card color="lilac" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{painel?.turmasAtivas ?? 0}</div>
          <span className="text-xs font-bold text-ink/80 block mt-1">turmas ativas</span>
        </Card>
        <Card color="yellow" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{painel?.totalAlunos ?? 0}</div>
          <span className="text-xs font-bold text-ink/80 block mt-1">alunos</span>
        </Card>
        <Card color="green" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{painel?.atividadesAbertas ?? 0}</div>
          <span className="text-xs font-bold text-ink/80 block mt-1">atividades abertas</span>
        </Card>
        <Card color="blue" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">{painel?.questoesNoBanco ?? 0}</div>
          <span className="text-xs font-bold text-ink/80 block mt-1">questões no banco</span>
        </Card>
      </div>

      {painel && turmas.length === 0 ? (
        <Card className="p-8 text-center bg-paper">
          <h2 className="text-xl font-bold font-title">Nenhuma turma ativa</h2>
          <p className="text-xs text-muted mt-1">Crie sua primeira turma para convidar alunos e publicar atividades.</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={() => setModalTurmaAberta(true)}>
            <Plus className="w-3.5 h-3.5" />
            Criar turma
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Turmas */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Suas turmas</span>
              <Button variant="secondary" size="sm" onClick={() => navigate('/professor/turmas')}>
                Ver todas
              </Button>
            </div>

            {turmas.map((t) => (
              <Card
                key={t.id}
                interactive
                onClick={() => navigate(`/professor/turmas/${t.id}`)}
                className="p-4 flex flex-col gap-2.5 bg-paper"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lilac border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                    <School className="w-5 h-5 text-ink" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-ink truncate">{t.nome}</h3>
                    <p className="text-xs text-muted truncate">
                      {[t.curso?.nome ?? 'Sem curso', t.periodo].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted flex-none" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Tag color="blue">
                    <Users className="w-3 h-3 mr-1" />
                    {t.totalAlunos} {t.totalAlunos === 1 ? 'aluno' : 'alunos'}
                  </Tag>
                  <Tag color="green">
                    {t.atividadesAbertas} {t.atividadesAbertas === 1 ? 'atividade aberta' : 'atividades abertas'}
                  </Tag>
                  <Tag color="pink">média {t.mediaPercentual != null ? `${t.mediaPercentual}%` : '—'}</Tag>
                </div>
              </Card>
            ))}
          </div>

          {/* Atividades recentes */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted py-1.5">Atividades recentes</span>

            {atividades.length === 0 ? (
              <Card className="p-6 text-center bg-paper">
                <p className="text-xs font-bold text-muted">
                  Nenhuma atividade publicada ainda. Abra uma turma para criar a primeira.
                </p>
              </Card>
            ) : (
              atividades.map((atv) => (
                <Card
                  key={atv.id}
                  interactive
                  onClick={() => navigate(`/professor/turmas/${atv.turma.id}/resultados/${atv.id}`)}
                  className="p-4 flex items-center justify-between gap-3 bg-paper"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange text-white border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-ink truncate">{atv.titulo}</h3>
                      <p className="text-xs text-muted truncate">
                        {atv.turma.nome} · {atv.concluiram}/{atv.totalAlunos} concluíram
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-none">
                    <Tag color={atv.status === 'ENCERRADA' ? 'paper' : 'green'}>
                      {atv.status === 'ENCERRADA' ? 'Encerrada' : 'Aberta'}
                    </Tag>
                    <ArrowRight className="w-4 h-4 text-muted" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <ModalTurma
        aberto={modalTurmaAberta}
        aoFechar={() => setModalTurmaAberta(false)}
        aoSalvar={handleTurmaCriada}
      />
    </div>
  );
}
