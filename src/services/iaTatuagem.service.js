const path = require('path');
const { gerarNoModelScope } = require('./modelScope.service');

const LIMITE_TOTAL_MS = 140 * 1000;
const LIMITE_CONEXAO_MS = 30 * 1000;
const LIMITE_GERACAO_MS = 80 * 1000;
const LIMITE_DOWNLOAD_MS = 20 * 1000;
const LIMITE_MODELSCOPE_MS = 60 * 1000;

const TEMPO_MINIMO_TENTATIVA_MS = 40 * 1000;

const PASTA_BASES = path.join(__dirname, '..', 'assets', 'membros');

const MEMBROS = {
  braco: { nome: 'Braço', ingles: 'forearm', formato: [768, 512], escala: 0.25, centro: [0.72, 0.5], eixo: 'x' },
  perna: { nome: 'Perna', ingles: 'calf of a leg', formato: [512, 768], escala: 0.35, centro: [0.24, 0.3], eixo: 'y' },
  costas: { nome: 'Costas', ingles: 'upper back', formato: [512, 768], escala: 0.5, eixo: 'y' },
  peito: { nome: 'Peito', ingles: 'chest', formato: [768, 512], escala: 0.35, eixo: 'y' },
  pescoco: { nome: 'Pescoço', ingles: 'side of the neck', formato: [512, 768], escala: 0.4, centro: [0.57, 0.6], eixo: 'y', comprimento: 0.35 },
  mao: { nome: 'Mão', ingles: 'back of the hand', formato: [768, 512], escala: 0.22, centro: [0.42, 0.62], eixo: 'y' },
};
const MEMBRO_PADRAO = 'braco';

const PROMPT_QUALIDADE = 'best quality, extremely detailed, photorealistic';

const MODELSCOPE_TEXTO = 'Tongyi-MAI/Z-Image-Turbo';
const MODELSCOPE_DESENHO = 'Qwen/Qwen-Image-Edit-2511';

const SPACES = [
  {

    id: 'hugging-apps/qwen-image-2-1-controlnet-union-demo',
    endpoint: '/generate',
    parametros: async (montagem, prompt, semente) => {
      const { handle_file } = require('@gradio/client');
      return [
        prompt,
        handle_file(new Blob([montagem], { type: 'image/png' })),
        'Canny', 
        null, 
        null, 
        1, 
        1024, 
        20, 
        semente,
        false, 
        '', 
        1, 
      ];
    },

    lerUrl: (dados) => dados?.[0]?.url,
  },
  {

    id: 'ByteDance/Hyper-SD15-Scribble',
    endpoint: '/process_image',
    parametros: async (montagem, prompt, semente) => {
      const { handle_file } = require('@gradio/client');
      const rascunho = await montarRascunho(montagem);
      const arquivo = () => handle_file(new Blob([rascunho], { type: 'image/png' }));
      return [
        4, 
        `${prompt}, ${PROMPT_QUALIDADE}`,
        1, 
        1, 
        semente,
        { background: arquivo(), layers: [], composite: arquivo() },
        1, 
      ];
    },

    lerUrl: (dados) => {
      const galeria = Array.isArray(dados?.[0]) ? dados[0] : [];
      const ultima = galeria[galeria.length - 1];
      return ultima?.image?.url || ultima?.url;
    },
  },
];

function erroComStatus(mensagem, statusCode) {
  const erro = new Error(mensagem);
  erro.statusCode = statusCode;
  return erro;
}

function normalizarMembro(valor) {
  if (typeof valor !== 'string') return null;
  const chave = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
  return Object.hasOwn(MEMBROS, chave) ? chave : null;
}

function ehPele(r, g, b) {
  return r - b > 25 && r >= g;
}

function preencher(podeEntrar, marcado, inicios, largura, altura) {
  const fila = new Int32Array(largura * altura);
  let ler = 0;
  let escrever = 0;
  const tentar = (i) => {
    if (!marcado[i] && podeEntrar(i)) {
      marcado[i] = 1;
      fila[escrever++] = i;
    }
  };
  inicios.forEach(tentar);
  while (ler < escrever) {
    const i = fila[ler++];
    const x = i % largura;
    if (x > 0) tentar(i - 1);
    if (x < largura - 1) tentar(i + 1);
    if (i >= largura) tentar(i - largura);
    if (i < largura * (altura - 1)) tentar(i + largura);
  }
}

function pixelsDaBorda(largura, altura) {
  const borda = [];
  for (let x = 0; x < largura; x++) borda.push(x, (altura - 1) * largura + x);
  for (let y = 1; y < altura - 1; y++) borda.push(y * largura, y * largura + largura - 1);
  return borda;
}

