require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { MEMBROS } = require('../src/services/iaTatuagem.service');

const PASTA_BASES = path.join(__dirname, '..', 'src', 'assets', 'membros');
const REFAZER = process.argv.includes('--refazer');

const SO_ESTES = process.argv.slice(process.argv.indexOf('--refazer') + 1).filter((a) => !a.startsWith('-'));

const DESCRICOES = {
  braco:
    'close-up studio photo of a bare human forearm lying horizontally across the whole frame, inner forearm skin facing the camera, filling the frame from left to right',
  pescoco:
    'close-up studio photo of the side of a person\'s neck, head turned slightly away, short dark hair, smooth bare neck skin in the center of the frame, natural pose',
};

const SPACES = [
  { space: 'black-forest-labs/FLUX.1-schnell', endpoint: '/infer' },
  { space: 'stabilityai/stable-diffusion-3.5-large-turbo', endpoint: '/infer' },
];

const MODELOS = ['black-forest-labs/FLUX.1-schnell', 'stabilityai/stable-diffusion-xl-base-1.0'];

const LIMITE_MS = 3 * 60 * 1000;

function comLimiteDeTempo(promessa) {
  let relogio;
  const estouro = new Promise((_, rejeitar) => {
    relogio = setTimeout(() => rejeitar(new Error('demorou mais de 3 minutos')), LIMITE_MS);
  });
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(relogio));
}

async function gerarComSpace(prompt, token) {
  const { Client } = require('@gradio/client');

  for (const { space, endpoint } of SPACES) {
    try {
      const cliente = await comLimiteDeTempo(Client.connect(space, { token }));
      const api = await cliente.view_api();
      const parametros = api.named_endpoints[endpoint]?.parameters || [];

      const dados = { prompt };
      for (const { parameter_name: nome, parameter_has_default: temPadrao } of parametros) {
        if (nome === 'randomize_seed') dados.randomize_seed = true;
        if (!temPadrao && /negative/i.test(nome)) dados[nome] = 'tattoo, text, watermark, deformed, blurry';
      }

      const resultado = await comLimiteDeTempo(cliente.predict(endpoint, dados));
      const saida = resultado.data?.[0];
      const url = saida?.url || saida?.image?.url;
      if (!url) throw new Error('o Space não devolveu imagem');

      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error(`não foi possível baixar a imagem (Status ${resposta.status})`);
      console.log(`   gerada no Space ${space}`);
      return Buffer.from(await resposta.arrayBuffer());
    } catch (erro) {
      console.warn(`   Space ${space} indisponível: ${erro.message}`);
    }
  }
  return null;
}

async function gerarComProvedor(prompt, token) {
  const { InferenceClient } = require('@huggingface/inference');
  const cliente = new InferenceClient(token);

  for (const modelo of MODELOS) {
    try {
      const imagem = await cliente.textToImage({ model: modelo, provider: 'auto', inputs: prompt });
      console.log(`   gerada com ${modelo}`);
      return Buffer.from(await imagem.arrayBuffer());
    } catch (erro) {
      const status = erro.httpResponse?.status ? ` (Status ${erro.httpResponse.status})` : '';
      console.warn(`   ${modelo} indisponível${status}: ${erro.message}`);

      if (erro.httpResponse?.status === 402) break;
    }
  }
  return null;
}

async function gerarComPollinations(prompt, [largura, altura]) {
  const semente = Math.floor(Math.random() * 100000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${largura}&height=${altura}&seed=${semente}&nologo=true`;
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(LIMITE_MS) });
    if (!resposta.ok) throw new Error(`Status ${resposta.status}`);
    console.log('   gerada no Pollinations (grátis, fora do Hugging Face)');
    return Buffer.from(await resposta.arrayBuffer());
  } catch (erro) {
    console.warn(`   Pollinations indisponível: ${erro.message}`);
    return null;
  }
}

async function gerarImagem(prompt, token, formato) {
  return (
    (await gerarComSpace(prompt, token)) ||
    (await gerarComPollinations(prompt, formato)) ||
    gerarComProvedor(prompt, token)
  );
}

async function main() {
  const token = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!token) {
    console.error('HUGGINGFACE_API_KEY não encontrada. Verifique o arquivo .env');
    process.exit(1);
  }

  fs.mkdirSync(PASTA_BASES, { recursive: true });
  let faltando = 0;

  for (const [chave, membro] of Object.entries(MEMBROS)) {
    const destino = path.join(PASTA_BASES, `${chave}.png`);
    const refazerEste = REFAZER && (SO_ESTES.length === 0 || SO_ESTES.includes(chave));
    if (fs.existsSync(destino) && !refazerEste) {
      console.log(`- ${membro.nome}: já existe, mantida.`);
      continue;
    }

    console.log(`- ${membro.nome}: gerando...`);
    const descricao = DESCRICOES[chave] || `professional studio photo of a bare human ${membro.ingles}, centered`;
    const prompt = `${descricao}, clean skin with no tattoos, plain light grey background, soft even lighting, highly detailed`;
    const imagem = await gerarImagem(prompt, token, membro.formato);

    if (!imagem) {
      console.error(`   não foi possível gerar a foto de ${membro.nome}.`);
      faltando++;
      continue;
    }

    await sharp(imagem).resize(...membro.formato, { fit: 'cover' }).png().toFile(destino);
    console.log(`   salva em ${destino}`);
  }

  console.log(faltando ? `\nTerminado, mas ${faltando} foto(s) faltando.` : '\nTodas as fotos base estão prontas.');
  process.exit(faltando ? 1 : 0);
}

main();
