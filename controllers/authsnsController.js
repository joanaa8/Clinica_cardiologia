const {ValidarUtente } = require ('../models/userSnsModels.js');

exports.loginSNS = async(req, res) => {
    const { username, password } = req.body;
    console.log('Tentativa de login, Nº saúde :', username);

    if (!req.body) {
        return res.status(400).json({ message: "Corpo do pedido vazio." });
    }

    
    try { //model faz a validação
        const user = await  ValidarUtente (username, password);
        console.log('Utilizador encontrado:', user ? 'sim' : 'não');

        if (!user) {
            console.log("Falha: Utente não encontrado com esses dados.");
            return res.status(401).json({ message: 'Utilizador não encontrado' });
        }

        // O 'user' já contém o 'id' vindo da base de dados.
        console.log('Login bem sucedido para o ID:', user.id);        
        return res.status(200).json ({
            message: 'Login bem sucedido para:',
            redirect: '/sns_simulacao.html'
        });
        

    }catch(error) {
        console.error('Erro no processo de login:', error);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
}


