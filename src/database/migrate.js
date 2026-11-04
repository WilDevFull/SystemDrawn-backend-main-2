require('dotenv').config();

const db = require('../config/database');

const SQL_CREATE_USUARIOS = `
  CREATE TABLE IF NOT EXISTS usuarios (
    cpf           VARCHAR(11)   NOT NULL,
    nome_completo VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_usuarios PRIMARY KEY (cpf)
  );
`;

const SQL_INDEX_USUARIOS = `
  CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios (cpf);
`;

const SQL_ADD_PERFIL_USUARIOS = `
  ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS perfil VARCHAR(20) NOT NULL DEFAULT 'cliente'
    CHECK (perfil IN ('cliente', 'admin'));
`;

const SQL_ADD_SENHA_USUARIOS = `
  ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
`;

const SQL_CREATE_AGENDAMENTOS = `
  CREATE TABLE IF NOT EXISTS agendamentos_tatuagem (
    id           SERIAL        NOT NULL,
    cpf_cliente  VARCHAR(11)   NOT NULL,
    data_hora    TIMESTAMP     NOT NULL,
    descricao    TEXT          NOT NULL,
    tatuador     VARCHAR(255)  NOT NULL,
    preco        NUMERIC(10,2),
    status       VARCHAR(20)   NOT NULL DEFAULT 'pendente',
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_agendamentos         PRIMARY KEY (id),
    CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (cpf_cliente)
      REFERENCES usuarios(cpf) ON DELETE CASCADE,
    CONSTRAINT chk_status CHECK (
      status IN ('pendente', 'confirmado', 'cancelado', 'concluido')
    )
  );
`;

const SQL_INDEX_AGENDAMENTOS_CPF = `
  CREATE INDEX IF NOT EXISTS idx_agendamentos_cpf_cliente ON agendamentos_tatuagem (cpf_cliente);
`;

const SQL_INDEX_AGENDAMENTOS_DATA = `
  CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos_tatuagem (data_hora);
`;

const SQL_CHECK_STATUS_PIERCING = `
  DO $$
  BEGIN
    IF to_regclass('public.agendamentos_piercing') IS NULL THEN
      RETURN;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.agendamentos_piercing'::regclass
        AND conname = 'chk_status_piercing'
    ) THEN
      ALTER TABLE agendamentos_piercing
        ADD CONSTRAINT chk_status_piercing
        CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')) NOT VALID;
    END IF;
  END
  $$;
`;

const run = async () => {
  console.log('[Migrate] Iniciando migração do banco de dados...');

  try {
    await db.query(SQL_CREATE_USUARIOS);
    console.log('[Migrate] Tabela "usuarios" verificada/criada com sucesso.');

    await db.query(SQL_INDEX_USUARIOS);
    console.log('[Migrate] Índice "idx_usuarios_cpf" verificado/criado com sucesso.');

    await db.query(SQL_ADD_PERFIL_USUARIOS);
    console.log('[Migrate] Coluna "perfil" da tabela "usuarios" verificada/criada com sucesso.');

    await db.query(SQL_ADD_SENHA_USUARIOS);
    console.log('[Migrate] Coluna "senha_hash" da tabela "usuarios" verificada/criada com sucesso.');

    await db.query(SQL_CREATE_AGENDAMENTOS);
    console.log('[Migrate] Tabela "agendamentos_tatuagem" verificada/criada com sucesso.');

    await db.query(SQL_INDEX_AGENDAMENTOS_CPF);
    console.log('[Migrate] Índice "idx_agendamentos_cpf_cliente" verificado/criado com sucesso.');

    await db.query(SQL_INDEX_AGENDAMENTOS_DATA);
    console.log('[Migrate] Índice "idx_agendamentos_data_hora" verificado/criado com sucesso.');

    await db.query(SQL_CHECK_STATUS_PIERCING);
    console.log('[Migrate] Regra de status da tabela "agendamentos_piercing" verificada/criada com sucesso.');

    console.log('[Migrate] Migração concluída com sucesso!');
  } catch (error) {
    console.error('[Migrate] Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    await db.pool.end();
    console.log('[Migrate] Pool de conexões encerrado.');
  }
};

run();