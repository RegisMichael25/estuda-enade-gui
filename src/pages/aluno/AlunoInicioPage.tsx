import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { TurmaAluno, AtividadeAluno, DesempenhoAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Play, ClipboardList, ArrowRight } from 'lucide-react';

export function AlunoInicioPage() {
  const navigate = useNavigate();

  const [turmas, setTurmas] = useState<TurmaAluno[]>([]);
  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoAluno | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    try {
      const [listaTurmas, listaAtividades, dadosDesempenho] = await Promise.all([
        api.aluno.obterTurmas(),
        api.aluno.obterAtividades().catch((): AtividadeAluno[] => []),
        api.aluno.obterDesempenho().catch((): DesempenhoAluno | null => null)
      ]);
      setTurmas(listaTurmas);
      setAtividades(listaAtividades);
      setDesempenho(dadosDesempenho);
    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const primeiraTurma = turmas[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Caso o aluno não esteja em nenhuma turma ainda */}
      {turmas.length === 0 && !carregando && (
        <Card color="lilac" className="p-6">
          <div className="w-12 h-12 rounded-xl bg-paper border-2 border-ink flex items-center justify-center font-title font-extrabold text-xl text-ink shadow-brutal-sm mb-3">
            e
          </div>
          <h2 className="text-xl font-bold font-title text-ink">Bora estudar pro ENADE?</h2>
          <p className="text-xs text-ink/80 mt-1 mb-4">
            Digite o código de convite fornecido pelo seu professor para acessar os simulados da turma.
          </p>

          <Button variant="primary" fullWidth onClick={() => navigate('/aluno/configuracoes/turmas')}>
            Entrar com código da turma
          </Button>
        </Card>
      )}

      {/* Indicador de Turma Vinculada */}
      {primeiraTurma && (
        <div className="flex items-center justify-between">
          <Tag color="lilac" className="text-xs py-1 px-3">
            {primeiraTurma.nome} {primeiraTurma.curso ? `· ${primeiraTurma.curso.nome}` : ''}
          </Tag>
          <span className="text-xs font-bold text-muted">
            Prof. {primeiraTurma.professor}
          </span>
        </div>
      )}

      {/* Hero: Resumo de Desempenho */}
      <Card color="orange" className="p-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
          Seu desempenho geral
        </span>
        <h2 className="text-3xl font-extrabold font-title text-white mt-1">
          {desempenho && (desempenho.respondidas ?? 0) > 0
            ? `${desempenho.percentual ?? 0}% de acertos`
            : 'Comece a praticar!'}
        </h2>
        <p className="text-xs text-white/90 mt-1">
          {desempenho && (desempenho.respondidas ?? 0) > 0
            ? `${desempenho.respondidas} questões respondidas · ${
                desempenho.melhorTema
                  ? `Melhor tema: ${desempenho.melhorTema}`
                  : `${desempenho.acertos} acertos`
              }`
            : 'Resolva questões para visualizar suas estatísticas por matéria.'}
        </p>
      </Card>

      {/* Atividades Publicadas */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Atividades & Simulados
          </span>
          <span className="text-xs font-bold text-muted">
            {atividades.length} {atividades.length === 1 ? 'disponível' : 'disponíveis'}
          </span>
        </div>

        {atividades.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">
              Nenhuma atividade aberta no momento para sua turma.
            </p>
          </Card>
        ) : (
          atividades.map((atv) => (
            <Card
              key={atv.id}
              interactive
              onClick={() => navigate(`/aluno/atividade/${atv.id}`)}
              className="p-3.5 flex items-center gap-3.5"
            >
              <div
                className={`w-11 h-11 rounded-xl border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm ${
                  atv.tipo === 'SIMULADO' ? 'bg-yellow' : 'bg-blue'
                }`}
              >
                <ClipboardList className="w-5 h-5 text-ink" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-ink truncate">{atv.titulo}</h3>
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  <span>{atv.totalQuestoes} questões</span>
                  <span>•</span>
                  <span>{atv.duracaoMinutos ? `${atv.duracaoMinutos} min` : 'Sem tempo'}</span>
                </div>
              </div>

              {!atv.podeIniciar ? (
                <Tag color="green">Concluído</Tag>
              ) : (
                <ArrowRight className="w-4 h-4 text-muted flex-none" />
              )}
            </Card>
          ))
        )}
      </div>

      {/* Card de Prática Livre */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Estudo individual
        </span>

        <Card
          color="green"
          interactive
          onClick={() => navigate('/aluno/pratica')}
          className="p-4 flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-xl bg-paper border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
            <Play className="w-5 h-5 text-ink fill-ink" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-sm text-ink">Praticar no Banco Livre</h3>
            <p className="text-xs text-ink/80 mt-0.5">
              Filtre questões oficiais do ENADE por ano e tema com gabarito imediato.
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-ink flex-none" />
        </Card>
      </div>
    </div>
  );
}
