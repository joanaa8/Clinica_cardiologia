let todosUtentes = []; // Variável para guardar a lista completa (para a pesquisa funcionar)
let utenteSelecionado = null; // Variável global crucial para os botões do modal

document.addEventListener("DOMContentLoaded", async function() {
    const token = localStorage.getItem("medico_token");
    if (!token) { window.location.href = "index.html"; return; }
    
    await carregarUtentes(token);
    configurarPesquisa();
});

// --- CARREGAR DADOS ---
async function carregarUtentes(token) {
    const container = document.getElementById("utentesList");
    try {
        const res = await fetch("/api/utentes", { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error("Erro API");
        
        todosUtentes = await res.json(); // Guarda na variável global
        renderizarUtentes(todosUtentes); // Renderiza a lista inicial
        
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="text-align:center; color:white;">Erro ao carregar dados.</p>';
    }
}

// --- RENDERIZAR LISTA PRINCIPAL ---
function renderizarUtentes(lista) {
    const container = document.getElementById("utentesList");
    container.innerHTML = "";

    if (!lista || lista.length === 0) { 
        container.innerHTML = "<p style='text-align:center; color:#ccc;'>Nenhum utente encontrado.</p>"; 
        return; 
    }

    lista.forEach(u => {
        const card = document.createElement("div");
        card.className = "utente-card"; 
        
        // O CSS trata do estilo, mas mantemos a estrutura limpa
        card.innerHTML = `
            <div class="card-info">
                <h3>${u.name}</h3>
                <p>SNS: ${u.sns_number || u.health_number || '---'}</p>
            </div>
            <button class="btn-detalhes" onclick="abrirModalUtente(${u.id})">
                <i class="fa-solid fa-eye"></i> Detalhes
            </button>
        `;
        container.appendChild(card);
    });
}

// --- ABRIR MODAL (Carrega tudo) ---
window.abrirModalUtente = async (id) => {
    const token = localStorage.getItem("medico_token");
    
    // 1. Reset Visual (Limpar modal antes de carregar novos dados)
    document.getElementById('m-nome').textContent = "A carregar...";
    document.getElementById('m-sns-badge').textContent = "SNS: ...";
    document.getElementById('m-idade-badge').textContent = "-- Anos";
    
    // Limpar listas
    document.getElementById('lista-alergias').innerHTML = "";
    document.getElementById('lista-problemas').innerHTML = "";
    document.getElementById('lista-medicacao').innerHTML = "";
    
    // Limpar grelha de dados
    document.getElementById('m-telemovel').textContent = "--";
    document.getElementById('m-email').textContent = "--";
    document.getElementById('m-sexo').textContent = "--";
    document.getElementById('m-sangue').textContent = "--";

    // Mostrar modal
    document.getElementById('modalUtente').classList.add('open'); 

    try {
        // 2. Fetch de todos os dados em paralelo (Performance)
        const [resDetalhes, resAlergias, resProblemas, resMedicacao] = await Promise.all([
            fetch(`/api/utentes/${id}`, { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch(`/api/utentes/${id}/alergies`, { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch(`/api/utentes/${id}/problemas`, { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch(`/api/utentes/${id}/medicacao`, { headers: { 'Authorization': 'Bearer ' + token } })
        ]);

        const u = await resDetalhes.json();
        utenteSelecionado = u; // <--- ISTO É O QUE FAZ OS BOTÕES DE AÇÃO FUNCIONAREM

        // 3. Preencher Cabeçalho
        document.getElementById('m-nome').textContent = u.name;
        document.getElementById('m-sns-badge').textContent = `SNS: ${u.health_number || u.sns_number || '--'}`;
        
        // Calcular Idade
        let idade = "--";
        if (u.date_of_birth) {
            const diff = Date.now() - new Date(u.date_of_birth).getTime();
            idade = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        }
        document.getElementById('m-idade-badge').textContent = `${idade} Anos`;

        // 4. Preencher Dados Pessoais
        document.getElementById('m-telemovel').textContent = u.phone || '--';
        document.getElementById('m-email').textContent = u.email || '--';
        document.getElementById('m-sexo').textContent = u.gender || u.sex || '--';
        document.getElementById('m-sangue').textContent = u.blood_type || '--';

        // 5. Preencher Listas (Usando a função auxiliar corrigida)
        preencherLista(document.getElementById('lista-alergias'), await resAlergias.json(), 'allergy', 'Sem alergias.');
        preencherLista(document.getElementById('lista-problemas'), await resProblemas.json(), 'description', 'Sem problemas clínicos.');
        
        // 6. Preencher Medicação (Estrutura específica)
        const meds = await resMedicacao.json();
        const listaMed = document.getElementById('lista-medicacao');
        
        if(!meds || meds.length === 0) {
            listaMed.innerHTML = '<p style="color:#888; font-style:italic;">Sem registos no histórico.</p>';
        } else {
            meds.forEach(m => {
                // CORREÇÃO: Usar class="list-item" para bater certo com o CSS
                listaMed.innerHTML += `
                <div class="list-item">
                    <div>
                        <strong>${m.medication_name}</strong>
                        <small>${m.notes || m.dosage_info || ''}</small>
                    </div>
                    <span class="badge badge-active">Ativo</span>
                </div>`;
            });
        }

    } catch (err) {
        console.error("Erro ao abrir modal:", err);
        alert("Erro ao carregar detalhes do utente.");
    }
};

// --- FUNÇÕES DOS BOTÕES ---

window.fecharModal = () => {
    document.getElementById('modalUtente').classList.remove('open');
};

window.irParaPrescricao = () => {
    if(!utenteSelecionado) return;
    // Redireciona enviando ID e Nome
    window.location.href = `prescricoes.html?patient_id=${utenteSelecionado.id}&patient_name=${encodeURIComponent(utenteSelecionado.name)}`;
};

window.irParaHistorico = () => {
    if(!utenteSelecionado) return;
    // Redireciona para a página nova
    window.location.href = `historico.html?patient_id=${utenteSelecionado.id}&patient_name=${encodeURIComponent(utenteSelecionado.name)}`;
};

// --- FUNÇÕES AUXILIARES ---

// Preenche listas genéricas (Alergias, Problemas)
function preencherLista(container, dados, campoChave, msgVazio) {
    container.innerHTML = ""; // Limpar
    if (!dados || dados.length === 0) {
        container.innerHTML = `<p style="color:#888; font-style:italic;">${msgVazio}</p>`;
        return;
    }
    dados.forEach(item => {
        // CORREÇÃO: Usar class="list-item" para o CSS funcionar
        container.innerHTML += `
            <div class="list-item">
                <strong>${item[campoChave]}</strong>
            </div>`;
    });
}

// Lógica de Pesquisa (Filtra a lista global sem ir à API)
function configurarPesquisa() {
    const input = document.getElementById("inputPesquisa");
    if(!input) return;

    input.addEventListener("input", (e) => {
        const termo = e.target.value.toLowerCase();
        
        const filtrados = todosUtentes.filter(u => 
            (u.name && u.name.toLowerCase().includes(termo)) || 
            (u.sns_number && String(u.sns_number).includes(termo)) ||
            (u.health_number && String(u.health_number).includes(termo))
        );
        
        renderizarUtentes(filtrados);
    });
}