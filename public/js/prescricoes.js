document.addEventListener('DOMContentLoaded', () => {
    carregarPrescricoes();
});

async function carregarPrescricoes() {
    const tabela = document.getElementById('lista-prescricoes');
    if (!tabela) return;
    
    tabela.innerHTML = ''; 

    try {
        const token = localStorage.getItem('medico_token');
        if (!token) return;

      
        const response = await fetch('/api/prescricoes', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter prescrições');
        }

        const dadosReais = await response.json();

        if (dadosReais.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhuma prescrição encontrada.</td></tr>';
            return;
        }


        dadosReais.forEach(dado => {
            const linha = document.createElement('tr');

            // formatação das datas
            const dataInicioFormatada = formatarData(dado.start_date);
            const dataFimFormatada = formatarData(dado.end_date);

            linha.innerHTML = `
                <td><div class="checkbox"></div></td>
                <td>${dado.patient_name}</td>
                <td>${dado.medication_name}</td>
                <td>${dataInicioFormatada}</td>
                <td>${dataFimFormatada}</td>
                <td>
                    <button class="btn-detalhes" onclick="abrirPrescricao(${dado.prescription_id})">
                        Consultar Prescrição
                    </button>
                </td>
            `;

            tabela.appendChild(linha);
        });

    } catch (erro) {
        console.error("Erro ao carregar prescrições:", erro);
        tabela.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Erro ao carregar dados.</td></tr>';
    }
}


function formatarData(timestamp) {
    if (!timestamp) return "---";
    const data = new Date(timestamp);
    return data.toLocaleDateString('pt-PT');
}


function abrirPrescricao(id) {
    console.log("A abrir prescrição ID:", id);
    alert(`A consultar detalhes da prescrição #${id}`);
}

