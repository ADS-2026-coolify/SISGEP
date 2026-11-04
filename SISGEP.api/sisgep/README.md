# SISGEP: guia da aplicação

Este guia explica, do jeito mais direto possível, como as partes do SISGEP se conectam e o que acontece quando alguém usa uma tela.

## 1. O sistema em uma imagem

O SISGEP tem uma aplicação visual e uma API:

```text
Pessoa
  ↓ usa
Frontend React no navegador
  ↓ envia uma requisição HTTP
API Django REST Framework
  ↓ valida e executa regras
Modelos Django / ORM
  ↓ consultam ou alteram
Banco de dados e arquivos enviados
  ↑
Resposta da API → atualização da tela
```

- **Frontend**: telas, formulários, botões e estado visual.
- **API**: os endereços e operações que o frontend pode chamar.
- **Backend**: código Python que recebe os pedidos, confere acesso e aplica as regras.
- **Banco de dados**: guarda os registros estruturados.
- **Arquivos de mídia**: fotos e documentos enviados, relacionados aos registros.

O frontend está em `SISGEP.web/`. O backend está em `SISGEP.api/`; este guia está dentro do app Django `sisgep/`.

## 2. O que é uma requisição?

Uma **requisição HTTP** é uma mensagem que um programa envia a outro. No SISGEP, o navegador envia uma requisição à API, e a API devolve uma resposta.

Uma requisição costuma ter:

1. **Método**: que tipo de ação se quer fazer.
2. **Endereço (URL)**: qual recurso será acessado.
3. **Dados**: informações a consultar, cadastrar ou alterar.
4. **Autenticação**: uma credencial que identifica a pessoa, quando a rota exige login.

Métodos usados com frequência:

| Método | Ideia geral | Exemplo |
| --- | --- | --- |
| `GET` | Consultar | Buscar a lista de veículos |
| `POST` | Criar ou executar uma ação | Cadastrar veículo ou registrar saída |
| `PUT` / `PATCH` | Alterar | Atualizar um cadastro |
| `DELETE` | Apagar | Remover um registro |

Na resposta, o **código HTTP** indica o resultado. Por exemplo, `200` significa sucesso numa consulta ou ação; `201` indica criação; `400` indica dados inválidos ou uma regra não atendida; `401` indica que é necessário autenticar; `403` indica que o usuário não tem permissão.

## 3. Como uma requisição percorre o código

```text
Componente/tela
  → função em src/api.tsx
  → config/urls.py
  → sisgep/urls.py
  → classe em sisgep/api_views/
  → serializer em sisgep/serializers/
  → modelo em sisgep/models/
  → banco de dados
  → resposta da API
  → componente atualiza a tela
```

Cada etapa tem uma responsabilidade:

1. **Componente React** coleta os dados ou pede uma consulta.
2. **Cliente de API** monta e envia a requisição. Neste sistema ele usa Axios.
3. **Rotas Django** encontram o código que atende o endereço.
4. **View/ViewSet** coordena a operação e aplica as regras daquela requisição.
5. **Permission** verifica se o usuário autenticado pode realizar a operação.
6. **Serializer** valida dados recebidos e prepara dados de resposta.
7. **Model e ORM** representam e consultam ou gravam os dados no banco.
8. **Resposta** volta ao frontend, que mostra o resultado.

Nem todo pedido precisa usar todas as etapas da mesma maneira. Por exemplo, uma consulta simples pode usar o comportamento padrão do Django REST Framework; operações com regras específicas têm métodos próprios nas views.

## 4. Exemplo: registrar a entrada de um veículo

Este é o caminho concreto do botão de salvar:

1. A tela [VehicleEntryForm.tsx](../../SISGEP.web/src/components/VehicleEntryForm.tsx) reúne placa, marca, modelo, categoria e outros campos.
2. A função `handleSubmit` prepara esses valores em `FormData`. Esse formato permite enviar campos de texto e fotos/documentos no mesmo pedido.
3. Ela chama `api.registrarEntrada(...)`, em [api.tsx](../../SISGEP.web/src/api.tsx).
4. Axios envia `POST /api/auth/veiculos/`. Se há token de acesso guardado, um interceptador acrescenta o token ao pedido.
5. `config/urls.py` encaminha `/api/auth/` para o app `sisgep`; `sisgep/urls.py` associa `veiculos/` à classe `VeiculoViewSet`.
6. A permissão `IsVeiculoPermitido` verifica se o usuário pode cadastrar veículos.
7. `VeiculoViewSet.create`, em `api_views/vehicles.py`, confere dados como categoria e placa e escolhe o serializer correspondente.
8. O backend exige o termo de apreensão para veículos do DETRAN e o mandado de busca/custódia para veículos de banco. Depois, o serializer valida os campos e `serializer.save()` cria o veículo através dos modelos Django.
9. As fotos são associadas ao veículo pela função `salvar_fotos_veiculo`, em `services/vehicle_service.py`.
10. O backend devolve os dados e um código de sucesso; a tela mostra a confirmação e atualiza a lista.

Em formato curto:

