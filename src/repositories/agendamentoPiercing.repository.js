const db =
  require(
    '../config/database'
  );

const create =
  async (dados) => {

    const result =
      await db.query(
        `
        INSERT INTO agendamentos_piercing
        (
          usuario_cpf,
          tipo_piercing_id,
          joia_piercing_id,
          observacao,
          data,
          horario,
          status
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          dados.usuarioCpf,
          dados.tipoPiercingId,
          dados.joiaPiercingId,
          dados.observacao,
          dados.data,
          dados.horario,
          dados.status,
        ]
      );

    return result.rows[0];
  };

const buscarTipoPorId =
  async (id) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM tipos_piercing
        WHERE id = $1
        `,
        [id]
      );

    return result.rows[0];
  };

const buscarJoiaPorId =
  async (id) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM joias_piercing
        WHERE id = $1
        `,
        [id]
      );

    return result.rows[0];
  };

const verificarHorario =
  async (
    data,
    horario,
    agendamentoId = null
  ) => {

    let query = `
      SELECT *
      FROM agendamentos_piercing
      WHERE data = $1
      AND horario = $2
    `;

    const params = [
      data,
      horario,
    ];

    if (
      agendamentoId
    ) {

      query +=
        `
        AND id != $3
        `;

      params.push(
        agendamentoId
      );
    }

    const result =
      await db.query(
        query,
        params
      );

    return result.rows[0];
  };

const findByUsuario =
  async (cpf) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM agendamentos_piercing
        WHERE usuario_cpf = $1
        ORDER BY
        data DESC,
        horario DESC
        `,
        [cpf]
      );

    return result.rows;
  };

const findById =
  async (id) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM agendamentos_piercing
        WHERE id = $1
        `,
        [id]
      );

    return result.rows[0];
  };

const update =
  async (
    id,
    dados
  ) => {

    const result =
      await db.query(
        `
        UPDATE
          agendamentos_piercing
        SET
          data = $1,
          horario = $2,
          observacao = $3,
          status = $4
        WHERE id = $5
        RETURNING *
        `,
        [
          dados.data,
          dados.horario,
          dados.observacao,
          dados.status,
          id,
        ]
      );

    return result.rows[0];
  };

const remove =
  async (id) => {

    await db.query(
      `
      DELETE FROM
      agendamentos_piercing
      WHERE id = $1
      `,
      [id]
    );

    return true;
  };

const findProximos =
  async (cpf) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM agendamentos_piercing
        WHERE usuario_cpf = $1
        AND data >= CURRENT_DATE
        ORDER BY
        data ASC,
        horario ASC
        `,
        [cpf]
      );

    return result.rows;
  };

const findHistorico =
  async (cpf) => {

    const result =
      await db.query(
        `
        SELECT *
        FROM agendamentos_piercing
        WHERE usuario_cpf = $1
        AND data < CURRENT_DATE
        ORDER BY
        data DESC,
        horario DESC
        `,
        [cpf]
      );

    return result.rows;
  };

module.exports = {
  create,
  buscarTipoPorId,
  buscarJoiaPorId,
  verificarHorario,
  findByUsuario,
  findById,
  update,
  remove,
  findProximos,
  findHistorico,
};