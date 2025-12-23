const argon2 = require('argon2');
const { findByUsername, increaseAttempts, resetAttempts, updatePassword } = require("../models/userModels.js");

const login = async (req, res) => {
    
    if (!req.body) {
        return res.status(400).json({ message: "Corpo da requisição vazio." });
    }

    const { username, password } = req.body;
    console.log('Login attempt with username:', username);

    if (!username || !password) {
        return res.status(400).json({ message: 'Username e password são obrigatórios.' });
    }
    
    try {
        const user = await findByUsername(username);
        console.log('User found:', user ? 'yes' : 'no');

        if (!user) {
            return res.status(401).json({ message: 'Utilizador não encontrado' });
        }

        // RN 2: Bloqueio de 5 minutos
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            return res.status(403).json({ message: 'Conta bloqueada. Tente mais tarde.' });
        }

        console.log('Verifying password...');
        const validPassword = await argon2.verify(user.password, password);
        console.log('Password valid:', validPassword);
        
        if (!validPassword) {
            await increaseAttempts(user.id_user);
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        await resetAttempts(user.id_user);

        const is_professional = !!user.professional_license;

        res.status(200).json({ 
            message: 'Login bem-sucedido', 
            id_user: user.id_user,
            is_professional: is_professional
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }   
};

const resetPassword = async (req, res) => {
    const { id_user, new_password } = req.body;

    if (!id_user || !new_password) {
        return res.status(400).json({ message: 'ID do utilizador e nova password são obrigatórios' });
    }

    try {
        
        const hash = await argon2.hash(new_password);
        
       
        await updatePassword(id_user, hash);
        
        res.status(200).json({ message: 'Password redefinida com sucesso' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

module.exports = { login, resetPassword };