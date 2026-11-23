import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { Aluno, DesempenhoAlunoTurma } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressMeter, Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { BarChart2, Copy, RefreshCw, UserMinus } from 'lucide-react';
import { useTurma } from './ProfessorTurmaPage';

export function TurmaAlunosAba() {
  const { turma, alunos, setTurma, setAlunos } = useTurma();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [busca, setBusca] = useState('');
  const [gerandoCodigo, setGerandoCodigo] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [alunoDesempenho, setAlunoDesempenho] = useState<Aluno | null>(null);

  const arquivada = !!turma.arquivadaEm;
  const termo = busca.trim().toLowerCase();
  const alunosFiltrados = termo
    ? alunos.filter((a) => a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo))
    : alunos;

  function copiarCodigo() {
    navigator.clipboard.writeText(turma.codigoConvite);
    toast('Código de convite copiado para a área de transferência!');
  }

  async function handleGerarNovoCodigo() {
    const ok = await confirmar({
      titulo: 'Gerar novo código de convite?',
      mensagem: 'O código atual deixa de funcionar e quem ainda não entrou vai precisar do novo. Os alunos que já estão na turma continuam nela.',
      rotuloConfirmar: 'Gerar novo código',
      perigo: true,
    });
    if (!ok) return;
    setGerandoCodigo(true);
    try {
      setTurma(await api.professor.gerarNovoConviteTurma(turma.id));
      toast('Novo código gerado com sucesso!');
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao gerar novo código.');
    } finally {
      setGerandoCodigo(false);
    }
  }

  async function handleRemoverAluno(aluno: Aluno) {
    const ok = await confirmar({
      titulo: `Remover ${aluno.nome} da turma?`,
      mensagem: 'O aluno deixa de ver as atividades desta turma. Para voltar, ele precisa entrar de novo com o código de convite.',
      rotuloConfirmar: 'Remover aluno',
      perigo: true,
    });
    if (!ok) return;
    setRemovendoId(aluno.id);
    try {
      await api.professor.removerAlunoTurma(turma.id, aluno.id);
      setAlunos((lista) => lista.filter((a) => a.id !== aluno.id));
      setTurma({ ...turma, totalAlunos: Math.max(0, turma.totalAlunos - 1) });
      toast(`${aluno.nome} foi removido da turma.`);
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao remover o aluno.');
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Alunos */}
      <div className="lg:col-span-2 flex flex-col gap-3">
        {alunos.length > 5 && (
          <Input
            placeholder="Buscar aluno por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar aluno"
          />
        )}

        {alunos.length === 0 ? (
          <Card className="p-6 text-center bg-paper">
            <p className="text-xs font-bold text-muted">
              {arquivada
                ? 'Nenhum aluno entrou nesta turma.'
                : 'Nenhum aluno ainda. Compartilhe o código de convite para que entrem pelo aplicativo.'}
            </p>
          </Card>
        ) : alunosFiltrados.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">Nenhum aluno encontrado para "{busca.trim()}".</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden bg-paper">
            <ul className="divide-y-2 divide-ink/10">
              {alunosFiltrados.map((a) => (
                <li key={a.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-pink border-2 border-ink flex items-center justify-center font-title font-extrabold text-xs text-ink flex-none">
                      {a.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink truncate">{a.nome}</p>
                      <p className="text-xs text-muted truncate">
                        {a.email} · entrou em {new Date(a.entrouEm).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-none">
                    <Button size="sm" variant="secondary" onClick={() => setAlunoDesempenho(a)}>
                      <BarChart2 className="w-3.5 h-3.5" />
                      Desempenho
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={`Remover ${a.nome}`}
                      carregando={removendoId === a.id}
                      onClick={() => handleRemoverAluno(a)}
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Remover
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Convite */}
      <Card color="lilac" className="p-5 flex flex-col gap-3">
        <div>
          <h3 className="text-lg font-bold font-title text-ink">Convide Alunos</h3>
          <p className="text-xs text-ink/80 mt-0.5">
            {arquivada
              ? 'Turma arquivada: o código não aceita novos alunos até a turma ser reativada.'
              : 'Compartilhe este código para os alunos entrarem nesta turma pelo aplicativo.'}
          </p>
        </div>

        <div
          className={`bg-paper border-[2.5px] border-dashed border-ink rounded-xl py-3 text-center my-1 ${
            arquivada ? 'opacity-50' : ''
          }`}
        >
          <span className="font-title font-extrabold text-2xl tracking-[0.2em] text-ink">{turma.codigoConvite}</span>
        </div>

        <Button variant="secondary" fullWidth onClick={copiarCodigo} disabled={arquivada}>
          <Copy className="w-4 h-4" />
          Copiar código de convite
        </Button>

        {!arquivada && (
          <button
            type="button"
            disabled={gerandoCodigo}
            onClick={handleGerarNovoCodigo}
            className="text-[11px] font-bold text-ink/70 hover:text-ink text-center flex items-center justify-center gap-1 cursor-pointer mt-1"
          >
            <RefreshCw className={`w-3 h-3 ${gerandoCodigo ? 'animate-spin' : ''}`} />
            Gerar novo código
          </button>
        )}
      </Card>

      <ModalDesempenhoAluno turmaId={turma.id} aluno={alunoDesempenho} aoFechar={() => setAlunoDesempenho(null)} />
    </div>
  );
}

interface ModalDesempenhoAlunoProps {
  turmaId: string;
  aluno: Aluno | null;
  aoFechar: () => void;
}

function ModalDesempenhoAluno({ turmaId, aluno, aoFechar }: ModalDesempenhoAlunoProps) {
  const [dados, setDados] = useState<DesempenhoAlunoTurma | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aluno) return;
    setDados(null);
    setErro(null);
    api.professor
      .obterDesempenhoAluno(turmaId, aluno.id)
      .then(setDados)
      .catch((err: any) => setErro(err.mensagem || 'Erro ao carregar o desempenho.'));
  }, [turmaId, aluno]);

  const tentativas = dados?.tentativas ?? [];
  const porTema = dados?.porTema ?? [];

  return (
    <Modal aberto={!!aluno} aoFechar={aoFechar} titulo={aluno ? `Desempenho de ${aluno.nome}` : undefined} className="max-w-2xl">
      {erro ? (
        <p className="text-xs font-bold text-pink">{erro}</p>
      ) : !dados ? (
        <p className="text-xs font-bold text-muted">Carregando...</p>
      ) : (
        <div className="flex flex-col gap-5 max-h-[65vh] overflow-y-auto pr-1">
          <section className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Por tema</span>
            {porTema.length === 0 ? (
              <p className="text-xs text-muted">Ainda não respondeu questões das atividades desta turma.</p>
            ) : (
              porTema.map((tema) => (
                <div key={tema.temaId} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span className="truncate">{tema.tema}</span>
                    <span className="flex-none ml-2">
                      {tema.percentual}% · {tema.acertos}/{tema.respondidas}
                    </span>
                  </div>
                  <ProgressMeter valor={tema.percentual} cor="green" />
                </div>
              ))
            )}
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Tentativas</span>
            {tentativas.length === 0 ? (
              <p className="text-xs text-muted">Nenhuma tentativa nas atividades desta turma.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tentativas.map((tt) => (
                  <li
                    key={tt.id}
                    className="flex items-center justify-between gap-3 border-2 border-ink rounded-xl px-3 py-2 bg-paper"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate">{tt.titulo}</p>
                      <p className="text-xs text-muted">
                        Tentativa {tt.numero} · {new Date(tt.iniciadaEm).toLocaleDateString()}
                      </p>
                    </div>
                    {tt.finalizadaEm ? (
                      <Tag color="green">
                        {tt.acertos ?? 0}/{tt.total} acertos
                      </Tag>
                    ) : (
                      <Tag color="yellow">Em andamento</Tag>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
