CREATE TABLE IF NOT EXISTS notificacoes (
  id              SERIAL PRIMARY KEY,
  usuario_cpf     VARCHAR(11)   NOT NULL,

  tipo            VARCHAR(50)   NOT NULL,

  titulo          VARCHAR(100)  NOT NULL,
  mensagem        TEXT          NOT NULL,
  lida            BOOLEAN       DEFAULT FALSE,

  referencia_id   INTEGER,
  referencia_tipo VARCHAR(20),

  criada_em       TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario
ON notificacoes(usuario_cpf);

CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas
ON notificacoes(usuario_cpf, lida)
WHERE lida = FALSE;
