document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('medico_token');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    await carregarMinhasPrescricoes(token);
});

// --- 1. CARREGAR A LISTA PRINCIPAL ---
async function carregarMinhasPrescricoes(token) {
    const tbody = document.querySelector('#tabela-prescricoes tbody');

    try {
        const res = await fetch('/api/prescricoes/my-prescriptions', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error('Falha ao obter dados');

        const lista = await res.json();
        tbody.innerHTML = '';

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Sem prescrições registadas.</td></tr>';
            return;
        }

        lista.forEach(p => {
            const tr = document.createElement('tr');
            
            // Definir classes de estado
            let statusClass = 'status-badge status-active';
            let statusLabel = 'Ativa';
            
            if (p.status === 'cancelled') { statusClass = 'status-badge status-cancelled'; statusLabel = 'Anulada'; }
            else if (p.status === 'expired') { statusClass = 'status-badge status-expired'; statusLabel = 'Expirada'; }

            // Tratamento de texto longo
            const meds = p.lista_medicamentos || '---';
            const medsResumo = meds.length > 45 ? meds.substring(0, 45) + '...' : meds;
            const numReceita = p.prescription_number || '<span style="color:#aaa; font-style:italic">A gerar...</span>';

            tr.innerHTML = `
                <td><strong>${p.nome_paciente}</strong></td>
                <td title="${meds}" style="color:#666;">${medsResumo}</td>
                <td>${p.data_formatada}</td>
                <td style="font-family:monospace; letter-spacing:1px;">${numReceita}</td>
                <td><span class="${statusClass}">${statusLabel}</span></td>
                <td style="text-align:center;">
                    <button onclick="abrirDetalhes(${p.id})" class="btn-icon-only" title="Ver Detalhes">
                        <i class="fa-regular fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Erro de ligação ao servidor.</td></tr>';
    }
}

// --- 2. ABRIR O MODAL DE DETALHES ---
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
        
        // A. Preencher HTML de forma mais limpa
        const content = document.getElementById('modal-content');
        
        // Determinar cor do status
        let statusColor = '#155724'; // Verde
        let btnDisplay = 'block';
        if (dados.header.status !== 'active') {
            statusColor = '#777'; 
            btnDisplay = 'none';
        }

        // Construir o HTML interno do modal dinamicamente para garantir o design novo
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

            <h3 style="font-size:1rem; color:#888; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">Medicamentos Prescritos</h3>
            
            <div style="max-height:250px; overflow-y:auto; margin-bottom:25px;">
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Dose / Forma</th>
                            <th>Qtd.</th>
                            <th>Instruções</th>
                        </tr>
                    </thead>
                    <tbody id="d-items-body">
                        ${dados.items.map(item => `
                            <tr>
                                <td style="font-weight:600; color:#333;">${item.commercial_name || 'Manual'}</td>
                                <td>${item.dose || ''} ${item.form_factor || ''}</td>
                                <td>${item.quantity} un.</td>
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
                    <i class="fa-solid fa-ban"></i> Anular Receita
                </button>
            </div>
        `;

        modal.classList.add('open');

    } catch (err) {
        console.error(err);
        alert("Erro ao carregar detalhes da prescrição.");
    }
};

// --- 3. FECHAR MODAL ---
window.fecharModalDetalhes = () => {
    document.getElementById('modal-detalhes').classList.remove('open');
};

// Fechar se clicar fora
document.getElementById('modal-detalhes').addEventListener('click', (e) => {
    if (e.target.id === 'modal-detalhes') {
        window.fecharModalDetalhes();
    }
});

// --- 4. ANULAR PRESCRIÇÃO ---
async function anularPrescricao(id) {
    const motivo = prompt("Por favor, indique o motivo da anulação:");
    
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
            carregarMinhasPrescricoes(token); 
        } else {
            alert("Erro: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Erro de comunicação com o servidor.");
    }
}