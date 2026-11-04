const criarAgendamento = async (models, dados) => {
  if (!dados.servico || !dados.data_hora) {
    throw new Error("O serviço e a data/hora são obrigatórios.");
  }

  return await models.Agendamento.create({
    servico: dados.servico,
    data_hora: dados.data_hora,
    usuarioCpf: dados.usuarioCpf,
    status: dados.status || 'pendente'
  });
};

const listarAgendamentos = async (models) => {
  return await models.Agendamento.findAll({
    include: [models.User]
  });
};

const obterAgendamento = async (models, id) => {
  return await models.Agendamento.findByPk(id);
};

const atualizarAgendamento = async (models, id, dados) => {
  const agendamento = await models.Agendamento.findByPk(id);
  if (!agendamento) return null;

  return await agendamento.update(dados);
};

const removerAgendamento = async (models, id) => {
  const deletados = await models.Agendamento.destroy({
    where: { id },
  });
  return deletados > 0;
};

module.exports = {
  criarAgendamento,
  listarAgendamentos,
  obterAgendamento,
  atualizarAgendamento,
  removerAgendamento
};