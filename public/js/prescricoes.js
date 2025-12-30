document.addEventListener('DOMContentLoaded', () => {
    carregarDadosMedico();
    carregarPrescricoes();
});

async function carregarDadosMedico() {
    try {
        const token = localStorage.getItem('medico_token'); 

        if (!token) {
            console.warn("Sem sessão iniciada.");
            // Opcional: window.location.href = 'index.html'; 
            return;
        }

        // Faz o pedido ao Backend 
        const response = await fetch('/api/account/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao obter perfil do médico');
        }

        const medico = await response.json();
        const elementoNome = document.getElementById('nome-medico');
        
        if (elementoNome && medico.name) {
            // Pega apenas no primeiro nome 
            const primeiroNome = medico.name.split(' ')[0];
            elementoNome.innerText = `Olá, ${primeiroNome}`;
        }

    } catch (erro) {
        console.error('Erro ao carregar médico:', erro);
    }
}

// 2. CARREGAR TABELA DE PRESCRIÇÕES  API
async function carregarPrescricoes() {
    const tabela = document.getElementById('lista-prescricoes');
    if (!tabela) return;
    
    tabela.innerHTML = ''; // Limpa a tabela antes de começar

    try {
        const token = localStorage.getItem('medico_token');
        if (!token) return;

        // Faz o pedido ao backend (Rota: /api/prescricoes)
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

        // Cria as linhas com os dados vindos da BD
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

// Formataçao do tmestamp
function formatarData(timestamp) {
    if (!timestamp) return "---";
    const data = new Date(timestamp);
    return data.toLocaleDateString('pt-PT');
}

// Botão 
function abrirPrescricao(id) {
    console.log("A abrir prescrição ID:", id);
    alert(`A consultar detalhes da prescrição #${id}`);
}

// Logout
function terminarSessao() {
    localStorage.removeItem('medico_token');
    alert("Sessão terminada.");
    window.location.href = 'index.html'; 
}