process.env.JWT_SECRET = "segredo-apenas-para-os-testes-automaticos";
process.env.DATABASE_URL = "postgresql://teste:teste@localhost:5432/banco-dos-testes";

const { requireRecaptcha } = require("../src/middlewares/recaptcha.middleware");
const authRoutes = require("../src/routes/auth.routes");
const authController = require("../src/controllers/auth.controller");

const fetchOriginal = global.fetch;

const rodarMiddleware = async (body) => {
  const next = jest.fn();
  await requireRecaptcha({ body }, {}, next);
  return next;
};

const googleResponde = (resultado) => {
  global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(resultado) });
};

const middlewaresDaRota = (caminho) =>
  authRoutes.stack
    .find((camada) => camada.route && camada.route.path === caminho)
    .route.stack.map((camada) => camada.handle);

describe("reCAPTCHA no login e no cadastro", () => {
  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = "chave-secreta-dos-testes";
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    delete process.env.RECAPTCHA_SECRET_KEY;
  });

  it("deve exigir o reCAPTCHA no login do cliente e do administrador", () => {
    expect(middlewaresDaRota("/login")).toContain(requireRecaptcha);
    expect(middlewaresDaRota("/admin/login")).toContain(requireRecaptcha);
  });

  it("deve exigir o reCAPTCHA no cadastro antes de criar a conta", () => {
    expect(middlewaresDaRota("/register")).toEqual([requireRecaptcha, authController.register]);
  });

  it("deve deixar passar quando o Google confirma o comprovante", async () => {
    googleResponde({ success: true });

    const next = await rodarMiddleware({ cpf: "12345678909", recaptchaToken: "comprovante-valido" });

    expect(next).toHaveBeenCalledWith();
    const [url, opcoes] = global.fetch.mock.calls[0];
    expect(url).toBe("https://www.google.com/recaptcha/api/siteverify");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.body.get("secret")).toBe("chave-secreta-dos-testes");
    expect(opcoes.body.get("response")).toBe("comprovante-valido");
  });

  it("deve barrar quem não mandou o comprovante, sem chamar o Google", async () => {
    global.fetch = jest.fn();

    for (const recaptchaToken of [undefined, "", 123]) {
      const next = await rodarMiddleware({ cpf: "12345678909", recaptchaToken });
      expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: "Confirme que você não é um robô." });
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("deve barrar quando o Google recusa o comprovante", async () => {
    googleResponde({ success: false, "error-codes": ["timeout-or-duplicate"] });

    const next = await rodarMiddleware({ recaptchaToken: "comprovante-usado" });

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 400 });
  });

  it("deve responder 503 quando não consegue falar com o Google", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("sem internet"));

    const next = await rodarMiddleware({ recaptchaToken: "comprovante-valido" });

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 503 });
  });

  it("deve responder 500 quando a chave secreta não está configurada", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    global.fetch = jest.fn();

    const next = await rodarMiddleware({ recaptchaToken: "comprovante-valido" });

    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 500 });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
