import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import type { TurmaAluno } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';

export function AlunoTurmasPage() {
  const { toast } = useToast();

  const [turmas, setTurmas] = useState<TurmaAluno[]>([]);
  const [codigoTurma, setCodigoTurma] = useState('');
  const [entrandoTurma, setEntrandoTurma] = useState(false);
  const [carregando, setCarregando] = useState(true);

  async function carregarTurmas() {
    try {
      setTurmas(await api.aluno.obterTurmas());
    } catch (err) {
      console.error('Erro ao carregar turmas do aluno:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function handleEntrarTurma(e: React.FormEvent) {
    e.preventDefault();
    if (!codigoTurma.trim()) return;

    setEntrandoTurma(true);
    try {
      await api.aluno.entrarTurma(codigoTurma.trim());
      toast('Você entrou na turma com sucesso!');
      setCodigoTurma('');
      await carregarTurmas();
    } catch (err: any) {
      toast(err.mensagem || 'Código de turma inválido ou expirado.');
    } finally {
      setEntrandoTurma(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          to="/aluno/configuracoes"
          className="text-xs font-bold text-muted hover:text-ink inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Configurações
        </Link>
        <h1 className="text-2xl font-extrabold font-title text-ink mt-1">Turmas</h1>
      </div>

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

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Minhas turmas
          </span>
          <span className="text-xs font-bold text-muted">{turmas.length}</span>
        </div>

        {!carregando && turmas.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">Você ainda não está em nenhuma turma.</p>
          </Card>
        ) : (
          turmas.map((t) => (
            <Card key={t.id} className="p-3.5 flex items-center gap-3.5">
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
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
