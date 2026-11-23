# estuda-enade-gui

Frontend do **Estuda ENADE**: interface do aluno (app iOS/Android e versão web para desktop) e portal web do professor.
O backend fica no repositório irmão [`estuda-enade-api`](../estuda-enade-api); o contrato da API (OpenAPI) está em `estuda-enade-api/src/main/resources/static/openapi/estuda-enade-api.json` e pode ser visto no Swagger UI (`/swagger-ui.html`).

Os documentos de concepção e o protótipo de baixa fidelidade ficam fora deste repositório, na pasta do projeto:

```
../documentacao/requisitos/   visão e requisitos do sistema
../documentacao/produto/      mapas de jornada e canvas do MVP
../prototipos/baixa-fidelidade/index.html   protótipo (abrir no navegador)
```

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173 (o Vite repassa /api para a API em localhost:8080)
npm run build        # checagem de tipos + build de produção
npm run codegen:api  # regenera src/api/types.ts a partir do contrato da API (rode após mudar o contrato)
```

Configuração opcional em `.env` (veja [`.env.example`](.env.example)).

## Acesso

Telas públicas: `/login` (e-mail e senha), `/cadastro` (aluno ou professor), `/esqueci-senha` (código por e-mail e nova senha). Quem já tem sessão vai direto para a própria área. Na área logada, o botão com ícone de chave cria ou troca a senha.

Para testar com os dados de exemplo da API: `ana@estudaenade.dev` (aluna) ou `professor@estudaenade.dev`, com a senha `123456`. Com a API em `OTP_PROVIDER=log` (padrão), o código do "esqueci a senha" aparece no log da API.

**Login com Google: adiado.** O código está pronto (botão e `/cadastro/google`), mas fica desligado enquanto `VITE_GOOGLE_CLIENT_ID` não estiver definido. Para ativar:
1. Crie um client ID OAuth do tipo "Aplicativo da Web" no Google Cloud Console (gratuito), com `http://localhost:5173` e as origens de produção em "Origens JavaScript autorizadas".
2. Defina `VITE_GOOGLE_CLIENT_ID` aqui e `GOOGLE_CLIENT_IDS` na API.

O Google não aceita `http://` em IP de rede local (`192.168.x.x`): pelo celular na rede local, o login com Google exige HTTPS ou um túnel.
