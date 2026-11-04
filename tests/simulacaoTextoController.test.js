jest.mock("../src/services/iaTatuagem.service", () => ({
  ...jest.requireActual("../src/services/iaTatuagem.service"),
  gerarSimulacao: jest.fn(),
  gerarSimulacaoPorTexto: jest.fn(),
}));

const iaTatuagemService = require("../src/services/iaTatuagem.service");
const { simularTatuagemPorTexto } = require("../src/controllers/simulacao.controller");

const enviar = async (body) => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  await simularTatuagemPorTexto({ body }, res);
  return { status: res.status.mock.calls[0][0], corpo: res.json.mock.calls[0][0] };
};

describe("simulação de tatuagem por texto", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("deve gerar a simulação com a descrição limpa e o membro escolhido", async () => {
    iaTatuagemService.gerarSimulacaoPorTexto.mockResolvedValue("data:image/jpeg;base64,AAAA");

    const resposta = await enviar({ descricao: "  leão   com rosa \n fine line ", membro: "Perna" });

    expect(iaTatuagemService.gerarSimulacaoPorTexto).toHaveBeenCalledWith("leão com rosa fine line", "Perna");
    expect(resposta).toEqual({
      status: 200,
      corpo: { sucesso: true, imagemSimulada: "data:image/jpeg;base64,AAAA" },
    });
  });

  it("deve recusar descrição vazia, curta ou que não seja texto", async () => {
    for (const descricao of [undefined, "", "   ", "ab", 123]) {
      const resposta = await enviar({ descricao, membro: "Braço" });
      expect(resposta.status).toBe(400);
      expect(resposta.corpo.erro).toContain("pelo menos 3 letras");
    }
    expect(iaTatuagemService.gerarSimulacaoPorTexto).not.toHaveBeenCalled();
  });

  it("deve recusar descrição com mais de 300 caracteres", async () => {
    const resposta = await enviar({ descricao: "a".repeat(301), membro: "Braço" });

    expect(resposta.status).toBe(400);
    expect(resposta.corpo.erro).toContain("no máximo 300");
    expect(iaTatuagemService.gerarSimulacaoPorTexto).not.toHaveBeenCalled();
  });

  it("deve recusar membro que não existe", async () => {
    const resposta = await enviar({ descricao: "dragão oriental", membro: "Orelha" });

    expect(resposta.status).toBe(400);
    expect(resposta.corpo.erro).toContain("Membro inválido");
    expect(iaTatuagemService.gerarSimulacaoPorTexto).not.toHaveBeenCalled();
  });

  it("deve aceitar o pedido sem membro, usando o padrão do serviço", async () => {
    iaTatuagemService.gerarSimulacaoPorTexto.mockResolvedValue("data:image/jpeg;base64,BBBB");

    const resposta = await enviar({ descricao: "rosa dos ventos" });

    expect(resposta.status).toBe(200);
    expect(iaTatuagemService.gerarSimulacaoPorTexto).toHaveBeenCalledWith("rosa dos ventos", undefined);
  });

  it("deve repassar a mensagem dos erros conhecidos da IA", async () => {
    const erro = new Error("O limite gratuito da IA acabou por hoje. Tente novamente mais tarde.");
    erro.statusCode = 429;
    iaTatuagemService.gerarSimulacaoPorTexto.mockRejectedValue(erro);

    const resposta = await enviar({ descricao: "borboleta", membro: "Mão" });

    expect(resposta).toEqual({ status: 429, corpo: { erro: erro.message } });
  });

  it("deve esconder detalhes de erros inesperados", async () => {
    iaTatuagemService.gerarSimulacaoPorTexto.mockRejectedValue(new Error("socket hang up"));

    const resposta = await enviar({ descricao: "borboleta", membro: "Mão" });

    expect(resposta).toEqual({ status: 500, corpo: { erro: "Falha ao processar a simulação da tatuagem." } });
  });
});
