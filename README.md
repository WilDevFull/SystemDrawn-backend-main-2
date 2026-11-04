# SystemDrawn API Backend

API Backend do projeto **SystemDrawn**, desenvolvida em **Node.js + Express.js**, com banco de dados **PostgreSQL hospedado no NeonDB** e autenticação baseada em **JWT**.

## Integrantes da Equipe

| Nome | RA |
|------|----|
| Alyson Rafael Reis Arruda de Lima | 00000853753 |
| Helleson Allan Borges de Sant'Ana | 00000855659 |
| João Victor Oliveira da Silva | 00000855670 |
| Matheus Soares de Lima | 00000855273 |
| Saíra Aguiar Rocha | 00000851069 |
| Thiago Carvalho de Castro | 00000014830 |
| Wilson Pereira de Lima | 00000855225 |

> **Observação:** Alyson Rafael Reis Arruda de Lima participa apenas da disciplina de **PI4**.

---

## Tecnologias Utilizadas

- **Node.js**
- **Express.js**
- **PostgreSQL**
- **NeonDB**
- **JWT Authentication**
- **Vercel**
- **Thunder Client / Postman**
- **Jest** (testes automáticos)
- **Hugging Face** (IA usada pelos *Spaces*: **ControlNet** na simulação com desenho e **FLUX.1-schnell** na simulação por texto)
- **@gradio/client** (conexão do backend com os Spaces do Hugging Face)
- **@huggingface/inference** (usado só pelo script que gera as fotos base dos membros)
- **sharp** (tratamento das imagens)
- **helmet**, **cors** e **express-rate-limit** (segurança e limite de pedidos)

---

## Funcionalidades Implementadas

### Autenticação
- Cadastro de usuário
- Login com CPF (o cliente entra só com o CPF, sem senha)
- Verificação de CPF
- Retorno de usuário autenticado
- Autenticação JWT
- Login de administrador com CPF e senha
- reCAPTCHA v2 no login do cliente e do administrador e no cadastro

