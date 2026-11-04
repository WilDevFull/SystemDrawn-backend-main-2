const pool = require('../config/database');

const criar = async (dados) => {
  const { nome_estilo, descricao, preco_estimado, imagem_exemplo } = dados;
  const query = `
    INSERT INTO estilos_tatuagem (nome_estilo, descricao, preco_estimado, imagem_exemplo)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const result = await pool.query(query, [nome_estilo, descricao, preco_estimado, imagem_exemplo]);
  return result.rows[0];
};

const listarTodos = async () => {
  const result = await pool.query('SELECT * FROM estilos_tatuagem ORDER BY nome_estilo ASC');
  return result.rows;
};

const buscarPorId = async (id) => {
  const result = await pool.query('SELECT * FROM estilos_tatuagem WHERE id = $1', [id]);
  return result.rows[0];
};

const atualizar = async (id, dados) => {
  const { nome_estilo, descricao, preco_estimado, imagem_exemplo } = dados;
  const query = `
    UPDATE estilos_tatuagem 
    SET nome_estilo = $1, descricao = $2, preco_estimado = $3, imagem_exemplo = $4
    WHERE id = $5 RETURNING *;
  `;
  const result = await pool.query(query, [nome_estilo, descricao, preco_estimado, imagem_exemplo, id]);
  return result.rows[0];
};

const remover = async (id) => {
  await pool.query('DELETE FROM estilos_tatuagem WHERE id = $1', [id]);
};

module.exports = { criar, listarTodos, buscarPorId, atualizar, remover };