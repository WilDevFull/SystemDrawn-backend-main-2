const { Router } = require('express');

const router = Router();

router.get("/", async (req, res) => {
  if (!req.context.me) {
    return res.status(401).send();
  }

  const user = await req.context.models.User.findOne({
    where: { cpf: req.context.me.cpf }
  });

  return res.send(user);
});

module.exports = router;