import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import type { Curso, Tema } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';
import { NovoItemCatalogo } from '@/components/ui/NovoItemCatalogo';
import { useToast } from '@/components/ui/Toast';
import { useConfirmacao } from '@/components/ui/Confirmacao';
import { adicionarOrdenado } from '@/lib/utils';
import { ArrowLeft, Check, Save } from 'lucide-react';

/** Primeira edição do ENADE no formato atual; o teto aceita a prova do ano seguinte. */
const ANO_MINIMO = 2004;
const ANO_MAXIMO = new Date().getFullYear() + 1;

export function ProfessorNovaQuestaoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirmar = useConfirmacao();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>('');
  const [temas, setTemas] = useState<Tema[]>([]);
  const [temaId, setTemaId] = useState<string>('');
  const [carregandoTemas, setCarregandoTemas] = useState(false);
  const [ano, setAno] = useState<string>('');

  const [enunciado, setEnunciado] = useState('');
  const [explicacao, setExplicacao] = useState('');
  const [alternativas, setAlternativas] = useState<string[]>([
    '', '', '', '', ''
  ]);
  const [indiceCorreta, setIndiceCorreta] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.catalogo
      .obterCursos()
      .then(setCursos)
      .catch((err) => console.error('Erro ao carregar cursos:', err));
  }, []);

  // Os temas pertencem ao curso: trocar o curso recarrega a lista e limpa o tema escolhido
  useEffect(() => {
    setTemaId('');
    setTemas([]);
    if (!cursoId) return;

    let ativo = true;
    setCarregandoTemas(true);
    api.catalogo
      .obterTemas(cursoId)
      .then((lista) => ativo && setTemas(lista))
      .catch((err) => console.error('Erro ao carregar temas:', err))
      .finally(() => ativo && setCarregandoTemas(false));
    return () => {
      ativo = false;
    };
  }, [cursoId]);

  function handleCursoCriado(curso: Curso) {
    setCursos((lista) => adicionarOrdenado(lista, curso));
    setCursoId(curso.id);
  }

  function handleTemaCriado(tema: Tema) {
    setTemas((lista) => adicionarOrdenado(lista, tema));
    setTemaId(tema.id);
  }

  function handleAlterarAlternativa(index: number, texto: string) {
    const novas = [...alternativas];
    novas[index] = texto;
    setAlternativas(novas);
  }

  async function handleSalvar(publicarApos = false) {
    if (!enunciado.trim()) {
      toast('Informe o enunciado da questão.');
      return;
    }
    if (alternativas.some((a) => !a.trim())) {
      toast('Preencha todas as 5 alternativas.');
      return;
    }
    if (!cursoId || !temaId) {
      toast('Selecione o curso e o tema da questão.');
      return;
    }
    const anoNumero = Number(ano);
    if (!Number.isInteger(anoNumero) || anoNumero < ANO_MINIMO || anoNumero > ANO_MAXIMO) {
      toast(`Informe o ano do exame entre ${ANO_MINIMO} e ${ANO_MAXIMO}.`);
      return;
    }

    if (
      publicarApos &&
      !(await confirmar({
        titulo: 'Salvar e publicar questão?',
        mensagem: 'A questão entra no banco institucional e na prática dos alunos, com gabarito e explicação. Confira a alternativa correta antes de publicar.',
        rotuloConfirmar: 'Publicar',
      }))
    ) {
      return;
    }

    setSalvando(true);
    try {
      const questao = await api.professor.criarQuestao({
        enunciado: enunciado.trim(),
        explicacao: explicacao.trim() || undefined,
        cursoId,
        temaId,
        ano: anoNumero,
        alternativas: alternativas.map((texto, idx) => ({
          texto: texto.trim(),
          correta: idx === indiceCorreta,
          ordem: idx + 1
        }))
      });

      if (publicarApos) {
        await api.professor.publicarQuestao(questao.id);
        toast('Questão salva e publicada com sucesso!');
      } else {
        toast('Questão salva como rascunho!');
      }

      navigate('/professor/questoes');
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao salvar questão.');
    } finally {
      setSalvando(false);
    }
  }

  const temAlgoPreenchido =
    !!enunciado.trim() || !!explicacao.trim() || alternativas.some((a) => a.trim());

  async function handleVoltar() {
    if (
      temAlgoPreenchido &&
      !(await confirmar({
        titulo: 'Descartar questão?',
        mensagem: 'O que você preencheu ainda não foi salvo e será perdido.',
        rotuloConfirmar: 'Descartar',
        rotuloCancelar: 'Continuar editando',
        perigo: true,
      }))
    ) {
      return;
    }
    navigate('/professor/questoes');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
        <button
          onClick={handleVoltar}
          className="text-xs font-bold text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para questões
        </button>
        <span className="text-xs font-bold text-ink">· Cadastro de Item</span>
      </div>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">
          Nova Questão
        </h1>
        <p className="text-xs lg:text-sm text-muted">
          Cadastre uma questão de múltipla escolha com gabarito e justificativa pedagógica.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Coluna Principal: Enunciado, Alternativas, Explicação */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="p-5 bg-paper flex flex-col gap-4">
            <Textarea
              label="Enunciado da questão"
              rows={4}
              placeholder="Digite o enunciado completo..."
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              required
            />

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Alternativas · Marque a alternativa correta (gabarito)
              </span>

              <div className="flex flex-col gap-2.5">
                {alternativas.map((texto, idx) => {
                  const letra = String.fromCharCode(65 + idx);
                  const correta = idx === indiceCorreta;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                        correta ? 'bg-green/20 border-green' : 'bg-paper border-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="alternativa-correta"
                        checked={correta}
                        onChange={() => setIndiceCorreta(idx)}
                        className="w-4 h-4 accent-orange cursor-pointer ml-1"
                        id={`correta-${idx}`}
                      />
                      <label
                        htmlFor={`correta-${idx}`}
                        className="w-6 h-6 rounded-lg border-2 border-ink bg-paper flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer"
                      >
                        {letra}
                      </label>
                      <input
                        type="text"
                        placeholder={`Texto da alternativa ${letra}...`}
                        value={texto}
                        onChange={(e) => handleAlterarAlternativa(idx, e.target.value)}
                        className="flex-1 bg-transparent border-0 text-xs font-medium text-ink focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Explicação pedagógica (justificativa do gabarito)"
              rows={3}
              placeholder="Explique por que a alternativa marcada é a correta..."
              value={explicacao}
              onChange={(e) => setExplicacao(e.target.value)}
            />
          </Card>
        </div>

        {/* Coluna Lateral: Classificação & Ações */}
        <Card color="yellow" className="p-5 flex flex-col gap-4">
          <h3 className="font-bold text-base font-title text-ink">
            Classificação da questão
          </h3>

          <Combobox
            label="Curso"
            placeholder="Selecione o curso"
            opcoes={cursos.map((c) => ({ valor: c.id, rotulo: c.nome }))}
            valor={cursoId}
            aoMudar={setCursoId}
          />
          <NovoItemCatalogo
            rotulo="Novo curso"
            placeholder="Nome do curso"
            criar={api.professor.criarCurso}
            onCriado={handleCursoCriado}
          />

          {cursoId ? (
            <>
              <Input
                label="Ano do Exame"
                type="number"
                inputMode="numeric"
                min={ANO_MINIMO}
                max={ANO_MAXIMO}
                step={1}
                placeholder={`Ex: ${ANO_MAXIMO - 1}`}
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />

              <Combobox
                label="Tema / Matéria"
                placeholder={carregandoTemas ? 'Carregando temas...' : 'Selecione o tema'}
                opcoes={temas.map((t) => ({ valor: t.id, rotulo: t.nome }))}
                valor={temaId}
                aoMudar={setTemaId}
                disabled={carregandoTemas}
                mensagemVazia="Nenhum tema neste curso. Crie um abaixo."
              />
              <NovoItemCatalogo
                key={cursoId}
                rotulo="Novo tema"
                placeholder="Nome do tema"
                criar={(nome) => api.professor.criarTema(cursoId, nome)}
                onCriado={handleTemaCriado}
              />
            </>
          ) : (
            <p className="text-xs text-muted">
              Escolha o curso para informar o ano e o tema.
            </p>
          )}

          <div className="flex flex-col gap-2 mt-2 pt-2 border-t-2 border-ink/20">
            <Button
              variant="secondary"
              size="md"
              fullWidth
              carregando={salvando}
              onClick={() => handleSalvar(false)}
            >
              <Save className="w-4 h-4" />
              Salvar como rascunho
            </Button>

            <Button
              variant="primary"
              size="md"
              fullWidth
              carregando={salvando}
              onClick={() => handleSalvar(true)}
            >
              <Check className="w-4 h-4" />
              Revisar e publicar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

