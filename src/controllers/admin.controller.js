const adminService = require('../services/admin.service');
const {
  validateDataAgenda,
  validateAgendamentoParams,
  validateMotivo,
} = require('../validations/admin.validation');

const agendaDoDia = async (req, res, next) => {
  try {
    const data = validateDataAgenda(req.query.data);
    const agendamentos = await adminService.listarAgendaDoDia(data);

    return res.status(200).json({
      success: true,
      data,
      total: agendamentos.length,
      agendamentos,
    });
  } catch (error) {
    next(error);
  }
};

const aprovacoesPendentes = async (req, res, next) => {
  try {
    const agendamentos = await adminService.listarPendentes();

    return res.status(200).json({
      success: true,
      total: agendamentos.length,
      agendamentos,
    });
  } catch (error) {
    next(error);
  }
};

const aprovarAgendamento = async (req, res, next) => {
  try {
    const { tipo, id } = validateAgendamentoParams(req.params);
    const resultado = await adminService.decidirAgendamento(tipo, id, 'aprovar');

    return res.status(200).json({
      success: true,
      message: 'Agendamento aprovado.',
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

const recusarAgendamento = async (req, res, next) => {
  try {
    const { tipo, id } = validateAgendamentoParams(req.params);
    const motivo = validateMotivo(req.body.motivo);
    const resultado = await adminService.decidirAgendamento(tipo, id, 'recusar', motivo);

    return res.status(200).json({
      success: true,
      message: 'Agendamento recusado.',
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { agendaDoDia, aprovacoesPendentes, aprovarAgendamento, recusarAgendamento };