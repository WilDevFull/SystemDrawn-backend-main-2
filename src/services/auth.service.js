const usuarioRepository = require('../repositories/usuario.repository');
const { generateToken } = require('../utils/jwt.util');
const { AppError } = require('../errors/AppError');
const { verificarSenha } = require('../utils/senha.util');

const formatUsuario = (usuario) => ({
  cpf: usuario.cpf,
  nomeCompleto: usuario.nomeCompleto || usuario.nome_completo, 
});

const checkCpf = async (cpf) => {
  const usuario = await usuarioRepository.findByCpf(cpf);

  if (!usuario) {
    return { exists: false };
  }

  return {
    exists: true,
    usuario: formatUsuario(usuario),
  };
};

const register = async (cpf, nomeCompleto) => {
  const existing = await usuarioRepository.findByCpf(cpf);
  if (existing) {
    throw new AppError('CPF já cadastrado. Utilize o endpoint de login.', 409);
  }

  const novoUsuario = await usuarioRepository.create(cpf, nomeCompleto);
  const formatted = formatUsuario(novoUsuario);
  const token = generateToken(formatted);

  console.log(`[Auth] Novo usuário cadastrado: CPF ${cpf}`);

  return { token, usuario: formatted };
};

const login = async (cpf) => {
  const usuario = await usuarioRepository.findByCpf(cpf);

  if (!usuario) {
    throw new AppError('CPF não encontrado. Cadastre-se primeiro.', 404);
  }

  const formatted = formatUsuario(usuario);
  const token = generateToken(formatted);

  console.log(`[Auth] Login realizado: CPF ${cpf}`);

  return { token, usuario: formatted };
};

const getMe = async (cpf) => {
  const usuario = await usuarioRepository.findByCpf(cpf);

  if (!usuario) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  return formatUsuario(usuario);
};

const loginAdmin = async (cpf, senha) => {
  const usuario = await usuarioRepository.findByCpfComSenha(cpf);
  const acessoLiberado =
    usuario && usuario.perfil === 'admin' && (await verificarSenha(senha, usuario.senha_hash));

  if (!acessoLiberado) {
    throw new AppError('CPF ou senha inválidos.', 401);
  }

  const formatted = { ...formatUsuario(usuario), perfil: 'admin' };
  const token = generateToken(formatted);

  console.log(`[Auth] Login de administrador realizado: CPF ${cpf}`);

  return { token, usuario: formatted };
};

module.exports = { checkCpf, register, login, getMe, loginAdmin };