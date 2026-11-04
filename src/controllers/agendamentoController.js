const agendamentoService = require("../services/agendamentoService");

const criarAgendamento = async (req, res) => {
  try {
    const novoAgendamento = await agendamentoService.criarAgendamento(req.context.models, req.body);
    res.status(201).send(novoAgendamento);
  } catch (error) {
    res.status(400).send({ erro: error.message });
  }
};

const listarAgendamentos = async (req, res) => {
  try {
    const agendamentos = await agendamentoService.listarAgendamentos(req.context.models);
    res.status(200).send(agendamentos);
  } catch (error) {
    res.status(500).send({ erro: "Erro ao listar agendamentos" });
  }
};

const obterAgendamento = async (req, res) => {
  try {
    const agendamento = await agendamentoService.obterAgendamento(req.context.models, req.params.id);
    if (!agendamento) {
      return res.status(404).send({ erro: "Agendamento não encontrado" });
    }
    res.status(200).send(agendamento);
  } catch (error) {
    res.status(500).send({ erro: "Erro ao obter agendamento" });
  }
};

const atualizarAgendamento = async (req, res) => {
  try {
    const agendamentoAtualizado = await agendamentoService.atualizarAgendamento(
      req.context.models,
      req.params.id,
      req.body
    );
    if (!agendamentoAtualizado) {
      return res.status(404).send({ erro: "Agendamento não encontrado" });
    }
    res.status(200).send(agendamentoAtualizado);
  } catch (error) {
    res.status(500).send({ erro: "Erro ao atualizar agendamento" });
  }
};

const removerAgendamento = async (req, res) => {
  try {
    const sucesso = await agendamentoService.removerAgendamento(req.context.models, req.params.id);
    if (!sucesso) {
      return res.status(404).send({ erro: "Agendamento não encontrado" });
    }
    res.status(200).send({ mensagem: "Agendamento removido com sucesso" });
  } catch (error) {
    res.status(500).send({ erro: "Erro ao remover agendamento" });
  }
};

module.exports = {
  criarAgendamento,
  listarAgendamentos,
  obterAgendamento,
  atualizarAgendamento,
  removerAgendamento
};