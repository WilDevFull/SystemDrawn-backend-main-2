const db = require('../config/database');

const create = async (dados) => {
  const result = await db.query(
    `INSERT INTO agendamentos_tatuagem 
     (cpf_cliente, data_hora, descricao, tatuador, preco, status) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [dados.cpf_cliente, dados.data_hora, dados.descricao, dados.tatuador, dados.preco, dados.status]
  );
  return result.rows[0];
};

const findByUsuario = async (cpf) => {
  const result = await db.query(
    'SELECT * FROM agendamentos_tatuagem WHERE cpf_cliente = $1 ORDER BY data_hora DESC',
    [cpf]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query('SELECT * FROM agendamentos_tatuagem WHERE id = $1', [id]);
  return result.rows[0];
};

const update = async (id, d) => {
  const result = await db.query(
    `UPDATE agendamentos_tatuagem SET data_hora=$1, descricao=$2, tatuador=$3, preco=$4, status=$5 
     WHERE id=$6 RETURNING *`,
    [d.data_hora, d.descricao, d.tatuador, d.preco, d.status, id]
  );
  return result.rows[0];
};

const remove = async (id) => {
  await db.query('DELETE FROM agendamentos_tatuagem WHERE id = $1', [id]);
  return true;
};

const findProximos = async (cpf) => {
  const result = await db.query(
    "SELECT * FROM agendamentos_tatuagem WHERE cpf_cliente = $1 AND data_hora >= NOW() AND status != 'cancelado' ORDER BY data_hora ASC",
    [cpf]
  );
  return result.rows;
};

const findHistorico = async (cpf) => {
  const result = await db.query(
    "SELECT * FROM agendamentos_tatuagem WHERE cpf_cliente = $1 AND (data_hora < NOW() OR status = 'concluido') ORDER BY data_hora DESC",
    [cpf]
  );
  return result.rows;
};

module.exports = { create, findByUsuario, findById, update, remove, findProximos, findHistorico };