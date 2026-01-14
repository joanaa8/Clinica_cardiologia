let todasReceitas = []; // Variável para guardar as receitas em memória

// Referências para o Modal (Janela de Detalhes)
const modal = document.getElementById("modal-detalhes");
const spanFechar = document.querySelector(".fechar-modal");

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Ler dados da sessão
    const patientId = sessionStorage.getItem('utenteId');
    const nome = sessionStorage.getItem('utenteNome');
    const n_saude = sessionStorage.getItem('utenteSaude');

    // 2. Preencher cabeçalho do Utente
    if (nome) document.getElementById('nome-exibido').textContent = nome;
    if (n_saude) document.getElementById('n_saude-exibido').textContent = n_saude;

    if (!patientId) {
        console.error("ID de utente não encontrado.");
        return;
    }

    // 3. Buscar as receitas ao servidor
    try {
        const response = await fetch(`/api/simulacao/receitas/${patientId}`);
        
        if (response.ok) {
            todasReceitas = await response.json(); // Guarda na variável global
            renderizarReceitas(todasReceitas);     // Mostra tudo inicialmente
        } else {
            console.error("Erro ao buscar receitas");
        }
    } catch (err) {
        console.error("Erro na ligação:", err);
    }

    // 4. Configurar os Botões de Filtro e eventos do Modal
    configurarFiltros();
    configurarModal();
});

function configurarFiltros() {
    const botoes = document.querySelectorAll('.btn-filtro');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'ativo' de todos e adiciona no clicado
            botoes.forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');

            // Lógica do filtro
            if (btn.textContent.trim() === 'Ativas') {
                const ativas = todasReceitas.filter(r => r.status === 'active');
                renderizarReceitas(ativas);
            } else {
                renderizarReceitas(todasReceitas);
            }
        });
    });
}

function configurarModal() {
    // Fechar ao clicar no X
    if (spanFechar) {
        spanFechar.onclick = () => modal.style.display = "none";
    }
    // Fechar ao clicar fora da caixa branca
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

function renderizarReceitas(lista) {
    const container = document.getElementById('lista-receitas');
    container.innerHTML = ''; // Limpar a lista atual

    if (lista.length === 0) {
        container.innerHTML = '<p class="msg-vazia" style="text-align:center; padding:20px;">Nenhuma receita encontrada.</p>';
        return;
    }

    lista.forEach(r => {
        // Criamos o elemento div do cartão
        const card = document.createElement('div');
        card.className = 'receita-card';
        card.style.cursor = 'pointer'; // Muda o cursor para indicar que é clicável

        // Preenchemos o HTML interno do cartão
        card.innerHTML = `
            <div class="receita-nome">${r.commercial_name}, ${r.dosage}</div>
            
            <span class="status-tag ${r.status}">${traduzirStatus(r.status)}</span>
            
            <div class="receita-detalhes">
                <p>Data da prescrição: <span>${formatarData(r.prescription_date)}</span></p>
                <p>Prescritor: <span>${r.doctor_name}</span></p>
                <p style="margin-top:8px; font-size: 0.8rem; color: #007f5f;">
                    <i class="fa-solid fa-eye"></i> Ver detalhes
                </p>
            </div>
        `;

        // Adicionamos o evento de clique para abrir os detalhes DESTA receita (r)
        card.addEventListener('click', () => abrirDetalhes(r));

        // Adicionamos o cartão à lista
        container.appendChild(card);
    });
}

function abrirDetalhes(r) {
    // Preencher os campos do Modal com os dados da receita clicada
    document.getElementById('m-nome-medicamento').textContent = r.commercial_name;
    document.getElementById('m-dosagem').textContent = r.dosage;
    
    // Status e cor
    const elStatus = document.getElementById('m-status');
    elStatus.textContent = traduzirStatus(r.status);
    elStatus.className = `status-tag ${r.status}`; // Reaproveita o CSS das cores

    document.getElementById('m-data').textContent = formatarData(r.prescription_date);
    document.getElementById('m-numero').textContent = r.prescription_number || '---';
    document.getElementById('m-codigo').textContent = r.access_code || '****';
    
    document.getElementById('m-instrucoes').textContent = r.instructions || 'Sem instruções específicas.';
    document.getElementById('m-quantidade').textContent = r.quantity || '1';
    document.getElementById('m-forma').textContent = r.form_factor || '-';
    document.getElementById('m-medico').textContent = r.doctor_name;

    // Mostrar o Modal (mudando de display:none para flex)
    modal.style.display = "flex";
}

// Função auxiliar para formatar a data (ex: 13 dez 2025)
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Função para traduzir o status do inglês (BD) para português (Ecrã)
function traduzirStatus(status) {
    const mapa = {
        'active': 'Ativa',
        'completed': 'Dispensada',
        'expired': 'Expirada',
        'cancelled': 'Cancelada'
    };
    return mapa[status] || status;
}