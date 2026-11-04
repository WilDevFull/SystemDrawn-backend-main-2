const URL_MODELSCOPE = 'https://api-inference.modelscope.ai';
const INTERVALO_CONSULTA_MS = 3 * 1000;

function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

async function lerJson(resposta) {
  const texto = await resposta.text();
  try {
    return JSON.parse(texto);
  } catch {
    return { message: texto };
  }
}

function erroDoModelScope(dados, situacao) {
  const detalhe = dados?.errors?.message || dados?.message || '';
  return new Error(`O ModelScope falhou (${situacao})${detalhe ? `: ${detalhe}` : '.'}`);
}

async function gerarNoModelScope({ modelo, prompt, tamanho, imagem, chave, limiteMs }) {
  const prazo = Date.now() + limiteMs;
  const restante = () => Math.max(1000, prazo - Date.now());
  const autorizacao = { Authorization: `Bearer ${chave}` };

  const corpo = { model: modelo, prompt };
  if (tamanho) corpo.size = `${tamanho[0]}x${tamanho[1]}`;
  if (imagem) corpo.image_url = [imagem];

  const pedido = await fetch(`${URL_MODELSCOPE}/v1/images/generations`, {
    method: 'POST',
    headers: { ...autorizacao, 'Content-Type': 'application/json', 'X-ModelScope-Async-Mode': 'true' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(restante()),
  });
  const dadosDoPedido = await lerJson(pedido);
  if (!pedido.ok || !dadosDoPedido.task_id) throw erroDoModelScope(dadosDoPedido, `status ${pedido.status}`);

  while (Date.now() + INTERVALO_CONSULTA_MS < prazo) {
    await esperar(INTERVALO_CONSULTA_MS);
    const consulta = await fetch(`${URL_MODELSCOPE}/v1/tasks/${dadosDoPedido.task_id}`, {
      headers: { ...autorizacao, 'X-ModelScope-Task-Type': 'image_generation' },
      signal: AbortSignal.timeout(restante()),
    });
    const tarefa = await lerJson(consulta);
    if (!consulta.ok) throw erroDoModelScope(tarefa, `status ${consulta.status}`);
    if (tarefa.task_status === 'FAILED') throw erroDoModelScope(tarefa, 'tarefa recusada');
    if (tarefa.task_status === 'SUCCEED') {
      const url = tarefa.output_images?.[0];
      if (!url) throw new Error('O ModelScope não retornou nenhuma imagem.');
      return url;
    }
  }

  throw new Error('O ModelScope demorou demais para gerar a imagem.');
}

module.exports = {
  gerarNoModelScope,
};