function mascaraDoMembro(rgb, largura, altura, ancora) {
  const total = largura * altura;
  const pele = new Uint8Array(total);
  for (let i = 0; i < total; i++) pele[i] = ehPele(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) ? 1 : 0;

  let inicio = ancora.y * largura + ancora.x;
  if (!pele[inicio]) {
    let menor = Infinity;
    for (let i = 0; i < total; i++) {
      if (!pele[i]) continue;
      const d = Math.hypot((i % largura) - ancora.x, Math.floor(i / largura) - ancora.y);
      if (d < menor) {
        menor = d;
        inicio = i;
      }
    }
    if (menor === Infinity) return null; 
  }

  const membro = new Uint8Array(total);
  preencher((i) => pele[i], membro, [inicio], largura, altura);

  const fora = new Uint8Array(total);
  preencher((i) => !membro[i], fora, pixelsDaBorda(largura, altura), largura, altura);
  for (let i = 0; i < total; i++) if (!fora[i]) membro[i] = 1;
  return { membro, inicio: { x: inicio % largura, y: Math.floor(inicio / largura) } };
}

function suavizar(valores, janela) {
  const saida = new Float32Array(valores.length).fill(NaN);
  for (let i = 0; i < valores.length; i++) {
    if (Number.isNaN(valores[i])) continue;
    let soma = 0;
    let quantos = 0;
    for (let j = Math.max(0, i - janela); j <= Math.min(valores.length - 1, i + janela); j++) {
      if (!Number.isNaN(valores[j])) {
        soma += valores[j];
        quantos++;
      }
    }
    saida[i] = soma / quantos;
  }
  return saida;
}

function medirMembro(membro, largura, altura, eixo, ancora) {
  const fatias = eixo === 'x' ? largura : altura;
  const tamanho = eixo === 'x' ? altura : largura;
  const ehMembro = eixo === 'x' ? (f, p) => membro[p * largura + f] : (f, p) => membro[f * largura + p];
  const trecho = (f, p) => {
    if (p < 0 || p >= tamanho || !ehMembro(f, p)) return null;
    let a = p;
    let b = p;
    while (a > 0 && ehMembro(f, a - 1)) a--;
    while (b < tamanho - 1 && ehMembro(f, b + 1)) b++;
    return [a, b];
  };

  const meio = new Float32Array(fatias).fill(NaN);
  const raio = new Float32Array(fatias).fill(NaN);
  const f0 = eixo === 'x' ? ancora.x : ancora.y;
  const p0 = eixo === 'x' ? ancora.y : ancora.x;
  const primeiro = trecho(f0, p0);
  for (const passo of [-1, 1]) {
    let anterior = primeiro;
    for (let f = f0; f >= 0 && f < fatias; f += passo) {
      const atual = trecho(f, Math.round((anterior[0] + anterior[1]) / 2));
      if (!atual) break;
      meio[f] = (atual[0] + atual[1]) / 2;
      raio[f] = (atual[1] - atual[0] + 1) / 2;
      anterior = atual;
    }
  }
  return { meio: suavizar(meio, 20), raio: suavizar(raio, 20), f0, p0 };
}

function apagarPedacos(rgba, largura, altura, deveApagar) {
  const total = largura * altura;
  const margem = Math.max(2, Math.round(0.03 * Math.min(largura, altura)));
  const visitado = new Uint8Array(total);
  const pedaco = [];
  for (let inicio = 0; inicio < total; inicio++) {
    if (visitado[inicio] || rgba[inicio * 4 + 3] <= 24) continue;
    pedaco.length = 0;
    visitado[inicio] = 1;
    pedaco.push(inicio);
    let maiorAlfa = 0;
    let encostaNaBorda = false;
    for (let k = 0; k < pedaco.length; k++) {
      const i = pedaco[k];
      const x = i % largura;
      maiorAlfa = Math.max(maiorAlfa, rgba[i * 4 + 3]);
      const y = (i - x) / largura;
      if (x < margem || x >= largura - margem || y < margem || y >= altura - margem) encostaNaBorda = true;
      const vizinhos = [x > 0 ? i - 1 : -1, x < largura - 1 ? i + 1 : -1, i - largura, i + largura];
      for (const j of vizinhos) {
        if (j >= 0 && j < total && !visitado[j] && rgba[j * 4 + 3] > 24) {
          visitado[j] = 1;
          pedaco.push(j);
        }
      }
    }
    if (deveApagar(pedaco.length, maiorAlfa, encostaNaBorda)) for (const i of pedaco) rgba[i * 4 + 3] = 0;
  }
}

