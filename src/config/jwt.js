if (!process.env.JWT_SECRET) {
  throw new Error('[Config] JWT_SECRET não definida nas variáveis de ambiente.');
}

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
};

module.exports = jwtConfig;