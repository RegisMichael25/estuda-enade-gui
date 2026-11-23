import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '@/api/client';
import type { Aluno, Turma } from '@/api/models';
import { ModalTurma } from '@/components/turma/ModalTurma';
import { Abas } from '@/components/ui/Abas';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { Archive, ArchiveRestore, ArrowLeft, BarChart2, FileText, Pencil, Users } from 'lucide-react';

/** O que a página da turma entrega às abas por `useOutletContext`. */
export interface TurmaContexto {
  turma: Turma;
  alunos: Aluno[];
  setTurma: (turma: Turma) => void;
  setAlunos: Dispatch<SetStateAction<Aluno[]>>;
}

/** Turma aberta, para as abas (Alunos, Atividades, Resultados). */
export function useTurma() {
  return useOutletContext<TurmaContexto>();
}

export function ProfessorTurmaPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [naoEncontrada, setNaoEncontrada] = useState(false);
  const [modalEditarAberta, setModalEditarAberta] = useState(false);
  const [alterandoArquivo, setAlterandoArquivo] = useState(false);

  useEffect(() => {
    setTurma(null);
    setNaoEncontrada(false);
    api.professor
      .obterTurma(id)
      .then((detalhe) => {
        setTurma(detalhe.turma);
        setAlunos(detalhe.alunos);
      })
      .catch((err: any) => {
        if (err.status === 404) setNaoEncontrada(true);
        else toast(err.mensagem || 'Erro ao carregar a turma.');
      });
  }, [id]);

  if (naoEncontrada) {
    return (
      <Card className="p-8 text-center bg-paper">
        <h2 className="text-xl font-bold font-title">Turma não encontrada</h2>
        <p className="text-xs text-muted mt-1">Ela pode pertencer a outro professor ou o link está errado.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/professor/turmas')}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para turmas
        </Button>
      </Card>
    );
  }

  if (!turma) {
    return <p className="text-xs font-bold text-muted">Carregando turma...</p>;
  }

  const t = turma;
  const arquivada = !!t.arquivadaEm;

  async function handleArquivar() {
    const ok = await confirmar({
      titulo: `Arquivar a turma "${t.nome}"?`,
      mensagem:
        'As atividades abertas serão encerradas (quem estiver no meio de uma tentativa ainda pode enviá-la) e a turma some para os alunos e do painel inicial. O código de convite deixa de aceitar novos alunos. Alunos, atividades e resultados ficam guardados, e você pode reativar a turma quando quiser.',
      rotuloConfirmar: 'Arquivar turma',
      perigo: true,
    });
    if (!ok) return;
    setAlterandoArquivo(true);
    try {
      setTurma(await api.professor.arquivarTurma(t.id));
      toast('Turma arquivada.');
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao arquivar a turma.');
    } finally {
      setAlterandoArquivo(false);
    }
  }

  async function handleReativar() {
    setAlterandoArquivo(true);
    try {
      setTurma(await api.professor.reativarTurma(t.id));
      toast('Turma reativada. O código de convite voltou a valer.');
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao reativar a turma.');
    } finally {
      setAlterandoArquivo(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        to="/professor/turmas"
        className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Turmas
      </Link>

      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink break-words">{t.nome}</h1>
            {arquivada && <Tag color="paper">Arquivada</Tag>}
          </div>
          <p className="text-xs lg:text-sm text-muted mt-1">
            {[t.curso?.nome ?? 'Sem curso', t.periodo, `criada em ${new Date(t.criadaEm).toLocaleDateString()}`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalEditarAberta(true)}>
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
          {arquivada ? (
            <Button variant="green" size="sm" carregando={alterandoArquivo} onClick={handleReativar}>
              <ArchiveRestore className="w-3.5 h-3.5" />
              Reativar
            </Button>
          ) : (
            <Button variant="danger" size="sm" carregando={alterandoArquivo} onClick={handleArquivar}>
              <Archive className="w-3.5 h-3.5" />
              Arquivar
            </Button>
          )}
        </div>
      </div>

      {arquivada && (
        <Card color="yellow" className="p-3.5 text-xs font-bold text-ink">
          Turma arquivada em {new Date(t.arquivadaEm!).toLocaleDateString()}. Os alunos não a veem mais, e ela não aceita
          novos alunos nem novas atividades; o histórico continua disponível. Ao reativar, as atividades encerradas
          continuam encerradas.
        </Card>
      )}

      <Abas
        abas={[
          { para: '', rotulo: `Alunos (${t.totalAlunos})`, icone: Users, exata: true },
          { para: 'atividades', rotulo: 'Atividades', icone: FileText },
          { para: 'resultados', rotulo: 'Resultados', icone: BarChart2 },
        ]}
      />

      <Outlet context={{ turma: t, alunos, setTurma, setAlunos } satisfies TurmaContexto} />

      <ModalTurma
        aberto={modalEditarAberta}
        aoFechar={() => setModalEditarAberta(false)}
        turma={t}
        aoSalvar={setTurma}
      />
    </div>
  );
}
