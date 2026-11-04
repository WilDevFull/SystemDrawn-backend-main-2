const estilosRepository = require('../repositories/estilosTatuagem.repository');
const { AppError } = require('../errors/AppError');

const criar = async (dados) => {
  if (!dados.nome_estilo) throw new AppError('O nome do estilo é obrigatório.', 400);
  return await estilosRepository.criar(dados);
};

const listar = async () => {
  return await estilosRepository.listarTodos();
};

const buscarPorId = async (id) => {
  const estilo = await estilosRepository.buscarPorId(id);
  if (!estilo) throw new AppError('Estilo de tatuagem não encontrado.', 404);
  return estilo;
};

const atualizar = async (id, dados) => {
  await buscarPorId(id);
  return await estilosRepository.atualizar(id, dados);
};

const remover = async (id) => {
  await buscarPorId(id);
  await estilosRepository.remover(id);
};

module.exports = { criar, listar, buscarPorId, atualizar, remover };