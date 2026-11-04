CREATE TABLE IF NOT EXISTS usuarios (
  cpf           VARCHAR(11)   NOT NULL,
  nome_completo VARCHAR(255)  NOT NULL,
  perfil        VARCHAR(20)   NOT NULL DEFAULT 'cliente' CHECK (perfil IN ('cliente', 'admin')),
  senha_hash    VARCHAR(255),
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_usuarios PRIMARY KEY (cpf)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_cpf ON usuarios (cpf);

COMMENT ON TABLE  usuarios               IS 'Usuários cadastrados no sistema SystemDrawn';
COMMENT ON COLUMN usuarios.cpf           IS 'CPF do usuário (somente dígitos, 11 chars) - chave primária';
COMMENT ON COLUMN usuarios.nome_completo IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.created_at    IS 'Data/hora de criação do registro';
COMMENT ON COLUMN usuarios.updated_at    IS 'Data/hora da última atualização do registro';

CREATE TABLE IF NOT EXISTS agendamentos_tatuagem (
  id            SERIAL        NOT NULL,
  cpf_cliente   VARCHAR(11)   NOT NULL,
  data_hora     TIMESTAMP     NOT NULL,
  descricao     TEXT          NOT NULL,
  tatuador      VARCHAR(255)  NOT NULL,
  preco         NUMERIC(10,2),
  status        VARCHAR(20)   NOT NULL DEFAULT 'pendente',
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT pk_agendamentos         PRIMARY KEY (id),
  CONSTRAINT fk_agendamentos_usuario FOREIGN KEY (cpf_cliente)
    REFERENCES usuarios(cpf) ON DELETE CASCADE,
  CONSTRAINT chk_status CHECK (
    status IN ('pendente', 'confirmado', 'cancelado', 'concluido')
  )
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_cpf_cliente ON agendamentos_tatuagem (cpf_cliente);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora   ON agendamentos_tatuagem (data_hora);

COMMENT ON TABLE  agendamentos_tatuagem              IS 'Agendamentos de sessões de tatuagem';
COMMENT ON COLUMN agendamentos_tatuagem.id           IS 'ID sequencial gerado automaticamente';
COMMENT ON COLUMN agendamentos_tatuagem.cpf_cliente  IS 'CPF do cliente (FK para usuarios.cpf)';
COMMENT ON COLUMN agendamentos_tatuagem.data_hora    IS 'Data e hora da sessão';
COMMENT ON COLUMN agendamentos_tatuagem.descricao    IS 'Descrição da tatuagem desejada';
COMMENT ON COLUMN agendamentos_tatuagem.tatuador     IS 'Nome do tatuador responsável';
COMMENT ON COLUMN agendamentos_tatuagem.preco        IS 'Preço estimado da sessão (opcional)';
COMMENT ON COLUMN agendamentos_tatuagem.status       IS 'Status: pendente | confirmado | cancelado | concluido';