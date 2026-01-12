let listaMedicamentos = [];
let medSelecionado = null;
let variacoesAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
    const dateInput = document.getElementById('input-start-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    configurarEventos();

    // Ler utente do URL (se vieres da lista de utentes)
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patient_id') || params.get('id');

    if (pId) {
        await carregarUtentePorId(pId);
    }
});

async function carregarUtentePorId(id) {
    const token = localStorage.getItem('medico_token');
    if (!token) return;

    try {
        const res = await fetch(`/api/utentes/${id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (res.ok) {
            const utente = await res.json();
            selecionarUtente(utente); 
            // Bloqueio visual para indicar pré-seleção
            const inputSearch = document.getElementById('input-patient-search');
            if(inputSearch) {
                inputSearch.style.backgroundColor = "#e0f7fa";
                inputSearch.title = "Utente selecionado";
            }
        }
    } catch (err) {
        console.error("Erro ao carregar utente:", err);
    }
}

function configurarEventos() {
    configurarPesquisaMedicamento();
    configurarPesquisaUtente();

    const btnAdd = document.getElementById('btn-add-med');
    if (btnAdd) btnAdd.addEventListener('click', adicionarMedicamento);

    // MUDANÇA: Ouve o botão de Histórico em vez de Prescrição
    const btnSubmit = document.getElementById('btn-submit-history');
    if (btnSubmit) btnSubmit.addEventListener('click', submeterHistorico);
}

// --- FUNÇÕES DE PESQUISA (IGUAIS AO ORIGINAL) ---
// (Mantivemos estas funções idênticas para garantir os mesmos parâmetros)

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
            } else { lista.style.display = 'none'; }
        } catch (err) { console.error(err); }
    });
    document.addEventListener('click', (e) => {
        if (!inputSearch.contains(e.target) && !lista.contains(e.target)) lista.style.display = 'none';
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
                } else { lista.style.display = 'none'; }
            } catch (err) { console.error(err); }
        });
        document.addEventListener('click', (e) => {
            if (!inputSearch.contains(e.target) && !lista.contains(e.target)) lista.style.display = 'none';
        });
    }
    if (selectForm) selectForm.addEventListener('change', () => atualizarSelectDose(selectForm.value));
    if (selectDose) selectDose.addEventListener('change', () => definirMedicamentoFinal());
}

async function carregarVariações(nomeMedicamento) {
    document.getElementById('input-med-search').value = nomeMedicamento;
    document.getElementById('lista-sugestoes').style.display = 'none';
    try {
        const res = await fetch(`/api/prescricoes/variations?name=${encodeURIComponent(nomeMedicamento)}`);
        variacoesAtuais = await res.json();
        if (variacoesAtuais.length > 0) atualizarSelectForma();
        else alert("Erro: Nenhuma variação encontrada.");
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
    if (!formaSelecionada) { selectDose.disabled = true; return; }
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
    // Data fim não é obrigatória no histórico (pode ser medicação contínua)
    const dataFim = document.getElementById('input-end-date').value; 
    const selectForm = document.getElementById('input-form');
    const selectDose = document.getElementById('input-dose');

    if (!medSelecionado || !selectForm.value || !selectDose.value) {
        alert("Selecione o medicamento, forma e dose.");
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
        end_date: dataFim || null,
        instructions: document.getElementById('input-instruction').value
    };

    listaMedicamentos.push(item);
    renderizarTabela();
    limparFormularioMedicamento();
}

function renderizarTabela() {
    const tbody = document.getElementById('medication-tbody');
    const emptyMsg = document.getElementById('empty-msg');
    const btnSubmit = document.getElementById('btn-submit-history');
    
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

// --- FUNÇÃO SUBMETER HISTÓRICO (MODIFICADA) ---
async function submeterHistorico() {
    const patientId = document.getElementById('patient_id_input').value;
    const notes = document.getElementById('justification-box').value;
    const alertBox = document.getElementById('interaction-alert-box');
    const alertList = document.getElementById('interaction-list');
    const btn = document.getElementById('btn-submit-history');

    if (!patientId) { alert("Erro: Nenhum utente selecionado."); return; }
    if (listaMedicamentos.length === 0) { alert("A lista está vazia."); return; }

    const token = localStorage.getItem('medico_token');
    if (!token) { window.location.href = 'index.html'; return; }

    btn.disabled = true;
    btn.textContent = "A guardar...";
    alertBox.style.display = 'none'; 
    alertList.innerHTML = '';
    
    try {
        // NOTA: Para histórico, normalmente não validamos interação "bloqueante", 
        // mas é bom verificar se o que estamos a adicionar conflita com o que ele já toma.
        
        // 1. Guardar no Histórico (Loop ou Batch dependendo do backend)
        // Como o teu backend espera POST /api/utentes/:id/medicacao para UM item de cada vez 
        // (baseado no teu código anterior), vamos fazer um loop.
        
        // Se quiseres enviar tudo de uma vez, precisarias de alterar o backend para aceitar array.
        // Vou assumir envio sequencial para garantir que funciona com o backend atual.
        
        let erros = 0;

        for (const item of listaMedicamentos) {
            const body = {
                medication_name: item.nome_medicamento,
                notes: `${item.dose} - ${item.instructions}. ${notes}`, // Junta infos nas notas
                end_date: item.end_date,
                start_date: item.start_date
            };

            const res = await fetch(`/api/utentes/${patientId}/medicacao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify(body)
            });

            if (!res.ok) erros++;
        }

        if (erros === 0) {
            alert("✅ Histórico atualizado com sucesso!");
            window.location.href = 'utente.html'; // Volta à lista de utentes
        } else {
            alert(`⚠️ Atenção: ${erros} medicamento(s) não foram guardados corretamente.`);
            btn.disabled = false;
            btn.textContent = "Tentar Novamente";
        }

    } catch (err) {
        console.error(err);
        alert("Erro técnico ao guardar histórico.");
        btn.disabled = false;
        btn.textContent = "Guardar no Histórico";
    }
}

