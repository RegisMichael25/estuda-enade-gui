import React, { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CamposNovaSenha, SENHAS_NAO_CONFEREM } from '@/components/auth/CamposCadastro';
import { codigoDeErro, mensagemDeErro } from '@/lib/erros';
import { senhaValida } from '@/lib/senha';

type Erros = Partial<Record<'codigo' | 'senha' | 'confirmacao', string>>;

/** Botão com ícone de chave que abre o ModalSenha (rodapé dos layouts e página de pendente). */
export function BotaoSenha({ aoClicar }: { aoClicar: () => void }) {
  const { usuario } = useAuth();
  const rotulo = usuario?.temSenha === false ? 'Criar senha' : 'Trocar senha';
  return (
    <button
      type="button"
      onClick={aoClicar}
      title={rotulo}
      aria-label={rotulo}
      className="p-1.5 border-2 border-ink rounded-lg bg-paper hover:bg-yellow/40 transition-all text-ink cursor-pointer"
    >
      <KeyRound className="w-4 h-4" />
    </button>
  );
}

/**
 * Criar ou trocar a senha da conta logada, como no "esqueci a senha": primeiro um código é enviado ao e-mail
 * da conta, depois o usuário informa o código e a nova senha. A resposta é uma sessão nova: as outras sessões
 * da conta são encerradas no servidor.
 */
export function ModalSenha({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  if (!aberto) return null;
  return <FormularioSenha aoFechar={aoFechar} />;
}

function FormularioSenha({ aoFechar }: { aoFechar: () => void }) {
  const { usuario, solicitarCodigoTrocaSenha, trocarSenha } = useAuth();
  const { toast } = useToast();
  const temSenha = usuario?.temSenha ?? true;

  const [etapa, setEtapa] = useState<'enviar' | 'confirmar'>('enviar');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<React.ReactNode>(null);
  const [erros, setErros] = useState<Erros>({});

  async function handleEnviarCodigo() {
    setCarregando(true);
    setErro(null);
    setErros({});
    try {
      await solicitarCodigoTrocaSenha();
      toast('Código enviado para o seu e-mail.');
      setCodigo('');
      setEtapa('confirmar');
    } catch (err) {
      setErro(mensagemDeErro(err, 'Não foi possível enviar o código. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    const locais: Erros = {};
    if (!codigo.trim()) locais.codigo = 'Informe o código recebido.';
    if (!senhaValida(senha)) locais.senha = 'A senha não atende às regras.';
    if (confirmacao !== senha) locais.confirmacao = SENHAS_NAO_CONFEREM;
    setErros(locais);
    if (Object.keys(locais).length) return;

    setCarregando(true);
    setErro(null);
    try {
      await trocarSenha(codigo.trim(), senha);
      toast(temSenha ? 'Senha alterada.' : 'Senha criada.');
      aoFechar();
    } catch (err) {
      const codigoErro = codigoDeErro(err);
      if (codigoErro === 'CODIGO_INVALIDO') {
        setErros({ codigo: 'Código inválido ou expirado.' });
        setErro(
          <>
            Código inválido ou expirado.{' '}
            <button type="button" onClick={handleEnviarCodigo} className="underline cursor-pointer">
              Reenviar código
            </button>
          </>
        );
      } else if (codigoErro === 'SENHA_FRACA') {
        setErros({ senha: mensagemDeErro(err, '') });
      } else {
        setErro(mensagemDeErro(err, 'Não foi possível salvar a senha. Tente novamente.'));
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal aberto aoFechar={aoFechar} titulo={temSenha ? 'Trocar senha' : 'Criar senha'}>
      <div className="flex flex-col gap-4">
        {erro && (
          <div role="alert" className="p-3 bg-pink/20 border-2 border-ink rounded-xl text-xs font-bold text-ink">
            {erro}
          </div>
        )}

        {etapa === 'enviar' ? (
          <>
            <p className="text-sm text-muted">
              {temSenha ? 'Para trocar a senha' : 'Sua conta ainda não tem senha. Para criar uma'}, enviaremos um
              código para <b>{usuario?.email}</b>.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={aoFechar}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" carregando={carregando} onClick={handleEnviarCodigo}>
                <Mail className="w-4 h-4" />
                Enviar código
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSalvar} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-muted">
              Enviamos um código para <b>{usuario?.email}</b>.
            </p>
            <Input
              id="troca-codigo"
              label="Código de 6 dígitos"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              error={erros.codigo}
              className="text-center text-2xl tracking-[0.25em] font-title font-bold"
              required
              autoFocus
            />
            <CamposNovaSenha
              senha={senha}
              aoMudarSenha={setSenha}
              confirmacao={confirmacao}
              aoMudarConfirmacao={setConfirmacao}
              erroSenha={erros.senha}
              erroConfirmacao={erros.confirmacao}
              rotulo="Nova senha"
            />
            <p className="text-xs text-muted">Ao salvar, você continua conectado aqui e sai dos outros dispositivos.</p>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleEnviarCodigo}
                disabled={carregando}
                className="text-xs font-bold text-muted hover:text-ink cursor-pointer disabled:opacity-60"
              >
                Reenviar código
              </button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={aoFechar}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" carregando={carregando}>
                  <KeyRound className="w-4 h-4" />
                  Salvar senha
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
