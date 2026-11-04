const {
  validateDataCivil,
  validateHorario,
  validateMomentoAgendamento,
  validateDadosTatuagem,
  validateDadosPiercing,
} = require("../src/validations/agendamento.validation");

const TIPO_PIERCING = "11111111-1111-4111-8111-111111111111";
const JOIA = "22222222-2222-4222-8222-222222222222";

describe("validações de agendamento", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-27T13:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("validateDataCivil", () => {
    it("deve aceitar uma data real", () => {
      expect(validateDataCivil("2026-02-28")).toBe("2026-02-28");
    });

    it("deve rejeitar formato errado", () => {
      expect(() => validateDataCivil("27/10/2026")).toThrow("Use o formato AAAA-MM-DD");
    });

    it("deve rejeitar dia que não existe", () => {
      expect(() => validateDataCivil("2026-02-30")).toThrow("Esse dia não existe no calendário");
    });
  });

  describe("validateHorario", () => {
    it("deve aceitar HH:MM e HH:MM:SS", () => {
      expect(validateHorario("14:00")).toBe("14:00");
      expect(validateHorario("09:30:00")).toBe("09:30");
    });

    it("deve rejeitar horário impossível", () => {
      expect(() => validateHorario("25:00")).toThrow("Horário inválido");
      expect(() => validateHorario("14h")).toThrow("Horário inválido");
    });
  });

  describe("validateMomentoAgendamento", () => {
    it("deve aceitar horário futuro dentro do expediente", () => {
      expect(() => validateMomentoAgendamento("2026-10-27", "11:00")).not.toThrow();
    });

    it("deve rejeitar horário que já passou", () => {
      expect(() => validateMomentoAgendamento("2026-10-27", "09:00")).toThrow("já passou");
    });

    it("deve rejeitar horário fora do expediente", () => {
      expect(() => validateMomentoAgendamento("2026-10-28", "07:00")).toThrow("fora do expediente");
      expect(() => validateMomentoAgendamento("2026-10-28", "18:00")).toThrow("fora do expediente");
    });
  });

  describe("validateDadosTatuagem", () => {
    const dadosValidos = {
      data_hora: "2026-11-05 14:00",
      descricao: "  Rosa no punho  ",
      tatuador: "Thiago",
      preco: "350,50",
    };

    it("deve limpar e devolver só os campos permitidos", () => {
      expect(validateDadosTatuagem({ ...dadosValidos, status: "confirmado" })).toEqual({
        data_hora: "2026-11-05 14:00",
        descricao: "Rosa no punho",
        tatuador: "Thiago",
        preco: 350.5,
      });
    });

    it("deve converter horário com fuso para o horário de São Paulo", () => {
      const dados = validateDadosTatuagem({ ...dadosValidos, data_hora: "2026-11-05T17:00:00.000Z" });
      expect(dados.data_hora).toBe("2026-11-05 14:00");
    });

    it("deve exigir data, descrição e tatuador", () => {
      expect(() => validateDadosTatuagem({ ...dadosValidos, data_hora: "" })).toThrow("Informe a data");
      expect(() => validateDadosTatuagem({ ...dadosValidos, descricao: "   " })).toThrow("Informe a descrição");
      expect(() => validateDadosTatuagem({ ...dadosValidos, tatuador: undefined })).toThrow("Informe o nome do tatuador");
    });

    it("deve rejeitar preço negativo ou que não é número", () => {
      expect(() => validateDadosTatuagem({ ...dadosValidos, preco: -10 })).toThrow("Preço inválido");
      expect(() => validateDadosTatuagem({ ...dadosValidos, preco: "caro" })).toThrow("Preço inválido");
    });

    it("deve rejeitar tatuagem no passado", () => {
      expect(() => validateDadosTatuagem({ ...dadosValidos, data_hora: "2026-10-26 14:00" })).toThrow("já passou");
    });

    it("na edição deve validar só o que foi enviado", () => {
      expect(validateDadosTatuagem({ descricao: "Leão" }, { parcial: true })).toEqual({ descricao: "Leão" });
      expect(() => validateDadosTatuagem({ data_hora: "2026-11-05 20:00" }, { parcial: true })).toThrow(
        "fora do expediente"
      );
    });
  });

  describe("validateDadosPiercing", () => {
    const dadosValidos = {
      tipo_piercing_id: TIPO_PIERCING,
      joia_piercing_id: JOIA,
      data: "2026-11-05",
      horario: "15:00",
      observacao: "  Primeira vez  ",
    };

    it("deve aceitar o que o site envia", () => {
      expect(validateDadosPiercing(dadosValidos)).toEqual({
        tipo_piercing_id: TIPO_PIERCING,
        joia_piercing_id: JOIA,
        data: "2026-11-05",
        horario: "15:00",
        observacao: "Primeira vez",
      });
    });

    it("deve rejeitar tipo ou joia com código inválido", () => {
      expect(() => validateDadosPiercing({ ...dadosValidos, tipo_piercing_id: "abc" })).toThrow("tipo de piercing");
      expect(() => validateDadosPiercing({ ...dadosValidos, joia_piercing_id: undefined })).toThrow("joia");
    });

    it("deve exigir data e horário", () => {
      expect(() => validateDadosPiercing({ ...dadosValidos, data: "" })).toThrow("Informe a data");
      expect(() => validateDadosPiercing({ ...dadosValidos, horario: undefined })).toThrow("Informe o horário");
    });

    it("deve rejeitar piercing no passado ou fora do expediente", () => {
      expect(() => validateDadosPiercing({ ...dadosValidos, data: "2026-10-20" })).toThrow("já passou");
      expect(() => validateDadosPiercing({ ...dadosValidos, horario: "19:00" })).toThrow("fora do expediente");
    });

    it("na edição deve aceitar só a observação", () => {
      expect(validateDadosPiercing({ observacao: "Trocar joia" }, { parcial: true })).toEqual({
        observacao: "Trocar joia",
      });
    });
  });
});