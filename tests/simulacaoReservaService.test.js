jest.mock("@gradio/client", () => ({ Client: { connect: jest.fn() }, handle_file: jest.fn() }));
jest.mock("../src/services/modelScope.service", () => ({ gerarNoModelScope: jest.fn() }));

const sharp = require("sharp");
const { Client } = require("@gradio/client");
const { gerarNoModelScope } = require("../src/services/modelScope.service");
const { gerarSimulacao, gerarSimulacaoPorTexto } = require("../src/services/iaTatuagem.service");

const criarCliente = () => ({
  submit: jest.fn(() => {
    const pedido = (async function* () {
      yield { type: "data", data: [{ url: "https://exemplo.hf.space/imagem.webp" }] };
      yield { type: "status", stage: "complete" };
    })();
    pedido.cancel = jest.fn(() => Promise.resolve());
    return pedido;
  }),
  close: jest.fn(),
});

const criarDesenho = async () => {
  const quadrado = await sharp({
    create: { width: 80, height: 80, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();
  const desenho = await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: quadrado, left: 60, top: 60 }])
    .png()
    .toBuffer();
  return `data:image/png;base64,${desenho.toString("base64")}`;
};

describe("fila de IAs: texto com ModelScope primeiro, desenho com Hugging Face primeiro", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    process.env.MODELSCOPE_API_KEY = "ms_token_de_teste";
    process.env.HUGGINGFACE_API_KEY = "hf_token_de_teste";

    const imagem = await sharp({
      create: { width: 64, height: 64, channels: 3, background: { r: 200, g: 150, b: 120 } },
    })
      .png()
      .toBuffer();
    global.fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => imagem }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
    delete process.env.MODELSCOPE_API_KEY;
  });

  it("deve gerar por texto no ModelScope sem chamar o Hugging Face", async () => {
    gerarNoModelScope.mockResolvedValue("https://oss.exemplo/imagem.png");

    const imagem = await gerarSimulacaoPorTexto("leão com rosa", "Braço");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(gerarNoModelScope).toHaveBeenCalledTimes(1);
    const pedido = gerarNoModelScope.mock.calls[0][0];
    expect(pedido).toMatchObject({ modelo: "Tongyi-MAI/Z-Image-Turbo", tamanho: [768, 512], chave: "ms_token_de_teste" });
    expect(pedido.prompt).toContain("forearm with a tattoo of leão com rosa");
    expect(pedido.limiteMs).toBeLessThanOrEqual(60000);
    expect(global.fetch).toHaveBeenCalledWith("https://oss.exemplo/imagem.png", expect.any(Object));
    expect(Client.connect).not.toHaveBeenCalled();
  });

  it("deve passar para o FLUX do Hugging Face quando os créditos do ModelScope acabarem", async () => {
    gerarNoModelScope.mockRejectedValue(new Error("O ModelScope falhou (status 429): quota exceeded"));
    Client.connect.mockResolvedValue(criarCliente());

    const imagem = await gerarSimulacaoPorTexto("rosa dos ventos", "Perna");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect).toHaveBeenCalledWith("black-forest-labs/FLUX.1-schnell", { token: "hf_token_de_teste" });
  });

  it("deve usar só o Hugging Face quando não houver chave do ModelScope", async () => {
    delete process.env.MODELSCOPE_API_KEY;
    Client.connect.mockResolvedValue(criarCliente());

    await gerarSimulacaoPorTexto("borboleta", "Mão");

    expect(gerarNoModelScope).not.toHaveBeenCalled();
    expect(Client.connect).toHaveBeenCalledTimes(1);
  });

  it("deve avisar que o limite acabou quando só houver ModelScope e ele estiver sem créditos", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    gerarNoModelScope.mockRejectedValue(new Error("O ModelScope falhou (status 429): daily quota exceeded"));

    await expect(gerarSimulacaoPorTexto("borboleta", "Mão")).rejects.toMatchObject({ statusCode: 429 });
    expect(Client.connect).not.toHaveBeenCalled();
  });

  it("deve recusar quando nenhuma chave estiver configurada", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.MODELSCOPE_API_KEY;

    await expect(gerarSimulacaoPorTexto("borboleta", "Mão")).rejects.toMatchObject({
      statusCode: 500,
      message: "O serviço de IA não está configurado.",
    });
    expect(gerarNoModelScope).not.toHaveBeenCalled();
  });

  it("deve gerar o desenho primeiro no Hugging Face, sem gastar o ModelScope", async () => {
    Client.connect.mockResolvedValue(criarCliente());

    const imagem = await gerarSimulacao(await criarDesenho(), "Braço");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect).toHaveBeenCalledWith("hugging-apps/qwen-image-2-1-controlnet-union-demo", {
      token: "hf_token_de_teste",
    });
    expect(gerarNoModelScope).not.toHaveBeenCalled();
  });

  it("deve passar o desenho para o ModelScope quando o limite do Hugging Face acabar", async () => {
    Client.connect.mockResolvedValue({
      submit: jest.fn(() => {
        const pedido = (async function* () {
          yield { type: "status", stage: "error", message: "You have exceeded your GPU quota" };
        })();
        pedido.cancel = jest.fn(() => Promise.resolve());
        return pedido;
      }),
      close: jest.fn(),
    });
    gerarNoModelScope.mockResolvedValue("https://oss.exemplo/editada.png");

    const imagem = await gerarSimulacao(await criarDesenho(), "Braço", "fine line");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect).toHaveBeenCalledTimes(1);
    const pedido = gerarNoModelScope.mock.calls[0][0];
    expect(pedido.modelo).toBe("Qwen/Qwen-Image-Edit-2511");
    expect(pedido.imagem).toMatch(/^data:image\/png;base64,/);
    expect(pedido.tamanho).toBeUndefined();
    expect(pedido.prompt).toContain("real tattoo inked on the forearm");
    expect(pedido.prompt).toContain("fine line");
    expect(pedido.limiteMs).toBeGreaterThan(60000);
  });

  it("deve usar só o ModelScope no desenho quando não houver chave do Hugging Face", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    gerarNoModelScope.mockResolvedValue("https://oss.exemplo/editada.png");

    const imagem = await gerarSimulacao(await criarDesenho(), "Braço");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect).not.toHaveBeenCalled();
    expect(gerarNoModelScope).toHaveBeenCalledTimes(1);
  });

  it("deve avisar o erro quando o Hugging Face e o ModelScope falharem no desenho", async () => {
    Client.connect.mockRejectedValue(new Error("Space is paused"));
    gerarNoModelScope.mockRejectedValue(new Error("O ModelScope demorou demais para gerar a imagem."));

    await expect(gerarSimulacao(await criarDesenho(), "Braço")).rejects.toMatchObject({ statusCode: 502 });
    expect(Client.connect).toHaveBeenCalledTimes(2);
    expect(gerarNoModelScope).toHaveBeenCalledTimes(1);
  });
});
