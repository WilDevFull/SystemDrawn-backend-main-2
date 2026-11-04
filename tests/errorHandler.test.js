const errorHandler = require("../src/middlewares/errorHandler.middleware");
const { AppError } = require("../src/errors/AppError");

const responder = (erro) => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  errorHandler(erro, {}, res, jest.fn());
  return { status: res.status.mock.calls[0][0], corpo: res.json.mock.calls[0][0] };
};

describe("errorHandler", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve devolver a mensagem dos erros conhecidos", () => {
    expect(responder(new AppError("Agendamento não encontrado.", 404))).toEqual({
      status: 404,
      corpo: { success: false, message: "Agendamento não encontrado." },
    });
  });

  it("deve explicar a duplicidade de acordo com a tabela", () => {
    expect(responder({ code: "23505", table: "usuarios" }).corpo.message).toBe("CPF já cadastrado.");
    expect(responder({ code: "23505", table: "agendamentos_piercing" })).toEqual({
      status: 409,
      corpo: { success: false, message: "Este horário já está ocupado." },
    });
  });

  it("deve responder 400 quando o banco recusa um dado mal formatado", () => {
    expect(responder({ code: "22P02", message: "invalid input syntax for type uuid" }).status).toBe(400);
  });

  it("deve esconder detalhes de erros inesperados", () => {
    expect(responder(new Error("conexão caiu"))).toEqual({
      status: 500,
      corpo: { success: false, message: "Erro interno do servidor. Tente novamente mais tarde." },
    });
  });
});