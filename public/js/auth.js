document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    carregarDadosMedico();
});

async function carregarDadosMedico() {
    const token = localStorage.getItem('medico_token');

    if (!token) {
        console.warn("Token não encontrado. Redirecionando para login.");
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('/api/account/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            console.error("Sessão expirada ou acesso proibido.");
            terminarSessao();
            return;
        }

        if (!response.ok) {
            console.error("Erro ao carregar dados:", response.status);
            return;
        }

        const account = await response.json();
        console.log('Médico recebido:', account);

        // Atualizar sidebar
        const elementoNome = document.getElementById('nome-medico');
        const elementoAvatar = document.getElementById('sidebar-avatar');

        if (elementoNome) elementoNome.textContent = account.name;
        if (elementoAvatar) {
            const iniciais = account.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            elementoAvatar.textContent = iniciais;
        }
        // Atualizar perfil
        document.getElementById('profile-name-display').textContent = account.name;
        document.getElementById('input-nome').value = account.name;
        document.getElementById('input-email').value = account.email;
        document.getElementById('input-licenca').value = account.professional_license;

        
    } catch (erro) {
        console.error('Erro de ligação ao servidor:', erro);
    }
}

function terminarSessao() {
    localStorage.removeItem('medico_token');
    window.location.href = 'index.html';
}
