let listaMedicamentos = [];
let medSelecionado = null;
let variacoesAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configurar Data de Hoje
    const dateInput = document.getElementById('input-start-date');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    // 2. Configurar Listeners
    configurarEventos();

    // 3. Verificar se viemos da página de Utentes (Redirecionamento normal)
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patient_id') || params.get('id'); 

    if (pId) {
        await carregarUtentePorId(pId);
    }

    // 4. VERIFICAR RENOVAÇÃO (Lógica integrada)
    await verificarRenovacao();
});

// --- CARREGAR UTENTE ---
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

// Carrega variações e devolve promise
async function carregarVariações(nomeMedicamento) {
    const inputSearch = document.getElementById('input-med-search');
    const lista = document.getElementById('lista-sugestoes');
    
    if(inputSearch) inputSearch.value = nomeMedicamento;
    if(lista) lista.style.display = 'none';

    try {
        const res = await fetch(`/api/prescricoes/variations?name=${encodeURIComponent(nomeMedicamento)}`);
        variacoesAtuais = await res.json();

        if (variacoesAtuais.length > 0) {
            atualizarSelectForma();
        } else {
            console.warn("Nenhuma variação encontrada.");
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
    
    if(tbody) tbody.innerHTML = '';

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
        if(tbody) tbody.appendChild(tr);
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
    document.getElementById('input-qty').value = '1';
    medSelecionado = null;
    variacoesAtuais = [];
}

// --- SUBMETER ---
async function submeterPrescricao() {
    const patientId = document.getElementById('patient_id_input').value;
    const notes = document.getElementById('justification-box') ? document.getElementById('justification-box').value : "";
    const inputJustificacao = document.getElementById('input-justificacao-clinica');
    const btn = document.getElementById('btn-submit-prescription');

    if (!patientId) { alert("Erro: Nenhum utente selecionado."); return; }
    if (listaMedicamentos.length === 0) { alert("A prescrição está vazia."); return; }

    const token = localStorage.getItem('medico_token');
    btn.disabled = true;
    btn.textContent = "A gravar...";

    try {
        const res = await fetch('/api/prescricoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                patient_id: patientId,
                notes: notes,
                items: listaMedicamentos,
                justificacao: inputJustificacao ? inputJustificacao.value : ""
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
        }
    } catch (err) {
        console.error(err);
        alert("Erro técnico.");
        btn.disabled = false;
    }
}

// --- FUNÇÃO DE RENOVAÇÃO (Compatível com os teus IDs) ---
async function verificarRenovacao() {
    const params = new URLSearchParams(window.location.search);
    const renewId = params.get('renew_id'); // Obtém o ID da URL

    if (!renewId) return;

    const token = localStorage.getItem("medico_token");

    try {
        // 1. Pedir os detalhes completos da prescrição antiga
        const res = await fetch(`/api/prescricoes/${renewId}/details`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error("Erro ao buscar dados da renovação");

        const dados = await res.json();
        const header = dados.header;
        const item = dados.items[0]; // Vamos preencher com o primeiro medicamento da lista

        // 2. Preencher Utente
        // Se usares Select2 ou Dropdown normal
        const selectUtente = document.getElementById("patientSelect"); // Verifica se o ID do teu HTML é este
        if(selectUtente) {
            selectUtente.value = header.patient_id; 
            selectUtente.dispatchEvent(new Event('change')); // Força a atualização visual
            
            // Se o valor não mudar (porque o utente não estava carregado), tenta carregar texto
            const option = document.createElement("option");
            option.text = header.nome_paciente;
            option.value = header.patient_id;
            selectUtente.add(option);
            selectUtente.value = header.patient_id;
        }

        // 3. Preencher Medicamento (Nome, Dose, Forma, Frequência)
        if (item) {
            // Preenche o campo de pesquisa/nome
            const inputNome = document.getElementById("medicationSearch") || document.getElementById("medicationName");
            if (inputNome) inputNome.value = item.commercial_name || "";

            // Preenche Dose
            const inputDose = document.getElementById("dosage");
            if (inputDose) inputDose.value = item.dose || "";

            // Preenche Forma Farmacêutica (Comprimido, Xarope...)
            const inputForma = document.getElementById("formFactor");
            if (inputForma) inputForma.value = item.form_factor || "";
            
            // Preenche Frequência/Regularidade
            const inputFreq = document.getElementById("frequency");
            if (inputFreq) inputFreq.value = item.regularidade || "";
            
            // Preenche Instruções
            const inputInstr = document.getElementById("instructions");
            if (inputInstr) inputInstr.value = item.instructions || "";
            
            // Guardar ID do medicamento (campo oculto se tiveres)
            const hiddenId = document.getElementById("selectedMedicationId");
            if(hiddenId) hiddenId.value = item.medication_id;
        }

        // 4. Calcular e Preencher Datas
        // Data Início = Hoje
        const hoje = new Date();
        const startStr = hoje.toISOString().split('T')[0];
        
        // Calcular duração da receita antiga
        let duracaoDias = 30; // Padrão
        if (item && item.start_date && item.end_date) {
            const oldStart = new Date(item.start_date);
            const oldEnd = new Date(item.end_date);
            const diffTime = Math.abs(oldEnd - oldStart);
            duracaoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Nova Data Fim = Hoje + Duração Antiga
        const novaDataFim = new Date();
        novaDataFim.setDate(hoje.getDate() + duracaoDias);
        const endStr = novaDataFim.toISOString().split('T')[0];

        // Inserir nos inputs
        if(document.getElementById("startDate")) document.getElementById("startDate").value = startStr;
        if(document.getElementById("endDate")) document.getElementById("endDate").value = endStr;

        // Feedback visual
        // alert(`Dados carregados para renovação de: ${item.commercial_name}`);

    } catch (e) {
        console.error("Erro ao renovar:", e);
        alert("Não foi possível carregar os dados para renovação.");
    }
}