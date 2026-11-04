const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('[Config] DATABASE_URL não definida nas variáveis de ambiente.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('[DB] Nova conexão estabelecida com o pool.');
});

pool.on('error', (err) => {
  console.error('[DB] Erro inesperado no pool de conexões:', err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query executada em ${duration}ms | Linhas: ${result.rowCount}`);
    return result;
  } catch (error) {
    console.error('[DB] Erro ao executar query:', error.message);
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };