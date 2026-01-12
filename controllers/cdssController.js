const axios = require('axios');

exports.calculateDosage = async (req, res) => {
    // Recebe os dados do Frontend (Site)
    const { med_name, weight, age } = req.body;

    if (!med_name) {
        return res.status(400).json({ message: "Selecione um medicamento." });
    }

    try {
        // 1. O Node.js chama o Microserviço Python (Porta 8000)
        // Envia o nome, peso e idade para o "cérebro" Python processar
        const response = await axios.post('http://127.0.0.1:8000/calculate', {
            med_name,
            weight,
            age
        });

        // 2. Recebe a resposta matemática do Python e devolve ao site
        res.json(response.data);

    } catch (error) {
        console.error("Erro na comunicação com a Calculadora Python:", error.message);
        
        // Se o Python estiver desligado, avisamos o utilizador
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                found: false, 
                message: "O sistema de calculadora está offline. Verifique se o terminal Python está aberto." 
            });
        }
        
        res.status(500).json({ message: "Erro ao processar o cálculo." });
    }
};