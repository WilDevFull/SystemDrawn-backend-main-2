const validarHorario = (dataHora) => {
  const data = new Date(dataHora);
  const agora = new Date();
  const hora = data.getHours();

  if (data < agora) return false;
  if (hora < 8 || hora >= 18) return false;

  return true;
};

describe("validarHorario", () => {
  it("deve aceitar horário válido", () => {
    const data = new Date();
    data.setHours(14, 0, 0, 0);
    data.setDate(data.getDate() + 1);

    expect(validarHorario(data)).toBe(true);
  });

  it("deve rejeitar horário fora do expediente", () => {
    const data = new Date();
    data.setHours(22, 0, 0, 0);
    data.setDate(data.getDate() + 1);

    expect(validarHorario(data)).toBe(false);
  });

  it("deve rejeitar data passada", () => {
    const data = new Date("2020-01-01");
    expect(validarHorario(data)).toBe(false);
  });
});

module.exports = { validarHorario };