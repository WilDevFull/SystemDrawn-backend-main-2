const db =
  require('../config/database');

const create =
  async (dados) => {
    const result =
      await db.query(
        `
        INSERT INTO joias_piercing
        (
          tipo_piercing_id,
          nome,
          tipo,
          material,
          cor,
          preco,
          imagem
        )
        VALUES
        ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *
        `,
        [
          dados.tipo_piercing_id,
          dados.nome,
          dados.tipo,
          dados.material,
          dados.cor,
          dados.preco,
          dados.imagem,
        ]
      );

    return result.rows[0];
  };

const findAll =
  async () => {
    const result =
      await db.query(
        `
        SELECT *
        FROM joias_piercing
        ORDER BY nome ASC
        `
      );

    return result.rows;
  };

const findById =
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

const update =
  async (
    id,
    dados
  ) => {
    const result =
      await db.query(
        `
        UPDATE joias_piercing
        SET
          tipo_piercing_id = $1,
          nome = $2,
          tipo = $3,
          material = $4,
          cor = $5,
          preco = $6,
          imagem = $7
        WHERE id = $8
        RETURNING *
        `,
        [
          dados.tipo_piercing_id,
          dados.nome,
          dados.tipo,
          dados.material,
          dados.cor,
          dados.preco,
          dados.imagem,
          id,
        ]
      );

    return result.rows[0];
  };

const remove =
  async (id) => {
    await db.query(
      `
      DELETE FROM joias_piercing
      WHERE id = $1
      `,
      [id]
    );

    return true;
  };

const findByTipoPiercing =
  async (
    tipoPiercingId
  ) => {
    const result =
      await db.query(
        `
        SELECT *
        FROM joias_piercing
        WHERE tipo_piercing_id = $1
        ORDER BY nome ASC
        `,
        [tipoPiercingId]
      );

    return result.rows;
  };

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  findByTipoPiercing,
};