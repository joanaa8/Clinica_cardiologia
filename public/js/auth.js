document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado');
    carregarSidebarMedico();
});

// Função responsável por carregar e atualizar a sidebar do médico autenticado
async function carregarSidebarMedico() {
    const token = localStorage.getItem('medico_token');

    if (!token) {
        console.warn("Token não encontrado. Redirecionando para login.");
        window.location.href = 'index.html';
        return;
    }

    try {
        // Pedido à API para obter os dados do médico autenticado
        const response = await fetch('/api/account/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Verifica se a sessão expirou ou se o acesso foi negado
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

        // Guarda o ID da conta do médico para uso em futuras consultas
        localStorage.setItem('medico_account_id', account.id);

        // Atualizar sidebar
        const elementoNome = document.getElementById('nome-medico');
        const elementoAvatar = document.getElementById('sidebar-avatar');

        if (elementoNome) elementoNome.textContent = account.name;

        // Gera e atualiza o avatar com as iniciais do nome
        if (elementoAvatar) {
            const iniciais = account.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            elementoAvatar.textContent = iniciais;
        }

    } catch (erro) {
        console.error('Erro de ligação ao servidor:', erro);
    }
}

// Termina a sessão do médico, limpando os dados armazenados
function terminarSessao() {
    localStorage.removeItem('medico_token');
    localStorage.removeItem('medico_account_id');
    window.location.href = 'index.html';
}