```text
VehicleEntryForm
  → api.registrarEntrada
  → POST /api/auth/veiculos/
  → VeiculoViewSet.create
  → serializer.is_valid()
  → serializer.save()
  → salvar_fotos_veiculo()
  → resposta para a tela
```

O cadastro escolhe um serializer por categoria:

- `detran` → `VeiculoDetranSerializer`
- `banco` → `VeiculoBancoSerializer`
- `particular` → `VeiculoParticularSerializer`

## 5. Como as rotas viram endereços

O arquivo `config/urls.py` define o prefixo `/api/auth/`. O arquivo `sisgep/urls.py` registra os recursos no roteador do Django REST Framework:

| Recurso registrado | Endereço local |
| --- | --- |
| Login | `/api/auth/login/` |
| Renovação de token | `/api/auth/refresh/` |
| Usuários | `/api/auth/usuarios/` |
| Clientes | `/api/auth/clientes/` |
| Bancos | `/api/auth/bancos/` |
| Infrações | `/api/auth/infracoes/` |
| Tabelas DETRAN | `/api/auth/tabela-detran/` |
| Veículos | `/api/auth/veiculos/` |

O roteador também disponibiliza operações de consulta, criação, alteração e remoção para os ViewSets. Algumas operações específicas têm endereços próprios, como:

- `GET /api/auth/veiculos/inventario/` — veículos ainda recolhidos;
- `GET /api/auth/veiculos/leilao/` — veículos recolhidos há mais de 60 dias-calendário;
- `POST /api/auth/veiculos/{id}/registrar_saida/` — registrar a saída de um veículo;
- `GET /api/auth/usuarios/me/` — obter os dados do usuário autenticado.

`{id}` representa o identificador real de um registro, por exemplo `123`.

## 6. Para que serve cada parte do backend?

| Local | O que procurar |
| --- | --- |
| `config/settings.py` | Configurações: aplicações, banco, autenticação, mídia e e-mail. |
| `config/urls.py` | Prefixo geral das rotas e painel administrativo Django. |
| `sisgep/urls.py` | Rotas da API do SISGEP e associação aos ViewSets. |
| `sisgep/api_views/` | Classes que recebem requisições e coordenam operações. |
| `sisgep/serializers/` | Validação e conversão dos dados recebidos e enviados. |
| `sisgep/models/` | Classes que representam os dados guardados no banco. |
| `sisgep/services/` | Funções auxiliares e regras reutilizáveis. |
| `sisgep/permissions.py` | Regras de acesso por usuário e operação. |
| `sisgep/validators.py` | Validações específicas, como arquivos. |
| `sisgep/migrations/` | Histórico das alterações das tabelas do banco. |
| Testes automatizados | Foram removidos a pedido do projeto; atualmente não há suíte automatizada do backend. |

### Model não é View

`Veiculo`, em `models/veiculo.py`, descreve **o registro e seus campos**.

`VeiculoViewSet`, em `api_views/vehicles.py`, atende **pedidos HTTP sobre veículos**.

Ambos são classes Python, mas fazem trabalhos diferentes.

### Exclusão lógica de veículos

Quando um administrador exclui um veículo pela API, o sistema preenche `excluido_em` e `excluido_por` em vez de apagar o registro. Os veículos inativados e seus anexos deixam de aparecer nas consultas normais da API e nos relatórios, mas permanecem armazenados para preservar o histórico. A exclusão física de veículos pelo Django Admin também fica desabilitada.

Na tela **Todos os Registros**, administradores consultam ativos, liberados e excluídos. Também podem abrir os detalhes completos de um veículo excluído, incluindo a data e o responsável pela exclusão; operadores continuam vendo apenas os registros ativos ou liberados. As consultas administrativas são protegidas para administradores em `GET /api/auth/veiculos/registros-administrativos/` e `GET /api/auth/veiculos/{id}/registro-administrativo/`.

### O que é um serializer?

Um **serializer** é uma ponte entre a API e os modelos Python. Ele ajuda a:

1. transformar os dados recebidos pela API em valores que o Django pode usar;
2. verificar se os dados recebidos são válidos;
3. transformar um objeto do Django em dados que a API pode devolver, normalmente JSON.

Por exemplo, o frontend envia informações de uma tabela do DETRAN. O serializer correspondente sabe que está trabalhando com o modelo `TabelaDetran` e valida campos como `guincho`, `estadia` e `ano_vigente`.

### O que significa `fields = '__all__'`?

Em serializers, é comum encontrar uma classe interna chamada `Meta`. Ela guarda configurações do serializer. Por exemplo, em `serializers/catalogs.py`:

```python
class TabelaDetranSerializer(serializers.ModelSerializer):
    class Meta:
        model = TabelaDetran
        fields = '__all__'
```

Leia assim:

- `model = TabelaDetran`: este serializer trabalha com o modelo `TabelaDetran`;
- `fields = '__all__'`: inclua todos os campos desse modelo neste serializer.