// --- LÓGICA CALCULADORA GLOBAL (MANTIDA) ---
window.abrirCalculadora = function() {
    const medInput = document.getElementById('input-med-search');
    const modal = document.getElementById('modal-calculadora');
    const nomeCampo = document.getElementById('calc-med-name');
    const resArea = document.getElementById('calc-resultado-area');

    if (!modal) { alert("Erro HTML: Modal não encontrado."); return; }
    if (!medInput || !medInput.value) { alert("⚠️ Selecione primeiro um medicamento."); return; }
    
    if (nomeCampo) nomeCampo.value = medInput.value;
    modal.classList.add('open');
    if (resArea) resArea.style.display = 'none';
};

window.fecharCalculadora = function() {
    const modal = document.getElementById('modal-calculadora');
    if (modal) modal.classList.remove('open');
};

window.calcularDoseAPI = async function() {
    const medName = document.getElementById('calc-med-name').value;
    const peso = document.getElementById('calc-peso').value;
    const idade = document.getElementById('calc-idade').value;

    if (!peso || !idade) { alert("Por favor preencha Peso e Idade."); return; }

    const token = localStorage.getItem('medico_token');
    try {
        const btn = document.querySelector('#modal-calculadora .btn-primary');
        const originalText = btn.innerHTML;
        btn.textContent = "A calcular...";
        btn.disabled = true;

        const res = await fetch('/api/prescricoes/calculate-dosage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
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
            spanDose.textContent = "Sem dados";
            spanDose.style.color = "#777";
            spanDetalhe.textContent = data.message;
            return;
        }
        if (data.calculo) {
            spanDose.textContent = data.calculo.dose_diaria;
            spanDose.style.color = "#006064";
            spanDetalhe.textContent = `${data.calculo.tipo} | ${data.calculo.detalhe}`;
        } else {
            spanDose.textContent = "Ver Nota";
            spanDose.style.color = "#555";
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
        alert("Erro ao calcular.");
    }
};