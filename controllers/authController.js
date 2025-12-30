const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const { findByUsername, increaseAttempts, resetAttempts, updatePassword, findByEmail, setResetToken, findByResetToken } = require("../models/userModels.js");
const { enviarEmail } = require('../services/emailService');

//validar utilizador, aplicação de regras de negócio, verificação do utilizador
const login = async (req, res) => {
    
    if (!req.body) {
        return res.status(400).json({ message: "Corpo do pedido vazio." });
    }

    const { username, password } = req.body;
    console.log('Tentativa de login com o nome de utilizador:', username);

    if (!username || !password) {
        return res.status(400).json({ message: 'Nome de utilizador e password são obrigatórios.' });
    }
    
    try {
        const user = await findByUsername(username);
        console.log('Utilizador encontrado:', user ? 'sim' : 'não');

        if (!user) {
            return res.status(401).json({ message: 'Utilizador não encontrado' });
        }

        // RN 2: Bloqueio de 5 minutos
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            return res.status(403).json({ message: 'Conta bloqueada. Tente mais tarde.' });
        }

        console.log('Verificar password...');
        const validPassword = await argon2.verify(user.password, password);
        console.log('Password valida:', validPassword);
        
        if (!validPassword) {
            await increaseAttempts(user.id_user);
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        await resetAttempts(user.id_user);// reset das tentativas falhadas, quando o login é efetuado corretamente

        const is_professional = !!user.professional_license;// verificação da categoria
        
        //criar token JWT
        const token = jwt.sign(
                {
                    id_user: user.id_user,
                    is_professional: is_professional
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({
                message: 'Login bem-sucedido',
                token: token
            });


    } catch (err) {
        console.error('Erro ao efetuar login:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }   
};

//validar o token, verificar a validade e atualizar a password
const resetPassword = async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;


    if (!password || !token) {
        return res.status(400).json({ message: 'Token e nova password são obrigatórios' });
    }

    try {
        const tokenRow = await findByResetToken(token);
        if (!tokenRow) return res.status(400).json({ message: 'Token inválido ou expirado' });

        if (new Date(tokenRow.reset_token_expires) < new Date()) {
            return res.status(400).json({ message: 'Token expirado' });// verificar a validade do token
        }

        const hash = await argon2.hash(password);//encriptação da password antes da inserção na base de dados
        await updatePassword(tokenRow.id_user, hash);

        res.status(200).json({ message: 'Password redefinida com sucesso' });

    } catch (err) {
        console.error('Erro na redefinição da password:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

//pedido de redefiniçaõ da pass, token de 15minutos e envio de link
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email é obrigatório' });

    try {
        const user = await findByEmail(email);

        
        if (!user) {//proteção de dados, não divulgamos a existencia de uma conta associada a esse email
            return res.status(200).json({ message: 'Se existir uma conta, enviámos um email com instruções' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await setResetToken(user.id_user, token, expires);

        const base = process.env.APP_BASE_URL || 'http://localhost:3000';
        const link = `${base}/redefinirpass.html?token=${token}`;

        //corpo do email, para mais profissionalismo
        const text = `Clique no link para redefinir a password:\n${link}\nSe não pediu, ignore.`;
        await enviarEmail(email, 'Recuperar password', text);


    } catch (err) {
        console.error('Erro no pedido de redefinição:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

module.exports = { login, resetPassword, requestPasswordReset };