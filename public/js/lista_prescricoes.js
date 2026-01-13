let todasPrescricoes = []; // Armazena os dados originais para não estar sempre a chamar a API

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('medico_token');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Carrega dados iniciais e configura os ouvintes de eventos
    await carregarPrescricoes(token);
    
    // Configura os filtros se existirem no HTML
    const inputPesquisa = document.getElementById("inputPesquisa");
    const filtroSelect = document.getElementById("filtroPrescricoes");

    if(inputPesquisa) inputPesquisa.addEventListener("input", aplicarFiltro);
    if(filtroSelect) filtroSelect.addEventListener("change", aplicarFiltro);
});

// --- 1. CARREGAR DADOS DA API ---
async function carregarPrescricoes(token) {
    const tbody = document.querySelector('#tabela-prescricoes tbody');

    try {
        const res = await fetch('/api/prescricoes/my-prescriptions', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Falha ao obter dados');

        todasPrescricoes = await res.json();

        // Aplica o filtro inicial (que vai renderizar a tabela)
        aplicarFiltro();

    } catch (err) {
        console.error(err);
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Erro de ligação ao servidor.</td></tr>';
    }
}

// --- 2. LÓGICA DE FILTRO E ORDENAÇÃO (NOVO) ---
function aplicarFiltro() {
    const filtro = document.getElementById("filtroPrescricoes") ? document.getElementById("filtroPrescricoes").value : 'recent';
    const termo = document.getElementById("inputPesquisa") ? document.getElementById("inputPesquisa").value.toLowerCase() : '';
    
    // 1. Filtrar por texto (Nome Utente ou Medicamentos)
    let listaFiltrada = todasPrescricoes.filter(p => 
        (p.nome_paciente && p.nome_paciente.toLowerCase().includes(termo)) || 
        (p.lista_medicamentos && p.lista_medicamentos.toLowerCase().includes(termo))
    );

    const hoje = new Date();

    // 2. Aplicar lógica do Dropdown
    if (filtro === 'expiring') {
        // Apenas ativas e ordenar pela data de fim (a que acaba mais cedo primeiro)
        // Nota: Assumindo que p.end_date ou p.data_fim vem da API. Se não vier, esta lógica falha.
        // Vou usar p.data_fim assumindo formato ISO ou Date
        listaFiltrada = listaFiltrada.filter(p => p.status === 'active');
        listaFiltrada.sort((a, b) => new Date(a.data_fim || a.end_date) - new Date(b.data_fim || b.end_date));
    } 
    else if (filtro === 'inactive') {
        // Canceladas ou Expiradas
        listaFiltrada = listaFiltrada.filter(p => p.status !== 'active');
        // Ordenar: mais recentes primeiro
        listaFiltrada.sort((a, b) => new Date(b.created_at || b.data_inicio) - new Date(a.created_at || a.data_inicio));
    } 
    else {
        // 'recent' (Padrão): Ordenar por data de criação
        listaFiltrada.sort((a, b) => new Date(b.created_at || b.data_inicio) - new Date(a.created_at || a.data_inicio));
    }

    renderizarTabela(listaFiltrada, filtro);
}

// --- 3. RENDERIZAR TABELA (COM BOTÃO RENOVAR) ---
function renderizarTabela(lista, tipoFiltro) {
    const tbody = document.querySelector('#tabela-prescricoes tbody');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Sem resultados.</td></tr>';
        return;
    }

    const hoje = new Date();

    lista.forEach(p => {
        const tr = document.createElement('tr');
        
        // Classes de estado
        let statusClass = 'status-badge status-active';
        let statusLabel = 'Ativa';
        
        if (p.status === 'cancelled') { statusClass = 'status-badge status-cancelled'; statusLabel = 'Anulada'; }
        else if (p.status === 'expired') { statusClass = 'status-badge status-expired'; statusLabel = 'Expirada'; }

        // Texto longo
        const meds = p.lista_medicamentos || '---';
        const medsResumo = meds.length > 40 ? meds.substring(0, 40) + '...' : meds;
        const numReceita = p.prescription_number || '<span style="color:#aaa;">---</span>';

        // LÓGICA DO BOTÃO RENOVAR
       let btnRenovar = '';

        // Verifica se existe data de fim
        const dataFim = p.data_fim ? new Date(p.data_fim) : (p.end_date ? new Date(p.end_date) : null);

        if (dataFim && p.status === 'active') {
            const hoje = new Date();
            const diasParaExpirar = Math.ceil((dataFim - hoje) / (1000 * 60 * 60 * 24));
            
            // Se faltarem 10 dias ou menos (e não tiver expirado há muito tempo)
            if (diasParaExpirar <= 10 && diasParaExpirar >= -5) {
                
                // CORREÇÃO: Enviamos apenas o ID da prescrição antiga
                btnRenovar = `
                    <button onclick="renovarPrescricao(${p.id})" 
                        class="btn-icon-only" 
                        style="color: #ff9800; border: 1px solid #ff9800; margin-right:5px;" 
                        title="Renovar Prescrição">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                `;
            }
        }

        tr.innerHTML = `
            <td><strong>${p.nome_paciente}</strong></td>
            <td title="${meds}" style="color:#666;">${medsResumo}</td>
            <td>${p.data_formatada || new Date(p.created_at).toLocaleDateString()}</td>
            <td style="font-family:monospace;">${numReceita}</td>
            <td><span class="${statusClass}">${statusLabel}</span></td>
            <td style="text-align:center; display:flex; justify-content:center; gap:5px;">
                ${btnRenovar}
                <button onclick="abrirDetalhes(${p.id})" class="btn-icon-only" title="Ver Detalhes">
                    <i class="fa-regular fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- 4. FUNÇÃO DE REDIRECIONAMENTO (RENOVAR) ---
window.renovarPrescricao = (dadosString) => {
    window.location.href = `prescricoes.html?renew_data=${dadosString}`;
};

// --- 5. DETALHES E MODAL (CÓDIGO ANTIGO MANTIDO) ---
let prescricaoAtualId = null;

window.abrirDetalhes = async (id) => {
    const token = localStorage.getItem('medico_token');
    const modal = document.getElementById('modal-detalhes');
    prescricaoAtualId = id;

    try {
        const res = await fetch(`/api/prescricoes/${id}/details`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!res.ok) throw new Error("Erro ao carregar detalhes");

        const dados = await res.json();
        const content = document.getElementById('modal-content');
        
        // Cores e Botão Anular
        let statusColor = '#155724'; 
        let btnDisplay = 'block';
        if (dados.header.status !== 'active') {
            statusColor = '#777'; 
            btnDisplay = 'none';
        }

        content.innerHTML = `
            <div class="info-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                <div class="data-box">
                    <span class="data-label">Utente</span>
                    <span class="data-value">${dados.header.nome_paciente}</span>
                </div>
                <div class="data-box">
                    <span class="data-label">Nº Receita</span>
                    <span class="data-value" style="font-family:monospace;">${dados.header.prescription_number || '---'}</span>
                </div>
            </div>

            <h3 style="font-size:1rem; color:#888; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">Medicamentos</h3>
            
            <div style="max-height:250px; overflow-y:auto; margin-bottom:25px;">
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Dose</th>
                            <th>Qtd.</th>
                            <th>Instruções</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.items.map(item => `
                            <tr>
                                <td style="font-weight:600;">${item.commercial_name || 'Manual'}</td>
                                <td>${item.dose || ''} ${item.form_factor || ''}</td>
                                <td>${item.quantity}</td>
                                <td>${item.instructions || '--'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #eee; padding-top:20px;">
                <div>
                    <span class="data-label">Estado</span>
                    <span style="font-weight:800; color:${statusColor}; text-transform:uppercase;">${dados.header.status}</span>
                </div>
                
                <button id="btn-anular" class="btn-remove" style="display:${btnDisplay};" onclick="anularPrescricao(${id})">
                    <i class="fa-solid fa-ban"></i> Anular
                </button>
            </div>
        `;

        modal.classList.add('open');

    } catch (err) {
        console.error(err);
        alert("Erro ao carregar detalhes.");
    }
};

window.fecharModalDetalhes = () => {
    document.getElementById('modal-detalhes').classList.remove('open');
};

document.getElementById('modal-detalhes')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-detalhes') window.fecharModalDetalhes();
});

// --- 6. ANULAR PRESCRIÇÃO ---
async function anularPrescricao(id) {
    const motivo = prompt("Motivo da anulação:");
    
    if (motivo === null) return; 
    if (motivo.trim() === "") {
        alert("A justificativa é obrigatória.");
        return;
    }

    const token = localStorage.getItem('medico_token');

    try {
        const res = await fetch(`/api/prescricoes/${id}/cancel`, {
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ reason: motivo })
        });

        const data = await res.json();

        if (res.ok) {
            alert("Prescrição anulada com sucesso.");
            window.fecharModalDetalhes();
            // Recarrega a lista para atualizar o estado
            carregarPrescricoes(token); 
        } else {
            alert("Erro: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Erro de comunicação.");
    }
}