const { validarNomeCompleto } = require('../src/utils/validators');

describe("validarNomeCompleto", () => {
  it("deve aceitar nome e sobrenome válidos", () => {
    expect(validarNomeCompleto("João Silva")).toBe(true);
  });

  it("deve rejeitar apenas o primeiro nome", () => {
    expect(validarNomeCompleto("João")).toBe(false);
  });

  it("deve rejeitar nomes com partes muito curtas", () => {
    expect(validarNomeCompleto("J S")).toBe(false);
  });

  it("deve rejeitar se houver números ou símbolos", () => {
    expect(validarNomeCompleto("João 123")).toBe(false);
    expect(validarNomeCompleto("João @ Silva")).toBe(false);
  });
});