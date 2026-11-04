const notificacaoService =
  require(
    '../services/notificacao.service'
  );

const listar =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      const notificacoes =
        await notificacaoService.listar(
          cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          data:
            notificacoes,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          erro:
            'Erro ao listar notificações.',
        });
    }
  };

const listarNaoLidas =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      const notificacoes =
        await notificacaoService.listarNaoLidas(
          cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          data:
            notificacoes,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          erro:
            'Erro ao listar notificações não lidas.',
        });
    }
  };

const contarNaoLidas =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      const total =
        await notificacaoService.contarNaoLidas(
          cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          total,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          erro:
            'Erro ao contar notificações.',
        });
    }
  };

const marcarComoLida =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      const { id } =
        req.params;

      const notificacao =
        await notificacaoService.marcarComoLida(
          id,
          cpf
        );

      return res
        .status(200)
        .json({
          success: true,
          data:
            notificacao,
        });
    } catch (error) {
      return res
        .status(
          error.statusCode ||
            500
        )
        .json({
          success: false,
          erro:
            error.message,
        });
    }
  };

const marcarTodasComoLidas =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      await notificacaoService.marcarTodasComoLidas(
        cpf
      );

      return res
        .status(200)
        .json({
          success: true,
          mensagem:
            'Todas as notificações foram marcadas como lidas.',
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          erro:
            'Erro ao marcar notificações como lidas.',
        });
    }
  };

const remover =
  async (req, res) => {
    try {
      const cpf =
        req.user.cpf;

      const { id } =
        req.params;

      await notificacaoService.remover(
        id,
        cpf
      );

      return res
        .status(200)
        .json({
          success: true,
          mensagem:
            'Notificação removida com sucesso.',
        });
    } catch (error) {
      return res
        .status(
          error.statusCode ||
            500
        )
        .json({
          success: false,
          erro:
            error.message,
        });
    }
  };

module.exports = {
  listar,
  listarNaoLidas,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  remover,
};