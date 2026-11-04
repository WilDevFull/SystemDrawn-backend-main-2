const repository =
  require(
    '../repositories/joiaPiercing.repository'
  );

const {
  AppError,
} = require(
  '../errors/AppError'
);

const criar =
  async (dados) => {
    return await repository.create(
      dados
    );
  };

const listar =
  async () => {
    return await repository.findAll();
  };

const buscarPorId =
  async (id) => {
    const joia =
      await repository.findById(
        id
      );

    if (!joia) {
      throw new AppError(
        'Joia não encontrada.',
        404
      );
    }

    return joia;
  };

const atualizar =
  async (
    id,
    dados
  ) => {
    await buscarPorId(id);

    return await repository.update(
      id,
      dados
    );
  };

const remover =
  async (id) => {
    await buscarPorId(id);

    return await repository.remove(
      id
    );
  };

const listarPorTipoPiercing =
  async (
    tipoPiercingId
  ) => {
    return await repository.findByTipoPiercing(
      tipoPiercingId
    );
  };

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  remover,
  listarPorTipoPiercing,
};