No modelo atual, `TabelaDetran` tem os campos `guincho`, `estadia` e `ano_vigente`; o Django também fornece um identificador para cada registro. Portanto, `__all__` se refere aos campos **desse modelo**, e não a todos os campos de todos os modelos do sistema. Ao salvar os valores DETRAN, a interface cria uma nova vigência a partir da data atual e preserva as tabelas anteriores; se uma tabela já tiver sido criada no mesmo dia, ela é atualizada. Vigências anteriores não podem ser alteradas nem excluídas pela API.

Se quiséssemos incluir somente alguns campos, poderíamos escrever, por exemplo, `fields = ['id', 'guincho']`. Isso faz o serializer expor e aceitar apenas os campos listados, conforme as regras dos campos. É útil quando queremos controlar explicitamente quais informações entram ou saem da API.

Pense no serializer como um formulário de conferência e tradução: ele recebe os dados, verifica se estão corretos e prepara os dados para a resposta.

### O que é um service?

Um service contém uma função que executa uma tarefa de apoio. Por exemplo, `vehicle_service.py` calcula custos e dias no pátio, procura tabela DETRAN e salva fotos. Ele não recebe todas as requisições do sistema: as views o chamam quando precisam dessas tarefas.

## 7. Para que serve cada parte do frontend?

| Local | O que procurar |
| --- | --- |
| `SISGEP.web/src/main.tsx` | Ponto de entrada que monta a aplicação React no navegador. |
| `SISGEP.web/src/App.tsx` | Seleção das telas e estado geral de navegação/autenticação. |
| `SISGEP.web/src/components/` | Telas e componentes, como login, painel e formulários. |
| `SISGEP.web/src/api.tsx` | Funções Axios que chamam os endereços do backend. |
| `SISGEP.web/src/contexts/` | Dados compartilhados por várias telas e funções de atualização. |
| `SISGEP.web/src/utils/` | Funções auxiliares usadas pelo frontend. |

Os dados podem ter nomes diferentes nas duas partes. Por exemplo, o backend usa `placa` e `data_entrada`; o contexto React converte esses campos para `plate` e `entryDate` para as telas.

## 8. Login e permissões

### Primeiro: como o sistema reconhece o usuário?

Vamos seguir um login real pelo código:

1. A tela `SISGEP.web/src/components/Login.tsx` recolhe o CPF e a senha.
2. O formulário remove pontos e traço do CPF e chama `api.login(cpf, password)`.
3. `SISGEP.web/src/api.tsx` envia um `POST` para `login/`, com CPF e senha.
4. A rota `login/`, registrada em `sisgep/urls.py`, usa `TokenObtainPairView`, fornecida pelo Simple JWT.
5. O modelo `Usuario`, em `sisgep/models/usuario.py`, declara `USERNAME_FIELD = 'cpf'`. Isso informa ao sistema de autenticação do Django que o CPF é o identificador usado no login, em vez do `username` tradicional.
6. O Django procura o usuário pelo CPF e confere a senha com a senha armazenada. Se as credenciais forem aceitas, o endpoint devolve dois tokens JWT: `access` e `refresh`.
7. A tela guarda os tokens no `localStorage` do navegador.
8. Antes de cada chamada Axios, o interceptador em `SISGEP.web/src/api.tsx` lê `access_token` e o envia no cabeçalho `Authorization` como token Bearer.
9. O backend está configurado para usar `JWTAuthentication`, em `config/settings.py`. Essa autenticação lê e valida o token de acesso e carrega o usuário correspondente. Durante o processamento daquela requisição, as views e permissões recebem essa identidade como `request.user`.

Em desenho:

```text
CPF + senha
  → endpoint login/
  → Django confere credenciais
  → devolve access e refresh
  → frontend guarda os tokens

Pedido seguinte + access token
  → JWTAuthentication valida o token
  → encontra o usuário
  → view recebe request.user
  → permission decide se esse usuário pode agir
```

### Acompanhe o fluxo nos arquivos e no código

#### A. A tela recolhe e prepara as credenciais

Em `SISGEP.web/src/components/Login.tsx`, a função `handleSubmit` é executada quando a pessoa envia o formulário. Primeiro impede o comportamento padrão do formulário e tira a pontuação do CPF:

```typescript
const normalizedCpf = cpf.replace(/\D/g, '');
const data = await api.login(normalizedCpf, password);
```

`replace(/\D/g, '')` significa “remova tudo o que não for número”. Assim, `123.456.789-01` é enviado como `12345678901`.

#### B. O frontend faz um pedido HTTP

Em `SISGEP.web/src/api.tsx`, a função `api.login` faz:

```typescript
apiClient.post('login/', {
  cpf,
  password,
});
```

`post` é o método HTTP usado para enviar esses dados ao backend. Como o `apiClient` tem `baseURL` igual a `http://localhost:8000/api/auth/` no desenvolvimento local, o endereço completo fica:

```text
POST http://localhost:8000/api/auth/login/
```

Em outro ambiente, `VITE_API_URL` pode substituir esse endereço-base.

#### C. A URL é encaminhada ao endpoint de login

`config/urls.py` encaminha o prefixo `api/auth/` para `sisgep.urls`. Nesse arquivo, a linha:

```python
path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair')
```

