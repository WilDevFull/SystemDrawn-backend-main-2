const adminRepository = require('../repositories/admin.repository');
const notificacaoService = require('./notificacao.service');
const { AppError } = require('../errors/AppError');
const { agoraEmSaoPaulo, formatarDataBrasileira } = require('../utils/data.util');

const STATUS_PARA_TELA = {
  pendente: 'pending',
  confirmado: 'confirmed',
  cancelado: 'cancelled',
  concluido: 'completed',
};

const SITUACAO_ATUAL = {
  confirmado: 'já foi aprovado',
  cancelado: 'já foi cancelado ou recusado',
  concluido: 'já foi concluído',
};

const DECISOES = {
  aprovar: {
    novoStatus: 'confirmado',
    tipoNotificacao: 'appointment_confirmed',
    titulo: 'Agendamento aprovado',
    resultado: { tatuagem: 'aprovada', piercing: 'aprovado' },
  },
  recusar: {
    novoStatus: 'cancelado',
    tipoNotificacao: 'appointment_cancelled',
    titulo: 'Agendamento recusado',
    resultado: { tatuagem: 'recusada', piercing: 'recusado' },
  },
};

const NOME_SERVICO = { tatuagem: 'Sua tatuagem', piercing: 'Seu piercing' };

const formatarStatus = (status) => STATUS_PARA_TELA[status] || status;

const formatarTatuagem = (agendamento) => ({
  id: `tatuagem-${agendamento.id}`,
  type: 'tatuagem',
  appointmentId: String(agendamento.id),
  date: agendamento.data,
  time: agendamento.horario,
  clientName: agendamento.cliente_nome || 'Cliente sem cadastro',
  service: `Tatuagem - ${agendamento.descricao}`,
  status: formatarStatus(agendamento.status),
});

const formatarPiercing = (agendamento) => ({
  id: `piercing-${agendamento.id}`,
  type: 'piercing',
  appointmentId: String(agendamento.id),
  date: agendamento.data,
  time: agendamento.horario,
  clientName: agendamento.cliente_nome || 'Cliente sem cadastro',
  service: agendamento.sub_local
    ? `Piercing ${agendamento.sub_local} (${agendamento.local})`
    : 'Piercing',
  status: formatarStatus(agendamento.status),
});

const OPERACOES = {
  tatuagem: {
    buscarPorId: (id) => adminRepository.findTatuagemPorId(id),
    atualizarStatus: (id, status) => adminRepository.atualizarStatusTatuagem(id, status),
    formatar: formatarTatuagem,
  },
  piercing: {
    buscarPorId: (id) => adminRepository.findPiercingPorId(id),
    atualizarStatus: (id, status) => adminRepository.atualizarStatusPiercing(id, status),
    formatar: formatarPiercing,
  },
};

const ordenarPorDataEHora = (a, b) =>
  `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`) ||
  a.clientName.localeCompare(b.clientName);

const listarAgendaDoDia = async (data) => {
  const [tatuagens, piercings] = await Promise.all([
    adminRepository.findTatuagensDoDia(data),
    adminRepository.findPiercingsDoDia(data),
  ]);

  return [...tatuagens.map(formatarTatuagem), ...piercings.map(formatarPiercing)].sort(
    ordenarPorDataEHora
  );
};

const listarPendentes = async () => {
  const [tatuagens, piercings] = await Promise.all([
    adminRepository.findTatuagensPendentes(),
    adminRepository.findPiercingsPendentes(),
  ]);

  return [...tatuagens.map(formatarTatuagem), ...piercings.map(formatarPiercing)].sort(
    ordenarPorDataEHora
  );
};

const notificarCliente = async (tipo, agendamento, decisao, motivo) => {
  const mensagem =
    `${NOME_SERVICO[tipo]} do dia ${formatarDataBrasileira(agendamento.data)} às ${agendamento.horario} ` +
    `foi ${decisao.resultado[tipo]} pelo estúdio.${motivo ? ` Motivo: ${motivo}` : ''}`;

  try {
    await notificacaoService.criar({
      usuarioCpf: agendamento.cliente_cpf,
      tipo: decisao.tipoNotificacao,
      titulo: decisao.titulo,
      mensagem,
    });
    return true;
  } catch (error) {
    console.error('[Admin] Não foi possível notificar o cliente:', error.message);
    return false;
  }
};

const decidirAgendamento = async (tipo, id, acao, motivo = null) => {
  const operacao = OPERACOES[tipo];
  const decisao = DECISOES[acao];
  const agendamento = await operacao.buscarPorId(id);

  if (!agendamento) {
    throw new AppError('Agendamento não encontrado.', 404);
  }

  if (agendamento.status !== 'pendente') {
    const situacao = SITUACAO_ATUAL[agendamento.status] || `está com status "${agendamento.status}"`;
    throw new AppError(`Este agendamento ${situacao}. Só é possível decidir pedidos pendentes.`, 409);
  }

  if (acao === 'aprovar') {
    if (`${agendamento.data} ${agendamento.horario}` < agoraEmSaoPaulo()) {
      throw new AppError('Não é possível aprovar um agendamento cuja data e horário já passaram.', 409);
    }

    if (tipo === 'tatuagem' && (await adminRepository.existeTatuagemConfirmadaNoMesmoHorario(id))) {
      throw new AppError('Este tatuador já tem outra tatuagem confirmada nesse mesmo dia e horário.', 409);
    }
  }

  const atualizado = await operacao.atualizarStatus(id, decisao.novoStatus);

  if (!atualizado) {
    throw new AppError('Este agendamento acabou de ser alterado. Atualize a lista e tente de novo.', 409);
  }

  const notificacaoEnviada = await notificarCliente(tipo, agendamento, decisao, motivo);

  return {
    agendamento: operacao.formatar({ ...agendamento, status: decisao.novoStatus }),
    notificacaoEnviada,
  };
};

module.exports = { listarAgendaDoDia, listarPendentes, decidirAgendamento };