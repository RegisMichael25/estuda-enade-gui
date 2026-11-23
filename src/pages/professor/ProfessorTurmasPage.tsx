import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Turma } from '@/api/models';
import { ModalTurma } from '@/components/turma/ModalTurma';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { Archive, ArrowRight, ChevronDown, Copy, Plus, School, Users } from 'lucide-react';

export function ProfessorTurmasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberta, setModalAberta] = useState(false);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  async function carregar() {
    try {
      setTurmas(await api.professor.obterTurmas({ incluirArquivadas: true }));
    } catch (err) {
      console.error('Erro ao carregar turmas:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function handleTurmaCriada(nova: Turma) {
    navigate(`/professor/turmas/${nova.id}`);
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo);
    toast('Código de convite copiado para a área de transferência!');
  }

  const ativas = turmas.filter((t) => !t.arquivadaEm);
  const arquivadas = turmas.filter((t) => t.arquivadaEm);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">Turmas</h1>
          <p className="text-xs lg:text-sm text-muted">
            Crie turmas, convide alunos e acompanhe quem está em cada uma.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalAberta(true)}>
          <Plus className="w-4 h-4" />
          Nova turma
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Turmas ativas</span>
          <span className="text-xs font-bold text-muted">{ativas.length}</span>
        </div>

        {!carregando && ativas.length === 0 ? (
          <Card className="p-6 text-center bg-paper">
            <p className="text-xs font-bold text-muted">
              Nenhuma turma ativa. Crie uma turma e compartilhe o código de convite com os alunos.
            </p>
            <Button variant="primary" size="sm" className="mt-3" onClick={() => setModalAberta(true)}>
              <Plus className="w-3.5 h-3.5" />
              Criar turma
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ativas.map((t) => (
              <CardTurma
                key={t.id}
                turma={t}
                aoAbrir={() => navigate(`/professor/turmas/${t.id}`)}
                aoCopiar={() => copiarCodigo(t.codigoConvite)}
              />
            ))}
          </div>
        )}
      </div>

      {arquivadas.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setMostrarArquivadas((v) => !v)}
            aria-expanded={mostrarArquivadas}
            className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted hover:text-ink cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5" />
              Turmas arquivadas
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mostrarArquivadas ? 'rotate-180' : ''}`} />
            </span>
            <span>{arquivadas.length}</span>
          </button>

          {mostrarArquivadas && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {arquivadas.map((t) => (
                <CardTurma
                  key={t.id}
                  turma={t}
                  aoAbrir={() => navigate(`/professor/turmas/${t.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ModalTurma aberto={modalAberta} aoFechar={() => setModalAberta(false)} aoSalvar={handleTurmaCriada} />
    </div>
  );
}

interface CardTurmaProps {
  turma: Turma;
  aoAbrir: () => void;
  /** Sem ele, o código de convite não aparece (turma arquivada não aceita alunos). */
  aoCopiar?: () => void;
}

function CardTurma({ turma, aoAbrir, aoCopiar }: CardTurmaProps) {
  const arquivada = !!turma.arquivadaEm;

  return (
    <Card
      interactive
      onClick={aoAbrir}
      className={`p-4 flex flex-col gap-3 ${arquivada ? 'bg-bg opacity-80' : 'bg-paper'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-lilac border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
          <School className="w-5 h-5 text-ink" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm text-ink truncate">{turma.nome}</h3>
          <p className="text-xs text-muted truncate">{turma.curso?.nome ?? 'Sem curso'}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted flex-none mt-1" />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {turma.periodo && <Tag color="yellow">{turma.periodo}</Tag>}
        <Tag color="blue">
          <Users className="w-3 h-3 mr-1" />
          {turma.totalAlunos} {turma.totalAlunos === 1 ? 'aluno' : 'alunos'}
        </Tag>
        {arquivada && <Tag color="paper">Arquivada</Tag>}
      </div>

      {aoCopiar && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-ink/15">
          <span className="font-title font-extrabold tracking-[0.15em] text-ink">{turma.codigoConvite}</span>
          <Button
            size="sm"
            variant="secondary"
            title="Copiar código de convite"
            onClick={(e) => {
              e.stopPropagation();
              aoCopiar();
            }}
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar
          </Button>
        </div>
      )}
    </Card>
  );
}
