import type {
  Comentario,
  Mural,
  Usuario,
  Sessao,
  Turma,
  TurmaDetalhe,
  TurmaAluno,
  DesempenhoAlunoTurma,
  PainelProfessor,
  Questao,
  PaginaQuestao,
  PaginaQuestaoAluno,
  StatusQuestao,
  Atividade,
  AtividadeDetalhe,
  AtividadeAluno,
  TentativaEstado,
  TentativaResumo,
  ResultadoTentativa,
  DesempenhoAluno,
  Gabarito,
  ContagemTema,
  HistoricoPratica,
  ProvaPessoal,
  ProvaPessoalResumo,
  QuestaoAluno,
  ResultadosAtividade,
  Sinalizacao,
  Convite,
  ConviteCriado,
  ProfessorPendente,
  Curso,
  Tema,
  UnidadeTempo,
  AtividadeRequest,
  Erro,
  CadastrarRequest,
  EntrarRequest,
  GoogleCadastrarRequest,
  RedefinirSenhaRequest,
  TrocarSenhaRequest
} from './models';

const API_BASE = '/api/v1';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'estuda_enade_access_token',
  REFRESH_TOKEN: 'estuda_enade_refresh_token',
  USUARIO: 'estuda_enade_usuario'
};

export class ApiException extends Error {
  constructor(
    public status: number,
    public codigo: string,
    public mensagem: string,
    public campos?: Record<string, string> | null
  ) {
    super(mensagem);
    this.name = 'ApiException';
  }
}

// Helpers de armazenamento de sessão
export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  getUsuario(): Usuario | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USUARIO);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Usuario;
    } catch {
      return null;
    }
  },
  salvarSessao(sessao: Sessao): void {
    if (sessao.accessToken) localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, sessao.accessToken);
    if (sessao.refreshToken) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, sessao.refreshToken);
    if (sessao.usuario) localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(sessao.usuario));
    window.dispatchEvent(new Event('estuda-enade-auth-change'));
  },
  atualizarUsuario(usuario: Usuario): void {
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
    window.dispatchEvent(new Event('estuda-enade-auth-change'));
  },
  limpar(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USUARIO);
    window.dispatchEvent(new Event('estuda-enade-auth-change'));
  }
};

let renovandoPromise: Promise<string | null> | null = null;

