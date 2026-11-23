import { Input } from '@/components/ui/Input';
import { CampoSenha } from '@/components/auth/CampoSenha';
import { SeletorPapel } from '@/components/auth/SeletorPapel';
import type { Papel } from '@/api/models';

/**
 * Papel e convite, comuns a /cadastro e /cadastro/google. O convite só existe para professor: ao trocar para
 * aluno, o campo some e o valor é limpo (o backend o ignoraria para aluno de qualquer forma).
 */
export function CamposPapelConvite({
  papel,
  aoMudarPapel,
  convite,
  aoMudarConvite,
  erroConvite,
  dicaProfessor
}: {
  papel: Papel | null;
  aoMudarPapel: (papel: Papel) => void;
  convite: string;
  aoMudarConvite: (valor: string) => void;
  erroConvite?: string;
  dicaProfessor?: string;
}) {
  function mudarPapel(novo: Papel) {
    if (novo === 'ALUNO') aoMudarConvite('');
    aoMudarPapel(novo);
  }

  return (
    <>
      <SeletorPapel valor={papel} aoMudar={mudarPapel} />
      {papel === 'PROFESSOR' && (
        <div className="flex flex-col gap-1.5">
          <Input
            id="cadastro-convite"
            label="Código de convite docente (opcional)"
            type="text"
            autoComplete="off"
            placeholder="Se recebeu convite de outro professor"
            value={convite}
            onChange={(e) => aoMudarConvite(e.target.value)}
            error={erroConvite}
          />
          {dicaProfessor && <p className="text-xs text-muted">{dicaProfessor}</p>}
        </div>
      )}
    </>
  );
}

/** Senha nova com confirmação e as regras da política. */
export function CamposNovaSenha({
  senha,
  aoMudarSenha,
  confirmacao,
  aoMudarConfirmacao,
  erroSenha,
  erroConfirmacao,
  rotulo = 'Senha'
}: {
  senha: string;
  aoMudarSenha: (valor: string) => void;
  confirmacao: string;
  aoMudarConfirmacao: (valor: string) => void;
  erroSenha?: string;
  erroConfirmacao?: string;
  rotulo?: string;
}) {
  return (
    <>
      <CampoSenha
        id="nova-senha"
        label={rotulo}
        autoComplete="new-password"
        value={senha}
        onChange={aoMudarSenha}
        error={erroSenha}
        mostrarRegras
        required
      />
      <CampoSenha
        id="nova-senha-confirmacao"
        label="Confirme a senha"
        autoComplete="new-password"
        value={confirmacao}
        onChange={aoMudarConfirmacao}
        error={erroConfirmacao}
        required
      />
    </>
  );
}

export const SENHAS_NAO_CONFEREM = 'As senhas não conferem.';

/** O professor só é liberado com convite ou pela aprovação de outro professor (o domínio do e-mail não conta). */
export const DICA_PROFESSOR_SEM_CONVITE =
  'Sem convite, seu acesso fica pendente até um professor já aprovado liberar.';
