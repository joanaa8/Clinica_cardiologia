const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 5 * 60 * 1000;


const {
  getUserByUsername,
  updateUserLoginAttempts,
  resetLoginAttempts
} = require("../models/auth.models.js"); 

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};


const realizarLogin = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    
    const user = await getUserByUsername(username);

    if (!user) {
      return handleResponse(res, 401, "Credenciais inválidas.");
    }

    
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const min = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return handleResponse(res, 403, `Bloqueado. Tente em ${min} min.`);
    }


    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      const attempts = (user.failed_attempts || 0) + 1;
      let lockoutUntil = null;
      if (attempts >= MAX_ATTEMPTS) lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);

      await updateUserLoginAttempts(user.id_user, attempts, lockoutUntil);
      return handleResponse(res, 401, attempts >= MAX_ATTEMPTS ? "Conta bloqueada." : "Senha incorreta.");
    }

   
    await resetLoginAttempts(user.id_user);
    const token = jwt.sign({ id: user.id_user }, process.env.JWT_SECRET, { expiresIn: '1h' });

    handleResponse(res, 200, "Login ok!", { token, redirect: "/profissional.html" });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  login: realizarLogin 
};