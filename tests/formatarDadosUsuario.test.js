const { sanitizeCpf } = require('../src/utils/cpf.util');

describe("sanitizeCpf", () => {
  it("deve remover pontos e traços", () => {
    expect(sanitizeCpf("123.456.789-00")).toBe("12345678900");
  });

  it("deve remover espaços em branco", () => {
    expect(sanitizeCpf(" 12345678900 ")).toBe("12345678900");
  });

  it("deve retornar string vazia se não for uma string", () => {
    expect(sanitizeCpf(null)).toBe("");
    expect(sanitizeCpf(123)).toBe("");
  });
});