jest.mock("@gradio/client", () => ({ Client: { connect: jest.fn() }, handle_file: jest.fn() }));

const sharp = require("sharp");
const { Client } = require("@gradio/client");
const { gerarSimulacaoPorTexto } = require("../src/services/iaTatuagem.service");

const criarCliente = (mensagens) => ({
  submit: jest.fn(() => {
    const pedido = (async function* () {
      for (const mensagem of mensagens) yield mensagem;
    })();
    pedido.cancel = jest.fn(() => Promise.resolve());
    return pedido;
  }),
  close: jest.fn(),
});

const respostaComImagem = [
  { type: "data", data: [{ url: "https://exemplo.hf.space/imagem.webp" }, 42] },
  { type: "status", stage: "complete" },
];

describe("gerarSimulacaoPorTexto", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
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
  });

  it("deve pedir ao FLUX.1-schnell uma foto do membro com a tatuagem descrita", async () => {
    const cliente = criarCliente(respostaComImagem);
    Client.connect.mockResolvedValue(cliente);

    const imagem = await gerarSimulacaoPorTexto("leão com rosa", "Braço");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect).toHaveBeenCalledTimes(1);
    expect(Client.connect).toHaveBeenCalledWith("black-forest-labs/FLUX.1-schnell", { token: "hf_token_de_teste" });

    const [endpoint, parametros] = cliente.submit.mock.calls[0];
    expect(endpoint).toBe("/infer");
    expect(parametros[0]).toContain("forearm with a tattoo of leão com rosa");
    expect(parametros.slice(2)).toEqual([false, 768, 512, 4]);
  });

  it("deve tentar o Stable Diffusion quando o FLUX estiver fora do ar", async () => {
    const cliente = criarCliente(respostaComImagem);
    Client.connect.mockRejectedValueOnce(new Error("Space is paused")).mockResolvedValueOnce(cliente);

    const imagem = await gerarSimulacaoPorTexto("rosa dos ventos", "Perna");

    expect(imagem).toMatch(/^data:image\/jpeg;base64,/);
    expect(Client.connect.mock.calls[1][0]).toBe("stabilityai/stable-diffusion-3.5-large-turbo");

    const parametros = cliente.submit.mock.calls[0][1];
    expect(parametros[0]).toContain("calf of a leg with a tattoo of rosa dos ventos");
    expect(parametros[1]).toBe("");
    expect(parametros.slice(3)).toEqual([false, 512, 768, 0, 4]);
  });

  it("deve parar e avisar quando a cota grátis acabar", async () => {
    Client.connect.mockResolvedValue(
      criarCliente([{ type: "status", stage: "error", message: "You have exceeded your GPU quota" }])
    );

    await expect(gerarSimulacaoPorTexto("borboleta", "Mão")).rejects.toMatchObject({ statusCode: 429 });
    expect(Client.connect).toHaveBeenCalledTimes(1);
  });

  it("deve recusar quando a chave do Hugging Face não estiver configurada", async () => {
    delete process.env.HUGGINGFACE_API_KEY;

    await expect(gerarSimulacaoPorTexto("borboleta", "Mão")).rejects.toMatchObject({
      statusCode: 500,
      message: "O serviço de IA não está configurado.",
    });
    expect(Client.connect).not.toHaveBeenCalled();
  });
});
