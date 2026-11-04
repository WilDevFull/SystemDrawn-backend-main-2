const { AppError } = require('../errors/AppError');
const { agoraEmSaoPaulo, dataHoraEmSaoPaulo } = require('../utils/data.util');

const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const FORMATO_HORARIO = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const FORMATO_DATA_HORA =
  /^(\d{4}-\d{2}-\d{2})[T ]([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/;
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HORA_ABERTURA = 8;
const HORA_FECHAMENTO = 18;
const PRECO_MAXIMO = 99999999.99;

const estaVazio = (valor) =>
  valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');

const validateDataCivil = (data) => {
  const partes = typeof data === 'string' ? FORMATO_DATA.exec(data) : null;

  if (!partes) {
    throw new AppError('Data inválida. Use o formato AAAA-MM-DD, por exemplo 2026-10-26.', 400);
  }

  const [, ano, mes, dia] = partes.map(Number);
  const calendario = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    calendario.getUTCFullYear() !== ano ||
    calendario.getUTCMonth() !== mes - 1 ||
    calendario.getUTCDate() !== dia
  ) {
    throw new AppError('Data inválida. Esse dia não existe no calendário.', 400);
  }

  return data;
};

const validateHorario = (horario) => {
  const partes = typeof horario === 'string' ? FORMATO_HORARIO.exec(horario) : null;

  if (!partes) {
    throw new AppError('Horário inválido. Use o formato HH:MM, por exemplo 14:00.', 400);
  }

  return `${partes[1]}:${partes[2]}`;
};

const validateDataHora = (dataHora) => {
  if (estaVazio(dataHora)) {
    throw new AppError('Informe a data e o horário da tatuagem.', 400);
  }

  const texto = typeof dataHora === 'string' ? dataHora.trim() : '';
  const partes = FORMATO_DATA_HORA.exec(texto);

  if (!partes) {
    throw new AppError(
      'Data e horário inválidos. Use o formato AAAA-MM-DD HH:MM, por exemplo 2026-11-05 14:00.',
      400
    );
  }

  const [, data, hora, minuto, segundos = '', , fuso] = partes;
  validateDataCivil(data);

  if (!fuso) {
    return { data, horario: `${hora}:${minuto}` };
  }

  const [dataLocal, horarioLocal] = dataHoraEmSaoPaulo(
    new Date(`${data}T${hora}:${minuto}${segundos}${fuso}`)
  ).split(' ');

  return { data: dataLocal, horario: horarioLocal };
};

const validateMomentoAgendamento = (data, horario) => {
  if (`${data} ${horario}` < agoraEmSaoPaulo()) {
    throw new AppError('Não é possível agendar para um dia ou horário que já passou.', 400);
  }

  const hora = Number(horario.slice(0, 2));

  if (hora < HORA_ABERTURA || hora >= HORA_FECHAMENTO) {
    throw new AppError('Horário fora do expediente. O estúdio atende das 08:00 às 18:00.', 400);
  }
};

const validateTexto = (valor, nomeCampo, maximo) => {
  if (valor === undefined || valor === null) {
    return '';
  }

  if (typeof valor !== 'string') {
    throw new AppError(`O campo ${nomeCampo} precisa ser um texto.`, 400);
  }

  const texto = valor.trim();

  if (texto.length > maximo) {
    throw new AppError(`O campo ${nomeCampo} não pode passar de ${maximo} caracteres.`, 400);
  }

  return texto;
};

const validatePreco = (preco) => {
  if (estaVazio(preco)) {
    return null;
  }

  const valor = typeof preco === 'string' ? Number(preco.trim().replace(',', '.')) : preco;

  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > PRECO_MAXIMO) {
    throw new AppError('Preço inválido. Informe um valor a partir de 0, por exemplo 350.00.', 400);
  }

  return Math.round(valor * 100) / 100;
};

const validateUuid = (valor, mensagem) => {
  if (typeof valor !== 'string' || !FORMATO_UUID.test(valor)) {
    throw new AppError(mensagem, 400);
  }

  return valor.toLowerCase();
};

const validateDadosTatuagem = (dados = {}, { parcial = false } = {}) => {
  const validados = {};

  if (!parcial || dados.data_hora !== undefined) {
    const { data, horario } = validateDataHora(dados.data_hora);
    validateMomentoAgendamento(data, horario);
    validados.data_hora = `${data} ${horario}`;
  }

  if (!parcial || dados.descricao !== undefined) {
    validados.descricao = validateTexto(dados.descricao, 'descrição', 2000);

    if (!validados.descricao) {
      throw new AppError('Informe a descrição da tatuagem.', 400);
    }
  }

  if (!parcial || dados.tatuador !== undefined) {
    validados.tatuador = validateTexto(dados.tatuador, 'tatuador', 255);

    if (!validados.tatuador) {
      throw new AppError('Informe o nome do tatuador.', 400);
    }
  }

  if (!parcial || dados.preco !== undefined) {
    validados.preco = validatePreco(dados.preco);
  }

  return validados;
};

const validateDadosPiercing = (dados = {}, { parcial = false } = {}) => {
  const validados = {};

  if (!parcial) {
    validados.tipo_piercing_id = validateUuid(
      dados.tipo_piercing_id,
      'Escolha um tipo de piercing válido.'
    );
    validados.joia_piercing_id = validateUuid(dados.joia_piercing_id, 'Escolha uma joia válida.');
  }

  if (!parcial || dados.data !== undefined) {
    if (estaVazio(dados.data)) {
      throw new AppError('Informe a data do piercing.', 400);
    }

    validados.data = validateDataCivil(dados.data);
  }

  if (!parcial || dados.horario !== undefined) {
    if (estaVazio(dados.horario)) {
      throw new AppError('Informe o horário do piercing.', 400);
    }

    validados.horario = validateHorario(dados.horario);
  }

  if (!parcial || dados.observacao !== undefined) {
    validados.observacao = validateTexto(dados.observacao, 'observação', 500);
  }

  if (!parcial) {
    validateMomentoAgendamento(validados.data, validados.horario);
  }

  return validados;
};

module.exports = {
  FORMATO_UUID,
  validateDataCivil,
  validateHorario,
  validateMomentoAgendamento,
  validateDadosTatuagem,
  validateDadosPiercing,
};