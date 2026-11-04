const { AppError } = require('../errors/AppError');
const { sanitizeCpf, validateCpf } = require('../utils/cpf.util');
const { validarNomeCompleto } = require('../utils/validators');

const validateAndSanitizeCpf = (cpf) => {
  if (!cpf || typeof cpf !== 'string') {
    throw new AppError('CPF é obrigatório.', 400);
  }

  const sanitized = sanitizeCpf(cpf);

  if (sanitized.length !== 11) {
    throw new AppError('CPF deve conter exatamente 11 dígitos.', 400);
  }

  if (!validateCpf(sanitized)) {
    throw new AppError('CPF inválido.', 400);
  }

  return sanitized;
};

const validateNomeCompleto = (nomeCompleto) => {
  if (!nomeCompleto || typeof nomeCompleto !== 'string') {
    throw new AppError('Nome completo é obrigatório.', 400);
  }

  const trimmed = nomeCompleto.trim();

  if (trimmed.length < 3) {
    throw new AppError('Nome completo deve ter ao menos 3 caracteres.', 400);
  }

  if (trimmed.length > 255) {
    throw new AppError('Nome completo não pode exceder 255 caracteres.', 400);
  }

  if (!validarNomeCompleto(trimmed)) {
    throw new AppError('Informe um nome completo válido (nome e sobrenome) contendo apenas letras.', 400);
  }

  return trimmed;
};

const validateSenha = (senha) => {
  if (!senha || typeof senha !== 'string' || senha.trim() === '') {
    throw new AppError('Senha é obrigatória.', 400);
  }

  if (senha.length > 128) {
    throw new AppError('Senha não pode exceder 128 caracteres.', 400);
  }

  return senha;
};

module.exports = { validateAndSanitizeCpf, validateNomeCompleto, validateSenha };