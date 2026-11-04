require('dotenv').config();

const readline = require('readline/promises');
const db = require('../src/config/database');
const usuarioRepository = require('../src/repositories/usuario.repository');
const { sanitizeCpf, validateCpf } = require('../src/utils/cpf.util');
const { validarForcaSenha } = require('../src/utils/validators');
const { gerarHashSenha } = require('../src/utils/senha.util');

const run = async () => {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    const cpf = sanitizeCpf(await terminal.question('CPF do administrador: '));

    if (!validateCpf(cpf)) {
      throw new Error('CPF inválido.');
    }

    const usuario = await usuarioRepository.findByCpf(cpf);

    if (!usuario) {
      throw new Error('CPF não encontrado. Cadastre esse CPF pelo site antes de torná-lo administrador.');
    }

    const senha = await terminal.question('Nova senha (mínimo 8 caracteres, com letras e números): ');

    if (!validarForcaSenha(senha)) {
      throw new Error('A senha precisa ter pelo menos 8 caracteres, com letras e números.');
    }

    const senhaHash = await gerarHashSenha(senha);
    await usuarioRepository.tornarAdmin(cpf, senhaHash);

    console.log(`[Admin] ${usuario.nome_completo} agora é administrador.`);
  } catch (error) {
    console.error('[Admin] Não foi possível definir o administrador:', error.message);
    process.exitCode = 1;
  } finally {
    terminal.close();
    await db.pool.end();
  }
};

run();