liga o caminho `login/` à view `TokenObtainPairView`, fornecida pela biblioteca Simple JWT. Ela confere as credenciais e, se forem válidas, cria o par de tokens. Não é uma função de login escrita dentro de `UsuarioViewSet`.

#### D. Por que o login usa CPF?

O model `Usuario`, em `sisgep/models/usuario.py`, declara:

```python
USERNAME_FIELD = 'cpf'
```

O Django usa essa configuração para saber qual campo identifica o usuário durante a autenticação. Neste projeto, esse campo é o CPF.

O model também declara:

```python
cpf = models.CharField(max_length=11, unique=True, ...)
```

`unique=True` significa que dois usuários não podem ter o mesmo CPF no banco. A senha é validada pelo sistema de autenticação do Django; a aplicação não procura um usuário comparando texto de senha diretamente.

#### E. O sucesso devolve tokens, não o perfil completo

Se CPF e senha forem aceitos, `TokenObtainPairView` responde com dados chamados `access` e `refresh`. Em `Login.tsx`, esses valores são guardados assim:

```typescript
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
```

- `access`: credencial enviada nas chamadas à API para autenticar o usuário.
- `refresh`: credencial usada para obter outro token de acesso pela rota `refresh/`.

O token não é a senha e não deve ser tratado como informação pública. O frontend guarda os tokens, e não a senha, para as chamadas seguintes.

Se o CPF ou a senha não forem aceitos, o `catch` de `handleSubmit` mostra “CPF ou senha incorretos”. Nesse caso, a tela não grava tokens.

#### F. A chamada seguinte carrega o token de acesso

Em `SISGEP.web/src/api.tsx`, um interceptador do Axios roda antes de cada requisição feita pelo `apiClient`:

```typescript
const token = localStorage.getItem('access_token');
if (token) {
  // acrescenta o token ao cabeçalho Authorization
}
```

Isso permite que cada função — por exemplo, `api.getVeiculos()` — envie o token sem precisar repetir essa lógica. Se não houver token, o interceptador não tem credencial para anexar.

#### G. O backend valida o token e define `request.user`

Em `config/settings.py`, o Django REST Framework está configurado com:

```python
'DEFAULT_AUTHENTICATION_CLASSES': (
    'rest_framework_simplejwt.authentication.JWTAuthentication',
)
```

Quando chega uma requisição protegida, `JWTAuthentication` procura o token no cabeçalho, verifica se é válido e não expirou e identifica o usuário correspondente. O resultado fica disponível como `request.user` enquanto aquela requisição é processada.

Uma analogia: o token é como uma credencial apresentada na entrada. O backend verifica a credencial e descobre qual usuário ela representa; não confia apenas no que a tela diz sobre o perfil.

#### H. O frontend também pergunta quem está logado

Depois de recarregar a página, `SISGEP.web/src/App.tsx` verifica se existe `access_token`. Se existir, chama `api.getUsuarioAtual()`, que faz `GET usuarios/me/`.

No backend, `UsuarioViewSet.me` usa o `request.user` definido pela autenticação e serializa esse usuário:

```python
return Response(self.get_serializer(request.user).data)
```

A resposta contém os dados do usuário, inclusive `tipo_usuario`, que a tela usa para exibir a experiência apropriada. A existência de texto salvo no navegador, por si só, não prova que o token ainda é válido: a chamada ao backend confirma se a sessão pode continuar.

#### I. Só depois vem a autorização

Quando o usuário tenta uma operação, a classe de permissão verifica o `request.user`. Por exemplo, `VeiculoViewSet` declara:

```python
permission_classes = [IsVeiculoPermitido]
```

Em `permissions.py`, `IsVeiculoPermitido` primeiro exige usuário autenticado. Depois, para ações como `registrar_saida` e `leilao`, ou para `PUT`, `PATCH` e `DELETE`, exige que `is_administrador(request.user)` seja verdadeiro.

Assim:

```text
JWTAuthentication → identifica a pessoa (request.user)
permission         → decide se ela pode executar esta ação
view               → executa a ação se a permissão permitir
```

Se a pessoa não estiver autenticada, o backend rejeita o pedido. Se estiver autenticada, mas seu perfil não puder fazer a operação, o backend também a rejeita — mesmo que alguém tente chamar a URL sem passar pela interface.

O token de acesso está configurado para durar 24 horas; o token de renovação, 7 dias. O token é uma credencial: quem o apresenta está pedindo para agir como o usuário identificado nele. Por isso, não deve ser compartilhado.

### Criação de conta e recuperação de senha: fluxo completo

O sistema tem dois caminhos relacionados:

1. Um administrador cria uma conta; o novo usuário recebe um link para definir a senha pela primeira vez.
2. Um usuário que já tem conta, mas esqueceu a senha, solicita um novo link.

Nos dois caminhos, o backend cria um link com um identificador do usuário e um token temporário. A senha não é enviada por e-mail.

#### A. O administrador preenche o formulário de usuário

O formulário fica em `SISGEP.web/src/components/SettingsUserTab.tsx`. Ao enviar, `handleSubmit`:

1. tira a pontuação do CPF e verifica se restaram 11 dígitos;
2. monta os dados `nome_completo`, `cpf`, `telefone`, `email` e `tipo_usuario`;
3. chama `api.createUsuario(userData)` quando é uma conta nova.

O frontend não envia uma senha inicial. A chamada `createUsuario`, em `SISGEP.web/src/api.tsx`, faz `POST usuarios/`. O prefixo geral da API resulta no endereço:

```text
POST /api/auth/usuarios/
```

#### B. O backend protege a criação e valida os dados

`UsuarioViewSet`, em `sisgep/api_views/users.py`, define:

```python
permission_classes = [IsAdministrador]
```

Portanto, criar uma conta pela API exige uma pessoa já autenticada como administradora. Essa verificação acontece no backend, mesmo que o frontend mostre ou esconda o formulário.

O método `create` da view recebe a requisição e remove qualquer valor `password` que tenha sido enviado:

```python
dados = {chave: valor for chave, valor in request.data.items()}
dados.pop('password', None)
```

Depois, passa os outros dados ao `UsuarioSerializer`:

```python
serializer = self.get_serializer(data=dados)
if not serializer.is_valid():
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
usuario = serializer.save()
```

`is_valid()` confere campos e regras do serializer. Se, por exemplo, faltar um campo obrigatório ou o CPF/e-mail já estiver em uso, a API responde com erros e a conta não é criada. Se estiver válido, `save()` chama a criação definida em `serializers/users.py`.

Como não existe senha inicial, `UsuarioSerializer.create` usa:

```python
user.set_unusable_password()
```

Isso cria a conta sem uma senha que possa ser usada para login. O usuário só conseguirá entrar depois de definir uma senha pelo link.

#### C. O backend cria o link de definição de senha

Depois de salvar a conta, `UsuarioViewSet.create` chama `gerar_link_recuperacao(usuario)`. Esse método faz duas coisas:

```python
identificador = urlsafe_base64_encode(force_bytes(usuario.pk))
token = default_token_generator.make_token(usuario)
```

- `usuario.pk` é o identificador do registro do usuário. A codificação em Base64 torna possível transportá-lo no endereço; ela não é uma senha nem um segredo.
- `make_token(usuario)` gera um token de confirmação associado à conta. O Django pode conferir depois se ele é válido.

O link é montado usando `FRONTEND_URL`, configurado em `config/settings.py`:

```text
FRONTEND_URL/definir-senha/<identificador>/<token>
```

O link contém uma credencial temporária. Quem o receber poderá tentar definir a senha daquela conta enquanto o token for válido; por isso, não deve ser compartilhado.

#### D. A view monta e envia o e-mail

Na criação da conta, a view monta uma mensagem de boas-vindas com o link e chama `enviar_email_seguro`, passando assunto, conteúdo, remetente e o endereço cadastrado em `usuario.email`.

`enviar_email_seguro` usa a função de e-mail do Django:

```python
send_mail(fail_silently=False, **kwargs)
```

As configurações de transporte ficam em `config/settings.py`:

- se `USE_BREVO=True`, usa o backend Brevo e a variável `BREVO_API_KEY`;
- caso contrário, usa SMTP, com configurações como `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER` e `EMAIL_HOST_PASSWORD`;
- `DEFAULT_FROM_EMAIL` define o remetente;
- `FRONTEND_URL` define o domínio que entra no link.

Essas configurações vêm de variáveis de ambiente; valores secretos devem ficar no `.env` local ou no painel do ambiente de hospedagem, nunca no código publicado.

#### E. O que acontece se o e-mail falhar na criação?

A conta é salva **antes** de tentar enviar a mensagem. Se `send_mail` falhar, `enviar_email_seguro` registra a exceção no log e devolve `False`. A view ainda responde `201 Created`, pois a conta existe, mas inclui um campo `aviso` explicando que o e-mail não pôde ser enviado. O frontend mostra esse aviso ao administrador.

Isso significa que uma falha de e-mail não apaga nem desfaz a conta. O administrador pode verificar a configuração ou pedir que o usuário use “Esqueci minha senha”.

#### F. O usuário abre o link e escolhe a senha

O frontend tem uma tela especial em `SISGEP.web/src/components/DefinirSenha.tsx`. `App.tsx` detecta se o endereço começa com `/definir-senha/` e mostra essa tela sem exigir login.

A tela separa o endereço em partes para obter `uid` e `token`. Antes de enviar, confere se:

- os dois campos de senha coincidem;
- a senha tem pelo menos 6 caracteres.

Em seguida, envia um pedido JSON:

```text
POST /api/auth/usuarios/redefinir_senha/
```

com `uid`, `token` e `senha`. Essa rota tem `AllowAny`: a pessoa ainda não está logada, mas precisa provar que recebeu o link válido.

No backend, `UsuarioViewSet.redefinir_senha`:

1. decodifica `uid` e localiza o registro do usuário;
2. chama `default_token_generator.check_token(usuario, token)`;
3. se usuário e token forem válidos, chama `usuario.set_password(nova_senha)` e salva;
4. caso contrário, responde que o link é inválido ou expirou.