function igualarLuzDoPapel(rgba, largura, altura) {
  const B = 8;
  const papel = [0, 1, 2].map(() => new Float32Array(B * B));
  for (let by = 0; by < B; by++) {
    for (let bx = 0; bx < B; bx++) {
      const [x0, x1] = [Math.floor((bx * largura) / B), Math.floor(((bx + 1) * largura) / B)];
      const [y0, y1] = [Math.floor((by * altura) / B), Math.floor(((by + 1) * altura) / B)];
      for (let c = 0; c < 3; c++) {
        const valores = [];
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) valores.push(rgba[(y * largura + x) * 4 + c]);
        valores.sort((a, b) => a - b);

        papel[c][by * B + bx] = valores.length ? valores[Math.floor(valores.length * 0.9)] : 255;
      }
    }
  }

  const brilho = (k) => Math.min(papel[0][k], papel[1][k], papel[2][k]);
  const tipico = Array.from({ length: B * B }, (_, k) => brilho(k)).sort((a, b) => a - b)[(B * B) >> 1];
  const valido = Array.from({ length: B * B }, (_, k) => brilho(k) >= tipico * 0.7);
  for (let rodada = 0; rodada < B && valido.includes(false); rodada++) {
    const novos = [];
    for (let k = 0; k < B * B; k++) {
      if (valido[k]) continue;
      const vizinhos = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const [bx, by] = [(k % B) + dx, Math.floor(k / B) + dy];
          if (bx >= 0 && bx < B && by >= 0 && by < B && valido[by * B + bx]) vizinhos.push(by * B + bx);
        }
      }
      if (vizinhos.length) {
        for (let c = 0; c < 3; c++) papel[c][k] = vizinhos.reduce((soma, v) => soma + papel[c][v], 0) / vizinhos.length;
        novos.push(k);
      }
    }
    novos.forEach((k) => (valido[k] = true));
  }
  for (let y = 0; y < altura; y++) {
    const fy = Math.max(0, Math.min(B - 1, (y + 0.5) / (altura / B) - 0.5));
    const [ya, ty] = [Math.floor(fy), fy - Math.floor(fy)];
    const yb = Math.min(B - 1, ya + 1);
    for (let x = 0; x < largura; x++) {
      const fx = Math.max(0, Math.min(B - 1, (x + 0.5) / (largura / B) - 0.5));
      const [xa, tx] = [Math.floor(fx), fx - Math.floor(fx)];
      const xb = Math.min(B - 1, xa + 1);
      for (let c = 0; c < 3; c++) {
        const p = papel[c];
        const luz =
          (p[ya * B + xa] * (1 - tx) + p[ya * B + xb] * tx) * (1 - ty) +
          (p[yb * B + xa] * (1 - tx) + p[yb * B + xb] * tx) * ty;
        const i = (y * largura + x) * 4 + c;
        rgba[i] = Math.min(255, Math.round((rgba[i] * 255) / Math.max(1, luz)));
      }
    }
  }
}

function corDaBorda(rgba, borda) {
  const mediana = (canal) => {
    const valores = borda.map((i) => rgba[i * 4 + canal]).sort((a, b) => a - b);
    return valores[Math.floor(valores.length / 2)];
  };
  return [mediana(0), mediana(1), mediana(2)];
}

function tirarFundoClaro(rgba, total, fundo) {
  const RUIDO = 12 / 255;
  for (let i = 0; i < total; i++) {
    let tinta = 0;
    for (let c = 0; c < 3; c++) tinta = Math.max(tinta, (fundo[c] - rgba[i * 4 + c]) / Math.max(1, fundo[c]));
    if (tinta > 0) {
      for (let c = 0; c < 3; c++) {
        const cor = fundo[c] + (rgba[i * 4 + c] - fundo[c]) / tinta;
        rgba[i * 4 + c] = Math.max(0, Math.min(255, Math.round(cor)));
      }
    }
    rgba[i * 4 + 3] = Math.round(rgba[i * 4 + 3] * Math.max(0, (tinta - RUIDO) / (1 - RUIDO)));
  }
}

