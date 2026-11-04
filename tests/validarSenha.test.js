const validarSenha = (senha) => {
  if (!senha) {
    throw new Error("Senha obrigatória");
  }

  if (senha.length < 8) {
    throw new Error("Senha deve ter pelo menos 8 caracteres");
  }

  const temLetra = /[a-zA-Z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);

  if (!temLetra || !temNumero) {
    throw new Error("Senha deve conter letras e números");
  }

  return true;
};

describe("validarSenha", () => {
  it("deve aceitar senha válida", () => {
    expect(validarSenha("abc12345")).toBe(true);
  });

  it("deve falhar se for vazia", () => {
    expect(() => validarSenha("")).toThrow("Senha obrigatória");
  });

  it("deve falhar se tiver menos de 8 caracteres", () => {
    expect(() => validarSenha("a1b2")).toThrow(
      "Senha deve ter pelo menos 8 caracteres"
    );
  });

  it("deve falhar se não tiver número", () => {
    expect(() => validarSenha("abcdefgh")).toThrow(
      "Senha deve conter letras e números"
    );
  });

  it("deve falhar se não tiver letra", () => {
    expect(() => validarSenha("12345678")).toThrow(
      "Senha deve conter letras e números"
    );
  });
});

module.exports = { validarSenha };