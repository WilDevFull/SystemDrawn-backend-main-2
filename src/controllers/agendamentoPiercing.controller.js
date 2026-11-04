const agendamentoService =
  require(
    '../services/agendamentoPiercing.service'
  );

const {
  validateDadosPiercing,
} = require(
  '../validations/agendamento.validation'
);

const criar = async (
  req,
  res,
  next
) => {
  try {
    const dados =
      validateDadosPiercing(
        req.body
      );

    const novo =
      await agendamentoService.criar(
        req.user.cpf,
        dados
      );

    return res
      .status(201)
      .json({
        success: true,
        agendamento: novo,
      });
  } catch (error) {
    next(error);
  }
};

const listar = async (
  req,
  res,
  next
) => {
  try {
    const lista =
      await agendamentoService.listarPorUsuario(
        req.user.cpf
      );

    return res
      .status(200)
      .json({
        success: true,
        agendamentos:
          lista,
      });
  } catch (error) {
    next(error);
  }
};

const buscarPorId =
  async (
    req,
    res,
    next
  ) => {
    try {
      const agendamento =
        await agendamentoService.buscarPorId(
          req.params.id,
          req.user.cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          agendamento,
        });
    } catch (error) {
      next(error);
    }
  };

const atualizar =
  async (
    req,
    res,
    next
  ) => {
    try {
      const dados =
        validateDadosPiercing(
          req.body,
          { parcial: true }
        );

      const atualizado =
        await agendamentoService.atualizar(
          req.params.id,
          req.user.cpf,
          dados
        );

      return res
        .status(200)
        .json({
          success: true,
          agendamento:
            atualizado,
        });
    } catch (error) {
      next(error);
    }
  };

const remover = async (
  req,
  res,
  next
) => {
  try {
    await agendamentoService.remover(
      req.params.id,
      req.user.cpf
    );

    return res
      .status(200)
      .json({
        success: true,
        message:
          'Agendamento removido com sucesso.',
      });
  } catch (error) {
    next(error);
  }
};

const listarProximos =
  async (
    req,
    res,
    next
  ) => {
    try {
      const lista =
        await agendamentoService.listarProximos(
          req.user.cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          agendamentos:
            lista,
        });
    } catch (error) {
      next(error);
    }
  };

const listarHistorico =
  async (
    req,
    res,
    next
  ) => {
    try {
      const lista =
        await agendamentoService.listarHistorico(
          req.user.cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          agendamentos:
            lista,
        });
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
  listarProximos,
  listarHistorico,
};