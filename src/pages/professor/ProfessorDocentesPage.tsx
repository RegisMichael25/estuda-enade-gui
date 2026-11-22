import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import type { Convite, ProfessorPendente, ConviteCriado } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { UserPlus, CheckCircle, Copy, ShieldCheck, Ban, Clock } from 'lucide-react';

const COOLDOWN_MS = 5 * 60 * 1000;
const LIMITE_HISTORICO_CONVITES = 5;

function formatarTempoRestante(ms: number): string {
  const totalSegundos = Math.ceil(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

export function ProfessorDocentesPage() {
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [convites, setConvites] = useState<Convite[]>([]);
  const [pendentes, setPendentes] = useState<ProfessorPendente[]>([]);
  const [novoConvite, setNovoConvite] = useState<ConviteCriado | null>(null);
  const [criandoConvite, setCriandoConvite] = useState(false);
  const [invalidandoId, setInvalidandoId] = useState<string | null>(null);
  const [aprovandoId, setAprovandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [agoraMs, setAgoraMs] = useState(() => Date.now());

  function conviteDisponivel(c: Convite, referenciaMs: number): boolean {
    return !c.usado && !c.invalidado && new Date(c.expiraEm).getTime() > referenciaMs;
  }

  const temConviteAtivo = convites.some((c) => conviteDisponivel(c, agoraMs));
  const ultimoCriadoMs =
    convites.length > 0
      ? Math.max(...convites.map((c) => new Date(c.criadoEm).getTime()))
      : 0;
  const restanteCooldownMs = Math.max(0, ultimoCriadoMs + COOLDOWN_MS - agoraMs);
  const emCooldown = restanteCooldownMs > 0;
  const bloqueadoGerar = temConviteAtivo || emCooldown;

  const convitesRecentes = [...convites]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, LIMITE_HISTORICO_CONVITES);

  async function carregar() {
    setCarregando(true);
    try {
      const [listaConvites, listaPendentes] = await Promise.all([
        api.professor.obterConvites().catch((): Convite[] => []),
        api.professor.obterProfessoresPendentes().catch((): ProfessorPendente[] => [])
      ]);
      setConvites(listaConvites);
      setPendentes(listaPendentes);
      setAgoraMs(Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!emCooldown && !temConviteAtivo) return;
    const timer = setInterval(() => {
      setAgoraMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [emCooldown, temConviteAtivo]);

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

  async function handleInvalidarConvite(conviteId: string) {
    const ok = await confirmar({
      titulo: 'Invalidar convite?',
      mensagem:
        'O código gerado deixará de funcionar imediatamente e será necessário aguardar o intervalo para gerar outro.',
      rotuloConfirmar: 'Invalidar',
    });
    if (!ok) return;

    setInvalidandoId(conviteId);
    try {
      await api.professor.invalidarConvite(conviteId);
      if (novoConvite?.id === conviteId) {
        setNovoConvite(null);
      }
      toast('Convite invalidado com sucesso.');
      await carregar();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao invalidar convite.');
    } finally {
      setInvalidandoId(null);
    }
  }

  async function handleAprovar(professor: ProfessorPendente) {
    const ok = await confirmar({
      titulo: 'Aprovar professor?',
      mensagem: `${professor.nome} (${professor.email}) passa a ter acesso ao portal do professor: turmas, banco de questões e atividades. A aprovação não pode ser desfeita pelo sistema.`,
      rotuloConfirmar: 'Aprovar',
    });
    if (!ok) return;

    setAprovandoId(professor.id);
    try {
      await api.professor.aprovarProfessor(professor.id);
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-title text-ink flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange" />
                Convite Docente
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Apenas 1 convite ativo por vez, com intervalo de 5 minutos entre gerações.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              carregando={criandoConvite}
              disabled={bloqueadoGerar}
              onClick={handleCriarConvite}
            >
              + Gerar convite
            </Button>
          </div>

          {bloqueadoGerar && (
            <div className="p-3 bg-bg border-2 border-ink/30 rounded-xl flex items-center gap-2 text-xs text-ink">
              <Clock className="w-4 h-4 text-orange shrink-0" />
              <span>
                {temConviteAtivo
                  ? emCooldown
                    ? `Você já possui um convite ativo. Invalide-o e aguarde ${formatarTempoRestante(restanteCooldownMs)} para gerar outro.`
                    : 'Você já possui um convite ativo. Invalide o convite atual para poder gerar outro.'
                  : `Aguarde ${formatarTempoRestante(restanteCooldownMs)} para gerar um novo convite.`}
              </span>
            </div>
          )}

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
              Últimos convites ({convitesRecentes.length})
            </span>

            {convitesRecentes.length === 0 ? (
              <p className="text-xs text-muted font-bold py-2">
                Nenhum convite emitido recentemente.
              </p>
            ) : (
              convitesRecentes.map((c) => {
                const disponivel = conviteDisponivel(c, agoraMs);
                const statusLabel = c.usado
                  ? 'Utilizado'
                  : c.invalidado
                  ? 'Invalidado'
                  : disponivel
                  ? 'Disponível'
                  : 'Expirado';

                return (
                  <div
                    key={c.id}
                    className="p-2.5 bg-bg border-2 border-ink rounded-xl flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-ink">
                        Convite de {new Date(c.criadoEm).toLocaleDateString()}
                      </span>
                      <span className="text-muted text-[11px] block">
                        {c.usado && c.usadoPor
                          ? `Utilizado por ${c.usadoPor}`
                          : `Expira em: ${new Date(c.expiraEm).toLocaleDateString()}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {disponivel && (
                        <Button
                          variant="secondary"
                          size="sm"
                          carregando={invalidandoId === c.id}
                          onClick={() => handleInvalidarConvite(c.id)}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Invalidar
                        </Button>
                      )}
                      <Tag color={disponivel ? 'green' : 'paper'}>{statusLabel}</Tag>
                    </div>
                  </div>
                );
              })
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
                    onClick={() => handleAprovar(p)}
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