function tirarFundoColorido(rgba, largura, altura, fundo, borda, soEncostado) {
  const total = largura * altura;
  const TOLERANCIA = 70;
  const distancia = (i) =>
    Math.hypot(rgba[i * 4] - fundo[0], rgba[i * 4 + 1] - fundo[1], rgba[i * 4 + 2] - fundo[2]);
  const encostado = new Uint8Array(total);
  if (soEncostado) preencher((i) => distancia(i) < TOLERANCIA, encostado, borda, largura, altura);
  for (let i = 0; i < total; i++) {
    if (soEncostado && !encostado[i]) continue;
    const fator = Math.min(1, Math.max(0, (distancia(i) - TOLERANCIA) / (TOLERANCIA * 0.6)));
    rgba[i * 4 + 3] = Math.round(rgba[i * 4 + 3] * Math.sqrt(fator));
  }

  const minimo = Math.max(6, Math.round(total * 0.0005));
  if (!soEncostado) apagarPedacos(rgba, largura, altura, (tamanho, maiorAlfa) => tamanho < 6 || (tamanho < minimo && maiorAlfa < 200));
}

function brilhoDaTinta(rgba, total) {
  let soma = 0;
  let peso = 0;
  for (let i = 0; i < total; i++) {
    const a = rgba[i * 4 + 3];
    soma += a * (0.3 * rgba[i * 4] + 0.59 * rgba[i * 4 + 1] + 0.11 * rgba[i * 4 + 2]);
    peso += a;
  }
  return peso ? soma / peso : 0;
}

function areaDoDesenho(rgba, largura, altura) {
  let [x0, y0, x1, y1] = [largura, altura, -1, -1];
  for (let i = 0; i < largura * altura; i++) {
    if (rgba[i * 4 + 3] > 24) {
      const x = i % largura;
      const y = Math.floor(i / largura);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return x1 < 0 ? null : { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function lerPixels(imagem) {
  const sharp = require('sharp');
  try {
    return await sharp(imagem, { limitInputPixels: 50e6 })
      .rotate() 
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }) 
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw erroComStatus('Não foi possível ler o desenho. Envie uma imagem PNG, JPG ou WEBP válida.', 400);
  }
}

function limparDesenho(rgba, largura, altura) {
  const total = largura * altura;
  const bordaToda = pixelsDaBorda(largura, altura);
  const borda = bordaToda.filter((i) => rgba[i * 4 + 3] > 128);

  if (borda.length < bordaToda.length * 0.5) return areaDoDesenho(rgba, largura, altura);

  const meioDe = (valores) => valores.sort((a, b) => a - b)[valores.length >> 1];
  const claroDaBorda = meioDe(borda.map((i) => Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2])));
  const corDaBordaForte = meioDe(
    borda.map((i) => Math.max(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) - Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]))
  );
  if (claroDaBorda >= 110 && corDaBordaForte <= 40) igualarLuzDoPapel(rgba, largura, altura);

  const fundo = corDaBorda(rgba, borda);
  const parecidos = borda.filter(
    (i) => Math.hypot(rgba[i * 4] - fundo[0], rgba[i * 4 + 1] - fundo[1], rgba[i * 4 + 2] - fundo[2]) < 70
  ).length;

  if (parecidos < borda.length * 0.5) {
    for (let y = 0; y < altura; y++) {
      for (let x = 0; x < largura; x++) {
        const e = Math.hypot((x - largura / 2) / (largura / 2), (y - altura / 2) / (altura / 2));
        const i = y * largura + x;
        rgba[i * 4 + 3] = Math.round(rgba[i * 4 + 3] * Math.min(1, Math.max(0, (1 - e) / 0.25)));
      }
    }
  } else if (Math.min(...fundo) >= 200) {
    tirarFundoClaro(rgba, total, fundo);

    apagarPedacos(rgba, largura, altura, (tamanho, maiorAlfa, encostaNaBorda) => encostaNaBorda && maiorAlfa < 160);
  } else {
    const copia = Buffer.from(rgba);
    tirarFundoColorido(rgba, largura, altura, fundo, borda, false);

    if (brilhoDaTinta(rgba, total) > 200) {
      copia.copy(rgba);
      tirarFundoColorido(rgba, largura, altura, fundo, borda, true);
      const area = areaDoDesenho(rgba, largura, altura);
      if (area) {
        const dentro = [];
        for (let y = area.top; y < area.top + area.height; y++) {
          for (let x = area.left; x < area.left + area.width; x++) dentro.push(y * largura + x);
        }
        const papelDentro = corDaBorda(rgba, dentro.filter((i) => rgba[i * 4 + 3] > 128));
        if (Math.min(...papelDentro) >= 200) {
          const pedaco = Buffer.alloc(dentro.length * 4);
          dentro.forEach((i, k) => rgba.copy(pedaco, k * 4, i * 4, i * 4 + 4));
          tirarFundoClaro(pedaco, dentro.length, papelDentro);
          dentro.forEach((i, k) => pedaco.copy(rgba, i * 4, k * 4, k * 4 + 4));
        }
      }
    }
  }
  return areaDoDesenho(rgba, largura, altura);
}