### Agendamento de Tatuagem
- Criar agendamento
- Listar agendamentos
- Buscar por ID
- Atualizar agendamento
- Excluir agendamento
- Histórico e próximos agendamentos
- Conferência dos dados antes de gravar (veja [Regras dos Agendamentos](#regras-dos-agendamentos))

### Agendamento de Piercing
- Criar agendamento
- Listar agendamentos
- Buscar por ID
- Atualizar agendamento
- Excluir agendamento
- Histórico e próximos agendamentos
- Conferência dos dados antes de gravar 

### Tipos de Piercing
- Listagem dos tipos de piercing disponíveis
- Busca por ID
- Cadastro, atualização e exclusão de tipos

### Joias de Piercing
- Listagem de joias
- Busca por ID
- Relacionamento com tipos de piercing (listagem das joias de um tipo)
- Cadastro, atualização e exclusão de joias

### Estilos de Tatuagem
- Listagem dos estilos
- Busca por ID
- Cadastro, atualização e exclusão de estilos

### Notificações
- Lista das notificações do cliente logado
- Lista só das não lidas e contador de não lidas
- Marcar uma notificação, ou todas, como lidas
- Excluir uma notificação

### Simulação de Tatuagem com IA
- O cliente envia o desenho da tatuagem que deseja
- Ou, se não tiver o desenho, descreve a tatuagem em texto
- O cliente escolhe o membro do corpo: Braço, Perna, Costas, Peito, Pescoço ou Mão
- A IA devolve uma foto realista desse membro já com a tatuagem
- Explicação completa na seção [Simulação de Tatuagem com IA](#simulação-de-tatuagem-com-ia)

### Área do Administrador
- Login do administrador com CPF e senha
- Agenda do dia com tatuagens e piercings
- Lista de pedidos pendentes
- Aprovar ou recusar pedidos, com aviso ao cliente


---

## Estrutura do Projeto

```text
SYSTEMDRAWN-BACKEND
├── .github
│   └── workflows
│       └── sonar.yml            (análise do código no SonarCloud)
├── scripts
│   ├── definir-admin.js         (define o administrador e a senha)
│   └── gerar-bases-membros.js   (gera as fotos base dos membros)
├── src
│   ├── assets
│   │   └── membros              (fotos base: braco.png, perna.png...)
│   ├── config
│   ├── controllers
│   ├── database
│   ├── errors
│   ├── middlewares
│   ├── repositories
│   ├── routes
│   ├── services
│   ├── utils
│   ├── validations
│   ├── app.js                   (a API; usado pelo npm start, npm run dev e Vercel)
│   └── index.js                 (outra forma de iniciar, sempre na porta 3000)
├── tests                        (testes automáticos com Jest)
├── .babelrc                     (configuração do Babel usada pelo Jest)
├── .env.example
├── package.json
├── sonar-project.properties     (configuração do SonarCloud)
├── vercel.json
└── README.md
```

---

## Execução Local

### Pré-requisitos

- **Node.js 18 ou mais novo** (é o que o `package.json` pede no campo `engines`)

### Instalar dependências

```bash
npm install
```

### Configurar variáveis de ambiente

Criar um arquivo `.env` com:

```env
HUGGINGFACE_API_KEY=seu_token_do_hugging_face
RECAPTCHA_SECRET_KEY=sua_chave_secreta_do_recaptcha
DATABASE_URL=postgresql://usuario:senha@host/database?sslmode=require
JWT_SECRET=jwt_minimo_32_chars
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

> O `HUGGINGFACE_API_KEY` é o token da conta do Hugging Face, criado em **huggingface.co → Settings → Access Tokens**. Ele é usado só pela simulação de tatuagem. Nunca envie esse token para o GitHub nem compartilhe com outras pessoas.

> O `RECAPTCHA_SECRET_KEY` é a **chave secreta** do reCAPTCHA v2, criada junto com a chave do site no painel do Google reCAPTCHA. A API usa essa chave para conferir com o Google o comprovante que o site manda no login e no cadastro. Ela também precisa ser cadastrada no Vercel, em **Settings → Environment Variables**. Nunca envie essa chave para o GitHub nem compartilhe com outras pessoas.

### Preparar o banco de dados

Na primeira vez, e sempre que o projeto ganhar uma tabela ou coluna nova, rode:

```bash
npm run migrate
```

Esse comando cria só o que ainda falta no banco que está no `DATABASE_URL`. Ele pode ser rodado mais de uma vez sem apagar nada.

Ele cuida da tabela `usuarios` (com as colunas `perfil` e `senha_hash`), da tabela `agendamentos_tatuagem` e da regra de status da tabela `agendamentos_piercing`. As outras tabelas que a API usa (`agendamentos_piercing`, `tipos_piercing`, `joias_piercing`, `estilos_tatuagem` e `notificacoes`) **não são criadas por esse comando** e precisam já existir no banco. Veja [Banco de Dados](#banco-de-dados).

### Executar projeto

```bash
npm run dev
```

Servidor local:

```text
http://localhost:3000
```

O `npm run dev` reinicia sozinho quando um arquivo muda (usa o `nodemon`). Para rodar sem isso, como em produção, use:

```bash
npm start
```

### Rodar os testes automáticos

```bash
npm test
```

Os testes usam dados de mentira, então não precisam do banco nem da internet. No fim aparece quantos passaram, por exemplo `Tests: 96 passed, 96 total`.

---

## Health Check

Endpoint utilizado para verificar se a API está online:

```http
GET /health
```

Resposta esperada:

```json
{
  "success": true,
  "message": "SystemDrawn API está online.",
  "env": "development"
}
```

O campo `env` mostra o valor do `NODE_ENV` (no Vercel, `production`).

---

## Rotas da API

| Método | Rota | Login | O que faz |
|--------|------|-------|-----------|
| `GET` | `/health` | Não | Confere se a API está no ar |
| `POST` | `/auth/check-cpf` | Não | Confere se o `cpf` já tem cadastro |
| `POST` | `/auth/register` | Não | Cadastra o cliente com `cpf`, `nomeCompleto` e `recaptchaToken`. Devolve o `token` e o `usuario` |
| `POST` | `/auth/login` | Não | Login do cliente só com o `cpf` e o `recaptchaToken`. Devolve o `token` e o `usuario` |
| `POST` | `/auth/admin/login` | Não | Login do administrador com `cpf`, `senha` e `recaptchaToken` |
| `GET` | `/auth/me` | Sim | Dados do usuário logado |
| `POST` | `/agendamentos-tatuagem` | Sim | Cria um agendamento com `data_hora`, `descricao`, `tatuador` e `preco` (opcional) |
| `GET` | `/agendamentos-tatuagem` | Sim | Lista os agendamentos de tatuagem do cliente logado |
| `GET` | `/agendamentos-tatuagem/proximos` e `/agendamentos-tatuagem/historico` | Sim | Próximos agendamentos e histórico |
| `GET`, `PUT`, `DELETE` | `/agendamentos-tatuagem/:id` | Sim | Busca, altera ou exclui um agendamento do cliente logado |
| `POST` | `/agendamentos-piercing` | Sim | Cria um agendamento com `tipo_piercing_id`, `joia_piercing_id`, `data`, `horario` e `observacao` (opcional) |
| `GET` | `/agendamentos-piercing` | Sim | Lista os agendamentos de piercing do cliente logado |
| `GET` | `/agendamentos-piercing/proximos` e `/agendamentos-piercing/historico` | Sim | Próximos agendamentos e histórico |
| `GET`, `PUT`, `DELETE` | `/agendamentos-piercing/:id` | Sim | Busca, altera ou exclui um agendamento do cliente logado |
| `GET`, `POST` | `/tipos-piercing` | Sim | Lista ou cadastra tipos de piercing |
| `GET`, `PUT`, `DELETE` | `/tipos-piercing/:id` | Sim | Busca, altera ou exclui um tipo de piercing |
| `GET`, `POST` | `/joias-piercing` | Sim | Lista ou cadastra joias |
| `GET` | `/joias-piercing/tipo-piercing/:tipoPiercingId` | Sim | Lista as joias de um tipo de piercing |
| `GET`, `PUT`, `DELETE` | `/joias-piercing/:id` | Sim | Busca, altera ou exclui uma joia |
| `GET`, `POST` | `/estilos-tatuagem` | Sim | Lista ou cadastra estilos de tatuagem |
| `GET`, `PUT`, `DELETE` | `/estilos-tatuagem/:id` | Sim | Busca, altera ou exclui um estilo |
| `GET` | `/notificacoes` | Sim | Lista as notificações do cliente logado |
| `GET` | `/notificacoes/nao-lidas` e `/notificacoes/contador` | Sim | Só as não lidas e quantas são |
| `PATCH` | `/notificacoes/:id/lida` e `/notificacoes/todas/lidas` | Sim | Marca uma notificação, ou todas, como lidas |
| `DELETE` | `/notificacoes/:id` | Sim | Exclui uma notificação |
| `POST` | `/simulacao` e `/simulacao/texto` | Sim | Simulação de tatuagem com IA (veja [Simulação de Tatuagem com IA](#simulação-de-tatuagem-com-ia)) |
| `GET`, `PATCH` | `/admin/...` | Admin | Área do administrador (veja [Área do Administrador](#área-do-administrador)) |

- **Login "Sim":** envie o token no cabeçalho `Authorization: Bearer <token>`. Sem o token, ou com um token vencido, a resposta é `401`.
- **Login "Admin":** precisa do token de um administrador. Com o token de um cliente, a resposta é `403`.
- **reCAPTCHA:** `/auth/register`, `/auth/login` e `/auth/admin/login` exigem o `recaptchaToken`, que é o comprovante do reCAPTCHA v2 marcado no site. Sem ele, ou se o Google recusar o comprovante, a resposta é `400`. Se a API não conseguir falar com o Google, a resposta é `503`.

### Limites da API

- **Quantidade de pedidos:** cada endereço de internet (IP) pode fazer até **100 pedidos a cada 15 minutos**. Passando disso, a API responde `429` com a mensagem "Muitas requisições. Tente novamente em 15 minutos.".
- **Tamanho do pedido:** o corpo do pedido (JSON) pode ter até **10 MB**. A imagem da simulação tem um limite próprio, menor: **5 MB**.

---

## Simulação de Tatuagem com IA

Funcionalidade que mostra ao cliente como a tatuagem ficaria no corpo antes de agendar. O cliente envia o desenho que quer tatuar, escolhe um membro do corpo e recebe uma foto realista desse membro já tatuado com o desenho.

Quem não tem o desenho pode descrever a tatuagem em texto, e a IA cria a foto a partir dessa descrição (veja [Simulação por descrição em texto](#simulação-por-descrição-em-texto)).

A sugestão do professor foi usar o **ControlNet** do **Hugging Face**. O ControlNet é um tipo de IA que gera uma imagem nova seguindo os contornos de uma imagem de referência.

### Como funciona, passo a passo

1. **O cliente envia o desenho.** Na tela **Simulador Tatoo** do site, o cliente escolhe a imagem do desenho (PNG, JPG ou WEBP, até 5 MB) e um dos 6 membros do corpo.
2. **O backend confere o pedido.** Se faltar a imagem, se o formato estiver errado, se passar de 5 MB ou se o membro não existir, o backend responde com uma mensagem de erro clara.
3. **O fundo do desenho é removido.** Se o desenho tiver fundo (branco, papel ou uma cor só), esse fundo é apagado e fica só o traço da tatuagem.
4. **O desenho é colado na foto base do membro.** Cada membro tem uma foto base fixa, guardada em `src/assets/membros`. O backend acha onde está a pele nessa foto e coloca o desenho só em cima dela. O desenho é **curvado em volta do membro**, como uma tatuagem de verdade: ele fica mais estreito nas laterais e, no pescoço e na mão, também gira junto com o membro.
5. **A montagem vai para a IA.** Essa montagem é enviada para um ControlNet num *Space* do Hugging Face (uma página pública com a IA rodando). O Space tira os contornos da montagem e redesenha tudo como uma foto realista do membro tatuado.
6. **Se a IA principal falhar, o backend tenta outra.** A ordem é:
   - **1º:** `hugging-apps/qwen-image-2-1-controlnet-union-demo` (ControlNet Canny);
   - **2º:** `ByteDance/Hyper-SD15-Scribble` (ControlNet Scribble, um pouco menos realista).
7. **O resultado volta para o site.** A imagem gerada é convertida para JPEG e enviada ao site, que mostra o título "Resultado da IA em: ..." com o nome do membro.

### Membros disponíveis

| Membro | Valor aceito no campo `membro` |
|--------|--------------------------------|
| Braço | `Braço` ou `braco` |
| Perna | `Perna` ou `perna` |
| Costas | `Costas` ou `costas` |
| Peito | `Peito` ou `peito` |
| Pescoço | `Pescoço` ou `pescoco` |
| Mão | `Mão` ou `mao` |

Os nomes funcionam com ou sem acento e com letras maiúsculas ou minúsculas. Se o campo `membro` não for enviado, o backend usa **Braço**. Qualquer outro nome é recusado com a lista dos 6 membros.

### Endpoint

```http
POST /simulacao
```

Exige login: envie o token no cabeçalho `Authorization: Bearer <token>`. Sem o token, a resposta é `401`. Corpo da requisição (JSON):

```json
{
  "imagemTatuagemBase64": "data:image/png;base64,iVBORw0KGgo...",
  "membro": "Braço",
  "promptText": "black ink tattoo"
}
```

| Campo | Obrigatório | O que é |
|-------|-------------|---------|
| `imagemTatuagemBase64` | Sim | O desenho da tatuagem em base64 (PNG, JPG ou WEBP, até 5 MB) |
| `membro` | Não | Um dos 6 membros da tabela acima (padrão: Braço) |
| `promptText` | Não | O estilo da tatuagem, em inglês (é o campo **Estilo** do site). Padrão: `black ink tattoo` |

Resposta de sucesso (`200`):

```json
{
  "sucesso": true,
  "imagemSimulada": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Respostas de erro (no formato `{ "erro": "mensagem" }`):

| Código | Quando acontece |
|--------|-----------------|
| `400` | Faltou o desenho, formato inválido, imagem acima de 5 MB, membro inválido, arquivo que não é uma imagem válida ou desenho vazio |
| `429` | O limite gratuito diário da IA acabou ("O limite gratuito da IA acabou por hoje") |
| `500` | O `HUGGINGFACE_API_KEY` não está no `.env`, ou a foto base do membro ainda não foi gerada |
| `502` | A IA não conseguiu gerar a imagem (por exemplo, os dois Spaces deram erro) |
| `503` | A IA está ocupada no momento |
| `504` | A IA demorou demais para responder |

### Simulação por descrição em texto

Para quem não tem o desenho. O cliente descreve a tatuagem com palavras, escolhe o membro e recebe uma foto realista desse membro já tatuado. Esse jeito **não usa a foto base nem o ControlNet**: a IA cria a foto inteira a partir do texto.

Como funciona, passo a passo:

1. **O backend confere o pedido.** A descrição precisa ter de 3 a 300 caracteres. Espaços e quebras de linha repetidos viram um espaço só. O membro segue a mesma regra da tabela de membros (sem membro, usa **Braço**).
2. **O backend monta uma frase em inglês.** Fica assim: `realistic close-up photo of a human (membro em inglês) with a tattoo of (descrição) inked on the skin, ...`. A descrição vai para a IA do jeito que o cliente escreveu, **sem tradução**. Em inglês o resultado costuma ser melhor.
3. **A frase vai para a IA.** O backend pede a imagem ao Space `black-forest-labs/FLUX.1-schnell` do Hugging Face, no tamanho da foto base do membro (por exemplo, 768 x 512 no Braço).
4. **Se a IA principal falhar, o backend tenta outra:** o Space `stabilityai/stable-diffusion-3.5-large-turbo`. Se a cota grátis acabar, ele para na hora e avisa.
5. **O resultado volta para o site**, convertido para JPEG, igual à simulação com desenho.

Usa a mesma chave `HUGGINGFACE_API_KEY` e os mesmos limites de tempo da simulação com desenho.

```http
POST /simulacao/texto
```

Exige login: envie o token no cabeçalho `Authorization: Bearer <token>`. Sem o token, a resposta é `401`. Corpo da requisição (JSON):

```json
{
  "descricao": "lion with a crown and roses, fine line, black and grey",
  "membro": "Braço"
}
```

| Campo | Obrigatório | O que é |
|-------|-------------|---------|
| `descricao` | Sim | A tatuagem descrita em texto, de 3 a 300 caracteres |
| `membro` | Não | Um dos 6 membros da tabela de membros (padrão: Braço) |

A resposta de sucesso (`200`) é igual à da simulação com desenho:

```json
{
  "sucesso": true,
  "imagemSimulada": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

Respostas de erro (no formato `{ "erro": "mensagem" }`):

| Código | Quando acontece |
|--------|-----------------|
| `400` | Descrição com menos de 3 ou mais de 300 caracteres, descrição que não é texto ou membro inválido |
| `429` | O limite gratuito diário da IA acabou ("O limite gratuito da IA acabou por hoje") |
| `500` | O `HUGGINGFACE_API_KEY` não está no `.env` |
| `502` | A IA não conseguiu gerar a imagem (por exemplo, os dois Spaces deram erro) |
| `503` | A IA está ocupada no momento |
| `504` | A IA demorou demais para responder |

Os testes `tests/simulacaoTextoController.test.js` e `tests/simulacaoTextoService.test.js` conferem essa rota com a IA simulada, então não gastam a cota.

### Fotos base dos membros

As fotos base ficam em `src/assets/membros` (`braco.png`, `perna.png`, `costas.png`, `peito.png`, `pescoco.png` e `mao.png`). Elas foram geradas uma única vez por IA com o comando:

```bash
npm run gerar-membros
```

Para gerar de novo:

```bash
npm run gerar-membros -- --refazer            # refaz todas
npm run gerar-membros -- --refazer braco mao  # refaz só as escolhidas
```

O script tenta, nesta ordem: o Space `black-forest-labs/FLUX.1-schnell`, o Space `stabilityai/stable-diffusion-3.5-large-turbo`, os servidores pagos do Hugging Face (só se a conta tiver créditos) e, por último, o **Pollinations** (grátis, fora do Hugging Face). Também é possível colocar fotos próprias nessa pasta, com os mesmos nomes.

Sem essas fotos, a simulação responde que ainda não está disponível.

### Arquivos da funcionalidade

| Arquivo | O que faz |
|---------|-----------|
| `src/routes/simulacao.routes.js` | Cria as rotas `POST /simulacao` e `POST /simulacao/texto` |
| `src/controllers/simulacao.controller.js` | Confere o pedido e devolve a resposta ou o erro (`simularTatuagem` para o desenho e `simularTatuagemPorTexto` para a descrição) |
| `src/services/iaTatuagem.service.js` | Remove o fundo, monta o desenho no membro e chama a IA. A função `gerarSimulacaoPorTexto` e a lista `SPACES_TEXTO` cuidam da simulação por texto |
| `scripts/gerar-bases-membros.js` | Gera as fotos base dos membros |
| `src/assets/membros/` | Guarda as fotos base |
| `tests/simulacaoTextoController.test.js` e `tests/simulacaoTextoService.test.js` | Testes da simulação por texto (a IA é simulada, não gastam cota) |

### Limitações conhecidas

- **Cota gratuita:** os Spaces usam a cota diária grátis de GPU (*ZeroGPU*) da conta do Hugging Face. Cada simulação com desenho gasta cerca de 30 segundos dessa cota, o que dá aproximadamente **10 simulações por dia** numa conta gratuita. A simulação por texto também usa essa cota, mas costuma ser bem mais rápida (no teste, levou cerca de 4 segundos).
- **Tempo:** cada simulação pode levar até cerca de **2 minutos e 20 segundos**. O backend desiste depois de **140 segundos** tentando. Em cada Space, ele espera no máximo 30 segundos para conectar, 80 segundos para gerar e 20 segundos para baixar a imagem.
- **Cores:** na simulação com desenho, a IA só enxerga os contornos, então um desenho colorido sai em tinta preta. Para pedir cores, escreva no campo **Estilo** do site (por exemplo, `colorful watercolor tattoo, red and blue`). Na simulação por texto, as cores podem ir direto na descrição.
- **Mesma base:** na simulação com desenho, todas as simulações de um membro usam a mesma foto base, então o tom de pele e a pose se repetem.

---

## Área do Administrador

Área usada pelo estúdio para organizar o dia. O administrador entra com CPF e senha, vê a agenda de qualquer dia e aprova ou recusa os pedidos de tatuagem e piercing.

### Como criar um administrador

O administrador precisa ter cadastro no site, como qualquer cliente. Depois, na pasta do backend:

```bash
npm run definir-admin
```

O comando pede o CPF e a nova senha (mínimo de 8 caracteres, com letras e números). A senha é guardada embaralhada (*hash* com `scrypt`), nunca em texto puro. Para trocar a senha, basta rodar o comando de novo.

> Rode `npm run migrate` antes, para o banco ter as colunas `perfil` e `senha_hash`.

### Endpoints

| Método | Rota | O que faz |
|--------|------|-----------|
| `POST` | `/auth/admin/login` | Login do administrador com `cpf` e `senha`. Devolve o `token` e o `usuario` |
| `GET` | `/admin/agenda?data=AAAA-MM-DD` | Agenda do dia, com tatuagens e piercings em ordem de horário. Sem `data`, usa o dia de hoje no horário de São Paulo |
| `GET` | `/admin/aprovacoes` | Pedidos que ainda estão pendentes |
| `PATCH` | `/admin/agendamentos/:tipo/:id/aprovar` | Aprova um pedido. `tipo` é `tatuagem` ou `piercing` |
| `PATCH` | `/admin/agendamentos/:tipo/:id/recusar` | Recusa um pedido. Aceita um `motivo` opcional, de até 255 caracteres, que vai para o cliente |

As rotas `/admin` exigem o token do administrador no cabeçalho `Authorization: Bearer <token>`. Sem login, a resposta é `401`. Com login de cliente, é `403`.

Cada agendamento da agenda vem neste formato:

```json
{
  "id": "piercing-6f1c2a0e-...",
  "type": "piercing",
  "appointmentId": "6f1c2a0e-...",
  "date": "2026-10-27",
  "time": "15:00",
  "clientName": "Nome do cliente",
  "service": "Piercing Labret (Boca)",
  "status": "pending"
}
```

O `status` vem com os nomes que a tela usa: `pendente` vira `pending`, `confirmado` vira `confirmed`, `cancelado` vira `cancelled` e `concluido` vira `completed`.

### Regras da aprovação

- Só pedidos **pendentes** podem ser aprovados ou recusados.
- Não é possível **aprovar** um horário que já passou. Recusar continua possível.
- Uma tatuagem não é aprovada se o tatuador já tem outra tatuagem confirmada no mesmo dia e horário.
- Se duas pessoas decidirem o mesmo pedido ao mesmo tempo, só a primeira decisão vale.
- O cliente recebe uma notificação com a decisão. Se o aviso falhar, a decisão continua valendo, e a resposta traz `notificacaoEnviada: false`.

### Arquivos da funcionalidade

| Arquivo | O que faz |
|---------|-----------|
| `src/routes/admin.routes.js` | Cria as rotas `/admin` e protege todas com o login de administrador |
| `src/controllers/admin.controller.js` | Recebe os pedidos e devolve as respostas |
| `src/services/admin.service.js` | Monta a agenda e aplica as regras da aprovação |
| `src/repositories/admin.repository.js` | Consultas ao banco da agenda e da aprovação |
| `src/validations/admin.validation.js` | Confere a data, o tipo, o código e o motivo |
| `src/middlewares/auth.middleware.js` | `requireAdmin`: só deixa passar quem tem perfil `admin` |
| `scripts/definir-admin.js` | Define o administrador e a senha |

---

## Regras dos Agendamentos

Antes de gravar um agendamento de tatuagem ou de piercing, o backend confere os dados. Se algo estiver errado, ele responde `400` com uma mensagem clara.

- **Data e horário:** a data precisa existir no calendário (formato `AAAA-MM-DD`) e o horário precisa estar no formato `HH:MM`.
- **Nada no passado:** não é possível agendar para um dia ou horário que já passou, no horário de São Paulo.
- **Expediente:** só são aceitos horários a partir das 08:00 e antes das 18:00.
- **Tatuagem:** data, horário, descrição e tatuador são obrigatórios. Se o preço for enviado, ele não pode ser negativo.
- **Piercing:** tipo, joia, data e horário são obrigatórios, e a joia precisa combinar com o tipo de piercing escolhido.
- **Remarcação:** quando o cliente muda a data ou o horário, o pedido volta para **pendente** e precisa ser aprovado de novo. O cliente não consegue mudar o status sozinho.

As regras ficam em `src/validations/agendamento.validation.js`.

---

## Banco de Dados

Banco de dados PostgreSQL hospedado na nuvem através do **NeonDB**.

| Tabela | O que guarda | Criada pelo `npm run migrate`? |
|--------|--------------|--------------------------------|
| `usuarios` | Clientes e administradores (CPF, nome, `perfil` e `senha_hash`) | Sim |
| `agendamentos_tatuagem` | Agendamentos de tatuagem | Sim |
| `agendamentos_piercing` | Agendamentos de piercing | Não (o comando só acrescenta a regra de status, se a tabela existir) |
| `tipos_piercing` | Tipos de piercing | Não |
| `joias_piercing` | Joias de cada tipo de piercing | Não |
| `estilos_tatuagem` | Estilos de tatuagem | Não |
| `notificacoes` | Avisos para o cliente | Não (o modelo está em `src/database/create_notificacoes.sql`) |

Os arquivos `src/database/schema.sql` e `src/database/create_notificacoes.sql` são modelos em SQL. Nenhum código os executa sozinho.

---

## Deploy

Aplicação publicada no **Vercel**.

---

## Testes da API

Os testes do backend foram realizados utilizando **Thunder Client / Postman**, incluindo autenticação, CRUD das entidades e relacionamentos entre tabelas.

O projeto também tem **testes automáticos com Jest**, na pasta `tests`. Eles conferem, por exemplo, a validação de CPF, senha e horários, as regras dos agendamentos e da aprovação e o acesso às rotas de administrador. Para rodar, use `npm test` (veja [Rodar os testes automáticos](#rodar-os-testes-automáticos)).