`set_password` guarda a senha em formato protegido, não como texto simples. Após a resposta de sucesso, a tela mostra uma confirmação e oferece voltar ao login.

#### G. Recuperação para quem já tinha conta

Na tela `SISGEP.web/src/components/PasswordRecovery.tsx`, a pessoa escolhe recuperar usando CPF ou e-mail e envia o formulário. `handleSubmit` chama `api.esqueciSenha(identificador, tipo)`, que envia:

```text
POST /api/auth/usuarios/esqueci_minha_senha/
```

O pedido contém `identificador` e `tipo` (`cpf` ou `email`). A ação `esqueci_minha_senha`, em `UsuarioViewSet`, é marcada com `AllowAny`, pois deve funcionar antes do login.

No backend:

1. Se `tipo` for `cpf`, remove a pontuação e procura a conta pelo CPF.
2. Caso contrário, procura a conta pelo e-mail.
3. Se encontrar o usuário, gera um novo link e tenta enviá-lo ao e-mail cadastrado.
4. Se não encontrar, responde com uma mensagem genérica: “Instruções enviadas se o usuário existir.”

A mensagem genérica evita que a API revele a terceiros se um CPF ou e-mail está cadastrado. No frontend, quando a API responde, a tela mostra a etapa “Instruções Enviadas”.

#### H. Como o link é protegido e quanto tempo dura?

O backend usa o `default_token_generator` do Django. A configuração padrão do Django invalida o token depois do prazo definido por `PASSWORD_RESET_TIMEOUT`, e tokens antigos também deixam de funcionar quando as informações de senha da conta mudam. Este projeto não define `PASSWORD_RESET_TIMEOUT` em `config/settings.py`; portanto, o prazo vem do padrão da versão do Django instalada.

**Atenção: há uma diferença entre texto da interface e configuração do backend.** `PasswordRecovery.tsx` informa que o link é válido por 30 minutos, mas o projeto não configura esse prazo de 30 minutos no backend. Não trate o texto da tela como garantia técnica do prazo enquanto essa configuração não for alinhada.

#### I. Detalhes atuais que é bom conhecer

- O sistema envia e-mail; não há envio de SMS implementado nesse fluxo. Apesar disso, a tela de recuperação menciona SMS quando a pessoa escolhe CPF.
- Se a conta for encontrada, mas o envio do e-mail de recuperação falhar, o helper registra a falha no log. A ação ainda devolve a resposta genérica de sucesso; por isso, a tela pode dizer que enviou instruções mesmo quando o servidor de e-mail falhou.
- A tela de definir senha verifica a repetição e o mínimo de 6 caracteres no navegador. A ação backend `redefinir_senha` chama `set_password`, mas não chama explicitamente `validate_password`; portanto, essa regra de 6 caracteres não é repetida no servidor no código atual.
- Para investigar problemas de envio, conferir `USE_BREVO` ou as variáveis SMTP no ambiente do backend, `DEFAULT_FROM_EMAIL`, `FRONTEND_URL` e os logs do Django. Nunca copie credenciais para chamados ou documentação.

### Identificar não é o mesmo que autorizar

`request.user` responde: **“qual usuário está fazendo este pedido?”**

Uma permission responde: **“esse usuário pode fazer esta operação?”**

Por exemplo, o token pode identificar corretamente um operador. O operador pode ter autorização para registrar a entrada de um veículo, mas não para registrar a saída. Nesse caso, o usuário está identificado, porém a operação é proibida.

Para saber como o perfil é representado, consulte `tipo_usuario` no modelo `Usuario`. A função `is_administrador`, em `permissions.py`, considera administrador quem tem `tipo_usuario = ADMINISTRADOR` ou é superusuário.

### Autenticado não é a mesma coisa que administrador

- **Não autenticado:** a API não recebeu um token de acesso válido.
- **Autenticado:** a API reconheceu o usuário.
- **Administrador:** o usuário autenticado tem `tipo_usuario = ADMINISTRADOR` ou é superusuário.
- **Operador:** o usuário autenticado não é administrador; pode fazer somente as operações permitidas para seu perfil.

A função `is_administrador` e as classes de permissão que usam essa distinção ficam em `permissions.py`.

### Quadro de acesso atual

| Operação | Quem pode fazer |
| --- | --- |
| Login | Qualquer pessoa pode enviar credenciais; é necessário CPF e senha válidos para obter tokens. |
| Consultar dados de usuário (`GET usuarios/me/`) | Rota configurada como pública, mas a própria ação exige que haja usuário autenticado. |
| Esqueci minha senha / redefinir senha | Rotas públicas; redefinir exige um link/token válido. |
| Listar ou consultar veículos e inventário | Usuário autenticado, administrador ou operador. |
| Cadastrar entrada de veículo (`POST veiculos/`) | Usuário autenticado, administrador ou operador. |
| Registrar saída de veículo | Apenas administrador. |
| Consultar veículos elegíveis ao leilão | Apenas administrador. |
| Alterar ou excluir veículo | Apenas administrador. |
| Consultar clientes, bancos, infrações e tabela DETRAN | Usuário autenticado, administrador ou operador. |
| Criar, alterar ou excluir esses cadastros | Apenas administrador. |
| Criar, alterar ou excluir usuários | Apenas administrador. |

