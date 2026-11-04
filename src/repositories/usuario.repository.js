const db = require('../config/database');

const findByCpf = async (cpf) => {
  const result = await db.query(
    'SELECT cpf, nome_completo, created_at, updated_at FROM usuarios WHERE cpf = $1',
    [cpf]
  );
  return result.rows[0] || null;
};

const create = async (cpf, nomeCompleto) => {
  const result = await db.query(
    `INSERT INTO usuarios (cpf, nome_completo, created_at, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     RETURNING cpf, nome_completo, created_at, updated_at`,
    [cpf, nomeCompleto]
  );
  return result.rows[0];
};

const findByCpfComSenha = async (cpf) => {
  const result = await db.query(
    'SELECT cpf, nome_completo, perfil, senha_hash FROM usuarios WHERE cpf = $1',
    [cpf]
  );
  return result.rows[0] || null;
};

const tornarAdmin = async (cpf, senhaHash) => {
  const result = await db.query(
    `UPDATE usuarios
     SET perfil = 'admin', senha_hash = $2, updated_at = NOW()
     WHERE cpf = $1
     RETURNING cpf, nome_completo, perfil`,
    [cpf, senhaHash]
  );
  return result.rows[0] || null;
};

module.exports = { findByCpf, create, findByCpfComSenha, tornarAdmin };