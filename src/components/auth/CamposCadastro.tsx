import { Input } from '@/components/ui/Input';
import { CampoSenha } from '@/components/auth/CampoSenha';
import { SeletorPapel } from '@/components/auth/SeletorPapel';
import type { Papel } from '@/api/models';

/** O convite só existe para professor: trocar para aluno limpa o valor. */
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
        placeholder="Repita a senha"
        value={confirmacao}
        onChange={aoMudarConfirmacao}
        error={erroConfirmacao}
        required
      />
    </>
  );
}

export const SENHAS_NAO_CONFEREM = 'As senhas não conferem.';

export const DICA_PROFESSOR_SEM_CONVITE =
  'Sem convite, seu acesso fica pendente até um professor já aprovado liberar.';
