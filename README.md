# Clínica Cardiologia

Sistema de gestão de autenticação e dashboard para clínica de cardiologia.

## Funcionalidades

- ✅ Autenticação de utilizadores (login/logout)
- ✅ Reset de password com email
- ✅ Dashboard para profissionais
- ✅ Proteção de rotas com JWT
- ✅ Bloqueio de conta após múltiplas tentativas de login
- ✅ Interface responsiva

## Pré-requisitos

- Node.js v14+
- PostgreSQL v10+
- npm ou yarn

## Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/joanaa8/Clinica_cardiologia.git
cd Clinica_cardiologia
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Copie o ficheiro de exemplo
cp .env.example .env

# Edite o .env com as suas credenciais
# DB_USER=seu_usuario
# DB_PASSWORD=sua_senha
# JWT_SECRET=sua_chave_secreta
```

4. **Configure a base de dados**
```bash
# Aceda ao PostgreSQL
psql -U postgres

# Crie a base de dados
CREATE DATABASE clinica_db;

# Importe o schema (se existir)
# \i schema.sql
```

## Uso

1. **Inicie o servidor**
```bash
npm start
```

2. **Aceda à aplicação**
```
http://localhost:3000
```

## Estrutura do Projeto

```
├── config/           # Configurações (BD)
├── controllers/      # Lógica das rotas
├── models/          # Modelos de dados
├── routes/          # Definição das rotas
├── middlewares/     # Middlewares de autenticação
├── public/          # Ficheiros estáticos (HTML, CSS, JS)
├── server.js        # Entrada da aplicação
└── .env.example     # Variáveis de ambiente (exemplo)
```

## Rotas da API

### Autenticação

- `POST /api/auth/login` - Login de utilizador
  ```json
  {
    "username": "utilizador",
    "password": "senha"
  }
  ```

- `POST /api/auth/reset-password` - Reset de password
  ```json
  {
    "email": "utilizador@email.com",
    "password": "nova_senha"
  }
  ```

## Páginas Públicas

- `/` - Página inicial
- `/recuperarpass.html` - Recuperação de password
- `/redefinirpass.html` - Redefinição de password

## Páginas Protegidas

- `/profissional.html` - Dashboard do profissional (requer JWT)

## Tecnologias

- **Backend**: Node.js + Express.js
- **Base de Dados**: PostgreSQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Criptografia**: Bcrypt
- **Frontend**: HTML5 + CSS3 + JavaScript

## Segurança

- ✅ Senhas criptografadas com Bcrypt
- ✅ Tokens JWT com expiração de 1 hora
- ✅ Proteção contra força bruta (bloqueio após 3 tentativas)
- ✅ Variáveis sensíveis em `.env` (não incluído no Git)
- ✅ CORS configurado
- ✅ Tratamento de erros seguro

## Contribuição

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.

## Licença

ISC

## Autores

- Joana (@joanaa8)
- Ariana (@arianac0)
- João (@Joaolivv)
- Matilde (@MatildeReis09)
