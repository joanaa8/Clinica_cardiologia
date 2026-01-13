const calcularDosagem = async (req, res) => {
    try {
        const { weight, age, medication_name } = req.body;

        if (!weight || !medication_name) {
            return res.status(400).json({ error: "Peso e nome do medicamento são obrigatórios." });
        }

        // URL da tua API Python
        const PYTHON_API_URL = 'http://127.0.0.1:8000/calculate';

        // 1. Envia os dados para o Python
        const response = await fetch(PYTHON_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                med_name: medication_name,
                weight: parseFloat(weight),
                age: parseInt(age || 30) 
            })
        });

        if (!response.ok) {
            throw new Error(`Erro na API Python: ${response.statusText}`);
        }

        const data = await response.json();

        // 2. Processa a resposta do Python
        if (data.found) {
            // Prepara a sugestão de texto para o input
            let sugestaoTexto = `${data.calculo.dose_recomendada}`;
            if (data.calculo.instrucao) {
                sugestaoTexto += ` (${data.calculo.instrucao})`;
            }

            res.json({
                found: true,
                // Mapeamento das novas chaves do Python
                dose: data.calculo.dose_recomendada,
                sugestao: sugestaoTexto,
                calculo: data.calculo.detalhe_matematico || "Dose padrão",
                tipo: data.calculo.tipo,
                
                // Passar os alertas de segurança e notas
                alertas: data.alertas || [],
                nota: data.nota_clinica || ""
            });
        } else {
            res.json({ 
                found: false, 
                message: data.message || "Não foi encontrada regra de dosagem." 
            });
        }

    } catch (error) {
        console.error("Erro no CDSS Controller:", error.message);
        res.status(502).json({ 
            found: false, 
            message: "Serviço de cálculo indisponível (Verifique se o Python está a correr)." 
        });
    }
};

module.exports = { calcularDosagem };