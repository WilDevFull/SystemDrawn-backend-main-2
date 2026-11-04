const service =
  require(
    '../services/joiaPiercing.service'
  );

const criar =
  async (
    req,
    res,
    next
  ) => {
    try {
      const joia =
        await service.criar(
          req.body
        );

      return res
        .status(201)
        .json({
          success: true,
          joia,
        });
    } catch (error) {
      next(error);
    }
  };

const listar =
  async (
    req,
    res,
    next
  ) => {
    try {
      const joias =
        await service.listar();

      return res
        .status(200)
        .json({
          success: true,
          joias,
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
      const joia =
        await service.buscarPorId(
          req.params.id
        );

      return res
        .status(200)
        .json({
          success: true,
          joia,
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
      const joia =
        await service.atualizar(
          req.params.id,
          req.body
        );

      return res
        .status(200)
        .json({
          success: true,
          joia,
        });
    } catch (error) {
      next(error);
    }
  };

const remover =
  async (
    req,
    res,
    next
  ) => {
    try {
      await service.remover(
        req.params.id
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            'Joia removida com sucesso.',
        });
    } catch (error) {
      next(error);
    }
  };

const listarPorTipoPiercing =
  async (
    req,
    res,
    next
  ) => {
    try {
      const joias =
        await service.listarPorTipoPiercing(
          req.params
            .tipoPiercingId
        );

      return res
        .status(200)
        .json({
          success: true,
          joias,
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
  listarPorTipoPiercing,
};