let listaMedicamentos = [];
let medSelecionado = null;
let variacoesAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configurar Data de Hoje
    const dateInput = document.getElementById('input-start-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    // 2. Configurar Listeners
    configurarEventos();

    // 3. Verificar se viemos da página de Utentes (Redirecionamento)
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patient_id') || params.get('id'); // Aceita ambos

    if (pId) {
        await carregarUtentePorId(pId);
    }
});

// --- FUNÇÃO CORRIGIDA COM TOKEN ---
async function carregarUtentePorId(id) {
    const token = localStorage.getItem('medico_token');
    if (!token) return;

    try {
        // Usa a rota de utentes que sabemos que funciona
        const res = await fetch(`/api/utentes/${id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (res.ok) {
            const utente = await res.json();
            selecionarUtente(utente); 
            // Bloqueio visual opcional para indicar que veio pré-selecionado
            const inputSearch = document.getElementById('input-patient-search');
            if(inputSearch) {
                inputSearch.style.backgroundColor = "#e0f7fa";
                inputSearch.title = "Utente pré-selecionado";
            }
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

    if(inputSearch) inputSearch.value = u.name;
    if(inputHidden) inputHidden.value = u.id;
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
            <td style="text-align:center;">
                <button class="btn-remove" onclick="removerItem(${index})"><i class="fa-solid fa-trash"></i></button>
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


// --- FUNÇÃO SUBMETER BLINDADA ---
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

    // BLOQUEIA O BOTÃO
    btn.disabled = true;
    btn.textContent = "A verificar...";

    // RESETAR O ALERTA
    alertBox.style.display = 'none'; 
    alertList.innerHTML = '';
    
    const temTextoJustificativo = inputJustificacao.value.trim().length > 0;
    
    try {
        if (!temTextoJustificativo) {
            const novosMedsIds = listaMedicamentos.map(m => m.medication_id).filter(id => id !== null);
            
            const resCheck = await fetch('/api/prescricoes/check-interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ patient_id: patientId, new_meds_ids: novosMedsIds })
            });
            
            const interacoes = await resCheck.json();

            if (interacoes && interacoes.length > 0) {
                alertBox.style.display = 'block'; 
                
                interacoes.forEach(i => {
                    const div = document.createElement('div');
                    div.className = 'interaction-item';
                    div.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="margin-top:3px;"></i> 
                                     <div><strong>${i.severity}:</strong> ${i.medicamento_1} + ${i.medicamento_2}<br>
                                     <small>${i.message}</small></div>`;
                    alertList.appendChild(div);
                });

                btn.textContent = "⚠️ Confirmar com Justificação";
                btn.disabled = false;
                btn.style.backgroundColor = "#d32f2f"; 
                alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                return;
            }
        }

        if (alertList.children.length > 0 && !inputJustificacao.value.trim()) {
             alert("É obrigatório preencher a justificação clínica.");
             alertBox.style.display = 'block';
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
                justificacao: inputJustificacao.value 
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
            btn.style.backgroundColor = ""; 
        }

    } catch (err) {
        console.error(err);
        alert("Erro técnico.");
        btn.disabled = false;
    }
}


// --- LÓGICA DA CALCULADORA (GLOBAL) ---

// 1. Abrir Calculadora
window.abrirCalculadora = function() {
    const medInput = document.getElementById('input-med-search');
    const modal = document.getElementById('modal-calculadora');
    const nomeCampo = document.getElementById('calc-med-name');
    const resArea = document.getElementById('calc-resultado-area');

    if (!modal) { alert("Erro HTML: Modal não encontrado."); return; }

    if (!medInput || !medInput.value) {
        alert("⚠️ Selecione primeiro um medicamento na pesquisa.");
        return;
    }
    
    if (nomeCampo) nomeCampo.value = medInput.value;
    modal.classList.add('open');
    if (resArea) resArea.style.display = 'none';
};

// 2. Fechar Calculadora
window.fecharCalculadora = function() {
    const modal = document.getElementById('modal-calculadora');
    if (modal) modal.classList.remove('open');
};

// 3. Chamar API e Calcular
window.calcularDoseAPI = async function() {
    const medName = document.getElementById('calc-med-name').value;
    const peso = document.getElementById('calc-peso').value;
    const idade = document.getElementById('calc-idade').value;

    if (!peso || !idade) {
        alert("Por favor preencha Peso e Idade.");
        return;
    }

    const token = localStorage.getItem('medico_token');

    try {
        const btn = document.querySelector('#modal-calculadora .btn-primary');
        const originalText = btn.innerHTML;
        btn.textContent = "A calcular...";
        btn.disabled = true;

        const res = await fetch('/api/prescricoes/calculate-dosage', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ med_name: medName, weight: peso, age: idade })
        });

        const data = await res.json();
        
        btn.innerHTML = originalText;
        btn.disabled = false;

        const areaRes = document.getElementById('calc-resultado-area');
        const spanDose = document.getElementById('res-dose');
        const spanDetalhe = document.getElementById('res-detalhe');
        const listaAlertas = document.getElementById('res-alertas-lista');

        areaRes.style.display = 'block';
        listaAlertas.innerHTML = '';

        if (!data.found) {
            spanDose.textContent = "Sem dados automáticos";
            spanDose.style.color = "#777";
            spanDetalhe.textContent = data.message || "Tente ajustar o nome.";
            return;
        }

        if (data.calculo) {
            spanDose.textContent = data.calculo.dose_diaria;
            spanDose.style.color = "#006064";
            spanDetalhe.textContent = `${data.calculo.tipo} | ${data.calculo.detalhe}`;
        } else {
            spanDose.textContent = "Consultar Nota Clínica";
            spanDose.style.color = "#555";
            spanDetalhe.textContent = "";
        }

        if (data.alertas && data.alertas.length > 0) {
            data.alertas.forEach(msg => {
                const div = document.createElement('div');
                div.style.cssText = "background:#fff3cd; color:#856404; padding:10px; border-radius:6px; border:1px solid #ffeeba; font-size:0.9rem;";
                div.textContent = msg;
                listaAlertas.appendChild(div);
            });
        }

    } catch (err) {
        console.error(err);
        alert("Erro ao calcular. Verifique se o servidor Python está a correr.");
        const btn = document.querySelector('#modal-calculadora .btn-primary');
        if(btn) { btn.disabled = false; btn.textContent = "Calcular"; }
    }
};