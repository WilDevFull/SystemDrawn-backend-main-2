const tiposPiercingService = require('../services/tiposPiercing.service');

class TiposPiercingController {
    async create(req, res, next) {
        try {
            const novoTipo = await tiposPiercingService.criarTipo(req.body);
            return res.status(201).json({ success: true, data: novoTipo });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req, res, next) {
        try {
            const tipos = await tiposPiercingService.listarTodos();
            return res.status(200).json({ success: true, data: tipos });
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const tipo = await tiposPiercingService.buscarPorId(req.params.id);
            return res.status(200).json({ success: true, data: tipo });
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const tipoAtualizado = await tiposPiercingService.atualizarTipo(req.params.id, req.body);
            return res.status(200).json({ success: true, data: tipoAtualizado });
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await tiposPiercingService.deletarTipo(req.params.id);
            return res.status(200).json({ success: true, message: 'Tipo de piercing deletado com sucesso.' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TiposPiercingController();