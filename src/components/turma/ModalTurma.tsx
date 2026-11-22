import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/api/client';
import type { Curso, Turma } from '@/api/models';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';
import { useToast } from '@/components/ui/Toast';

const PERIODO_PADRAO = '2026.2';

export interface ModalTurmaProps {
  aberto: boolean;
  aoFechar: () => void;
  /** Turma a editar. Sem ela, o modal cria uma turma nova. */
  turma?: Turma | null;
  /** Chamado com a turma criada ou atualizada, depois do sucesso. */
  aoSalvar: (turma: Turma) => void;
}

/** Modal único para criar e editar turma. Usado na barra lateral e no módulo de turmas. */
export function ModalTurma({ aberto, aoFechar, turma, aoSalvar }: ModalTurmaProps) {
  const { toast } = useToast();
  const editando = !!turma;

  const [nome, setNome] = useState('');
  const [periodo, setPeriodo] = useState(PERIODO_PADRAO);
  const [cursoId, setCursoId] = useState('');
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(turma?.nome ?? '');
    setPeriodo(turma ? turma.periodo ?? '' : PERIODO_PADRAO);
    setCursoId(turma?.curso?.id ?? '');

    api.catalogo
      .obterCursos()
      .then((lista) => {
        setCursos(lista);
        if (!turma?.curso && lista.length > 0) setCursoId(lista[0].id);
      })
      .catch((err) => console.error('Erro ao carregar cursos:', err));
  }, [aberto, turma]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !cursoId) {
      toast('Informe o nome da turma e selecione o curso.');
      return;
    }

    const payload = { nome: nome.trim(), periodo: periodo.trim() || undefined, cursoId };
    setSalvando(true);
    try {
      const salva = turma
        ? await api.professor.atualizarTurma(turma.id, payload)
        : await api.professor.criarTurma(payload);
      toast(editando ? 'Turma atualizada.' : 'Turma criada com sucesso!');
      aoSalvar(salva);
      aoFechar();
    } catch (err: any) {
      toast(err.mensagem || (editando ? 'Erro ao salvar a turma.' : 'Erro ao criar turma.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={editando ? 'Editar Turma' : 'Criar Nova Turma'}>
      <form onSubmit={handleSalvar} className="flex flex-col gap-4">
        <Input
          label="Nome da Turma"
          placeholder="Ex: ADS — Turma B"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={120}
          required
          autoFocus
        />

        <Input
          label="Período / Semestre"
          placeholder="Ex: 2026.2"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          maxLength={20}
        />

        <Combobox
          label="Curso"
          opcoes={cursos.map((c) => ({ valor: c.id, rotulo: c.nome }))}
          valor={cursoId}
          aoMudar={setCursoId}
          required
        />
        <p className="text-xs text-muted -mt-2">
          {cursos.length === 0 ? 'Nenhum curso cadastrado. ' : 'Não encontrou o curso? '}
          <Link
            to="/professor/cursos"
            onClick={aoFechar}
            className="font-bold text-ink underline hover:text-orange"
          >
            {cursos.length === 0 ? 'Cadastre um curso' : 'Gerencie em Cursos'}
          </Link>
          {cursos.length === 0 ? ' antes de criar a turma.' : '.'}
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t-2 border-ink/20">
          <Button type="button" variant="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" carregando={salvando}>
            {editando ? 'Salvar alterações' : 'Criar turma'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
