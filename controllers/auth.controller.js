const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { 
  getUserByUsernameService, 
  updateAttemptsService, 
  resetAttemptsService,
  resetPasswordService // Garante que esta função existe no teu auth.models.js
} = require("../models/auth.models.js");

const handleResponse = (res, status, message, data = null) => {
  res.status(status).json({ status, message, data });
};

const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const user = await getUserByUsernameService(username);
    if (!user) return handleResponse(res, 401, "Credenciais inválidas.");

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      // Incrementar tentativas falhadas na BD
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockoutUntil = attempts >= 3 ? new Date(Date.now() + (5 * 60 * 1000)) : null;
      
      await updateAttemptsService(user.id_user, attempts, lockoutUntil);
      return handleResponse(res, 401, "Senha incorreta.");
    }

    // Login com sucesso: Reset de tentativas
    await resetAttemptsService(user.id_user);
    
    const token = jwt.sign({ id: user.id_user }, process.env.JWT_SECRET, { expiresIn: '1h' });

    handleResponse(res, 200, "Login ok!", { 
        token, 
        nome: user.real_name, 
        redirect: "/profissional.html" 
    });

  } catch (error) {
    next(error);
  } 
};

// Se ainda não tiveres a lógica do reset completa, define a função vazia para evitar o erro de 'undefined'
const resetPassword = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const result = await resetPasswordService(email, password);
        handleResponse(res, 200, "Password alterada com sucesso");
    } catch (error) {
        next(error);
    }
};

module.exports = { 
  login, 
  resetPassword 
};