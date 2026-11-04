const tiposPiercingRepository =
  require('../repositories/tiposPiercing.repository');

const { AppError } =
  require('../errors/AppError');

class TiposPiercingService {
  async criarTipo(dados) {
    return await tiposPiercingRepository
      .create(dados);
  }

  async listarTodos() {
    return await tiposPiercingRepository
      .findAll();
  }

  async buscarPorId(id) {
    const tipo =
      await tiposPiercingRepository
        .findById(id);

    if (!tipo) {
      throw new AppError(
        'Tipo de piercing não encontrado.',
        404
      );
    }

    return tipo;
  }

  async atualizarTipo(id, dados) {
    await this.buscarPorId(id);

    return await tiposPiercingRepository
      .update(id, dados);
  }

  async deletarTipo(id) {
    await this.buscarPorId(id);

    return await tiposPiercingRepository
      .delete(id);
  }
}

module.exports =
  new TiposPiercingService();