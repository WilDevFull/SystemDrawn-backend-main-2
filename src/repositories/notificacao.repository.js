const db =
  require('../config/database');

const create =
  async (dados) => {
    const result =
      await db.query(
        `
        INSERT INTO notificacoes
        (
          usuario_cpf,
          tipo,
          titulo,
          mensagem
        )
        VALUES
        ($1,$2,$3,$4)
        RETURNING *
        `,
        [
          dados.usuarioCpf,
          dados.tipo,
          dados.titulo,
          dados.mensagem,
        ]
      );

    return result.rows[0];
  };

const findByUsuario =
  async (cpf) => {
    const result =
      await db.query(
        `
        SELECT *
        FROM notificacoes
        WHERE usuario_cpf = $1
        ORDER BY created_at DESC
        `,
        [cpf]
      );

    return result.rows;
  };

const findNaoLidas =
  async (cpf) => {
    const result =
      await db.query(
        `
        SELECT *
        FROM notificacoes
        WHERE usuario_cpf = $1
        AND lida = FALSE
        ORDER BY created_at DESC
        `,
        [cpf]
      );

    return result.rows;
  };

const marcarComoLida =
  async (id, cpf) => {
    const result =
      await db.query(
        `
        UPDATE notificacoes
        SET lida = TRUE
        WHERE id = $1
        AND usuario_cpf = $2
        RETURNING *
        `,
        [id, cpf]
      );

    return result.rows[0];
  };

const marcarTodasComoLidas =
  async (cpf) => {
    const result =
      await db.query(
        `
        UPDATE notificacoes
        SET lida = TRUE
        WHERE usuario_cpf = $1
        AND lida = FALSE
        RETURNING *
        `,
        [cpf]
      );

    return result.rows;
  };

const contarNaoLidas =
  async (cpf) => {
    const result =
      await db.query(
        `
        SELECT COUNT(*) AS total
        FROM notificacoes
        WHERE usuario_cpf = $1
        AND lida = FALSE
        `,
        [cpf]
      );

    return parseInt(
      result.rows[0].total,
      10
    );
  };

const remove =
  async (id, cpf) => {
    await db.query(
      `
      DELETE FROM notificacoes
      WHERE id = $1
      AND usuario_cpf = $2
      `,
      [id, cpf]
    );

    return true;
  };

module.exports = {
  create,
  findByUsuario,
  findNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  contarNaoLidas,
  remove,
};