async function prepararDesenho(imagem) {
  const sharp = require('sharp');
  const { data, info } = await lerPixels(imagem);
  const area = limparDesenho(data, info.width, info.height);
  if (!area) throw erroComStatus('O desenho enviado parece estar vazio. Envie outra imagem.', 400);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract(area)
    .png()
    .toBuffer();
}

async function montarImagemControle(imagemTatuagemBase64, chaveMembro) {
  const sharp = require('sharp');
  const membro = MEMBROS[chaveMembro];
  const caminhoBase = path.join(PASTA_BASES, `${chaveMembro}.png`);
  const [largura, altura] = membro.formato;
  const indisponivel = () => erroComStatus(`A simulação para "${membro.nome}" ainda não está disponível.`, 500);

  let base;
  try {
    base = await sharp(caminhoBase).resize(largura, altura, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  } catch {
    console.error(
      `[IA] Foto base não encontrada em ${caminhoBase}. Rode "npm run gerar-membros" uma vez.`
    );
    throw indisponivel();
  }

  const dados = imagemTatuagemBase64.replace(/^data:[^,]+,/, '');
  const desenhoLimpo = await prepararDesenho(Buffer.from(dados, 'base64'));

  const [centroX, centroY] = membro.centro || [0.5, 0.5];
  const ancora = { x: Math.round(centroX * (largura - 1)), y: Math.round(centroY * (altura - 1)) };
  const achado = mascaraDoMembro(base, largura, altura, ancora);
  const medida = achado && medirMembro(achado.membro, largura, altura, membro.eixo, achado.inicio);
  if (!medida || !(medida.raio[medida.f0] >= 0.05 * Math.min(largura, altura))) {
    console.error(`[IA] Não achei o membro na foto base de ${chaveMembro}. Gere a foto de novo.`);
    throw indisponivel();
  }
  const { meio, raio, f0, p0 } = medida;

  const limiteAoLongo = Math.round(
    membro.eixo === 'x' ? largura * membro.escala : altura * (membro.comprimento || 0.6)
  );
  const limiteLado = Math.round(membro.eixo === 'x' ? altura * 0.6 : largura * membro.escala);

  let [n, sf, sm, sff, sfm] = [0, 0, 0, 0, 0];
  for (let f = Math.max(0, Math.round(f0 - limiteAoLongo / 2)); f < Math.min(meio.length, f0 + limiteAoLongo / 2); f++) {
    if (Number.isNaN(meio[f])) continue;
    [n, sf, sm, sff, sfm] = [n + 1, sf + f, sm + meio[f], sff + f * f, sfm + f * meio[f]];
  }
  const inclinacao = n > 1 ? Math.max(-0.5, Math.min(0.5, (n * sfm - sf * sm) / (n * sff - sf * sf || 1))) : 0;
  const meio0 = n > 1 ? (sm - inclinacao * sf) / n + inclinacao * f0 : meio[f0];
  const norma = Math.hypot(1, inclinacao);
  const raio0 = raio[f0] / norma;

  const limiteVolta = Math.min(limiteLado, 1.7 * raio0);
  const { width: w0, height: h0 } = await sharp(desenhoLimpo).metadata();
  const [comprimento0, volta0] = membro.eixo === 'x' ? [w0, h0] : [h0, w0];
  const escala = Math.min(limiteAoLongo / comprimento0, limiteVolta / volta0, 2);
  const comprimento = Math.max(1, Math.round(comprimento0 * escala));
  const volta = Math.max(1, Math.round(volta0 * escala));
  const [dw, dh] = membro.eixo === 'x' ? [comprimento, volta] : [volta, comprimento];
  const desenho = await sharp(desenhoLimpo).resize(dw, dh, { fit: 'fill' }).ensureAlpha().raw().toBuffer();

  const amostrar = (x, y, saida) => {
    const xa = Math.max(0, Math.min(dw - 1, Math.floor(x)));
    const ya = Math.max(0, Math.min(dh - 1, Math.floor(y)));
    const xb = Math.min(dw - 1, xa + 1);
    const yb = Math.min(dh - 1, ya + 1);
    const fx = Math.max(0, Math.min(1, x - xa));
    const fy = Math.max(0, Math.min(1, y - ya));
    const pesos = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
    const pontos = [ya * dw + xa, ya * dw + xb, yb * dw + xa, yb * dw + xb];
    let alfa = 0;
    saida[0] = saida[1] = saida[2] = 0;
    for (let k = 0; k < 4; k++) {
      const a = (desenho[pontos[k] * 4 + 3] / 255) * pesos[k];
      alfa += a;
      for (let c = 0; c < 3; c++) saida[c] += desenho[pontos[k] * 4 + c] * a;
    }
    if (alfa > 0) for (let c = 0; c < 3; c++) saida[c] /= alfa;
    saida[3] = alfa;
  };

  const membroSuave = await sharp(Buffer.from(achado.membro.map((v) => v * 255)), {
    raw: { width: largura, height: altura, channels: 1 },
  })
    .blur(1.5)
    .extractChannel(0)
    .raw()
    .toBuffer();

  const folga = Math.max(0, raio0 * (Math.PI / 2) * 0.8 - volta / 2);
  const desvio = (p0 - meio0) / norma;
  const deslocamento0 = Math.max(-folga, Math.min(folga, raio0 * Math.asin(Math.max(-1, Math.min(1, desvio / raio0)))));
  const camada = Buffer.alloc(largura * altura * 4);
  const cor = [0, 0, 0, 0];
  for (let i = 0; i < largura * altura; i++) {
    if (!membroSuave[i]) continue;
    const [x, y] = [i % largura, Math.floor(i / largura)];
    const [f, p] = membro.eixo === 'x' ? [x, y] : [y, x];
    const aoLongo = (f - f0 + inclinacao * (p - meio0)) / norma + comprimento / 2;
    const t = (p - meio0 - inclinacao * (f - f0)) / norma / raio0;
    if (Math.abs(t) >= 1) continue;
    const naVolta = raio0 * Math.asin(t) - deslocamento0 + volta / 2;
    if (naVolta < 0 || naVolta > volta - 1 || aoLongo < 0 || aoLongo > comprimento - 1) continue;
    if (membro.eixo === 'x') amostrar(aoLongo, naVolta, cor);
    else amostrar(naVolta, aoLongo, cor);
    const lateral = Math.min(1, (1 - Math.abs(t)) / 0.15);
    camada[i * 4] = Math.round(cor[0]);
    camada[i * 4 + 1] = Math.round(cor[1]);
    camada[i * 4 + 2] = Math.round(cor[2]);
    camada[i * 4 + 3] = Math.round(cor[3] * lateral * membroSuave[i]);
  }

  return sharp(base, { raw: { width: largura, height: altura, channels: 3 } })
    .composite([{ input: camada, raw: { width: largura, height: altura, channels: 4 }, blend: 'multiply' }])
    .png()
    .toBuffer();
}

async function montarRascunho(montagem) {
  const sharp = require('sharp');
  const { data, info } = await sharp(montagem)
    .greyscale()
    .blur(1) 
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: largura, height: altura } = info;
  const rascunho = Buffer.alloc(largura * altura, 255);
  const pixel = (x, y) => data[y * largura + x];

  for (let y = 1; y < altura - 1; y++) {
    for (let x = 1; x < largura - 1; x++) {
      const gx =
        pixel(x + 1, y - 1) + 2 * pixel(x + 1, y) + pixel(x + 1, y + 1) -
        pixel(x - 1, y - 1) - 2 * pixel(x - 1, y) - pixel(x - 1, y + 1);
      const gy =
        pixel(x - 1, y + 1) + 2 * pixel(x, y + 1) + pixel(x + 1, y + 1) -
        pixel(x - 1, y - 1) - 2 * pixel(x, y - 1) - pixel(x + 1, y - 1);
      if (Math.hypot(gx, gy) > 40) rascunho[y * largura + x] = 0;
    }
  }

  return sharp(rascunho, { raw: { width: largura, height: altura, channels: 1 } }).png().toBuffer();
}

