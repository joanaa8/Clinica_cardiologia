let listaMedicamentos = [];
let medSelecionado = null;
let variacoesAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Configurar Data de Hoje
    const dateInput = document.getElementById('input-start-date');
    if (dateInput) dateInput.valueAsDate = new Date();

  
    await verificarRenovacao();
    
    // 2. Configurar Listeners
    configurarEventos();

    // 3. Verificar se viemos da página de Utentes (Redirecionamento normal)
    const params = new URLSearchParams(window.location.search);
    const pId = params.get('patient_id') || params.get('id'); 

    if (pId) {
        await carregarUtentePorId(pId);
    }

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

// --- SUBMETER PRESCRIÇÃO (COM BLOQUEIO DE INTERAÇÕES) ---
async function submeterPrescricao() {
    const patientId = document.getElementById('patient_id_input').value;
    const notes = document.getElementById('justification-box') ? document.getElementById('justification-box').value : "";
    const inputJustificacao = document.getElementById('input-justificacao-clinica'); // Campo da justificação obrigatória
    const btn = document.getElementById('btn-submit-prescription');
    
    // Elementos do Alerta
    const alertBox = document.getElementById('interaction-alert-box'); // Certifica-te que tens esta div no HTML
    const alertList = document.getElementById('interaction-list');

    // 1. Validações Básicas
    if (!patientId) { alert("Erro: Nenhum utente selecionado."); return; }
    if (listaMedicamentos.length === 0) { alert("A prescrição está vazia."); return; }

    const token = localStorage.getItem('medico_token');
    
    // Feedback visual
    const textoOriginal = btn.textContent;
    btn.disabled = true;
    btn.textContent = "A verificar interações...";

    try {
        // 2. Verificar Interações (Chamada à API)
        // Extrair apenas os IDs dos medicamentos novos
        const novosMedsIds = listaMedicamentos.map(m => m.medication_id).filter(id => id);
        
        console.log("A verificar interações para:", novosMedsIds);

        const resCheck = await fetch('/api/prescricoes/check-interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ patient_id: patientId, new_meds_ids: novosMedsIds })
        });

        const interacoes = await resCheck.json();
        console.log("Interações detetadas:", interacoes);

        // 3. Lógica de Bloqueio
        const temInteracoes = interacoes && interacoes.length > 0;
        const temJustificacao = inputJustificacao && inputJustificacao.value.trim().length > 0;

        // SE houver interações E NÃO houver justificação -> BLOQUEIA
        if (temInteracoes && !temJustificacao) {
            
            // Mostra a caixa de alerta (se existir no HTML)
            if (alertBox && alertList) {
                alertBox.style.display = 'block';
                alertList.innerHTML = ''; // Limpa alertas anteriores
                
                interacoes.forEach(i => {
                    const div = document.createElement('div');
                    div.className = 'alert-item'; // Podes dar estilo CSS a isto
                    div.style.cssText = "background: #ffebee; color: #c62828; padding: 10px; margin-bottom: 5px; border-left: 5px solid #c62828;";
                    div.innerHTML = `
                        <strong>⚠️ INTERAÇÃO GRAVE (${i.severity})</strong><br>
                        Entre: <b>${i.medicamento_1}</b> e <b>${i.medicamento_2}</b><br>
                        <small>${i.message}</small>
                    `;
                    alertList.appendChild(div);
                });
            } else {
                // Fallback se não tiveres a DIV de alerta
                let msg = " ATENÇÃO: Interações detetadas!\n\n";
                interacoes.forEach(i => msg += `- ${i.medicamento_1} + ${i.medicamento_2}: ${i.message}\n`);
                msg += "\nÉ OBRIGATÓRIO preencher o campo 'Justificação Clínica' para prosseguir.";
                alert(msg);
            }

            // Destaca o campo de justificação
            if(inputJustificacao) {
                inputJustificacao.style.border = "2px solid red";
                inputJustificacao.focus();
            }

            // Muda o botão para vermelho
            btn.disabled = false;
            btn.textContent = " Confirmar com Justificação";
            btn.style.backgroundColor = "#d32f2f"; 
            
            // IMPORTANTE: O return aqui impede a prescrição de ser gravada!
            return; 
        }

        // 4. Se chegou aqui, ou não tem interações, ou já justificou.
        btn.textContent = "A gravar...";

        const res = await fetch('/api/prescricoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({
                patient_id: patientId,
                notes: notes,
                items: listaMedicamentos,
                justificacao: temJustificacao ? inputJustificacao.value : "" 
            })
        });

        const result = await res.json();
        
        if (res.ok) {
            alert(`✅ Sucesso! Receita Nº: ${result.data.prescription_number}`);
            window.location.href = 'lista_prescricoes.html'; 
        } else {
            alert("Erro ao gravar: " + result.message);
            btn.disabled = false;
            btn.textContent = textoOriginal;
        }

    } catch (err) {
        console.error("Erro no processo:", err);
        alert("Erro técnico ao verificar interações ou gravar.");
        btn.disabled = false;
        btn.textContent = textoOriginal;
    }
}


