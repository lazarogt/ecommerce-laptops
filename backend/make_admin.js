// backend/scripts/make_admin.js
const { User } = require("./src/models");
(async () => {
  const user = await User.findOne({ where: { email: "lazaro@test.com" } });
  if (!user) return console.log("Usuario no encontrado");
  user.role = "admin";
  await user.save();
  console.log("Usuario promovido a admin");
  process.exit(0);
})();
