
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    if (email) {
        document.getElementById('email').value = email;
    }
});

async function redefinirPassword(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const nova_password = document.getElementById('nova_password').value;
    const confirmar_password = document.getElementById('confirmar_password').value;

    // Validação básica no cliente
    if (nova_password !== confirmar_password) {
        alert("As passwords não coincidem!");
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: nova_password })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message); // "Password redefinida com sucesso"
            window.location.href = 'index.html'; // Volta para o login
        } else {
            alert(result.message || "Erro ao redefinir password");
        }
    } catch (error) {
        console.error('Erro:', error);
        alert("Erro de conexão com o servidor.");
    }
}