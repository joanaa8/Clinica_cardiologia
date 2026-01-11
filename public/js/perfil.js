document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
});

// Função responsável por carregar os dados do perfil do médico autenticado
async function carregarPerfil() {
    const token = localStorage.getItem('medico_token');

    if (!token) {
        console.warn("Token não encontrado. Redirecionando para login.");
        window.location.href = 'index.html';
        return;
    }

    try {
        // Pedido à API para obter os dados do utilizador autenticado
        const response = await fetch('/api/account/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("Erro ao carregar perfil:", response.status);
            return;
        }

        const account = await response.json();
        console.log('Perfil recebido:', account);

        // Preencher formulário
        const nomeInput = document.getElementById('input-nome');
        const emailInput = document.getElementById('input-email');
        const licencaInput = document.getElementById('input-licenca');
        const profileNameDisplay = document.getElementById('profile-name-display');

        if (nomeInput) nomeInput.value = account.name;
        if (emailInput) emailInput.value = account.email;
        if (licencaInput) licencaInput.value = account.professional_license;
        if (profileNameDisplay) profileNameDisplay.textContent = account.name;

    } catch (erro) {
        console.error('Erro de ligação ao servidor:', erro);
    }
}