// --- FUNÇÃO DE RENOVAÇÃO ---
async function verificarRenovacao() {
    const params = new URLSearchParams(window.location.search);
    const renewId = params.get('renew_id'); // Pega o ID da URL

    if (!renewId) return; // Se não houver ID, não faz nada (modo criação normal)

    const token = localStorage.getItem("medico_token");

    try {
        // 1. Pedir os detalhes da prescrição antiga
        const res = await fetch(`/api/prescricoes/${renewId}/details`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error("Erro ao carregar dados da renovação");

        const dados = await res.json();
        const header = dados.header;
        const items = dados.items;

        console.log("Dados para renovação:", dados);

        // 2. Preencher o Utente (Reutiliza a tua função de carregar utente)
        if (header.patient_id) {
            // Preenche o campo hidden
            const inputId = document.getElementById('patient_id_input');
            const inputNome = document.getElementById('input-patient-search');
            
            if (inputId) inputId.value = header.patient_id;
            if (inputNome) {
                inputNome.value = header.nome_paciente;
                inputNome.style.backgroundColor = "#e8f5e9"; // Verde claro para indicar sucesso
            }
        }

        // 3. TRATAR DAS DATAS (O Pulo do Gato 🐈)
        // Queremos iniciar HOJE, mas manter a DURAÇÃO da receita antiga
        const hoje = new Date();
        const inputInicio = document.getElementById('input-start-date');
        const inputFim = document.getElementById('input-end-date');

        if (inputInicio) inputInicio.valueAsDate = hoje;

        // Calcular duração média do primeiro item (para definir a data de fim do formulário)
        let diasDuracao = 30; // Padrão
        if (items.length > 0 && items[0].start_date && items[0].end_date) {
            const oldStart = new Date(items[0].start_date);
            const oldEnd = new Date(items[0].end_date);
            const diffTime = Math.abs(oldEnd - oldStart);
            diasDuracao = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Definir nova data de fim = Hoje + Duração Antiga
        const novaDataFim = new Date();
        novaDataFim.setDate(hoje.getDate() + diasDuracao);
        
        if (inputFim) inputFim.valueAsDate = novaDataFim;
        
        // Formatamos a string da data fim para usar nos objetos (YYYY-MM-DD)
        const dataFimStr = novaDataFim.toISOString().split('T')[0];
        const dataInicioStr = hoje.toISOString().split('T')[0];

        // 4. Adicionar os Medicamentos à Tabela
        // Limpamos a lista atual para garantir
        listaMedicamentos = []; 

        items.forEach(item => {
            // Criamos o objeto exatamente como o backend espera
            const novoItem = {
                medication_id: item.medication_id,
                nome_medicamento: item.commercial_name, // Nome que vem do JOIN
                dose: item.dose,
                forma: item.form_factor, // Atenção: backend tem de enviar isto no details
                quantity: item.quantity,
                regularidade: item.regularidade,
                instructions: item.instructions,
                
                // AQUI ESTÁ A CHAVE: Usamos as NOVAS datas
                start_date: dataInicioStr,
                end_date: dataFimStr
            };

            listaMedicamentos.push(novoItem);
        });

        // Atualiza a tabela visualmente
        renderizarTabela();
        
        // Aviso visual discreto
        const btnSubmit = document.getElementById('btn-submit-prescription');
        if(btnSubmit) btnSubmit.textContent = "Renovar Receita";

    } catch (e) {
        console.error("Erro no processo de renovação:", e);
        alert("Não foi possível carregar os dados para renovação.");
    }
}