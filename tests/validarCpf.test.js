const { validateCpf } = require('../src/utils/cpf.util');

describe("validarCpf", () => {
  it("deve retornar true para um CPF válido e real", () => {
    expect(validateCpf("12345678909")).toBe(true);
  });

  it("deve retornar false para CPFs com sequências repetidas (inválidos)", () => {
    expect(validateCpf("11111111111")).toBe(false);
    expect(validateCpf("00000000000")).toBe(false);
  });

  it("deve retornar false para CPF com menos de 11 dígitos", () => {
    expect(validateCpf("123.456.78")).toBe(false);
  });

  it("deve retornar false se o CPF for vazio ou nulo", () => {
    expect(validateCpf("")).toBe(false);
    expect(validateCpf(null)).toBe(false);
  });

  it("deve retornar false para CPFs com dígitos verificadores matematicamente incorretos", () => {
    expect(validateCpf("12345678901")).toBe(false);
  });
});

module.exports = {};