async function renovarToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.limpar();
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/renovar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      tokenStorage.limpar();
      return null;
    }

    const sessao: Sessao = await res.json();
    tokenStorage.salvarSessao(sessao);
    return sessao.accessToken ?? null;
  } catch {
    tokenStorage.limpar();
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // Auto token refresh on 401
  if (response.status === 401 && !path.startsWith('/auth/')) {
    if (!renovandoPromise) {
      renovandoPromise = renovarToken().finally(() => {
        renovandoPromise = null;
      });
    }

    const novoToken = await renovandoPromise;
    if (novoToken) {
      headers.set('Authorization', `Bearer ${novoToken}`);
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    let erro: Erro;
    try {
      erro = await response.json();
    } catch {
      erro = {
        codigo: 'ERRO_DESCONHECIDO',
        mensagem: `Erro na requisição HTTP ${response.status}`
      };
    }
    throw new ApiException(response.status, erro.codigo, erro.mensagem, erro.campos as any);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // ===================== AUTH =====================
  auth: {
    cadastrar(payload: CadastrarRequest): Promise<Sessao> {
      return request<Sessao>('/auth/cadastrar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    entrar(payload: EntrarRequest): Promise<Sessao> {
      return request<Sessao>('/auth/entrar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    entrarComGoogle(idToken: string): Promise<Sessao> {
      return request<Sessao>('/auth/google/entrar', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });
    },

    cadastrarComGoogle(payload: GoogleCadastrarRequest): Promise<Sessao> {
      return request<Sessao>('/auth/google/cadastrar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    solicitarCodigoSenha(email: string): Promise<void> {
      return request<void>('/auth/senha/codigo', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
    },

    redefinirSenha(payload: RedefinirSenhaRequest): Promise<void> {
      return request<void>('/auth/senha/redefinir', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    solicitarCodigoTrocaSenha(): Promise<void> {
      return request<void>('/eu/senha/codigo', { method: 'POST' });
    },

    /** Código errado vem como 422, não 401, para não disparar a renovação automática. */
    trocarSenha(payload: TrocarSenhaRequest): Promise<Sessao> {
      return request<Sessao>('/eu/senha', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    renovar(refreshToken: string): Promise<Sessao> {
      return request<Sessao>('/auth/renovar', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    },

    async sair(): Promise<void> {
      const refreshToken = tokenStorage.getRefreshToken();
      try {
        if (refreshToken) {
          await request<void>('/auth/sair', {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
          });
        }
      } catch {
        // Falha ao revogar no servidor não impede sair: a sessão local é limpa do mesmo jeito.
      } finally {
        tokenStorage.limpar();
      }
    },

    obterEu(): Promise<Usuario> {
      return request<Usuario>('/eu');
    },

    atualizarEu(nome: string): Promise<Usuario> {
      return request<Usuario>('/eu', {
        method: 'PUT',
        body: JSON.stringify({ nome })
      });
    }
  },

  // ===================== CATÁLOGO =====================
  catalogo: {
    obterCursos(): Promise<Curso[]> {
      return request<Curso[]>('/cursos');
    },

    /** Cada tema pertence a um curso. Sem `cursoId`, vêm os temas de todos os cursos. */
    obterTemas(cursoId?: string): Promise<Tema[]> {
      return request<Tema[]>(cursoId ? `/temas?cursoId=${encodeURIComponent(cursoId)}` : '/temas');
    },

    /** Unidades da duração de uma atividade: Minutos (`min`) e Horas (`h`), nesta ordem. */
    obterUnidadesTempo(): Promise<UnidadeTempo[]> {
      return request<UnidadeTempo[]>('/unidades-tempo');
    }
  },

  // ===================== ALUNO =====================
  aluno: {
    obterTurmas(): Promise<TurmaAluno[]> {
      return request<TurmaAluno[]>('/aluno/turmas');
    },

    entrarTurma(codigo: string): Promise<TurmaAluno> {
      return request<TurmaAluno>('/aluno/turmas/entrar', {
        method: 'POST',
        body: JSON.stringify({ codigo })
      });
    },

    sairDaTurma(turmaId: string): Promise<void> {
      return request<void>(`/aluno/turmas/${turmaId}`, {
        method: 'DELETE'
      });
    },

    obterAtividades(): Promise<AtividadeAluno[]> {
      return request<AtividadeAluno[]>('/aluno/atividades');
    },

    obterAtividadeDetalhe(atividadeId: string): Promise<AtividadeAluno> {
      return request<AtividadeAluno>(`/aluno/atividades/${atividadeId}`);
    },

    iniciarTentativa(atividadeId: string): Promise<TentativaEstado> {
      return request<TentativaEstado>(`/aluno/atividades/${atividadeId}/tentativas`, {
        method: 'POST'
      });
    },

    obterTentativa(tentativaId: string): Promise<TentativaEstado> {
      return request<TentativaEstado>(`/aluno/tentativas/${tentativaId}`);
    },

    salvarResposta(tentativaId: string, questaoId: string, alternativaId: string): Promise<void> {
      return request<void>(`/aluno/tentativas/${tentativaId}/respostas/${questaoId}`, {
        method: 'PUT',
        body: JSON.stringify({ alternativaId })
      });
    },

    enviarTentativa(tentativaId: string): Promise<ResultadoTentativa> {
      return request<ResultadoTentativa>(`/aluno/tentativas/${tentativaId}/enviar`, {
        method: 'POST'
      });
    },

    obterResultadoTentativa(tentativaId: string): Promise<ResultadoTentativa> {
      return request<ResultadoTentativa>(`/aluno/tentativas/${tentativaId}/resultado`);
    },

    obterHistoricoTentativas(): Promise<TentativaResumo[]> {
      return request<TentativaResumo[]>('/aluno/tentativas');
    },

    // Mural de comentários da atividade
    obterMural(atividadeId: string): Promise<Mural> {
      return request<Mural>(`/aluno/atividades/${atividadeId}/comentarios`);
    },

    comentar(atividadeId: string, texto: string): Promise<Comentario> {
      return request<Comentario>(`/aluno/atividades/${atividadeId}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ texto })
      });
    },

    editarComentario(comentarioId: string, texto: string): Promise<Comentario> {
      return request<Comentario>(`/aluno/comentarios/${comentarioId}`, {
        method: 'PUT',
        body: JSON.stringify({ texto })
      });
    },

    apagarComentario(comentarioId: string): Promise<void> {
      return request<void>(`/aluno/comentarios/${comentarioId}`, {
        method: 'DELETE'
      });
    },

    obterAnosPratica(cursoId?: string): Promise<number[]> {
      return request<number[]>(cursoId ? `/aluno/pratica/anos?cursoId=${encodeURIComponent(cursoId)}` : '/aluno/pratica/anos');
    },

    obterQuestoesPratica(params?: {
      cursoId?: string;
      /** Vários temas: a API recebe `temaId` repetido. */
      temaIds?: string[];
      /** Vários anos: a API recebe `ano` repetido. */
      anos?: number[];
      historico?: HistoricoPratica;
      busca?: string;
      pagina?: number;
      tamanho?: number;
    }): Promise<PaginaQuestaoAluno> {
      const sp = new URLSearchParams();
      if (params?.cursoId) sp.set('cursoId', params.cursoId);
      params?.temaIds?.forEach((t) => sp.append('temaId', t));
      params?.anos?.forEach((a) => sp.append('ano', String(a)));
      if (params?.historico && params.historico !== 'TODAS') sp.set('historico', params.historico);
      if (params?.busca) sp.set('busca', params.busca);
      if (params?.pagina !== undefined) sp.set('pagina', String(params.pagina));
      if (params?.tamanho !== undefined) sp.set('tamanho', String(params.tamanho));
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return request<PaginaQuestaoAluno>(`/aluno/pratica/questoes${qs}`);
    },

    /** Quantas questões há em cada tema do curso (só temas com questão), com o desempenho do aluno no tema. */
    obterContagemPratica(cursoId: string, anos: number[] = [], historico: HistoricoPratica = 'TODAS'): Promise<ContagemTema[]> {
      const sp = new URLSearchParams({ cursoId });
      anos.forEach((a) => sp.append('ano', String(a)));
      if (historico !== 'TODAS') sp.set('historico', historico);
      return request<ContagemTema[]>(`/aluno/pratica/contagem?${sp.toString()}`);
    },

    /** Sorteia questões para a prova do aluno, sem repetir as de `excluirIds`. */
    sortearPratica(params: {
      cursoId: string;
      temaIds: string[];
      anos: number[];
      historico?: HistoricoPratica;
      /** Reparte a quantidade igualmente entre os temas (Simulado ENADE). */
      equilibrar?: boolean;
      quantidade: number;
      excluirIds: string[];
    }): Promise<QuestaoAluno[]> {
      return request<QuestaoAluno[]>('/aluno/pratica/sortear', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    },

    // ---------- provas montadas pelo aluno (só dele, fora da turma) ----------

    listarProvas(): Promise<ProvaPessoalResumo[]> {
      return request<ProvaPessoalResumo[]>('/aluno/provas');
    },

    criarProva(questaoIds: string[], nome?: string): Promise<ProvaPessoal> {
      return request<ProvaPessoal>('/aluno/provas', {
        method: 'POST',
        body: JSON.stringify({ questaoIds, nome: nome || null })
      });
    },

    obterProva(provaId: string): Promise<ProvaPessoal> {
      return request<ProvaPessoal>(`/aluno/provas/${provaId}`);
    },

    excluirProva(provaId: string): Promise<void> {
      return request<void>(`/aluno/provas/${provaId}`, { method: 'DELETE' });
    },

    responderNaProva(provaId: string, questaoId: string, alternativaId: string): Promise<Gabarito> {
      return request<Gabarito>(`/aluno/provas/${provaId}/questoes/${questaoId}/responder`, {
        method: 'POST',
        body: JSON.stringify({ alternativaId })
      });
    },

    concluirProva(provaId: string): Promise<ProvaPessoal> {
      return request<ProvaPessoal>(`/aluno/provas/${provaId}/concluir`, { method: 'POST' });
    },

    refazerProva(provaId: string): Promise<ProvaPessoal> {
      return request<ProvaPessoal>(`/aluno/provas/${provaId}/refazer`, { method: 'POST' });
    },

    provaComErradas(provaId: string): Promise<ProvaPessoal> {
      return request<ProvaPessoal>(`/aluno/provas/${provaId}/erradas`, { method: 'POST' });
    },

    responderPratica(questaoId: string, alternativaId: string): Promise<Gabarito> {
      return request<Gabarito>(`/aluno/pratica/questoes/${questaoId}/responder`, {
        method: 'POST',
        body: JSON.stringify({ alternativaId })
      });
    },

    sinalizarQuestao(questaoId: string, motivo: string): Promise<void> {
      return request<void>(`/aluno/questoes/${questaoId}/sinalizacoes`, {
        method: 'POST',
        body: JSON.stringify({ motivo })
      });
    },

    obterDesempenho(): Promise<DesempenhoAluno> {
      return request<DesempenhoAluno>('/aluno/desempenho');
    }
  },

  // ===================== PROFESSOR =====================
  professor: {
    /** Cria o curso. Se já existir um com o mesmo nome, a API devolve o existente. */
    criarCurso(nome: string): Promise<Curso> {
      return request<Curso>('/professor/cursos', {
        method: 'POST',
        body: JSON.stringify({ nome })
      });
    },

    /** Cria o tema no curso. Se já existir um com o mesmo nome nesse curso, a API devolve o existente. */
    criarTema(cursoId: string, nome: string): Promise<Tema> {
      return request<Tema>('/professor/temas', {
        method: 'POST',
        body: JSON.stringify({ nome, cursoId })
      });
    },

    /** Painel inicial: todas as turmas ativas ou, com `turmaId`, só essa turma (404 se arquivada ou de outro professor). */
    obterPainel(turmaId?: string): Promise<PainelProfessor> {
      const query = turmaId ? `?turmaId=${encodeURIComponent(turmaId)}` : '';
      return request<PainelProfessor>(`/professor/painel${query}`);
    },

    /** Só as turmas ativas, a menos que `incluirArquivadas` seja verdadeiro. */
    obterTurmas(opcoes?: { incluirArquivadas?: boolean }): Promise<Turma[]> {
      const query = opcoes?.incluirArquivadas ? '?incluirArquivadas=true' : '';
      return request<Turma[]>(`/professor/turmas${query}`);
    },

    criarTurma(payload: { nome: string; periodo?: string; cursoId: string }): Promise<Turma> {
      return request<Turma>('/professor/turmas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    obterTurma(turmaId: string): Promise<TurmaDetalhe> {
      return request<TurmaDetalhe>(`/professor/turmas/${turmaId}`);
    },

    atualizarTurma(
      turmaId: string,
      payload: { nome: string; periodo?: string; cursoId: string }
    ): Promise<Turma> {
      return request<Turma>(`/professor/turmas/${turmaId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    gerarNovoConviteTurma(turmaId: string): Promise<Turma> {
      return request<Turma>(`/professor/turmas/${turmaId}/convite`, {
        method: 'POST'
      });
    },

    arquivarTurma(turmaId: string): Promise<Turma> {
      return request<Turma>(`/professor/turmas/${turmaId}/arquivar`, {
        method: 'POST'
      });
    },

    reativarTurma(turmaId: string): Promise<Turma> {
      return request<Turma>(`/professor/turmas/${turmaId}/reativar`, {
        method: 'POST'
      });
    },

    removerAlunoTurma(turmaId: string, alunoId: string): Promise<void> {
      return request<void>(`/professor/turmas/${turmaId}/alunos/${alunoId}`, {
        method: 'DELETE'
      });
    },

    obterDesempenhoAluno(turmaId: string, alunoId: string): Promise<DesempenhoAlunoTurma> {
      return request<DesempenhoAlunoTurma>(
        `/professor/turmas/${turmaId}/alunos/${alunoId}/desempenho`
      );
    },

    obterAtividadesTurma(turmaId: string): Promise<Atividade[]> {
      return request<Atividade[]>(`/professor/turmas/${turmaId}/atividades`);
    },

    criarAtividadeTurma(turmaId: string, payload: AtividadeRequest): Promise<Atividade> {
      return request<Atividade>(`/professor/turmas/${turmaId}/atividades`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    obterAtividade(atividadeId: string): Promise<AtividadeDetalhe> {
      return request<AtividadeDetalhe>(`/professor/atividades/${atividadeId}`);
    },

    atualizarAtividade(atividadeId: string, payload: AtividadeRequest): Promise<Atividade> {
      return request<Atividade>(`/professor/atividades/${atividadeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    excluirAtividade(atividadeId: string): Promise<void> {
      return request<void>(`/professor/atividades/${atividadeId}`, {
        method: 'DELETE'
      });
    },

    publicarAtividade(atividadeId: string): Promise<Atividade> {
      return request<Atividade>(`/professor/atividades/${atividadeId}/publicar`, {
        method: 'POST'
      });
    },

    encerrarAtividade(atividadeId: string): Promise<Atividade> {
      return request<Atividade>(`/professor/atividades/${atividadeId}/encerrar`, {
        method: 'POST'
      });
    },

    obterResultadosAtividade(atividadeId: string): Promise<ResultadosAtividade> {
      return request<ResultadosAtividade>(`/professor/atividades/${atividadeId}/resultados`);
    },

    // Mural de comentários da atividade
    obterMural(atividadeId: string): Promise<Mural> {
      return request<Mural>(`/professor/atividades/${atividadeId}/comentarios`);
    },

    comentar(atividadeId: string, texto: string): Promise<Comentario> {
      return request<Comentario>(`/professor/atividades/${atividadeId}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ texto })
      });
    },

    editarComentario(comentarioId: string, texto: string): Promise<Comentario> {
      return request<Comentario>(`/professor/comentarios/${comentarioId}`, {
        method: 'PUT',
        body: JSON.stringify({ texto })
      });
    },

    apagarComentario(comentarioId: string): Promise<void> {
      return request<void>(`/professor/comentarios/${comentarioId}`, {
        method: 'DELETE'
      });
    },

    obterQuestoes(params?: {
      cursoId?: string;
      temaId?: string;
      ano?: number;
      busca?: string;
      apenasMinhas?: boolean;
      status?: StatusQuestao;
      apenasSinalizadas?: boolean;
      pagina?: number;
      tamanho?: number;
    }): Promise<PaginaQuestao> {
      const sp = new URLSearchParams();
      if (params?.cursoId) sp.set('cursoId', params.cursoId);
      if (params?.temaId) sp.set('temaId', params.temaId);
      if (params?.ano) sp.set('ano', String(params.ano));
      if (params?.busca) sp.set('busca', params.busca);
      // A API chama os parâmetros de `minhas` e `sinalizadas`
      if (params?.apenasMinhas) sp.set('minhas', 'true');
      if (params?.apenasSinalizadas) sp.set('sinalizadas', 'true');
      if (params?.status) sp.set('status', params.status);
      if (params?.pagina !== undefined) sp.set('pagina', String(params.pagina));
      if (params?.tamanho !== undefined) sp.set('tamanho', String(params.tamanho));
      const qs = sp.toString() ? `?${sp.toString()}` : '';
      return request<PaginaQuestao>(`/professor/questoes${qs}`);
    },

    /** Anos das questões que o professor vê no banco, do mais recente ao mais antigo. */
    obterAnosBanco(cursoId?: string): Promise<number[]> {
      return request<number[]>(cursoId ? `/professor/questoes/anos?cursoId=${encodeURIComponent(cursoId)}` : '/professor/questoes/anos');
    },

    criarQuestao(payload: {
      enunciado: string;
      explicacao?: string;
      cursoId: string;
      temaId: string;
      ano: number;
      alternativas: { texto: string; correta: boolean; ordem: number }[];
    }): Promise<Questao> {
      return request<Questao>('/professor/questoes', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    obterQuestao(questaoId: string): Promise<Questao> {
      return request<Questao>(`/professor/questoes/${questaoId}`);
    },

    atualizarQuestao(
      questaoId: string,
      payload: {
        enunciado: string;
        explicacao?: string;
        cursoId: string;
        temaId: string;
        ano: number;
        alternativas: { texto: string; correta: boolean; ordem: number }[];
      }
    ): Promise<Questao> {
      return request<Questao>(`/professor/questoes/${questaoId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },

    publicarQuestao(questaoId: string): Promise<Questao> {
      return request<Questao>(`/professor/questoes/${questaoId}/publicar`, {
        method: 'POST'
      });
    },

    ocultarQuestao(questaoId: string): Promise<Questao> {
      return request<Questao>(`/professor/questoes/${questaoId}/ocultar`, {
        method: 'POST'
      });
    },

    excluirQuestao(questaoId: string): Promise<void> {
      return request<void>(`/professor/questoes/${questaoId}`, {
        method: 'DELETE'
      });
    },

    obterSinalizacoesQuestao(questaoId: string): Promise<Sinalizacao[]> {
      return request<Sinalizacao[]>(`/professor/questoes/${questaoId}/sinalizacoes`);
    },

    sinalizarQuestao(questaoId: string, motivo: string): Promise<void> {
      return request<void>(`/professor/questoes/${questaoId}/sinalizacoes`, {
        method: 'POST',
        body: JSON.stringify({ motivo })
      });
    },

    resolverSinalizacoes(questaoId: string): Promise<void> {
      return request<void>(`/professor/questoes/${questaoId}/sinalizacoes/resolver`, {
        method: 'POST'
      });
    },

    obterConvites(): Promise<Convite[]> {
      return request<Convite[]>('/professor/convites');
    },

    criarConvite(): Promise<ConviteCriado> {
      return request<ConviteCriado>('/professor/convites', {
        method: 'POST'
      });
    },
invalidarConvite(conviteId: string): Promise<Convite> {
      return request<Convite>(`/professor/convites/${conviteId}/invalidar`, {
        method: 'POST'
      });
    },
    obterProfessoresPendentes(): Promise<ProfessorPendente[]> {
      return request<ProfessorPendente[]>('/professor/professores/pendentes');
    },

    aprovarProfessor(professorId: string): Promise<void> {
      return request<void>(`/professor/professores/${professorId}/aprovar`, {
        method: 'POST'
      });
    }
  }
};