function comLimiteDeTempo(promessa, ms, mensagem, aoEstourar) {
  let relogio;
  const estouro = new Promise((_, rejeitar) => {
    relogio = setTimeout(() => {
      if (aoEstourar) aoEstourar();
      rejeitar(erroComStatus(mensagem, 504));
    }, ms);
  });
  return Promise.race([promessa, estouro]).finally(() => clearTimeout(relogio));
}

function conectar(space, token, limiteMs) {
  const { Client } = require('@gradio/client');
  const conexao = Client.connect(space.id, { token });
  return comLimiteDeTempo(
    conexao,
    limiteMs,
    'O serviço de IA demorou para responder. Tente novamente em instantes.',
    () => {

      conexao.then((cliente) => cliente.close()).catch(() => {});
    }
  );
}

async function rodarControlNet(cliente, endpoint, parametros, limiteMs) {
  const pedido = cliente.submit(endpoint, parametros, null, null, true);

  const leitura = (async () => {
    let dados;
    let terminou = false;
    for await (const mensagem of pedido) {
      if (mensagem.type === 'data') dados = mensagem.data;
      if (mensagem.type === 'status' && mensagem.stage === 'error') {
        throw new Error(mensagem.message || 'O Space do ControlNet retornou um erro.');
      }
      if (mensagem.type === 'status' && mensagem.stage === 'complete') terminou = true;
      if (dados && terminou) return dados;
    }
    return dados;
  })();
  leitura.catch(() => {}); 

  return comLimiteDeTempo(
    leitura,
    limiteMs,
    'A IA demorou demais para gerar a simulação. Tente novamente em instantes.',
    () => {
      pedido.cancel().catch(() => {});
      pedido.return();
    }
  );
}

