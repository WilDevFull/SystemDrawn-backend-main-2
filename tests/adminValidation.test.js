const {
  validateDataAgenda,
  validateAgendamentoParams,
  validateMotivo,
} = require("../src/validations/admin.validation");

describe("validações do Admin", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("validateDataAgenda", () => {
    it("sem data deve usar o dia de hoje em São Paulo", () => {
      jest.useFakeTimers({ now: new Date("2026-10-27T02:00:00Z") });
      expect(validateDataAgenda(undefined)).toBe("2026-10-26");
    });

    it("deve aceitar data válida e rejeitar data inválida", () => {
      expect(validateDataAgenda("2026-10-26")).toBe("2026-10-26");
      expect(() => validateDataAgenda("2026-13-01")).toThrow("Esse dia não existe");
      expect(() => validateDataAgenda("hoje")).toThrow("Use o formato AAAA-MM-DD");
    });
  });

  describe("validateAgendamentoParams", () => {
    it("deve aceitar tatuagem com número e piercing com UUID", () => {
      expect(validateAgendamentoParams({ tipo: "tatuagem", id: "37" })).toEqual({ tipo: "tatuagem", id: "37" });
      expect(
        validateAgendamentoParams({ tipo: "piercing", id: "6b363332-00f5-4108-a042-05a3558cfcff" })
      ).toEqual({ tipo: "piercing", id: "6b363332-00f5-4108-a042-05a3558cfcff" });
    });

    it("deve rejeitar tipo desconhecido e código errado", () => {
      expect(() => validateAgendamentoParams({ tipo: "unha", id: "1" })).toThrow("Tipo de agendamento inválido");
      expect(() => validateAgendamentoParams({ tipo: "tatuagem", id: "abc" })).toThrow("Código do agendamento inválido");
      expect(() => validateAgendamentoParams({ tipo: "piercing", id: "123" })).toThrow("Código do agendamento inválido");
    });
  });

  describe("validateMotivo", () => {
    it("deve limpar espaços e aceitar motivo vazio", () => {
      expect(validateMotivo("  Joia indisponível  ")).toBe("Joia indisponível");
      expect(validateMotivo(undefined)).toBeNull();
      expect(validateMotivo("   ")).toBeNull();
    });

    it("deve rejeitar motivo que não é texto ou muito longo", () => {
      expect(() => validateMotivo(123)).toThrow("precisa ser um texto");
      expect(() => validateMotivo("x".repeat(256))).toThrow("255 caracteres");
    });
  });
});