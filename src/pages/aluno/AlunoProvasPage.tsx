import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { ProvaPessoalResumo } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag, ProgressMeter } from '@/components/ui/Tag';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { percentual } from './pratica/estado';
import { EvolucaoProvas } from './pratica/EvolucaoProvas';

const DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Histórico das provas que o aluno montou na prática livre. É só dele. */
export function AlunoProvasPage() {
  const navigate = useNavigate();
  const confirmar = useConfirmacao();
  const { toast } = useToast();
  const [provas, setProvas] = useState<ProvaPessoalResumo[] | null>(null);

  useEffect(() => {
    api.aluno
      .listarProvas()
      .then(setProvas)
      .catch(() => {
        setProvas([]);
        toast('Não foi possível carregar suas provas.');
      });
    // Só ao abrir a tela
  }, []);

  async function excluir(p: ProvaPessoalResumo) {
    const ok = await confirmar({
      titulo: 'Excluir esta prova?',
      mensagem: `"${p.nome}" sai do seu histórico. As respostas continuam contando no seu desempenho.`,
      rotuloConfirmar: 'Excluir',
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.aluno.excluirProva(p.id);
      setProvas((lista) => lista?.filter((x) => x.id !== p.id) ?? null);
    } catch (err: any) {
      toast(err.mensagem || 'Não foi possível excluir a prova.');
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-ink">
        <button
          type="button"
          onClick={() => navigate('/aluno/pratica')}
          className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Praticar
        </button>
        <span className="text-xs font-bold text-ink">Minhas provas</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-title">Minhas provas</h2>
          <p className="text-xs text-muted">Provas que você montou. Só você vê.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/aluno/pratica')}>
          <Plus className="w-4 h-4" />
          Montar prova
        </Button>
      </div>

      {provas === null ? (
        <p className="text-xs text-muted">Carregando provas...</p>
      ) : provas.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm font-bold">Você ainda não montou nenhuma prova.</p>
          <p className="text-xs text-muted mt-1">Escolha temas e questões e pratique no seu ritmo.</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate('/aluno/pratica')}>
            Montar minha primeira prova
          </Button>
        </Card>
      ) : (
        <>
        <EvolucaoProvas provas={provas} />
        <ul className="flex flex-col gap-3">
          {provas.map((p) => {
            const concluida = !!p.concluidaEm;
            const progresso = concluida ? percentual(p.acertos, p.total) : percentual(p.respondidas, p.total);
            return (
              <li key={p.id}>
                <Card className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/aluno/provas/${p.id}`)}
                      className="text-left flex-1 min-w-0 cursor-pointer group"
                    >
                      <h3 className="font-bold text-sm text-ink group-hover:text-orange truncate">{p.nome}</h3>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {p.curso.nome} · {p.total} {p.total === 1 ? 'questão' : 'questões'} · {DATA.format(new Date(p.criadaEm))}
                      </p>
                    </button>
                    {concluida ? <Tag color="green">Concluída</Tag> : <Tag color="yellow">Em andamento</Tag>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted">{concluida ? 'Acertos' : 'Respondidas'}</span>
                      <span className="text-ink">
                        {concluida ? `${p.acertos}/${p.total} · ${progresso}%` : `${p.respondidas}/${p.total}`}
                      </span>
                    </div>
                    <ProgressMeter valor={progresso} cor={concluida ? (progresso >= 60 ? 'green' : 'pink') : 'yellow'} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => excluir(p)}
                      className="text-xs font-bold text-muted hover:text-red-600 flex items-center gap-1 cursor-pointer"
                      aria-label={`Excluir a prova ${p.nome}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir
                    </button>
                    <Button variant={concluida ? 'secondary' : 'primary'} size="sm" onClick={() => navigate(`/aluno/provas/${p.id}`)}>
                      {concluida ? 'Ver resultado' : 'Continuar'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
}
