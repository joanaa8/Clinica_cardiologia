document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. SEGURANÇA E AUTH
    // =========================================================
    
    // MUDANÇA: Usar um nome de token específico para o paciente
    const token = localStorage.getItem('paciente_token');

    if (!token) {
        window.location.href = 'index.html'; // Garante que tens um index.html de login
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
                localStorage.removeItem('paciente_token'); // Remover o token correto
                window.location.href = 'index.html';
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("Erro de conexão:", error);
            return null;
        }
    };

    // ... (CÓDIGO DE NAVEGAÇÃO SPA MANTÉM-SE IGUAL) ...
    // Vou omitir a parte da Navegação (Alternar Aba) pois está correta no teu original
    // Basta manteres o código das abas aqui.

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

                    // 1. Remover classe 'active' de todos os links
                    document.querySelectorAll('.sidebar nav ul li a').forEach(a => a.classList.remove('active'));
                    // 2. Adicionar 'active' ao clicado
                    linkElement.classList.add('active');

                    // 3. Esconder todas as views
                    document.getElementById('view-perfil').classList.add('hidden');
                    document.getElementById('view-consultas').classList.add('hidden');
                    document.getElementById('view-prescricoes').classList.add('hidden');

                    // 4. Mostrar a view desejada
                    const viewAlvo = document.getElementById(linkObj.view);
                    viewAlvo.classList.remove('hidden');

                    // 5. Carregar dados específicos se necessário (para não carregar tudo no início)
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
        const nomes = nomeCompleto.trim().split(/\s+/); // Divide por espaços
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

        // ... (Lógica de Alergias e Problemas mantém-se igual) ...
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
            li.className = "problem-item"; // Adicionei uma classe para estilizar
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
            // Ajustar status para bater certo com o ENUM do SQL ('scheduled', 'completed','cancelled')
            if (c.status === 'cancelled') statusClass = 'cancelada'; 
            if (c.status === 'completed') statusClass = 'completa';
            // Se o status for 'scheduled', usa a classe default 'agendada'

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


    // --- C. PRESCRIÇÕES ---
const carregarPrescricoes = async () => {
    // A tua API tem de devolver: start_date, end_date, quantity, regularidade, instructions, etc.
    const receitas = await fetchAPI('/api/paciente/prescricoes'); 
    const container = document.getElementById('listaPrescricoes');
    container.innerHTML = ''; 

    if (!receitas || receitas.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center;">Sem prescrições registadas.</p>';
        return;
    }

    receitas.forEach(r => {
        // --- AQUI ESTÁ A CORRESPONDÊNCIA QUE PEDISTE ---
        // start_date -> Data de Emissão
        const dataEmissao = r.start_date 
            ? new Date(r.start_date).toLocaleDateString('pt-PT') 
            : '--/--/----';
            
        // end_date -> Data de Validade
        const dataValidade = r.end_date 
            ? new Date(r.end_date).toLocaleDateString('pt-PT') 
            : '--/--/----';
        // ------------------------------------------------

        // Define a cor do status
        let statusClass = 'ativo';
        if (r.status === 'expired') statusClass = 'expirado';
        if (r.status === 'cancelled') statusClass = 'cancelada';
        if (r.status === 'completed') statusClass = 'completa';

        const cardHTML = `
            <div class="presc-card">
                <div class="presc-top">
                    <div class="med-info">
                        <h3>${r.medication_name || 'Medicamento'}</h3>
                        <span class="dose-badge">${r.dose || ''}</span>
                    </div>
                    <span class="status-badge ${statusClass}">${r.status}</span>
                </div>

                <div class="presc-details">
                    <div class="detail-group">
                        <small>Médico</small>
                        <strong>${r.doctor_name || 'N/A'}</strong>
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
                        <strong>${r.quantity || '1'} Emb.</strong>
                    </div>

                    <div class="detail-group">
                        <small>Regularidade</small>
                        <strong style="text-transform: capitalize;">${r.regularidade || 'N/A'}</strong>
                    </div>
                </div>

                <div class="presc-notes">
                    <strong>Instruções:</strong>
                    <p>${r.instructions || 'Seguir indicações médicas.'}</p>
                    
                    ${r.notes ? `<p style="margin-top:5px; font-size:0.9em; color:#666"><em>Nota: ${r.notes}</em></p>` : ''}
                </div>
            </div>
        `;

        container.innerHTML += cardHTML;
    });
};

    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('paciente_token'); // Correção do nome
            window.location.href = 'index.html';
        });
    }
    setupNavigation();
    carregarPerfil();
});