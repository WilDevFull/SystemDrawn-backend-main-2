const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { AppError } = require('../errors/AppError');

const generateToken = (payload) => {
  return jwt.sign(
    {
      cpf: payload.cpf,
      nomeCompleto: payload.nomeCompleto,
      perfil: payload.perfil === 'admin' ? 'admin' : 'cliente',
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token expirado. Faça login novamente.', 401);
    }
    throw new AppError('Token inválido.', 401);
  }
};

module.exports = { generateToken, verifyToken };