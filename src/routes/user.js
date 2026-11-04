const { Router } = require('express');

const router = Router();

router.get("/", async (req, res) => {
  const users = await req.context.models.User.findAll();
  return res.send(users);
});

router.get("/:cpf", async (req, res) => {
  const user = await req.context.models.User.findOne({
    where: { cpf: req.params.cpf },
  });
  return res.send(user);
});

router.post("/", async (req, res) => {
  const user = await req.context.models.User.create({
    cpf: req.body.cpf,
    nomeCompleto: req.body.nomeCompleto,
  });
  return res.send(user);
});

router.put("/:cpf", async (req, res) => {
  const user = await req.context.models.User.findOne({
    where: { cpf: req.params.cpf },
  });
  if (user) {
    await user.update({
      nomeCompleto: req.body.nomeCompleto,
    });
  }
  return res.send(user);
});

router.delete("/:cpf", async (req, res) => {
  await req.context.models.User.destroy({
    where: { cpf: req.params.cpf },
  });
  return res.send(true);
});

module.exports = router;