As regras estão implementadas no backend:

- `IsVeiculoPermitido` controla as operações de veículos.
- `IsAdministradorOuLeitura` permite consulta a usuários autenticados e exige administrador para alterações nos cadastros.
- `IsAdministrador` exige administrador para a gestão de usuários.
- As ações de recuperação de senha usam `AllowAny` porque precisam estar acessíveis antes do login. A ação `me` também substitui a permissão padrão, mas verifica explicitamente se existe usuário autenticado.

### A tela também esconde algumas opções

O frontend verifica o tipo de usuário em `SISGEP.web/src/App.tsx` e impede a navegação a algumas telas administrativas. Isso melhora a experiência: o operador não deve receber opções que não pode usar.

Mas a proteção real também está no backend. Mesmo que alguém tente chamar a URL diretamente, a permissão do ViewSet verifica o usuário antes de executar a operação. **Esconder um botão não substitui a autorização do servidor.**

### O que significam 401 e 403?

- **401 — não autenticado:** faltou um token válido, ou o token não foi aceito.
- **403 — sem permissão:** a pessoa foi reconhecida, mas o seu perfil não pode fazer aquela operação.

Exemplo: sem login, tentar listar veículos deve resultar em `401`. Um operador autenticado tentando alterar um veículo deve resultar em `403`.

Para encontrar as verificações no código, comece em `sisgep/permissions.py`; depois veja qual `permission_classes` é usada pela classe ou ação em `sisgep/api_views/`.

## 9. Banco de dados e arquivos

Os modelos Django descrevem tabelas e relações. O **ORM** permite consultá-las e alterá-las usando Python; ele gera as operações SQL apropriadas.

- Sem `DATABASE_URL`, a configuração usa o arquivo SQLite local `db.sqlite3`.
- Com `DATABASE_URL`, a configuração usa a conexão indicada, por exemplo uma conexão PostgreSQL.
- `migrations/` guarda as mudanças versionadas na estrutura do banco.
- Fotos e documentos são arquivos de mídia. O arquivo em si fica no armazenamento de mídia; o banco guarda o caminho e a relação com o registro.
- `USE_CLOUDINARY` controla se o armazenamento configurado usa Cloudinary ou o armazenamento local.

### Como uma foto ou um PDF chega ao armazenamento?

Pense num arquivo como tendo duas partes:

1. **O conteúdo do arquivo** — os bytes reais da foto ou do PDF, guardados no armazenamento.
2. **A referência no banco** — o nome/caminho do arquivo e a ligação com o veículo, guardados pelo Django.

O fluxo de upload é:

```text
Pessoa escolhe um arquivo na tela
  → frontend coloca o arquivo em FormData
  → Axios envia multipart/form-data
  → Django recebe o arquivo
  → validador verifica o formato permitido
  → campo FileField/ImageField escolhe o armazenamento e a pasta
  → armazenamento grava o arquivo
  → banco guarda o caminho e a relação com o veículo
  → serializer inclui a referência na resposta da API
```

No formulário de entrada, as fotos são adicionadas a `FormData` com o nome `fotos`. Documentos são enviados em campos próprios, como `documento_apreensao` (DETRAN) e `documento_custodia` (banco). O Axios envia esses dados como `multipart/form-data`, um formato HTTP que carrega texto e arquivos no mesmo pedido.

O formulário de entrada exige quatro fotos identificadas como diagonal dianteira esquerda, diagonal dianteira direita, diagonal traseira esquerda e diagonal traseira direita. A API também rejeita o cadastro se não receber exatamente quatro fotos válidas, inclusive em chamadas diretas.

Para novos cadastros, a API também exige o documento de apreensão do DETRAN ou o documento de custódia do banco, conforme a categoria. Os campos continuam opcionais no modelo para manter compatibilidade com registros antigos e importações. Nos detalhes do veículo, a tela disponibiliza o documento correspondente para consulta quando ele existe.

No backend:

- `VeiculoViewSet.create` salva primeiro o veículo e depois chama `salvar_fotos_veiculo`.
- `salvar_fotos_veiculo` cria um registro `FotosVeiculo` para cada foto e o relaciona ao veículo.
- Os campos `ImageField` e `FileField` nos modelos indicam quais valores são arquivos e onde devem ser guardados.
- `upload_to` escolhe uma subpasta dentro do armazenamento. Por exemplo, as fotos de checklist usam `fotos/checklist/`; documentos do DETRAN usam `documentos/detran/apreensao/` ou `documentos/detran/liberacao/`.
- `validators.py` aceita fotos JPG, JPEG, PNG ou WEBP; documentos aceitam PDF e esses formatos de imagem. O formulário também faz uma checagem de extensão/tipo antes de enviar; o backend repete a validação.

O armazenamento efetivo depende da configuração:

