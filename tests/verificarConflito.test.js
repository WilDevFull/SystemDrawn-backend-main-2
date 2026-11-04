const bancoDeDados = {
  buscarAgendamentos: async () => {
    return []; 
  }
};

const verificarConflito = async (novoHorario) => {
  const agendamentos = await bancoDeDados.buscarAgendamentos();
  return agendamentos.some((a) => a.dataHora === novoHorario);
};

describe("verificarConflito", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve detectar conflito", async () => {
    const agendamentosStub = [{ dataHora: "2026-05-01T14:00:00" }];
    const mockBusca = jest.spyOn(bancoDeDados, "buscarAgendamentos").mockResolvedValue(agendamentosStub);

    const resultado = await verificarConflito("2026-05-01T14:00:00");

    expect(mockBusca).toHaveBeenCalled();
    expect(resultado).toBe(true);
  });

  it("não deve detectar conflito", async () => {
    const agendamentosStub = [{ dataHora: "2026-05-01T14:00:00" }];
    const mockBusca = jest.spyOn(bancoDeDados, "buscarAgendamentos").mockResolvedValue(agendamentosStub);

    const resultado = await verificarConflito("2026-05-01T15:00:00");

    expect(mockBusca).toHaveBeenCalled();
    expect(resultado).toBe(false);
  });
});

module.exports = { verificarConflito, bancoDeDados };