function traduzirErro(erro) {
  if (erro.statusCode) return erro;
  const texto = String(erro.message || '');
  if (/quota/i.test(texto)) {
    return erroComStatus('O limite gratuito da IA acabou por hoje. Tente novamente mais tarde.', 429);
  }
  if (/busy|queue|full/i.test(texto)) {
    return erroComStatus('A IA está ocupada no momento. Tente novamente em instantes.', 503);
  }
  return erroComStatus('Não foi possível gerar a simulação agora. Tente novamente.', 502);
}

async function urlParaBase64(url, limiteMs) {
  const sharp = require('sharp');
  const resposta = await fetch(url, { signal: AbortSignal.timeout(limiteMs) });
  if (!resposta.ok) {
    throw new Error(`Não foi possível baixar a imagem gerada (Status ${resposta.status}).`);
  }
  const original = Buffer.from(await resposta.arrayBuffer());

  const { channels: canais } = await sharp(original).stats();
  if (canais.slice(0, 3).every((canal) => canal.max <= 8)) {
    throw erroComStatus(
      'A IA não conseguiu gerar essa simulação. Tente outro desenho ou outro membro.',
      502
    );
  }

  const imagem = await sharp(original)
    .flatten({ background: '#ffffff' })
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
  return `data:image/jpeg;base64,${imagem.toString('base64')}`;
}

async function gerarNoSpace(space, entrada, prompt, token, prazo) {
  const restante = () => prazo - Date.now();

  console.log(`[IA] Conectando ao Space ${space.id}...`);
  const cliente = await conectar(space, token, Math.min(LIMITE_CONEXAO_MS, restante()));

  const semente = Math.floor(Math.random() * 100000);
  const parametros = await space.parametros(entrada, prompt, semente);
  const dados = await rodarControlNet(
    cliente,
    space.endpoint,
    parametros,
    Math.min(LIMITE_GERACAO_MS, restante())
  );

  const url = space.lerUrl(dados);
  if (!url) {
    throw new Error('O Space não retornou nenhuma imagem.');
  }

  return urlParaBase64(url, Math.min(LIMITE_DOWNLOAD_MS, Math.max(restante(), 5000)));
}

const SPACES_TEXTO = [
  {
    id: 'black-forest-labs/FLUX.1-schnell',
    endpoint: '/infer',
    parametros: async ([largura, altura], prompt, semente) => [prompt, semente, false, largura, altura, 4],
    lerUrl: (dados) => dados?.[0]?.url,
  },
  {
    id: 'stabilityai/stable-diffusion-3.5-large-turbo',
    endpoint: '/infer',
    parametros: async ([largura, altura], prompt, semente) => [prompt, '', semente, false, largura, altura, 0, 4],
    lerUrl: (dados) => dados?.[0]?.url,
  },
];

function lerChaves() {
  const modelScope = process.env.MODELSCOPE_API_KEY?.trim();
  const huggingFace = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!modelScope && !huggingFace) {
    console.error('[IA] MODELSCOPE_API_KEY e HUGGINGFACE_API_KEY não encontradas. Verifique o arquivo .env');
    throw erroComStatus('O serviço de IA não está configurado.', 500);
  }
  return { modelScope, huggingFace };
}

