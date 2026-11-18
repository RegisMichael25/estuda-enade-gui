import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/api/client';
import type { Turma, ResumoTurma } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import {
  ClipboardList,
  Copy,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface ContextType {
  turmaSelecionada: Turma | null;
  turmas: Turma[];
}

export function ProfessorInicioPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { turmaSelecionada } = useOutletContext<ContextType>();

  const [resumo, setResumo] = useState<ResumoTurma | null>(null);
  const [codigoConvite, setCodigoConvite] = useState(turmaSelecionada?.codigoConvite || '');
  const [gerandoCodigo, setGerandoCodigo] = useState(false);

  useEffect(() => {
    async function carregarResumo() {
      if (!turmaSelecionada) return;
      setCodigoConvite(turmaSelecionada.codigoConvite);
      try {
        const dados = await api.professor.obterResumoTurma(turmaSelecionada.id);
        setResumo(dados);
      } catch (err) {
        console.error('Erro ao carregar resumo da turma:', err);
      }
    }
    carregarResumo();
  }, [turmaSelecionada]);

  function copiarCodigoConvite() {
    if (!codigoConvite) return;
    navigator.clipboard.writeText(codigoConvite);
    toast('Código de convite copiado para a área de transferência!');
  }

  async function handleGerarNovoCodigo() {
    if (!turmaSelecionada) return;
    setGerandoCodigo(true);
    try {
      const atualizada = await api.professor.gerarNovoConviteTurma(turmaSelecionada.id);
      toast('Novo código gerado com sucesso!');
      setCodigoConvite(atualizada.codigoConvite);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao gerar novo código.');
    } finally {
      setGerandoCodigo(false);
    }
  }

  if (!turmaSelecionada) {
    return (
      <Card className="p-8 text-center bg-paper">
        <h2 className="text-xl font-bold font-title">Nenhuma turma encontrada</h2>
        <p className="text-xs text-muted mt-1">
          Crie sua primeira turma para gerenciar alunos e atividades.
        </p>
      </Card>
    );
  }

  const atividades = resumo?.atividades || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
          Bom dia, <span className="text-orange">{usuario?.nome || 'Professor'}</span>
        </h1>
        <p className="text-xs lg:text-sm font-medium text-muted mt-1">
          Visão geral da turma <b>{turmaSelecionada.nome}</b> {turmaSelecionada.periodo ? `(${turmaSelecionada.periodo})` : ''}
        </p>
      </div>

      {/* Grid de 4 Cards de Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card color="yellow" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">
            {resumo?.totalAlunos ?? 0}
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            alunos vinculados
          </span>
        </Card>

        <Card color="blue" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">
            {resumo?.questoesNoBanco ?? 0}
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            questões no banco
          </span>
        </Card>

        <Card color="green" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">
            {resumo?.atividadesAbertas ?? 0}
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            atividades abertas
          </span>
        </Card>

        <Card color="pink" className="p-4">
          <div className="text-3xl lg:text-4xl font-extrabold font-title text-ink">
            {resumo?.mediaPercentual !== null && resumo?.mediaPercentual !== undefined ? `${resumo.mediaPercentual}%` : '—'}
          </div>
          <span className="text-xs font-bold text-ink/80 block mt-1">
            média da turma
          </span>
        </Card>
      </div>

      {/* Grid 2 colunas: Atividades Recentes + Convite de Alunos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Atividades Recentes */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Atividades Recentes
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/professor/atividades')}
            >
              Ver todas
            </Button>
          </div>

          {atividades.length === 0 ? (
            <Card className="p-6 text-center bg-paper">
              <p className="text-xs font-bold text-muted">
                Nenhuma atividade criada nesta turma ainda.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/professor/atividades')}
                className="mt-3"
              >
                + Criar primeira atividade
              </Button>
            </Card>
          ) : (
            atividades.map((atv) => (
              <Card
                key={atv.id}
                interactive
                onClick={() => navigate(`/professor/atividades/${atv.id}/resultados`)}
                className="p-4 flex items-center justify-between gap-3 bg-paper"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange text-white border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">{atv.titulo}</h3>
                    <p className="text-xs text-muted">
                      {atv.concluiram}/{resumo?.totalAlunos ?? 0} concluíram
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Tag color="green">Resultados</Tag>
                  <ArrowRight className="w-4 h-4 text-muted" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Card Convite de Alunos */}
        <Card color="lilac" className="p-5 flex flex-col gap-3">
          <div>
            <h3 className="text-lg font-bold font-title text-ink">Convide Alunos</h3>
            <p className="text-xs text-ink/80 mt-0.5">
              Compartilhe este código para os alunos entrarem diretamente nesta turma pelo aplicativo.
            </p>
          </div>

          <div className="bg-paper border-[2.5px] border-dashed border-ink rounded-xl py-3 text-center my-1">
            <span className="font-title font-extrabold text-2xl tracking-[0.2em] text-ink">
              {codigoConvite || '...'}
            </span>
          </div>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={copiarCodigoConvite}
          >
            <Copy className="w-4 h-4" />
            Copiar código de convite
          </Button>

          <button
            type="button"
            disabled={gerandoCodigo}
            onClick={handleGerarNovoCodigo}
            className="text-[11px] font-bold text-ink/70 hover:text-ink text-center flex items-center justify-center gap-1 cursor-pointer mt-1"
          >
            <RefreshCw className={`w-3 h-3 ${gerandoCodigo ? 'animate-spin' : ''}`} />
            Gerar novo código
          </button>
        </Card>
      </div>
    </div>
  );
}
