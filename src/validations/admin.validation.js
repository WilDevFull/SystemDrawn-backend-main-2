const { AppError } = require('../errors/AppError');
const { hojeEmSaoPaulo } = require('../utils/data.util');
const { FORMATO_UUID, validateDataCivil } = require('./agendamento.validation');

const validateDataAgenda = (data) => {
  if (data === undefined || data === '') {
    return hojeEmSaoPaulo();
  }

  return validateDataCivil(data);
};

const TIPOS_AGENDAMENTO = ['tatuagem', 'piercing'];
const FORMATO_ID_TATUAGEM = /^[1-9]\d{0,8}$/;

const validateAgendamentoParams = ({ tipo, id }) => {
  if (!TIPOS_AGENDAMENTO.includes(tipo)) {
    throw new AppError('Tipo de agendamento inválido. Use tatuagem ou piercing.', 400);
  }

  const formatoId = tipo === 'tatuagem' ? FORMATO_ID_TATUAGEM : FORMATO_UUID;

  if (typeof id !== 'string' || !formatoId.test(id)) {
    throw new AppError('Código do agendamento inválido.', 400);
  }

  return { tipo, id };
};

const validateMotivo = (motivo) => {
  if (motivo === undefined || motivo === null || motivo === '') {
    return null;
  }

  if (typeof motivo !== 'string') {
    throw new AppError('O motivo da recusa precisa ser um texto.', 400);
  }

  const texto = motivo.trim();

  if (texto.length > 255) {
    throw new AppError('O motivo da recusa não pode passar de 255 caracteres.', 400);
  }

  return texto || null;
};

module.exports = { validateDataAgenda, validateAgendamentoParams, validateMotivo };