- **Local:** com `USE_CLOUDINARY=False`, o Django usa armazenamento de arquivos no servidor. A configuração de mídia aponta para a pasta `media/` do backend, servida sob `/media/` durante o desenvolvimento.
- **Cloudinary:** com `USE_CLOUDINARY=True` e as credenciais configuradas, o armazenamento padrão de mídia usa Cloudinary. Os campos de documentos usam um armazenamento separado, configurado como `documents` em `config/settings.py`; a URL desse armazenamento é assinada e temporária.

O banco de dados **não guarda a foto ou o PDF inteiro como uma célula**. Ele guarda a referência para encontrar o arquivo. Por isso, fazer backup apenas do banco não basta para preservar os uploads locais: é preciso preservar também a pasta `media/` (ou o armazenamento remoto correspondente).

No frontend, `resolveMediaUrl`, em `SISGEP.web/src/api.tsx`, transforma a referência devolvida pela API em uma URL que a tela pode abrir para exibir a foto.

## 10. Como iniciar localmente

Use dois terminais: um para o backend e outro para o frontend. Os comandos abaixo são para PowerShell, executados a partir da raiz do repositório.

### Backend

```powershell
cd .\SISGEP.api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Se já existir um `.env`, não o substitua. Para criar o arquivo apenas quando ele ainda não existir, use:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Confira `.env.example` e configure as variáveis necessárias para o seu ambiente em `.env`. Não compartilhe esse arquivo nem publique segredos. Para usar a configuração local de SQLite, deixe `DATABASE_URL` sem valor; se for usar PostgreSQL, configure a URL correspondente.

Depois:

```powershell
python manage.py migrate
python manage.py runserver
```

A API local ficará em `http://127.0.0.1:8000/`. As rotas do SISGEP começam em `http://127.0.0.1:8000/api/auth/`.

### Frontend

Em outro terminal:

```powershell
cd .\SISGEP.web
npm install
npm run dev
```

O Vite informa no terminal o endereço local da interface, normalmente `http://localhost:5173/`. Por padrão, `src/api.tsx` chama a API em `http://localhost:8000/api/auth/`. Para apontar a outro backend, configure `VITE_API_URL` no ambiente do build/desenvolvimento.

É necessário ter uma conta válida para entrar. Este guia não define credenciais padrão.

## 11. Comandos úteis

Execute os comandos do Django dentro de `SISGEP.api/`:

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
```

Os testes automatizados do backend foram removidos; `manage.py check` verifica a configuração do Django, mas não substitui testes funcionais.

### Importar TRVs em PDF

O comando `importar_trvs` lê os dados dos TRVs e as quatro fotos diagonais. Por padrão, ele apenas mostra uma prévia: não consulta nem altera o banco e não envia arquivos ao armazenamento.

```powershell
python manage.py importar_trvs "C:\Users\Seu Nome\Downloads\Recolhas"
```

Confira a prévia e faça backup do banco e dos arquivos antes de executar a gravação:

```powershell
python manage.py importar_trvs "C:\Users\Seu Nome\Downloads\Recolhas" --commit
```

Com `--commit`, o SISGEP cadastra os veículos como **recolhidos**, guarda o PDF original em `documento_apreensao` e salva apenas as fotos “Diagonal Dianteira Esquerda”, “Diagonal Dianteira Direita”, “Diagonal Traseira Esquerda” e “Diagonal Traseira Direita”. Se um TRV tiver várias infrações, a primeira fica associada ao veículo e os códigos restantes vão para `observacoes`. O município é lido do documento; tabelas DETRAN e infrações principais precisam existir no SISGEP.

O importador não substitui nem apaga os PDFs da pasta. Uma execução posterior reconhece registros completos do mesmo TRV e os ignora; conflitos ou dados obrigatórios ausentes interrompem a importação com uma mensagem explícita.

O comando aceita TRVs de duas ou três páginas: lê os dados da primeira e as fotos da segunda; qualquer página adicional continua preservada no PDF original anexado.

Execute os scripts do frontend dentro de `SISGEP.web/`:

```powershell
npm run lint
npm run build
```

## 12. Vocabulário rápido

| Termo | Significado simples |
| --- | --- |
| **Requisição** | Pedido enviado pelo navegador ao backend. |
| **Rota** | Endereço que indica qual operação chamar. |
| **View / ViewSet** | Código que recebe o pedido e coordena a resposta. |
| **Model** | Descrição de um tipo de dado persistido no banco. |
| **Serializer** | Valida e converte dados de entrada e saída da API. |
| **Service** | Função de apoio para uma tarefa ou regra específica. |
| **ORM** | Ferramenta do Django para trabalhar com o banco usando Python. |
| **Migration** | Instrução versionada para criar ou alterar a estrutura do banco. |
| **JWT** | Token enviado para identificar o usuário em chamadas autenticadas. |

## 13. Resumo para explicar o SISGEP

> “O SISGEP possui um frontend React e uma API feita com Django REST Framework. O frontend envia requisições HTTP. As rotas Django direcionam cada pedido a uma view, que verifica permissões, coordena a operação e usa serializers para validar os dados. Os models representam os dados persistidos pelo ORM no banco. A API devolve uma resposta, e o frontend atualiza a tela.”
