import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Pencil, RefreshCw, Send, Trash2 } from 'lucide-react';
import { api, ApiException } from '@/api/client';
import type { Comentario, Mural } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { cn } from '@/lib/utils';

/** Mesmo limite do contrato da API (`ComentarioRequest.texto`). */
const LIMITE_TEXTO = 2000;

interface MuralComentariosProps {
  atividadeId: string;
  /** Define as rotas usadas: `/aluno/...` ou `/professor/...`. As permissões vêm da API. */
  papel: 'aluno' | 'professor';
}

function formatarMomento(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Mural de comentários de uma atividade, aberto à turma.
 * O aluno só chega aqui depois de enviar a primeira tentativa; a API garante essa regra.
 * Sem tempo real: carrega ao abrir e no botão "Atualizar".
 */
export function MuralComentarios({ atividadeId, papel }: MuralComentariosProps) {
  const fonte = papel === 'aluno' ? api.aluno : api.professor;
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [mural, setMural] = useState<Mural | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setMural(await fonte.obterMural(atividadeId));
    } catch (err) {
      toast(err instanceof ApiException ? err.mensagem : 'Não foi possível carregar os comentários.');
    } finally {
      setCarregando(false);
    }
  }, [atividadeId, fonte, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function substituir(atualizado: Comentario) {
    setMural((m) => m && { ...m, comentarios: m.comentarios.map((c) => (c.id === atualizado.id ? atualizado : c)) });
  }

  async function handleEnviar() {
    const limpo = texto.trim();
    if (!limpo) return;
    setEnviando(true);
    try {
      const novo = await fonte.comentar(atividadeId, limpo);
      setMural((m) => m && { ...m, comentarios: [...m.comentarios, novo] });
      setTexto('');
    } catch (err) {
      toast(err instanceof ApiException ? err.mensagem : 'Não foi possível publicar o comentário.');
    } finally {
      setEnviando(false);
    }
  }

  function iniciarEdicao(c: Comentario) {
    setEditandoId(c.id);
    setTextoEdicao(c.texto);
  }

  async function handleSalvarEdicao() {
    const limpo = textoEdicao.trim();
    if (!editandoId || !limpo) return;
    setSalvandoEdicao(true);
    try {
      substituir(await fonte.editarComentario(editandoId, limpo));
      setEditandoId(null);
    } catch (err) {
      toast(err instanceof ApiException ? err.mensagem : 'Não foi possível salvar a edição.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function handleApagar(c: Comentario) {
    const ok = await confirmar({
      titulo: 'Apagar comentário?',
      mensagem: c.meu
        ? 'O comentário sai do mural para toda a turma.'
        : `O comentário de ${c.autor.nome} sai do mural para toda a turma.`,
      rotuloConfirmar: 'Apagar',
      perigo: true,
    });
    if (!ok) return;
    try {
      await fonte.apagarComentario(c.id);
      setMural((m) => m && { ...m, comentarios: m.comentarios.filter((x) => x.id !== c.id) });
    } catch (err) {
      toast(err instanceof ApiException ? err.mensagem : 'Não foi possível apagar o comentário.');
    }
  }

  function enviarComAtalho(e: React.KeyboardEvent<HTMLTextAreaElement>, acao: () => void) {
    // Ctrl/Cmd + Enter envia; Enter sozinho quebra a linha
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      acao();
    }
  }

  const comentarios = mural?.comentarios ?? [];

  return (
    <Card className="p-0 bg-paper overflow-hidden">
      <div className="p-4 border-b-2 border-ink bg-bg flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          Comentários da turma ({comentarios.length})
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={carregar} carregando={carregando}>
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {carregando && !mural ? (
          <p className="text-xs font-bold text-muted text-center py-4">Carregando comentários...</p>
        ) : comentarios.length === 0 ? (
          <p className="text-xs text-muted text-center py-4">
            Nenhum comentário ainda. {mural?.podeComentar && 'Comece a conversa sobre esta atividade.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {comentarios.map((c) => {
              const doProfessor = c.papelAutor === 'PROFESSOR';
              const editando = editandoId === c.id;
              return (
                <li
                  key={c.id}
                  className={cn(
                    'p-3 rounded-xl border-2 border-ink flex flex-col gap-1.5',
                    doProfessor ? 'bg-yellow/40' : 'bg-paper'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-xs">
                      <b className="text-ink">{c.meu ? 'Você' : c.autor.nome}</b>
                      {doProfessor && <Tag color="yellow">Professor</Tag>}
                      <span className="text-muted">
                        {formatarMomento(c.criadoEm)}
                        {c.editadoEm && ' · editado'}
                      </span>
                    </div>
                    {!editando && (c.podeEditar || c.podeApagar) && (
                      <div className="flex items-center gap-1">
                        {c.podeEditar && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => iniciarEdicao(c)} aria-label="Editar comentário">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {c.podeApagar && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleApagar(c)} aria-label="Apagar comentário">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {editando ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        rows={3}
                        value={textoEdicao}
                        maxLength={LIMITE_TEXTO}
                        onChange={(e) => setTextoEdicao(e.target.value)}
                        onKeyDown={(e) => enviarComAtalho(e, handleSalvarEdicao)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditandoId(null)}>
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          carregando={salvandoEdicao}
                          disabled={!textoEdicao.trim()}
                          onClick={handleSalvarEdicao}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink whitespace-pre-wrap break-words">{c.texto}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {mural && !mural.podeComentar && (
          <p className="text-xs text-muted font-bold">
            Turma arquivada: o mural está disponível só para leitura.
          </p>
        )}

        {mural?.podeComentar && (
          <div className="flex flex-col gap-2 pt-3 border-t-2 border-ink/20">
            <Textarea
              rows={3}
              placeholder={
                papel === 'aluno'
                  ? 'Comente sobre a atividade ou tire uma dúvida com a turma...'
                  : 'Escreva para a turma sobre esta atividade...'
              }
              value={texto}
              maxLength={LIMITE_TEXTO}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => enviarComAtalho(e, handleEnviar)}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-muted">
                {texto.length}/{LIMITE_TEXTO} · Ctrl+Enter para enviar
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                carregando={enviando}
                disabled={!texto.trim()}
                onClick={handleEnviar}
              >
                <Send className="w-3.5 h-3.5" />
                Comentar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
