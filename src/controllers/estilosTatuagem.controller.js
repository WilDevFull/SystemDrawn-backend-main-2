const estiloService = require('../services/estilosTatuagem.service');

const criar = async (req, res, next) => {
  try {
    const novo = await estiloService.criar(req.body);
    return res.status(201).json({ success: true, estilo: novo });
  } catch (error) { next(error); }
};

const listar = async (req, res, next) => {
  try {
    const lista = await estiloService.listar();
    return res.status(200).json({ success: true, estilos: lista });
  } catch (error) { next(error); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const estilo = await estiloService.buscarPorId(req.params.id);
    return res.status(200).json({ success: true, estilo: estilo });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const estilo = await estiloService.atualizar(req.params.id, req.body);
    return res.status(200).json({ success: true, estilo: estilo });
  } catch (error) { next(error); }
};

const remover = async (req, res, next) => {
  try {
    await estiloService.remover(req.params.id);
    return res.status(200).json({ success: true, message: 'Estilo removido com sucesso.' });
  } catch (error) { next(error); }
};

module.exports = { criar, listar, buscarPorId, atualizar, remover };