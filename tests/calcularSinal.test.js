const calcularSinal = (valorTotal) => {
  if (valorTotal <= 0) {
    throw new Error("Valor inválido");
  }

  const taxa = 0.1;
  return valorTotal * taxa;
}

describe("calcularSinal", () => {
  it("deve calcular 10% do valor total", () => {
    expect(calcularSinal(100)).toBe(10);
  });

  it("deve calcular corretamente valores maiores", () => {
    expect(calcularSinal(250)).toBe(25);
  });

  it("deve lançar erro para valor zero", () => {
    expect(() => calcularSinal(0)).toThrow("Valor inválido");
  });

  it("deve lançar erro para valor negativo", () => {
    expect(() => calcularSinal(-50)).toThrow("Valor inválido");
  });
});

module.exports = { calcularSinal };