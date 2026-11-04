const notificacaoRepository =
  require(
    '../repositories/notificacao.repository'
  );

const { AppError } =
  require(
    '../errors/AppError'
  );

const {
  paraDataIso,
  paraHorarioCurto,
  formatarDataBrasileira,
} = require(
  '../utils/data.util'
);

const criar =
  async (dados) => {
    return await notificacaoRepository
      .create(dados);
  };

const criarParaAgendamento =
  async (
    usuarioCpf,
    tipoServico,
    evento,
    dados
  ) => {

    let titulo =
      '';

    let mensagem =
      '';

    let tipo =
      'appointment_reminder';

    const quando =
      dados.data && dados.horario
        ? `${formatarDataBrasileira(paraDataIso(dados.data))} às ${paraHorarioCurto(dados.horario)}`
        : '';

    if (
      evento ===
      'AGENDAMENTO_CRIADO'
    ) {

      titulo =
        `${tipoServico} agendado`;

      mensagem =
        `Seu ${tipoServico.toLowerCase()} foi agendado para ${quando} e aguarda a aprovação do estúdio.`;

      tipo =
        'appointment_confirmed';
    }

    if (
      evento ===
      'AGENDAMENTO_CANCELADO'
    ) {

      titulo =
        `${tipoServico} cancelado`;

      mensagem =
        `Seu ${tipoServico.toLowerCase()} foi cancelado.`;

      tipo =
        'appointment_cancelled';
    }

    if (
      evento ===
      'AGENDAMENTO_CONFIRMADO'
    ) {

      titulo =
        `${tipoServico} confirmado`;

      mensagem =
        `Seu ${tipoServico.toLowerCase()} foi confirmado para ${quando}.`;

      tipo =
        'appointment_confirmed';
    }

    return await notificacaoRepository
      .create({
        usuarioCpf,
        tipo,
        titulo,
        mensagem,
      });
  };

const listar =
  async (cpf) => {
    return await notificacaoRepository
      .findByUsuario(cpf);
  };

const listarNaoLidas =
  async (cpf) => {
    return await notificacaoRepository
      .findNaoLidas(cpf);
  };

const marcarComoLida =
  async (id, cpf) => {

    const notificacao =
      await notificacaoRepository
        .marcarComoLida(
          id,
          cpf
        );

    if (!notificacao) {
      throw new AppError(
        'Notificação não encontrada.',
        404
      );
    }

    return notificacao;
  };

const marcarTodasComoLidas =
  async (cpf) => {
    return await notificacaoRepository
      .marcarTodasComoLidas(
        cpf
      );
  };

const contarNaoLidas =
  async (cpf) => {
    return await notificacaoRepository
      .contarNaoLidas(
        cpf
      );
  };

const remover =
  async (id, cpf) => {

    const notificacoes =
      await notificacaoRepository
        .findByUsuario(cpf);

    const existe =
      notificacoes.find(
        (n) => n.id === id
      );

    if (!existe) {
      throw new AppError(
        'Notificação não encontrada.',
        404
      );
    }

    await notificacaoRepository
      .remove(
        id,
        cpf
      );

    return true;
  };

module.exports = {
  criar,
  criarParaAgendamento,
  listar,
  listarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
  contarNaoLidas,
  remover,
};