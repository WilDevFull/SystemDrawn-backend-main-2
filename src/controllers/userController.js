const getUsers = (req, res) => {
  res.json([
    { 
      cpf: "12345678901", 
      nomeCompleto: "Usuário Teste" 
    }
  ]);
};

module.exports = {
  getUsers
};