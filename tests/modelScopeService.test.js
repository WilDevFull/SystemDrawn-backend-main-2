const { gerarNoModelScope } = require("../src/services/modelScope.service");

const resposta = (status, dados) => ({ ok: status < 400, status, text: async () => JSON.stringify(dados) });

const PEDIDO_TEXTO = {
  modelo: "Tongyi-MAI/Z-Image-Turbo",
  prompt: "forearm with a tattoo of a rose",
  tamanho: [768, 512],
  chave: "ms_token_de_teste",
  limiteMs: 60000,
};

describe("gerarNoModelScope", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  it("deve pedir a imagem, consultar até ficar pronta e devolver o link", async () => {
    global.fetch
      .mockResolvedValueOnce(resposta(200, { task_id: "tarefa-1" }))
      .mockResolvedValueOnce(resposta(200, { task_status: "PROCESSING" }))
      .mockResolvedValueOnce(resposta(200, { task_status: "SUCCEED", output_images: ["https://oss.exemplo/imagem.png"] }));

    const promessa = gerarNoModelScope(PEDIDO_TEXTO);
    await jest.advanceTimersByTimeAsync(6000);

    await expect(promessa).resolves.toBe("https://oss.exemplo/imagem.png");

    const [urlPedido, opcoesPedido] = global.fetch.mock.calls[0];
    expect(urlPedido).toBe("https://api-inference.modelscope.ai/v1/images/generations");
    expect(opcoesPedido.method).toBe("POST");
    expect(opcoesPedido.headers).toMatchObject({
      Authorization: "Bearer ms_token_de_teste",
      "X-ModelScope-Async-Mode": "true",
    });
    expect(JSON.parse(opcoesPedido.body)).toEqual({
      model: "Tongyi-MAI/Z-Image-Turbo",
      prompt: "forearm with a tattoo of a rose",
      size: "768x512",
    });

    const [urlConsulta, opcoesConsulta] = global.fetch.mock.calls[1];
    expect(urlConsulta).toBe("https://api-inference.modelscope.ai/v1/tasks/tarefa-1");
    expect(opcoesConsulta.headers).toMatchObject({
      Authorization: "Bearer ms_token_de_teste",
      "X-ModelScope-Task-Type": "image_generation",
    });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("deve mandar a imagem da montagem quando for edição", async () => {
    global.fetch
      .mockResolvedValueOnce(resposta(200, { task_id: "tarefa-2" }))
      .mockResolvedValueOnce(resposta(200, { task_status: "SUCCEED", output_images: ["https://oss.exemplo/editada.png"] }));

    const promessa = gerarNoModelScope({
      modelo: "Qwen/Qwen-Image-Edit",
      prompt: "make the tattoo look real",
      imagem: "data:image/png;base64,AAAA",
      chave: "ms_token_de_teste",
      limiteMs: 60000,
    });
    await jest.advanceTimersByTimeAsync(3000);

    await expect(promessa).resolves.toBe("https://oss.exemplo/editada.png");
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      model: "Qwen/Qwen-Image-Edit",
      prompt: "make the tattoo look real",
      image_url: ["data:image/png;base64,AAAA"],
    });
  });

  it("deve avisar o motivo quando o ModelScope recusar o pedido", async () => {
    global.fetch.mockResolvedValueOnce(resposta(429, { errors: { message: "daily quota exceeded" } }));

    await expect(gerarNoModelScope(PEDIDO_TEXTO)).rejects.toThrow(
      "O ModelScope falhou (status 429): daily quota exceeded"
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("deve avisar quando a tarefa falhar no ModelScope", async () => {
    global.fetch
      .mockResolvedValueOnce(resposta(200, { task_id: "tarefa-3" }))
      .mockResolvedValueOnce(resposta(200, { task_status: "FAILED", errors: { message: "content blocked" } }));

    const promessa = gerarNoModelScope(PEDIDO_TEXTO);
    const verificacao = expect(promessa).rejects.toThrow("O ModelScope falhou (tarefa recusada): content blocked");
    await jest.advanceTimersByTimeAsync(3000);
    await verificacao;
  });

  it("deve desistir quando passar do tempo limite", async () => {
    global.fetch
      .mockResolvedValueOnce(resposta(200, { task_id: "tarefa-4" }))
      .mockResolvedValue(resposta(200, { task_status: "RUNNING" }));

    const promessa = gerarNoModelScope({ ...PEDIDO_TEXTO, limiteMs: 10000 });
    const verificacao = expect(promessa).rejects.toThrow("O ModelScope demorou demais para gerar a imagem.");
    await jest.advanceTimersByTimeAsync(10000);
    await verificacao;
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
