import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { TurmaAluno, AtividadeAluno } from '@/api/models';
import { formatarDuracao } from '@/lib/duracao';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { Users, ClipboardList, ArrowRight, LogOut } from 'lucide-react';

export function AlunoTurmasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [turmas, setTurmas] = useState<TurmaAluno[]>([]);
  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [codigoTurma, setCodigoTurma] = useState('');
  const [entrandoTurma, setEntrandoTurma] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [saindoId, setSaindoId] = useState<string | null>(null);

  async function carregarDados() {
    try {
      const [listaTurmas, listaAtividades] = await Promise.all([
        api.aluno.obterTurmas(),
        api.aluno.obterAtividades().catch((): AtividadeAluno[] => [])
      ]);
      setTurmas(listaTurmas);
      setAtividades(listaAtividades);
    } catch (err) {
      console.error('Erro ao carregar turmas do aluno:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleEntrarTurma(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoTurma.trim()) return;

    setEntrandoTurma(true);
    try {
      await api.aluno.entrarTurma(codigoTurma.trim());
      toast('Você entrou na turma com sucesso!');
      setCodigoTurma('');
      await carregarDados();
    } catch (err: any) {
      toast(err.mensagem || 'Código de turma inválido ou expirado.');
    } finally {
      setEntrandoTurma(false);
    }
  }

  async function handleSairDaTurma(turma: TurmaAluno) {
    const ok = await confirmar({
      titulo: `Sair da turma "${turma.nome}"?`,
      mensagem: 'Você deixa de ver as atividades desta turma. Seus resultados continuam guardados. Para voltar, vai precisar do código de convite do professor.',
      rotuloConfirmar: 'Sair da turma',
      perigo: true,
    });
    if (!ok) return;
    setSaindoId(turma.id);
    try {
      await api.aluno.sairDaTurma(turma.id);
      toast(`Você saiu da turma ${turma.nome}.`);
      await carregarDados();
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível sair da turma.');
    } finally {
      setSaindoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold font-title text-ink">Turmas</h1>

      {/* Entrar em uma turma com código */}
      <Card color="lilac" className="p-6">
        <h2 className="text-xl font-bold font-title text-ink">
          {turmas.length === 0 ? 'Bora estudar pro ENADE?' : 'Entrar em outra turma'}
        </h2>
        <p className="text-xs text-ink/80 mt-1 mb-4">
          Digite o código de convite fornecido pelo seu professor para acessar os simulados da turma.
        </p>

        <form onSubmit={handleEntrarTurma} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Código da turma (ex: ABC-123)"
            value={codigoTurma}
            onChange={(e) => setCodigoTurma(e.target.value.toUpperCase())}
            className="text-center font-title font-bold tracking-widest text-lg"
            required
          />
          <Button type="submit" variant="primary" carregando={entrandoTurma}>
            Entrar na turma
          </Button>
        </form>
      </Card>

      {/* Turmas do aluno com suas atividades */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Minhas turmas
          </span>
          <span className="text-xs font-bold text-muted">{turmas.length}</span>
        </div>

        {!carregando && turmas.length === 0 && (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">Você ainda não está em nenhuma turma.</p>
          </Card>
        )}

        {turmas.map((t) => {
          const atividadesTurma = atividades.filter((a) => a.turma.id === t.id);

          return (
            <Card key={t.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-lilac border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                  <Users className="w-5 h-5 text-ink" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-ink truncate">{t.nome}</h3>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {t.curso ? `${t.curso.nome} · ` : ''}Prof. {t.professor}
                  </p>
                </div>
                {t.periodo && <Tag color="lilac">{t.periodo}</Tag>}
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t-2 border-ink/20">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Atividades ({atividadesTurma.length})
                </span>

                {atividadesTurma.length === 0 ? (
                  <p className="text-xs text-muted">Nenhuma atividade aberta nesta turma.</p>
                ) : (
                  atividadesTurma.map((atv) => (
                    <button
                      key={atv.id}
                      onClick={() => navigate(`/aluno/atividade/${atv.id}`)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-ink bg-paper hover:bg-bg transition-all text-left cursor-pointer"
                    >
                      <ClipboardList className="w-4 h-4 text-ink flex-none" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-ink truncate">{atv.titulo}</div>
                        <div className="text-xs text-muted">
                          {atv.totalQuestoes} questões ·{' '}
                          {formatarDuracao(atv)}
                          {atv.melhorAcertos != null &&
                            ` · Melhor: ${atv.melhorAcertos}/${atv.totalQuestoes}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        {atv.status === 'ENCERRADA' ? (
                          <Tag color="paper">Encerrada</Tag>
                        ) : atv.tentativaAbertaId ? (
                          <Tag color="yellow">Em andamento</Tag>
                        ) : !atv.podeIniciar ? (
                          <Tag color="green">Concluído</Tag>
                        ) : null}
                        <ArrowRight className="w-4 h-4 text-muted flex-none" />
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  carregando={saindoId === t.id}
                  onClick={() => handleSairDaTurma(t)}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sair da turma
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
