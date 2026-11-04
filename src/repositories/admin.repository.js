const db = require('../config/database');

const SELECT_TATUAGENS = `
  SELECT t.id,
         TO_CHAR(t.data_hora, 'YYYY-MM-DD') AS data,
         TO_CHAR(t.data_hora, 'HH24:MI') AS horario,
         t.cpf_cliente AS cliente_cpf,
         u.nome_completo AS cliente_nome,
         t.descricao,
         t.status
  FROM agendamentos_tatuagem t
  LEFT JOIN usuarios u ON u.cpf = t.cpf_cliente`;

const SELECT_PIERCINGS = `
  SELECT p.id,
         TO_CHAR(p.data, 'YYYY-MM-DD') AS data,
         TO_CHAR(p.horario, 'HH24:MI') AS horario,
         p.usuario_cpf AS cliente_cpf,
         u.nome_completo AS cliente_nome,
         tp.local,
         tp.sub_local,
         p.status
  FROM agendamentos_piercing p
  LEFT JOIN usuarios u ON u.cpf = p.usuario_cpf
  LEFT JOIN tipos_piercing tp ON tp.id = p.tipo_piercing_id`;

const findTatuagensDoDia = async (data) => {
  const result = await db.query(
    `${SELECT_TATUAGENS}
     WHERE t.data_hora::date = $1::date
     ORDER BY t.data_hora`,
    [data]
  );
  return result.rows;
};

const findPiercingsDoDia = async (data) => {
  const result = await db.query(
    `${SELECT_PIERCINGS}
     WHERE p.data = $1::date
     ORDER BY p.horario`,
    [data]
  );
  return result.rows;
};

const findTatuagensPendentes = async () => {
  const result = await db.query(
    `${SELECT_TATUAGENS}
     WHERE t.status = 'pendente'
     ORDER BY t.data_hora`
  );
  return result.rows;
};

const findPiercingsPendentes = async () => {
  const result = await db.query(
    `${SELECT_PIERCINGS}
     WHERE p.status = 'pendente'
     ORDER BY p.data, p.horario`
  );
  return result.rows;
};

const findTatuagemPorId = async (id) => {
  const result = await db.query(`${SELECT_TATUAGENS} WHERE t.id = $1`, [id]);
  return result.rows[0] || null;
};

const findPiercingPorId = async (id) => {
  const result = await db.query(`${SELECT_PIERCINGS} WHERE p.id = $1`, [id]);
  return result.rows[0] || null;
};

const existeTatuagemConfirmadaNoMesmoHorario = async (id) => {
  const result = await db.query(
    `SELECT outra.id
     FROM agendamentos_tatuagem alvo
     JOIN agendamentos_tatuagem outra
       ON outra.tatuador = alvo.tatuador
      AND outra.data_hora = alvo.data_hora
      AND outra.id <> alvo.id
     WHERE alvo.id = $1
       AND outra.status = 'confirmado'
     LIMIT 1`,
    [id]
  );
  return result.rows.length > 0;
};

const atualizarStatusTatuagem = async (id, novoStatus) => {
  const result = await db.query(
    `UPDATE agendamentos_tatuagem
     SET status = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'pendente'
     RETURNING id`,
    [id, novoStatus]
  );
  return result.rows[0] || null;
};

const atualizarStatusPiercing = async (id, novoStatus) => {
  const result = await db.query(
    `UPDATE agendamentos_piercing
     SET status = $2
     WHERE id = $1 AND status = 'pendente'
     RETURNING id`,
    [id, novoStatus]
  );
  return result.rows[0] || null;
};

module.exports = {
  findTatuagensDoDia,
  findPiercingsDoDia,
  findTatuagensPendentes,
  findPiercingsPendentes,
  findTatuagemPorId,
  findPiercingPorId,
  existeTatuagemConfirmadaNoMesmoHorario,
  atualizarStatusTatuagem,
  atualizarStatusPiercing,
};