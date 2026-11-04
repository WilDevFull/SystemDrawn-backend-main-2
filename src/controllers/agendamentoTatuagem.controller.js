const agendamentoService = require('../services/agendamentoTatuagem.service');
const { AppError } = require('../errors/AppError');
const { validateDadosTatuagem } = require('../validations/agendamento.validation');

const criar = async (req, res, next) => {
  try {
    const dados = validateDadosTatuagem(req.body);
    const novo = await agendamentoService.criar(req.user.cpf, dados);
    return res.status(201).json({ success: true, agendamento: novo });
  } catch (error) {
    next(error);
  }
};

const listar = async (req, res, next) => {
  try {
    const lista = await agendamentoService.listarPorUsuario(req.user.cpf);
    return res.status(200).json({ success: true, agendamentos: lista });
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const ag = await agendamentoService.buscarPorId(Number(req.params.id), req.user.cpf);
    return res.status(200).json({ success: true, agendamento: ag });
  } catch (error) {
    next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const dados = validateDadosTatuagem(req.body, { parcial: true });
    const ag = await agendamentoService.atualizar(Number(req.params.id), req.user.cpf, dados);
    return res.status(200).json({ success: true, agendamento: ag });
  } catch (error) {
    next(error);
  }
};

const remover = async (req, res, next) => {
  try {
    await agendamentoService.remover(Number(req.params.id), req.user.cpf);
    return res.status(200).json({ success: true, message: 'Agendamento removido com sucesso.' });
  } catch (error) {
    next(error);
  }
};

const listarPorUsuario = async (req, res, next) => {
  try {
    const cpfParam = req.params.cpf;
    if (cpfParam !== req.user.cpf) {
      throw new AppError('Você não tem permissão para acessar os agendamentos de outro usuário.', 403);
    }
    const lista = await agendamentoService.listarPorUsuario(cpfParam);
    return res.status(200).json({ success: true, agendamentos: lista });
  } catch (error) {
    next(error);
  }
};

const listarProximos = async (req, res, next) => {
  try {
    const lista = await agendamentoService.listarProximos(req.user.cpf);
    return res.status(200).json({ success: true, agendamentos: lista });
  } catch (error) {
    next(error);
  }
};

const listarHistorico = async (req, res, next) => {
  try {
    const lista = await agendamentoService.listarHistorico(req.user.cpf);
    return res.status(200).json({ success: true, agendamentos: lista });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  remover,
  listarPorUsuario,
  listarProximos,
  listarHistorico,
};