let consultaSelecionada = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarConsultas();
    inicializarFlatpickr();// Inicializa o componente de reagendamento
});

async function carregarConsultas() {
    const token = localStorage.getItem('medico_token');// Obtém o token de autenticação
    const dropdown = document.getElementById('statusDropdown'); // Captura o valor do dropdown de filtragem
    const filtro = dropdown ? dropdown.value : 'proximas';

    try {
        // Envia o filtro como query parameter para o backend
        const res = await fetch(`/api/consultas?ordenar=${filtro}`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.status === 401) {
            window.location.href = 'index.html';
            return;
        }

        const consultas = await res.json();
        
        // Debug para verificar no browser o que está a chegar
        console.log("Consultas carregadas:", consultas);
        
        renderizarConsultas(consultas);
        
    } catch (err) {
        console.error("Erro ao carregar consultas:", err);
    }
}

// Renderiza a lista de consultas em formato de cartões
function renderizarConsultas(lista) {

    const container = document.getElementById('consultasList'); // Sincronização com o ID do HTML
    if (!container) return;

    container.innerHTML = '';// Limpa o conteúdo antes de renderizar novamente

    if (!lista || lista.length === 0) {
        container.innerHTML = '<p class="aviso-vazio">Não foram encontradas consultas para este filtro.</p>';
        return;
    }

    lista.forEach(c => {

        // Mapeamento dos aliases definidos no teu Modelo SQL
        const id = c.appointment_id; 
        const paciente = c.patient_name;

        const statusPt = formatarStatus(c.status);// Formata o estado da consulta para português
        
        const card = document.createElement('div');
        card.className = 'consulta-card';
        card.innerHTML = `
            <div class="card-info-left">
                <h3>${paciente}</h3>
                <div class="status-row">
                    <span>${new Date(c.appointment_date).toLocaleString('pt-PT')}</span>
                </div>
            </div>
            <button class="btn-detalhes" onclick="abrirModal('${id}')">Ver Detalhes</button>
        `;
        container.appendChild(card);
    });
}

// Abre o modal com os detalhes de uma consulta específica
async function abrirModal(id) {
    const modal = document.getElementById('modalOverlay');
    const token = localStorage.getItem('medico_token');

    try {
        const res = await fetch(`/api/consultas/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Erro ao carregar consulta");
        
        const dados = await res.json(); 

        // Mapeamento para garantir que o id está presente para o PUT
        consultaSelecionada = {
            ...dados,
            id: dados.appointment_id 
        };

        // Função auxiliar para preencher elementos do modal
        const setEl = (idEl, val) => {
            const el = document.getElementById(idEl);
            if (el) el.textContent = val || '---';
        };

        const dataObj = new Date(consultaSelecionada.appointment_date);

        setEl('m-paciente', consultaSelecionada.patient_name);
        setEl('m-sns', consultaSelecionada.health_number);
        setEl('m-telemovel', consultaSelecionada.phone);
        setEl('m-data-so', dataObj.toLocaleDateString('pt-PT'));
        setEl('m-hora', dataObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));

        const iniciais = consultaSelecionada.patient_name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
        setEl('m-avatar', iniciais);

        const statusEl = document.getElementById('m-status');
        if (statusEl) {
            statusEl.textContent = formatarStatus(dados.status);
            statusEl.className = `status-badge ${dados.status}`;
        }

        modal.classList.add('open');
    } catch (err) {
        console.error("Erro ao abrir modal:", err);
    }
}

// Converte o estado da consulta para texto em português
function formatarStatus(status) {
    const traducoes = {
        'scheduled': 'AGENDADA',
        'completed': 'CONCLUÍDA',
        'cancelled': 'CANCELADA'
    };
    
    return traducoes[status] || status.toUpperCase();
}

// Fecha o modal e repõe o estado inicial dos botões
function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('btnConfirmarData').style.display = 'none';
    document.getElementById('btnreagendarConsulta').innerText = 'Reagendar Consulta';
}

// Inicializa o Flatpickr para reagendamento de consultas
function inicializarFlatpickr() {
    flatpickr("#btnreagendarConsulta", {
        enableTime: true,
        dateFormat: "d-m-Y H:i",
        locale: "pt",
        disableMobile: true,
        minDate: "today",
        static: false, // Permite que o calendário flutue ao lado do botão
        position: "right center", 
        
        onChange: function(selectedDates, dateStr) {
            const btnReagendar = document.getElementById('btnreagendarConsulta');
            const btnConfirmar = document.getElementById('btnConfirmarData');
            
            // Atualiza o texto do botão com a data escolhida
            btnReagendar.innerText = `${dateStr}`;
            btnConfirmar.style.display = "block";

            // Confirma o reagendamento da consulta
            btnConfirmar.onclick = async function() {
                try {
                    const token = localStorage.getItem('medico_token');
                    const res = await fetch(`/api/consultas/${consultaSelecionada.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ data: selectedDates[0] })
                    });

                    if (!res.ok) throw new Error('Erro ao atualizar');

                    alert("Consulta reagendada com sucesso!");
                    fecharModal();
                    carregarConsultas();
                    
                } catch (err) {
                    alert("Erro ao reagendar consulta");
                }
            };
        }
    });
}