async function gerarNosSpaces(spaces, entrada, prompt, token, ingles, prazo) {
  let ultimoErro;

  for (const [posicao, space] of spaces.entries()) {
    if (posicao > 0 && prazo - Date.now() < TEMPO_MINIMO_TENTATIVA_MS) break;

    try {
      console.log(`[IA] Gerando tatuagem no membro "${ingles}" com ${space.id}...`);
      const imagem = await gerarNoSpace(space, entrada, prompt, token, prazo);
      console.log('[IA] Simulação gerada com sucesso!');
      return imagem;
    } catch (erro) {
      console.error(`[IA] Falha no Space ${space.id}:`, erro.message);
      ultimoErro = traduzirErro(erro);

      if (ultimoErro.statusCode === 429) break;
    }
  }

  throw ultimoErro;
}

async function gerarNoModelScopeEmBase64(pedido, chave, prazo, limiteMs) {
  console.log(`[IA] Gerando com o ModelScope (${pedido.modelo})...`);
  const url = await gerarNoModelScope({
    ...pedido,
    chave,
    limiteMs: Math.min(limiteMs, prazo - Date.now()),
  });
  const imagem = await urlParaBase64(url, Math.min(LIMITE_DOWNLOAD_MS, Math.max(prazo - Date.now(), 5000)));
  console.log('[IA] Simulação gerada com sucesso no ModelScope!');
  return imagem;
}

async function gerarComReserva({ chaves, modelScopePrimeiro, pedidoModelScope, spaces, entrada, prompt, ingles }) {
  const prazo = Date.now() + LIMITE_TOTAL_MS;

  const tentarModelScope = async () => {
    try {
      const limite = modelScopePrimeiro ? LIMITE_MODELSCOPE_MS : LIMITE_TOTAL_MS;
      return await gerarNoModelScopeEmBase64(pedidoModelScope, chaves.modelScope, prazo, limite);
    } catch (erro) {
      console.error('[IA] Falha no ModelScope:', erro.message);
      throw erro;
    }
  };
  const tentarHuggingFace = () => gerarNosSpaces(spaces, entrada, prompt, chaves.huggingFace, ingles, prazo);

  const ordem = modelScopePrimeiro
    ? [chaves.modelScope && tentarModelScope, chaves.huggingFace && tentarHuggingFace]
    : [chaves.huggingFace && tentarHuggingFace, chaves.modelScope && tentarModelScope];

  let ultimoErro;
  for (const [posicao, tentar] of ordem.filter(Boolean).entries()) {
    if (posicao > 0 && prazo - Date.now() < TEMPO_MINIMO_TENTATIVA_MS) break;
    try {
      return await tentar();
    } catch (erro) {
      ultimoErro = traduzirErro(erro);
    }
  }

  throw ultimoErro;
}

async function gerarSimulacao(imagemTatuagemBase64, membro, promptText) {
  const chaveMembro = normalizarMembro(membro) || MEMBRO_PADRAO;
  const { ingles } = MEMBROS[chaveMembro];
  const chaves = lerChaves();

  const promptFinal = `realistic close-up photo of a human ${ingles} with a tattoo inked on the skin, ${
    promptText || 'black ink tattoo'
  }, natural skin texture, studio lighting`;

  let montagem;
  try {
    montagem = await montarImagemControle(imagemTatuagemBase64, chaveMembro);
  } catch (erro) {
    console.error('[IA] Falha ao montar a imagem:', erro.message);
    throw traduzirErro(erro);
  }

  return gerarComReserva({
    chaves,
    modelScopePrimeiro: false,
    pedidoModelScope: {
      modelo: MODELSCOPE_DESENHO,
      prompt: `turn the drawing on the skin into a real tattoo inked on the ${ingles}, keep the exact same design, position and size, ${
        promptText || 'black ink tattoo'
      }, natural skin texture, photorealistic`,
      imagem: `data:image/png;base64,${montagem.toString('base64')}`,
    },
    spaces: SPACES,
    entrada: montagem,
    prompt: promptFinal,
    ingles,
  });
}

async function gerarSimulacaoPorTexto(descricao, membro) {
  const chaveMembro = normalizarMembro(membro) || MEMBRO_PADRAO;
  const { ingles, formato } = MEMBROS[chaveMembro];
  const chaves = lerChaves();

  const promptFinal = `realistic close-up photo of a human ${ingles} with a tattoo of ${descricao} inked on the skin, ${PROMPT_QUALIDADE}, natural skin texture, studio lighting`;

  return gerarComReserva({
    chaves,
    modelScopePrimeiro: true,
    pedidoModelScope: { modelo: MODELSCOPE_TEXTO, prompt: promptFinal, tamanho: formato },
    spaces: SPACES_TEXTO,
    entrada: formato,
    prompt: promptFinal,
    ingles,
  });
}

module.exports = {
  gerarSimulacao,
  gerarSimulacaoPorTexto,
  normalizarMembro,
  MEMBROS,
};
