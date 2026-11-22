import type { components } from './types';

export type Schemas = components['schemas'];

export type Usuario = Schemas['UsuarioResponse'];
export type Sessao = Schemas['SessaoResponse'];
export type Papel = Schemas['Papel'];
export type Erro = Schemas['ErroResponse'];

export type Curso = Schemas['ItemResponse'];
export type Tema = Schemas['ItemResponse'];

export type Turma = Schemas['TurmaResponse'];
export type TurmaDetalhe = Schemas['TurmaDetalheResponse'];
export type ResumoTurma = Schemas['ResumoTurmaResponse'];
export type TurmaAluno = Schemas['TurmaAlunoResponse'];
export type Aluno = Schemas['AlunoResponse'];
export type DesempenhoAlunoTurma = Schemas['DesempenhoAlunoTurmaResponse'];
export type PainelProfessor = Schemas['PainelProfessorResponse'];
export type PainelTurma = Schemas['PainelTurma'];
export type AtividadeRecentePainel = Schemas['AtividadeRecentePainel'];

export type Questao = Schemas['QuestaoResponse'];
export type QuestaoAluno = Schemas['QuestaoAlunoResponse'];
export type Alternativa = Schemas['AlternativaResponse'];
export type AlternativaAluno = Schemas['AlternativaAlunoResponse'];
export type PaginaQuestao = Schemas['PaginaQuestaoResponse'];
export type PaginaQuestaoAluno = Schemas['PaginaQuestaoAlunoResponse'];
export type StatusQuestao = Schemas['StatusQuestao'];

export type Atividade = Schemas['AtividadeResponse'];
export type AtividadeDetalhe = Schemas['AtividadeDetalheResponse'];
export type AtividadeAluno = Schemas['AtividadeAlunoResponse'];
export type AtividadeRecente = Schemas['AtividadeRecente'];
export type StatusAtividade = Schemas['StatusAtividade'];
export type TipoAtividade = Schemas['TipoAtividade'];
export type Encerramento = Schemas['Encerramento'];

export type TentativaEstado = Schemas['TentativaEstadoResponse'];
export type TentativaResumo = Schemas['TentativaResumoResponse'];
export type ResultadoTentativa = Schemas['ResultadoTentativaResponse'];
export type QuestaoCorrigida = Schemas['QuestaoCorrigidaResponse'];
export type Gabarito = Schemas['GabaritoResponse'];

export type DesempenhoAluno = Schemas['DesempenhoAlunoResponse'];
export type TemaDesempenho = Schemas['TemaDesempenho'];
export type ResultadosAtividade = Schemas['ResultadosAtividadeResponse'];
export type ResultadoAluno = Schemas['ResultadoAluno'];

export type Sinalizacao = Schemas['SinalizacaoResponse'];
export type Convite = Schemas['ConviteResponse'] & {
  invalidado?: boolean;
  invalidadoEm?: string | null;
};
export type ConviteCriado = Schemas['ConviteCriadoResponse'];
export type ProfessorPendente = Schemas['ProfessorPendenteResponse'];