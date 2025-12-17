const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const MAX_ATTEMPTS = 3; 
const LOCKOUT_DURATION = 5 * 60 * 1000;

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({ error: "Credenciais inválidas." });
        }

        // RN 2: Verifica se a conta está atualmente bloqueada
        if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
            return res.status(403).json({ error: `Conta bloqueada. Tente em ${minutosRestantes} min.` });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            // Incrementação de falhas
            const attempts = (user.failed_login_attempts || 0) + 1;
            let lockoutUntil = null;

            if (attempts >= MAX_ATTEMPTS) {
                lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION);
            }

            await User.updateLockout(user.id_user, attempts, lockoutUntil);
            
            const msg = attempts >= MAX_ATTEMPTS 
                ? "Limite de tentativas atingido. Conta bloqueada por 10 min." 
                : "Senha incorreta.";
            return res.status(401).json({ error: msg });
        }

        // igualar tentativas a 0 e criar JWT
        await User.resetLockout(user.id_user);
        const token = jwt.sign({ id: user.id_user }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, message: "Login realizado com sucesso!" });

    } catch (err) {
        res.status(500).json({ error: "Erro interno no servidor." });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        // Procurar o médico pelo e-mail na tabela Account
        const result = await db.query('SELECT id_user FROM Account WHERE email = $1', [email]);
        const doctor = result.rows[0];

        if (!doctor) {
            // Por segurança, respondemos "E-mail enviado" mesmo que não exista
            return res.json({ message: "Se o e-mail existir, um link foi enviado." });
        }

        // 2. Gerar Token e Expiração (10 min)
        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 10 * 60000);

        // 3. Gravar na tabela Users
        await db.query(
            'UPDATE Users SET reset_token = $1, reset_token_expires = $2 WHERE id_user = $3',
            [token, expires, doctor.id_user]
        );

        // 4. Aqui enviarias o e-mail. Para o teste, fazemos log:
        console.log(` link de reset para o médico: http://localhost:3000/public/redefinir.html?token=${token}`);

        res.json({ message: "Link de recuperação enviado com sucesso." });

    } catch (err) {
        res.status(500).json({ error: "Erro ao processar pedido." });
    }
};