jest.mock("../src/repositories/notificacao.repository", () => ({
  create: jest.fn(async (dados) => dados),
}));

const notificacaoRepository = require("../src/repositories/notificacao.repository");
const notificacaoService = require("../src/services/notificacao.service");

describe("aviso automático de agendamento", () => {
  beforeEach(() => {
    notificacaoRepository.create.mockClear();
  });

  it("deve mostrar a data do piercing no padrão brasileiro", async () => {
    await notificacaoService.criarParaAgendamento("52998224725", "PIERCING", "AGENDAMENTO_CRIADO", {
      data: new Date(2026, 9, 27),
      horario: "15:00:00",
    });

    expect(notificacaoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioCpf: "52998224725",
        mensagem: "Seu piercing foi agendado para 27/10/2026 às 15:00 e aguarda a aprovação do estúdio.",
      })
    );
  });

  it("deve aceitar a data já em texto", async () => {
    await notificacaoService.criarParaAgendamento("52998224725", "PIERCING", "AGENDAMENTO_CONFIRMADO", {
      data: "2026-11-05",
      horario: "09:30",
    });

    expect(notificacaoRepository.create.mock.calls[0][0].mensagem).toBe(
      "Seu piercing foi confirmado para 05/11/2026 às 09:30."
    );
  });

  it("deve avisar o cancelamento sem precisar de data", async () => {
    await notificacaoService.criarParaAgendamento("52998224725", "PIERCING", "AGENDAMENTO_CANCELADO", {});

    expect(notificacaoRepository.create.mock.calls[0][0]).toMatchObject({
      tipo: "appointment_cancelled",
      mensagem: "Seu piercing foi cancelado.",
    });
  });
});