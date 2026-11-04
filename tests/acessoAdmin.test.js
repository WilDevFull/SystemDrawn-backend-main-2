process.env.JWT_SECRET = "segredo-apenas-para-os-testes-automaticos";

const { authenticate, requireAdmin } = require("../src/middlewares/auth.middleware");
const { generateToken } = require("../src/utils/jwt.util");
const { gerarHashSenha, verificarSenha } = require("../src/utils/senha.util");

const rodarMiddleware = (middleware, req) => {
  const next = jest.fn();
  middleware(req, {}, next);
  return next;
};

describe("acesso do Admin", () => {
  describe("token", () => {
    it("deve guardar o perfil admin só quando for admin", () => {
      const tokenAdmin = generateToken({ cpf: "12345678909", nomeCompleto: "Maria Admin", perfil: "admin" });
      const tokenEstranho = generateToken({ cpf: "11144477735", nomeCompleto: "João da Silva", perfil: "dono" });

      const reqAdmin = { headers: { authorization: `Bearer ${tokenAdmin}` } };
      const reqEstranho = { headers: { authorization: `Bearer ${tokenEstranho}` } };

      rodarMiddleware(authenticate, reqAdmin);
      rodarMiddleware(authenticate, reqEstranho);

      expect(reqAdmin.user.perfil).toBe("admin");
      expect(reqEstranho.user.perfil).toBe("cliente");
    });

    it("deve recusar token inválido", () => {
      const next = rodarMiddleware(authenticate, { headers: { authorization: "Bearer token-falso" } });
      expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
    });
  });

  describe("requireAdmin", () => {
    it("deve deixar o admin passar", () => {
      const next = rodarMiddleware(requireAdmin, { user: { perfil: "admin" } });
      expect(next).toHaveBeenCalledWith();
    });

    it("deve barrar cliente e quem não fez login", () => {
      const nextCliente = rodarMiddleware(requireAdmin, { user: { perfil: "cliente" } });
      const nextSemLogin = rodarMiddleware(requireAdmin, {});

      expect(nextCliente.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
      expect(nextSemLogin.mock.calls[0][0]).toMatchObject({ statusCode: 403 });
    });
  });

  describe("senha do Admin", () => {
    it("deve conferir a senha certa e recusar a errada", async () => {
      const hash = await gerarHashSenha("Senha2026");

      expect(hash).not.toContain("Senha2026");
      await expect(verificarSenha("Senha2026", hash)).resolves.toBe(true);
      await expect(verificarSenha("senha2026", hash)).resolves.toBe(false);
    });

    it("deve recusar quando não existe senha guardada", async () => {
      await expect(verificarSenha("Senha2026", null)).resolves.toBe(false);
      await expect(verificarSenha("Senha2026", "texto-qualquer")).resolves.toBe(false);
    });
  });
});