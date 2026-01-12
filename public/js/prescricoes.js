let listaMedicamentos = [];
let medSelecionado = null;
let variacoesAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
    const dateInput = document.getElementById('input-start-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    configurarEventos();

    const params = new URLSearchParams(window.location.search);
    const idPacienteURL = params.get('id');

    if (idPacienteURL) {
        await carregarUtentePorId(idPacienteURL);
    }
});

async function carregarUtentePorId(id) {
    try {
        const res = await fetch(`/api/prescricoes/patient/${id}`);
        if (res.ok) {
            const utente = await res.json();
            selecionarUtente(utente); 
        }
    } catch (err) {
        console.error("Erro ao carregar utente inicial:", err);
    }
}

function configurarEventos() {
    configurarPesquisaMedicamento();
    configurarPesquisaUtente();

    const btnAdd = document.getElementById('btn-add-med');
    if (btnAdd) btnAdd.addEventListener('click', adicionarMedicamento);

    const btnSubmit = document.getElementById('btn-submit-prescription');
    if (btnSubmit) btnSubmit.addEventListener('click', submeterPrescricao);
}

// --- PESQUISA DE UTENTE ---
function configurarPesquisaUtente() {
    const inputSearch = document.getElementById('input-patient-search');
    const inputHidden = document.getElementById('patient_id_input');
    const lista = document.getElementById('lista-sugestoes-pacientes');

    if (!inputSearch) return;

    inputSearch.addEventListener('input', async (e) => {
        const termo = e.target.value;
        if (termo.length === 0) inputHidden.value = "";
        
        if (termo.length < 2) { lista.style.display = 'none'; return; }

        try {
            const res = await fetch(`/api/prescricoes/search-patients?term=${termo}`);
            const utentes = await res.json();
            
            lista.innerHTML = '';
            if (utentes.length > 0) {
                lista.style.display = 'block';
                utentes.forEach(u => {
                    const li = document.createElement('li');
                    li.textContent = `${u.name} (SNS: ${u.health_number || 'N/A'})`; 
                    li.onclick = () => selecionarUtente(u);
                    lista.appendChild(li);
                });
            } else {
                lista.style.display = 'none';
            }
        } catch (err) { console.error(err); }
    });

    document.addEventListener('click', (e) => {
        if (!inputSearch.contains(e.target) && !lista.contains(e.target)) {
            lista.style.display = 'none';
        }
    });
}

function selecionarUtente(u) {
    const inputSearch = document.getElementById('input-patient-search');
    const inputHidden = document.getElementById('patient_id_input');
    const lista = document.getElementById('lista-sugestoes-pacientes');

    inputSearch.value = u.name;
    inputHidden.value = u.id;

    if(lista) lista.style.display = 'none';
}

// --- PESQUISA DE MEDICAMENTO ---
function configurarPesquisaMedicamento() {
    const inputSearch = document.getElementById('input-med-search');
    const lista = document.getElementById('lista-sugestoes');
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');

    if (inputSearch) {
        inputSearch.addEventListener('input', async (e) => {
            const termo = e.target.value;
            if (termo.length < 2) { lista.style.display = 'none'; return; }

            try {
                const res = await fetch(`/api/prescricoes/search-meds?term=${termo}`);
                const meds = await res.json();
                
                lista.innerHTML = '';
                const nomesUnicos = [...new Set(meds.map(m => m.commercial_name))];

                if (nomesUnicos.length > 0) {
                    lista.style.display = 'block';
                    nomesUnicos.forEach(nome => {
                        const li = document.createElement('li');
                        li.textContent = nome;
                        li.onclick = () => carregarVariações(nome);
                        lista.appendChild(li);
                    });
                } else {
                    lista.style.display = 'none';
                }
            } catch (err) { console.error(err); }
        });

        document.addEventListener('click', (e) => {
            if (!inputSearch.contains(e.target) && !lista.contains(e.target)) {
                lista.style.display = 'none';
            }
        });
    }

    if (selectForm) {
        selectForm.addEventListener('change', () => {
            atualizarSelectDose(selectForm.value);
        });
    }

    if (selectDose) {
        selectDose.addEventListener('change', () => {
            definirMedicamentoFinal();
        });
    }
}

