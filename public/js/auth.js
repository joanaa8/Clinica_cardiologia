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
            console.error("Sessão expirada.");
            terminarSessao();
            return;
        }

        if (response.ok) {
            const medico = await response.json();
            console.log('Médico recebido:', medico);
            console.log('Elemento nome:', document.getElementById('nome-medico'));

            
            const elementoNome = document.getElementById('nome-medico') || document.getElementById('sidebar-nome');
            const elementoAvatar = document.getElementById('sidebar-avatar');

            if (elementoNome) elementoNome.innerText = medico.name;
            if (elementoAvatar) {
                const iniciais = medico.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                elementoAvatar.innerText = iniciais;
            }
        }
    } catch (erro) {
        console.error('Erro de ligação ao servidor:', erro);
    }
}
function terminarSessao() {
    localStorage.removeItem('medico_token');
    window.location.href = 'index.html';
}