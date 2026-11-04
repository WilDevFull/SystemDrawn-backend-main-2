const pool = require('../config/database');

class TiposPiercingRepository {
    async create({ local, sub_local, tempo_cicatrizacao, descricao_cuidados, preco_estimado }) {
        const query = `
            INSERT INTO tipos_piercing (local, sub_local, tempo_cicatrizacao, descricao_cuidados, preco_estimado)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [local, sub_local, tempo_cicatrizacao, descricao_cuidados, preco_estimado];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async findAll() {
        const query = 'SELECT * FROM tipos_piercing ORDER BY local, sub_local;';
        const { rows } = await pool.query(query);
        return rows;
    }

    async findById(id) {
        const query = 'SELECT * FROM tipos_piercing WHERE id = $1;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }

    async update(id, { local, sub_local, tempo_cicatrizacao, descricao_cuidados, preco_estimado }) {
        const query = `
            UPDATE tipos_piercing 
            SET local = $1, sub_local = $2, tempo_cicatrizacao = $3, descricao_cuidados = $4, preco_estimado = $5
            WHERE id = $6
            RETURNING *;
        `;
        const values = [local, sub_local, tempo_cicatrizacao, descricao_cuidados, preco_estimado, id];
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async delete(id) {
        const query = 'DELETE FROM tipos_piercing WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        return rows[0];
    }
}

module.exports = new TiposPiercingRepository();