async function carregarVariações(nomeMedicamento) {
    document.getElementById('input-med-search').value = nomeMedicamento;
    document.getElementById('lista-sugestoes').style.display = 'none';

    try {
        const res = await fetch(`/api/prescricoes/variations?name=${encodeURIComponent(nomeMedicamento)}`);
        variacoesAtuais = await res.json();

        if (variacoesAtuais.length > 0) {
            atualizarSelectForma();
        } else {
            alert("Erro: Nenhuma variação encontrada.");
        }
    } catch (err) { console.error(err); }
}

function atualizarSelectForma() {
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');
    
    selectForm.innerHTML = '<option value="">Selecione a forma...</option>';
    selectDose.innerHTML = '<option value="">Aguardando forma...</option>';
    selectDose.disabled = true;

    const formasUnicas = [...new Set(variacoesAtuais.map(item => item.form_factor))];

    formasUnicas.forEach(forma => {
        const option = document.createElement('option');
        option.value = forma;
        option.textContent = forma;
        selectForm.appendChild(option);
    });

    selectForm.disabled = false;
    medSelecionado = null;
}

function atualizarSelectDose(formaSelecionada) {
    const selectDose = document.getElementById('input-dose');
    selectDose.innerHTML = '<option value="">Selecione a dose...</option>';

    if (!formaSelecionada) {
        selectDose.disabled = true;
        return;
    }

    const dosesDisponiveis = variacoesAtuais.filter(item => item.form_factor === formaSelecionada);

    dosesDisponiveis.forEach(item => {
        const option = document.createElement('option');
        option.value = item.dosage; 
        option.textContent = item.dosage;
        option.dataset.id = item.id; 
        selectDose.appendChild(option);
    });

    selectDose.disabled = false;
}

function definirMedicamentoFinal() {
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');
    const forma = selectForm.value;
    const dose = selectDose.value;

    if (!forma || !dose) return;

    const encontrado = variacoesAtuais.find(item => item.form_factor === forma && item.dosage === dose);

    if (encontrado) medSelecionado = encontrado;
}

function adicionarMedicamento() {
    const nome = document.getElementById('input-med-search').value;
    const dataFim = document.getElementById('input-end-date').value;
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');

    if (!medSelecionado || !selectForm.value || !selectDose.value) {
        alert("Selecione o medicamento, forma e dose.");
        return;
    }
    if (!dataFim) {
        alert("Defina a data de fim.");
        return;
    }

    const item = {
        medication_id: medSelecionado.id,
        nome_medicamento: medSelecionado.commercial_name,
        dose: medSelecionado.dosage,
        forma: medSelecionado.form_factor,
        quantity: document.getElementById('input-qty').value,
        regularidade: document.getElementById('input-regularidade').value,
        start_date: document.getElementById('input-start-date').value,
        end_date: dataFim,
        instructions: document.getElementById('input-instruction').value
    };

    listaMedicamentos.push(item);
    renderizarTabela();
    limparFormularioMedicamento();
}

function renderizarTabela() {
    const tbody = document.getElementById('medication-tbody');
    const emptyMsg = document.getElementById('empty-msg');
    const btnSubmit = document.getElementById('btn-submit-prescription');
    
    tbody.innerHTML = '';

    if (listaMedicamentos.length === 0) {
        if(emptyMsg) emptyMsg.style.display = 'block';
        if(btnSubmit) btnSubmit.disabled = true;
        return;
    }
    
    if(emptyMsg) emptyMsg.style.display = 'none';
    if(btnSubmit) btnSubmit.disabled = false;

    listaMedicamentos.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.nome_medicamento}</strong></td>
            <td>${item.forma}</td>
            <td>${item.dose}</td>
            <td>${item.end_date}</td>
            <td>${item.instructions}</td>
            <td style="text-align:center;">
                <button class="btn-remove" onclick="removerItem(${index})">&times;</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.removerItem = (index) => {
    listaMedicamentos.splice(index, 1);
    renderizarTabela();
};

function limparFormularioMedicamento() {
    document.getElementById('input-med-search').value = '';
    
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');
    
    selectForm.innerHTML = '<option value="">Selecione o medicamento primeiro</option>';
    selectForm.disabled = true;
    selectDose.innerHTML = '<option value="">Selecione a forma primeiro</option>';
    selectDose.disabled = true;

    document.getElementById('input-instruction').value = '';
    medSelecionado = null;
    variacoesAtuais = [];
}


