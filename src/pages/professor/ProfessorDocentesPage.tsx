import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import type { Convite, ProfessorPendente, ConviteCriado } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, CheckCircle, Copy, ShieldCheck } from 'lucide-react';

export function ProfessorDocentesPage() {
  const { toast } = useToast();

  const [convites, setConvites] = useState<Convite[]>([]);
  const [pendentes, setPendentes] = useState<ProfessorPendente[]>([]);
  const [novoConvite, setNovoConvite] = useState<ConviteCriado | null>(null);
  const [criandoConvite, setCriandoConvite] = useState(false);
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const [listaConvites, listaPendentes] = await Promise.all([
        api.professor.obterConvites().catch((): Convite[] => []),
        api.professor.obterProfessoresPendentes().catch((): ProfessorPendente[] => [])
      ]);
      setConvites(listaConvites);
      setPendentes(listaPendentes);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCriarConvite() {
    setCriandoConvite(true);
    try {
      const criado = await api.professor.criarConvite();
      setNovoConvite(criado);
      toast('Novo convite docente gerado! Válido por 7 dias.');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao gerar convite.');
    } finally {
      setCriandoConvite(false);
    }
  }

  async function handleAprovar(professorId: string) {
    setAprovandoId(professorId);
    try {
      await api.professor.aprovarProfessor(professorId);
      toast('Professor aprovado com sucesso!');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao aprovar professor.');
    } finally {
      setAprovandoId(null);
    }
  }

  function copiarCodigo(cod: string) {
    navigator.clipboard.writeText(cod);
    toast('Código de convite copiado!');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
          Gestão Docente
        </h1>
        <p className="text-xs lg:text-sm text-muted">
          Convide novos professores para colaborar com o banco ou aprove cadastros pendentes.
        </p>
      </div>

      {/* Grid: Convites + Aprovações Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card de Criação de Convites */}
        <Card className="p-5 bg-paper flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-title text-ink flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange" />
                Convite Docente
              </h2>
              <p className="text-xs text-muted mt-0.5">
                O convite permite que outro professor entre com acesso imediato e aprovado.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              carregando={criandoConvite}
              onClick={handleCriarConvite}
            >
              + Gerar convite
            </Button>
          </div>

          {novoConvite && (
            <div className="p-4 bg-yellow/30 border-2 border-ink rounded-xl flex flex-col gap-2 animate-in fade-in">
              <span className="text-[11px] font-bold uppercase text-ink/80">
                Convite gerado (Uso único · Válido por 7 dias):
              </span>
              <div className="flex items-center justify-between bg-paper border-2 border-ink rounded-lg p-2.5">
                <span className="font-title font-extrabold text-lg text-ink tracking-widest">
                  {novoConvite.codigo}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copiarCodigo(novoConvite.codigo)}
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </Button>
              </div>
            </div>
          )}

          {/* Histórico de Convites */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Convites emitidos ({convites.length})
            </span>

            {convites.length === 0 ? (
              <p className="text-xs text-muted font-bold py-2">
                Nenhum convite emitido recentemente.
              </p>
            ) : (
              convites.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-bg border-2 border-ink rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-ink">
                      Convite de {new Date(c.criadoEm).toLocaleDateString()}
                    </span>
                    <span className="text-muted text-[11px] block">
                      Expira em: {new Date(c.expiraEm).toLocaleDateString()}
                    </span>
                  </div>

                  <Tag color={c.usado ? 'paper' : 'green'}>
                    {c.usado ? 'Utilizado' : 'Disponível'}
                  </Tag>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Professores Pendentes de Aprovação */}
        <Card className="p-5 bg-paper flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold font-title text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Professores Pendentes
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Docentes que se cadastraram sem convite e aguardam autorização institucional.
            </p>
          </div>

          {pendentes.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-ink/30 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-muted">
                Nenhum professor aguardando aprovação no momento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pendentes.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-bg border-2 border-ink rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="font-bold text-xs text-ink">{p.nome}</h3>
                    <p className="text-xs text-muted">{p.email}</p>
                    <span className="text-[10px] text-muted">
                      Cadastrado em {new Date(p.criadoEm).toLocaleDateString()}
                    </span>
                  </div>

                  <Button
                    variant="green"
                    size="sm"
                    carregando={aprovandoId === p.id}
                    onClick={() => handleAprovar(p.id)}
                  >
                    Aprovar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
