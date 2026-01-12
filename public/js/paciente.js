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

    // ...

    // =========================================================
    // 3. CARREGAMENTO DE DADOS
    // =========================================================

    const safeText = (text, suffix = "") => {
        if (!text && text !== 0) return "--";
        return text + suffix;
    };

    // --- A. PERFIL COMPLETO ---
    const carregarPerfil = async () => {
        const dados = await fetchAPI('/api/paciente/perfil');
        
        if (!dados) return;

        document.getElementById('nomeUtente').textContent = safeText(dados.name);
        document.getElementById('nome-lateral').textContent = safeText(dados.name);
        document.getElementById('numUtente').textContent = safeText(dados.health_number);
        
        document.getElementById('emailUtente').textContent = safeText(dados.email);
        // NOTA: A query SQL já faz "p.phone as telefone", por isso isto funciona:
        document.getElementById('telUtente').textContent = safeText(dados.telefone); 

        if (dados.date_of_birth) {
            const data = new Date(dados.date_of_birth).toLocaleDateString('pt-PT');
            document.getElementById('dataNasc').textContent = data;
        } else {
            document.getElementById('dataNasc').textContent = "--";
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
                li.textContent = prob.description;
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
            // CORREÇÃO: Usar 'appointment_date' (conforme corrigido na query)
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

    // --- C. PRESCRIÇÕES (Mantém-se quase igual) ---
    const carregarPrescricoes = async () => {
        const receitas = await fetchAPI('/api/paciente/prescricoes');
        const tbody = document.getElementById('tabelaPrescricoes');
        tbody.innerHTML = ''; 

        if (!receitas || receitas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;">Sem prescrições registadas.</td></tr>';
            return;
        }

        receitas.forEach(r => {
            const dataF = r.prescription_date 
                ? new Date(r.prescription_date).toLocaleDateString('pt-PT') 
                : '--/--/----';
            
            // ENUM SQL: 'active', 'expired', 'cancelled', 'completed'
            let statusClass = 'ativo';
            if (r.status === 'expired') statusClass = 'expirado';
            if (r.status === 'cancelled') statusClass = 'cancelada';
            
            // Tentei usar r.justificacao se existir, senão notes, senão genérico
            const detalhes = r.justificacao || r.notes || "Ver detalhes";

            const row = `
                <tr>
                    <td>${dataF}</td>
                    <td>${detalhes}</td>
                    <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    };

    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('paciente_token'); // Correção do nome
            window.location.href = 'index.html';
        });
    }

    carregarPerfil();
});