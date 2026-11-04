jest.mock("../src/repositories/admin.repository", () => ({
  findTatuagensDoDia: jest.fn(),
  findPiercingsDoDia: jest.fn(),
  findTatuagensPendentes: jest.fn(),
  findPiercingsPendentes: jest.fn(),
  findTatuagemPorId: jest.fn(),
  findPiercingPorId: jest.fn(),
  existeTatuagemConfirmadaNoMesmoHorario: jest.fn(),
  atualizarStatusTatuagem: jest.fn(),
  atualizarStatusPiercing: jest.fn(),
}));

jest.mock("../src/services/notificacao.service", () => ({
  criar: jest.fn(),
}));

const adminRepository = require("../src/repositories/admin.repository");
const notificacaoService = require("../src/services/notificacao.service");
const adminService = require("../src/services/admin.service");

const tatuagemPendente = {
  id: 37,
  data: "2026-11-05",
  horario: "15:00",
  cliente_cpf: "11144477735",
  cliente_nome: "João da Silva",
  descricao: "Rosa no punho",
  status: "pendente",
};

const piercingPendente = {
  id: "6b363332-00f5-4108-a042-05a3558cfcff",
  data: "2026-11-05",
  horario: "09:00",
  cliente_cpf: "52998224725",
  cliente_nome: "Ana Souza",
  local: "Orelha",
  sub_local: "Helix",
  status: "pendente",
};

describe("admin.service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: new Date("2026-10-27T13:00:00Z") });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("listarAgendaDoDia", () => {
    it("deve juntar tatuagens e piercings no formato da tela, em ordem de horário", async () => {
      adminRepository.findTatuagensDoDia.mockResolvedValue([
        { ...tatuagemPendente, status: "concluido" },
        { ...tatuagemPendente, id: 38, horario: "16:00", cliente_nome: null },
      ]);
      adminRepository.findPiercingsDoDia.mockResolvedValue([piercingPendente]);

      const agenda = await adminService.listarAgendaDoDia("2026-11-05");

      expect(adminRepository.findTatuagensDoDia).toHaveBeenCalledWith("2026-11-05");
      expect(agenda).toEqual([
        {
          id: "piercing-6b363332-00f5-4108-a042-05a3558cfcff",
          type: "piercing",
          appointmentId: "6b363332-00f5-4108-a042-05a3558cfcff",
          date: "2026-11-05",
          time: "09:00",
          clientName: "Ana Souza",
          service: "Piercing Helix (Orelha)",
          status: "pending",
        },
        {
          id: "tatuagem-37",
          type: "tatuagem",
          appointmentId: "37",
          date: "2026-11-05",
          time: "15:00",
          clientName: "João da Silva",
          service: "Tatuagem - Rosa no punho",
          status: "completed",
        },
        expect.objectContaining({ id: "tatuagem-38", clientName: "Cliente sem cadastro", time: "16:00" }),
      ]);
    });
  });

  describe("decidirAgendamento", () => {
    it("deve avisar quando o agendamento não existe", async () => {
      adminRepository.findTatuagemPorId.mockResolvedValue(undefined);

      await expect(adminService.decidirAgendamento("tatuagem", "99", "aprovar")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("não deve decidir de novo um agendamento que já foi aprovado", async () => {
      adminRepository.findTatuagemPorId.mockResolvedValue({ ...tatuagemPendente, status: "confirmado" });

      await expect(adminService.decidirAgendamento("tatuagem", "37", "recusar")).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("já foi aprovado"),
      });
      expect(adminRepository.atualizarStatusTatuagem).not.toHaveBeenCalled();
    });

    it("não deve aprovar horário que já passou", async () => {
      adminRepository.findPiercingPorId.mockResolvedValue({ ...piercingPendente, data: "2026-10-27" });

      await expect(
        adminService.decidirAgendamento("piercing", piercingPendente.id, "aprovar")
      ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("já passaram") });
    });

    it("não deve aprovar tatuagem se o tatuador já está ocupado", async () => {
      adminRepository.findTatuagemPorId.mockResolvedValue(tatuagemPendente);
      adminRepository.existeTatuagemConfirmadaNoMesmoHorario.mockResolvedValue(true);

      await expect(adminService.decidirAgendamento("tatuagem", "37", "aprovar")).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("tatuador"),
      });
      expect(adminRepository.atualizarStatusTatuagem).not.toHaveBeenCalled();
    });

    it("deve recusar com segurança quando outra pessoa mudou o pedido ao mesmo tempo", async () => {
      adminRepository.findTatuagemPorId.mockResolvedValue(tatuagemPendente);
      adminRepository.existeTatuagemConfirmadaNoMesmoHorario.mockResolvedValue(false);
      adminRepository.atualizarStatusTatuagem.mockResolvedValue(undefined);

      await expect(adminService.decidirAgendamento("tatuagem", "37", "aprovar")).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("acabou de ser alterado"),
      });
      expect(notificacaoService.criar).not.toHaveBeenCalled();
    });

    it("deve aprovar o piercing e avisar o cliente", async () => {
      adminRepository.findPiercingPorId.mockResolvedValue(piercingPendente);
      adminRepository.atualizarStatusPiercing.mockResolvedValue({ id: piercingPendente.id });
      notificacaoService.criar.mockResolvedValue({});

      const resultado = await adminService.decidirAgendamento("piercing", piercingPendente.id, "aprovar");

      expect(adminRepository.atualizarStatusPiercing).toHaveBeenCalledWith(piercingPendente.id, "confirmado");
      expect(notificacaoService.criar).toHaveBeenCalledWith({
        usuarioCpf: "52998224725",
        tipo: "appointment_confirmed",
        titulo: "Agendamento aprovado",
        mensagem: "Seu piercing do dia 05/11/2026 às 09:00 foi aprovado pelo estúdio.",
      });
      expect(resultado.notificacaoEnviada).toBe(true);
      expect(resultado.agendamento.status).toBe("confirmed");
    });

    it("deve recusar a tatuagem com motivo, mesmo que o horário já tenha passado", async () => {
      adminRepository.findTatuagemPorId.mockResolvedValue({ ...tatuagemPendente, data: "2026-10-20" });
      adminRepository.atualizarStatusTatuagem.mockResolvedValue({ id: 37 });
      notificacaoService.criar.mockResolvedValue({});

      const resultado = await adminService.decidirAgendamento("tatuagem", "37", "recusar", "Agenda cheia");

      expect(adminRepository.atualizarStatusTatuagem).toHaveBeenCalledWith("37", "cancelado");
      expect(notificacaoService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo: "appointment_cancelled",
          mensagem: "Sua tatuagem do dia 20/10/2026 às 15:00 foi recusada pelo estúdio. Motivo: Agenda cheia",
        })
      );
      expect(resultado.agendamento.status).toBe("cancelled");
    });

    it("deve concluir a decisão mesmo se o aviso ao cliente falhar", async () => {
      adminRepository.findPiercingPorId.mockResolvedValue(piercingPendente);
      adminRepository.atualizarStatusPiercing.mockResolvedValue({ id: piercingPendente.id });
      notificacaoService.criar.mockRejectedValue(new Error("tabela de avisos fora do ar"));

      const resultado = await adminService.decidirAgendamento("piercing", piercingPendente.id, "recusar");

      expect(resultado.notificacaoEnviada).toBe(false);
      expect(resultado.agendamento.status).toBe("cancelled");
    });
  });
});