// --- FUNÇÃO SUBMETER  ---
async function submeterPrescricao() {
    const patientId = document.getElementById('patient_id_input').value;
    const notes = document.getElementById('justification-box').value;
    
    // Elementos do Alerta Integrado
    const alertBox = document.getElementById('interaction-alert-box');
    const alertList = document.getElementById('interaction-list');
    const inputJustificacao = document.getElementById('input-justificacao-clinica');
    
    const btn = document.getElementById('btn-submit-prescription');

    if (!patientId) { alert("Erro: Nenhum utente selecionado."); return; }
    if (listaMedicamentos.length === 0) { alert("A prescrição está vazia."); return; }

    const token = localStorage.getItem('medico_token');
    if (!token) { window.location.href = 'index.html'; return; }

    // BLOQUEIA O BOTÃO PARA EVITAR DUPLO CLIQUE
    btn.disabled = true;
    btn.textContent = "A verificar...";

    // 1. PASSO CRÍTICO: RESETAR O ALERTA (ESCONDER TUDO)
    // Se não fizermos isto, a caixa fica lá para sempre
    alertBox.style.display = 'none'; 
    alertList.innerHTML = '';
    
    // Verifica se já temos uma justificação escrita (significa que é a 2ª tentativa)
    // Verificamos se a caixa ESTAVA visível antes de a escondermos acima, ou se o campo tem texto
    const temTextoJustificativo = inputJustificacao.value.trim().length > 0;
    
    try {
        // Se ainda não justificou, vamos verificar ao servidor
        if (!temTextoJustificativo) {
            const novosMedsIds = listaMedicamentos.map(m => m.medication_id).filter(id => id !== null);
            
            const resCheck = await fetch('/api/prescricoes/check-interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ patient_id: patientId, new_meds_ids: novosMedsIds })
            });
            
            const interacoes = await resCheck.json();

            // AQUI É QUE DECIDIMOS SE MOSTRAMOS A CAIXA OU NÃO
            if (interacoes && interacoes.length > 0) {
                
                // TEM INTERAÇÕES -> MOSTRAR CAIXA VERMELHA
                alertBox.style.display = 'block'; 
                
                interacoes.forEach(i => {
                    const div = document.createElement('div');
                    div.className = 'interaction-item';
                    // Adicionei um ícone de aviso em cada linha
                    div.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="margin-top:3px;"></i> 
                                     <div><strong>${i.severity}:</strong> ${i.medicamento_1} + ${i.medicamento_2}<br>
                                     <small>${i.message}</small></div>`;
                    alertList.appendChild(div);
                });

                btn.textContent = "⚠️ Confirmar com Justificação";
                btn.disabled = false;
                btn.style.backgroundColor = "#d32f2f"; // Mudar botão para vermelho para avisar

                // Scroll suave até ao alerta para o médico ver
                alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                return; // PARA AQUI. NÃO ENVIA A PRESCRIÇÃO.
            }
        }

        // 2. ENVIAR A PRESCRIÇÃO (Só chega aqui se não houver interações OU se já justificou)
        
        // Se a caixa estava aberta (agora escondida) e não escreveu nada:
        // Nota: Como escondemos a caixa no início da função, usamos a lógica do texto
        if (alertList.children.length > 0 && !inputJustificacao.value.trim()) {
             alert("É obrigatório preencher a justificação clínica.");
             alertBox.style.display = 'block'; // Mostra de novo
             btn.disabled = false;
             return;
        }

        btn.textContent = "A gravar...";
        
        const res = await fetch('/api/prescricoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                patient_id: patientId,
                notes: notes,
                items: listaMedicamentos,
                justificacao: inputJustificacao.value // Envia o texto (ou vazio se não houve alerta)
            })
        });

        const result = await res.json();
        
        if (res.ok) {
            alert(`✅ Sucesso! Receita Nº: ${result.data.prescription_number}`);
            window.location.href = 'lista_prescricoes.html'; 
        } else {
            alert("Erro: " + result.message);
            btn.disabled = false;
            btn.textContent = "✅ Emitir Prescrição";
            btn.style.backgroundColor = ""; // Reset cor
        }

    } catch (err) {
        console.error(err);
        alert("Erro técnico.");
        btn.disabled = false;
    }
}