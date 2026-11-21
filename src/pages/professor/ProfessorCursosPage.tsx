import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import type { Curso } from '@/api/models';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { adicionarOrdenado } from '@/lib/utils';
import { GraduationCap, Plus } from 'lucide-react';

export function ProfessorCursosPage() {
  const { toast } = useToast();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [modalAberta, setModalAberta] = useState(false);
  const [nomeCurso, setNomeCurso] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    api.catalogo
      .obterCursos()
      .then(setCursos)
      .catch((err) => console.error('Erro ao carregar cursos:', err))
      .finally(() => setCarregando(false));
  }, []);

  function fecharModal() {
    setModalAberta(false);
    setNomeCurso('');
  }

  async function handleCriarCurso(e: React.FormEvent) {
    e.preventDefault();
    const nome = nomeCurso.trim();
    if (!nome) {
      toast('Informe o nome do curso.');
      return;
    }

    setCriando(true);
    try {
      const curso = await api.professor.criarCurso(nome);
      // A API devolve o curso existente quando o nome já está cadastrado
      const jaExistia = cursos.some((c) => c.id === curso.id);
      setCursos((lista) => adicionarOrdenado(lista, curso));
      toast(jaExistia ? `O curso "${curso.nome}" já estava cadastrado.` : 'Curso criado com sucesso!');
      fecharModal();
    } catch (err: any) {
      toast(err.mensagem || 'Erro ao criar curso.');
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-title text-ink">Cursos</h1>
          <p className="text-xs lg:text-sm text-muted">
            Cadastre os cursos que serão usados nas turmas e no banco de questões.
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalAberta(true)}>
          <Plus className="w-4 h-4" />
          Novo curso
        </Button>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Cursos cadastrados
          </span>
          <span className="text-xs font-bold text-muted">{cursos.length}</span>
        </div>

        {!carregando && cursos.length === 0 ? (
          <Card className="p-4 text-center bg-paper">
            <p className="text-xs font-bold text-muted">
              Nenhum curso cadastrado. Crie o primeiro para poder abrir turmas.
            </p>
          </Card>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {cursos.map((c) => (
              <Card key={c.id} className="p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue border-2 border-ink flex items-center justify-center flex-none shadow-brutal-sm">
                  <GraduationCap className="w-5 h-5 text-ink" />
                </div>
                <span className="font-bold text-sm text-ink truncate">{c.nome}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal aberto={modalAberta} aoFechar={fecharModal} titulo="Novo Curso">
        <form onSubmit={handleCriarCurso} className="flex flex-col gap-4">
          <Input
            label="Nome do curso"
            placeholder="Ex: Análise e Desenvolvimento de Sistemas"
            value={nomeCurso}
            onChange={(e) => setNomeCurso(e.target.value)}
            required
            autoFocus
          />

          <div className="flex justify-end gap-2 pt-2 border-t-2 border-ink/20">
            <Button type="button" variant="ghost" onClick={fecharModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" carregando={criando}>
              Criar curso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
