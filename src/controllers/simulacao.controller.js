const iaTatuagemService = require('../services/iaTatuagem.service');

const FORMATO_IMAGEM = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/;
const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const DESCRICAO_MINIMA = 3;
const DESCRICAO_MAXIMA = 300;

function mensagemMembroInvalido(membro) {
  if (membro == null || membro === '' || iaTatuagemService.normalizarMembro(membro)) return null;
  const opcoes = Object.values(iaTatuagemService.MEMBROS).map((m) => m.nome);
  return `Membro inválido. Escolha um destes: ${opcoes.join(', ')}.`;
}

function responderErro(res, error) {
  console.error('Erro no Controller de simulação:', error.message);
  return res.status(error.statusCode || 500).json({
    erro: error.statusCode ? error.message : 'Falha ao processar a simulação da tatuagem.',
  });
}

async function simularTatuagem(req, res) {
  try {
    const { imagemTatuagemBase64, imagemCorpoBase64, membro, promptText } = req.body;
    const imagemTatuagem = imagemTatuagemBase64 || imagemCorpoBase64;

    if (!imagemTatuagem) {
      return res
        .status(400)
        .json({ erro: 'A imagem da tatuagem (desenho do cliente) é obrigatória para a simulação.' });
    }

    if (typeof imagemTatuagem !== 'string' || !FORMATO_IMAGEM.test(imagemTatuagem)) {
      return res.status(400).json({ erro: 'Envie o desenho como imagem PNG, JPG ou WEBP.' });
    }

    if ((imagemTatuagem.length * 3) / 4 > TAMANHO_MAXIMO) {
      return res.status(400).json({ erro: 'A imagem do desenho deve ter no máximo 5 MB.' });
    }

    const erroMembro = mensagemMembroInvalido(membro);
    if (erroMembro) {
      return res.status(400).json({ erro: erroMembro });
    }

    const imagemGerada = await iaTatuagemService.gerarSimulacao(imagemTatuagem, membro, promptText);

    return res.status(200).json({
      sucesso: true,
      imagemSimulada: imagemGerada,
    });
  } catch (error) {
    return responderErro(res, error);
  }
}

async function simularTatuagemPorTexto(req, res) {
  try {
    const { descricao, membro } = req.body;
    const texto = typeof descricao === 'string' ? descricao.replace(/\s+/g, ' ').trim() : '';

    if (texto.length < DESCRICAO_MINIMA) {
      return res
        .status(400)
        .json({ erro: `Descreva a tatuagem que você quer com pelo menos ${DESCRICAO_MINIMA} letras.` });
    }

    if (texto.length > DESCRICAO_MAXIMA) {
      return res
        .status(400)
        .json({ erro: `A descrição da tatuagem deve ter no máximo ${DESCRICAO_MAXIMA} caracteres.` });
    }

    const erroMembro = mensagemMembroInvalido(membro);
    if (erroMembro) {
      return res.status(400).json({ erro: erroMembro });
    }

    const imagemGerada = await iaTatuagemService.gerarSimulacaoPorTexto(texto, membro);

    return res.status(200).json({
      sucesso: true,
      imagemSimulada: imagemGerada,
    });
  } catch (error) {
    return responderErro(res, error);
  }
}

module.exports = {
  simularTatuagem,
  simularTatuagemPorTexto,
};
