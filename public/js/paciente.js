document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. SEGURANÇA E AUTH
    // =========================================================
    
    const token = localStorage.getItem('paciente_token');

    if (!token) {
        window.location.href = 'index.html'; 
        return;
    }

    const fetchAPI = async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 || response.status === 403) {
                alert("A sua sessão expirou. Por favor, faça login novamente.");
                localStorage.removeItem('paciente_token'); 
                window.location.href = 'index.html';
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Erro de conexão:", error);
            return null;
        }
    };

    // =========================================================
    // 2. NAVEGAÇÃO
    // =========================================================

    const setupNavigation = () => {
        const links = [
            { id: 'link-perfil', view: 'view-perfil' },
            { id: 'link-consultas', view: 'view-consultas', loadFunc: carregarConsultas },
            { id: 'link-prescricoes', view: 'view-prescricoes', loadFunc: carregarPrescricoes }
        ];

        links.forEach(linkObj => {
            const linkElement = document.getElementById(linkObj.id);
            
            if (linkElement) {
                linkElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.sidebar nav ul li a').forEach(a => a.classList.remove('active'));
                    linkElement.classList.add('active');

                    document.getElementById('view-perfil').classList.add('hidden');
                    document.getElementById('view-consultas').classList.add('hidden');
                    document.getElementById('view-prescricoes').classList.add('hidden');

                    const viewAlvo = document.getElementById(linkObj.view);
                    viewAlvo.classList.remove('hidden');

                    if (linkObj.loadFunc) {
                        linkObj.loadFunc();
                    }
                });
            }
        });
    };

    // =========================================================
    // 3. CARREGAMENTO DE DADOS
    // =========================================================

    const safeText = (text, suffix = "") => {
        if (!text && text !== 0) return "--";
        return text + suffix;
    };

    const getIniciais = (nomeCompleto) => {
        if (!nomeCompleto) return "EU";
        const nomes = nomeCompleto.trim().split(/\s+/); 
        if (nomes.length === 1) return nomes[0].charAt(0).toUpperCase();
        
        const primeiraLetra = nomes[0].charAt(0);
        const ultimaLetra = nomes[nomes.length - 1].charAt(0);
        return (primeiraLetra + ultimaLetra).toUpperCase();
    };

    // --- A. PERFIL COMPLETO ---
    const carregarPerfil = async () => {
        const dados = await fetchAPI('/api/paciente/perfil');
        if (!dados) return;

        document.getElementById('nomeUtente').textContent = safeText(dados.name);
        document.getElementById('nome-lateral').textContent = safeText(dados.name);
        document.getElementById('sidebar-avatar').textContent = getIniciais(dados.name);

        document.getElementById('numUtente').textContent = safeText(dados.health_number);
        document.getElementById('emailUtente').textContent = safeText(dados.email);
        document.getElementById('telUtente').textContent = safeText(dados.telefone); 

        if (dados.date_of_birth) {
            const data = new Date(dados.date_of_birth).toLocaleDateString('pt-PT');
            document.getElementById('dataNasc').textContent = data;
        }
        
        document.getElementById('sexoUtente').textContent = safeText(dados.sex);
        document.getElementById('tipoSangue').textContent = safeText(dados.blood_type);
        document.getElementById('peso').textContent = safeText(dados.weight_kg, " kg");
        document.getElementById('altura').textContent = safeText(dados.height_cm, " cm");

        const listaAlergias = document.getElementById('listaAlergias');
        listaAlergias.innerHTML = ''; 
        if (dados.alergias && dados.alergias.length > 0) {
            dados.alergias.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.allergy}</strong> <small>(${item.gravity || 'N/A'})</small>`;
                listaAlergias.appendChild(li);
            });
        } else {
            listaAlergias.innerHTML = '<li>Nenhuma alergia registada.</li>';
        }

        const listaProblemas = document.getElementById('listaProblemas');
        listaProblemas.innerHTML = '';
        if (dados.problemas && dados.problemas.length > 0) {
            dados.problemas.forEach(prob => {
                const li = document.createElement('li');
                li.className = "problem-item";
                const cid = prob.cid_code || 'N/A';
                const snomed = prob.snomed_ct || 'N/A';
                    
                li.innerHTML = `
                    <div class="prob-header">
                        <strong>${prob.description}</strong>
                        <div class="prob-badges">
                            <span class="status-badge ${prob.problem_type}">${prob.problem_type}</span>
                            <span class="status-badge ${prob.status}">${prob.status}</span>
                        </div>
                    </div>
                    <div class="prob-codes">
                        <small><strong>CID:</strong> ${cid}</small>
                        <small><strong>SNOMED:</strong> ${snomed}</small>
                    </div>
                `;
                listaProblemas.appendChild(li);   
            });
        } else {
             listaProblemas.innerHTML = '<li>Nenhum problema ativo.</li>';
        }
    };

    // --- B. CONSULTAS ---
    const carregarConsultas = async () => {
        const consultas = await fetchAPI('/api/paciente/consultas');
        const tbody = document.getElementById('tabelaConsultas');
        tbody.innerHTML = ''; 

        if (!consultas || consultas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Sem histórico de consultas.</td></tr>';
            return;
        }

        consultas.forEach(c => {
            const dataF = c.appointment_date 
                ? new Date(c.appointment_date).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' }) 
                : '--/--/----';

            let statusClass = 'agendada';
            if (c.status === 'cancelled') statusClass = 'cancelada'; 
            if (c.status === 'completed') statusClass = 'completa';

            const row = `
                <tr>
                    <td>${dataF}</td>
                    <td>${c.nome_medico || 'Clínica Geral'}</td>
                    <td><span class="status-badge ${statusClass}">${c.status}</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    };

    // --- C. PRESCRIÇÕES (MODIFICADO PARA SUPORTAR CLIQUE) ---
    const carregarPrescricoes = async () => {
        const receitas = await fetchAPI('/api/paciente/prescricoes'); 
        const container = document.getElementById('listaPrescricoes');
        container.innerHTML = ''; 

        if (!receitas || receitas.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">Sem prescrições registadas.</p>';
            return;
        }

        receitas.forEach(r => {
            // Formatar datas
            const dataEmissao = r.prescription_date ? new Date(r.prescription_date).toLocaleDateString('pt-PT') : '--/--/----';
            const dataValidade = r.end_date ? new Date(r.end_date).toLocaleDateString('pt-PT') : '--/--/----';

            // Definir classes de cor para o estado
            let statusClass = 'ativo';
            let statusTexto = 'Ativa';
            
            if (r.status === 'expired') { statusClass = 'expirado'; statusTexto = 'Expirada'; }
            if (r.status === 'cancelled') { statusClass = 'cancelada'; statusTexto = 'Cancelada'; }
            if (r.status === 'completed') { statusClass = 'completa'; statusTexto = 'Dispensada'; }

            // CRIAÇÃO DO ELEMENTO (Em vez de string, para permitir o click)
            const card = document.createElement('div');
            card.className = 'presc-card';
            card.style.cursor = 'pointer'; // Cursor de clique

            card.innerHTML = `
                <div class="presc-top">
                    <div class="med-info">
                        <h3>${r.medication_name || 'Medicamento'}</h3>
                        <span class="dose-badge">${r.dosage || ''}</span>
                    </div>
                    <span class="status-badge ${statusClass}">${statusTexto}</span>
                </div>

                <div class="presc-details">
                    <div class="detail-group">
                        <small>Médico</small>
                        <strong>${r.doctor_name || 'Desconhecido'}</strong>
                    </div>

                    <div class="detail-group">
                        <small>Data de Emissão</small>
                        <strong>${dataEmissao}</strong>
                    </div>

                    <div class="detail-group">
                        <small>Data de Validade</small>
                        <strong>${dataValidade}</strong>
                    </div>

                    <div class="detail-group">
                        <small>Quantidade</small>
                        <strong>${r.quantity || '1'} Unid.</strong>
                    </div>

                    <div class="detail-group">
                        <small>Forma</small>
                        <strong style="text-transform: capitalize;">${r.form_factor || '-'}</strong>
                    </div>
                </div>

                <div class="presc-notes">
                    <strong>Instruções:</strong>
                    <p style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">
                        ${r.instructions || 'Seguir indicações médicas.'}
                    </p>
                    <div style="margin-top:10px; color:var(--cor-secundaria); font-size:0.85rem; font-weight:bold;">
                        <i class="fa-solid fa-eye"></i> Ver detalhes completos
                    </div>
                </div>
            `;

            // ADICIONAR EVENTO DE CLIQUE
            card.addEventListener('click', () => abrirModalPrescricao(r, statusTexto, statusClass, dataEmissao, dataValidade));

            container.appendChild(card);
        });
    };

    // --- FUNÇÃO PARA ABRIR O MODAL (ADICIONADA) ---
    function abrirModalPrescricao(r, statusTexto, statusClass, dataEmissao, dataValidade) {
        const modal = document.getElementById('modal-prescricao');
        if(!modal) return; 

        // Preencher os campos
        document.getElementById('m-nome').textContent = r.medication_name || 'Sem nome';
        document.getElementById('m-dose').textContent = r.dosage || '-';
        
        const elStatus = document.getElementById('m-status');
        elStatus.textContent = statusTexto;
        elStatus.className = `status-badge ${statusClass}`; 

        document.getElementById('m-medico').textContent = r.doctor_name || 'Desconhecido';
        document.getElementById('m-qtd').textContent = (r.quantity || '1') + ' Embalagem(ns)';
        document.getElementById('m-data-emissao').textContent = dataEmissao;
        document.getElementById('m-data-validade').textContent = dataValidade;
        document.getElementById('m-forma').textContent = r.form_factor || 'Não especificado';
        
        document.getElementById('m-instrucoes').textContent = r.instructions || 'Sem instruções especiais.';

        // Mostrar notas apenas se existirem
        const boxNotas = document.getElementById('box-notas');
        if (r.notes) {
            document.getElementById('m-notas').textContent = r.notes;
            boxNotas.style.display = 'block';
        } else {
            boxNotas.style.display = 'none';
        }

        // Mostrar o modal
        modal.style.display = 'flex';

        // Lógica de fechar
        const spanFechar = modal.querySelector('.fechar-modal');
        if(spanFechar) spanFechar.onclick = () => modal.style.display = 'none';

        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    }

    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('paciente_token'); 
            window.location.href = 'index.html';
        });
    }

    setupNavigation();
    carregarPerfil();
});