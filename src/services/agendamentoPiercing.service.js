const repository =
  require(
    '../repositories/agendamentoPiercing.repository'
  );

const {
  AppError,
} = require(
  '../errors/AppError'
);

const notificacaoService =
  require(
    './notificacao.service'
  );

const {
  validateMomentoAgendamento,
} = require(
  '../validations/agendamento.validation'
);

const {
  paraDataIso,
  paraHorarioCurto,
} = require(
  '../utils/data.util'
);

const criar = async (
  usuarioCpf,
  dados
) => {

  const tipoPiercing =
    await repository.buscarTipoPorId(
      dados.tipo_piercing_id
    );

  if (!tipoPiercing) {
    throw new AppError(
      'Tipo de piercing não encontrado.',
      404
    );
  }

  const joia =
    await repository.buscarJoiaPorId(
      dados.joia_piercing_id
    );

  if (!joia) {
    throw new AppError(
      'Joia não encontrada.',
      404
    );
  }

  if (
    joia.tipo_piercing_id !==
    tipoPiercing.id
  ) {
    throw new AppError(
      'Esta joia não é indicada para o tipo de piercing escolhido.',
      400
    );
  }

  const horarioExiste =
    await repository.verificarHorario(
      dados.data,
      dados.horario
    );

  if (horarioExiste) {
    throw new AppError(
      'Este horário já está ocupado.',
      409
    );
  }

  const novoAgendamento = {
    usuarioCpf,

    tipoPiercingId:
      tipoPiercing.id,

    joiaPiercingId:
      joia.id,

    observacao:
      dados.observacao || '',

    data:
      dados.data,

    horario:
      dados.horario,

    status:
      'pendente',
  };

  const agendamento =
    await repository.create(
      novoAgendamento
    );

  await notificacaoService
    .criarParaAgendamento(
      usuarioCpf,
      'PIERCING',
      'AGENDAMENTO_CRIADO',
      {
        data:
          agendamento.data,

        horario:
          agendamento.horario,

        agendamentoId:
          agendamento.id,
      }
    );

  return agendamento;
};

const listarPorUsuario =
  async (
    usuarioCpf
  ) => {

    return await repository
      .findByUsuario(
        usuarioCpf
      );
  };

const buscarPorId =
  async (
    id,
    usuarioCpf
  ) => {

    const agendamento =
      await repository.findById(
        id
      );

    if (
      !agendamento ||
      agendamento.usuario_cpf !==
        usuarioCpf
    ) {

      throw new AppError(
        'Agendamento não encontrado.',
        404
      );
    }

    return agendamento;
  };

const atualizar =
  async (
    id,
    usuarioCpf,
    dados
  ) => {

    const existente =
      await buscarPorId(
        id,
        usuarioCpf
      );

    const mudouHorario =
      dados.data !== undefined ||
      dados.horario !== undefined;

    const novaData =
      dados.data ||
      paraDataIso(
        existente.data
      );

    const novoHorario =
      dados.horario ||
      paraHorarioCurto(
        existente.horario
      );

    if (
      mudouHorario
    ) {

      validateMomentoAgendamento(
        novaData,
        novoHorario
      );

      const ocupado =
        await repository.verificarHorario(
          novaData,
          novoHorario
        );

      if (
        ocupado &&
        ocupado.id !== id
      ) {

        throw new AppError(
          'Este horário já está ocupado.',
          409
        );
      }
    }

    const atualizado = {
      ...existente,
      ...dados,
      data:
        novaData,
      horario:
        novoHorario,
      status:
        mudouHorario
          ? 'pendente'
          : existente.status,
    };

    const resultado =
      await repository.update(
        id,
        atualizado
      );

    await notificacaoService
      .criarParaAgendamento(
        usuarioCpf,
        'PIERCING',
        'AGENDAMENTO_CRIADO',
        {
          data:
            resultado.data,

          horario:
            resultado.horario,

          agendamentoId:
            resultado.id,
        }
      );

    return resultado;
  };

const remover =
  async (
    id,
    usuarioCpf
  ) => {

    const agendamento =
      await buscarPorId(
        id,
        usuarioCpf
      );

    await repository.remove(
      id
    );

    await notificacaoService
      .criarParaAgendamento(
        usuarioCpf,
        'PIERCING',
        'AGENDAMENTO_CANCELADO',
        {
          data:
            agendamento.data,

          horario:
            agendamento.horario,
        }
      );

    return true;
  };

const listarProximos =
  async (
    usuarioCpf
  ) => {

    return await repository
      .findProximos(
        usuarioCpf
      );
  };

const listarHistorico =
  async (
    usuarioCpf
  ) => {

    return await repository
      .findHistorico(
        usuarioCpf
      );
  };

module.exports = {
  criar,
  listarPorUsuario,
  buscarPorId,
  atualizar,
  remover,
  listarProximos,
  listarHistorico,
};
