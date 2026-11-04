const agendamentoRepository = require('../repositories/agendamentoTatuagem.repository');
const { AppError } = require('../errors/AppError');

const criar = async (usuarioCpf, dados) => {
  const novoAgendamento = {
    cpf_cliente: usuarioCpf,
    data_hora: dados.data_hora,
    descricao: dados.descricao,
    tatuador: dados.tatuador,
    preco: dados.preco,
    status: 'pendente'
  };

  return await agendamentoRepository.create(novoAgendamento);
};

const listarPorUsuario = async (usuarioCpf) => {
  return await agendamentoRepository.findByUsuario(usuarioCpf);
};

const buscarPorId = async (id, usuarioCpf) => {
  const ag = await agendamentoRepository.findById(id);
  if (!ag || ag.cpf_cliente !== usuarioCpf) {
    throw new AppError('Agendamento não encontrado.', 404);
  }
  return ag;
};

const atualizar = async (id, usuarioCpf, dados) => {
  const agExistente = await buscarPorId(id, usuarioCpf);
  const remarcou = dados.data_hora !== undefined;
  const dadosAtualizados = {
    ...agExistente,
    ...dados,
    status: remarcou ? 'pendente' : agExistente.status,
  };
  return await agendamentoRepository.update(id, dadosAtualizados);
};

const remover = async (id, usuarioCpf) => {
  await buscarPorId(id, usuarioCpf);
  return await agendamentoRepository.remove(id);
};

const listarProximos = async (usuarioCpf) => {
  return await agendamentoRepository.findProximos(usuarioCpf);
};

const listarHistorico = async (usuarioCpf) => {
  return await agendamentoRepository.findHistorico(usuarioCpf);
};

module.exports = {
  criar,
  listarPorUsuario,
  buscarPorId,
  atualizar,
  remover,
  listarProximos,
  listarHistorico
};