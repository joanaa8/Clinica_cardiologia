//listener que é executado quando a página carrega, captura do token
document.addEventListener('DOMContentLoaded', () => {

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {

        alert('Token inválido ou em falta.');
        return;

    }

    document.getElementById('token').value = token;

});
// verifica a pass nos dois campos para perceber se é compatível, envio de uma mensagem de resposta do servidor
async function redefinirPassword(event) {

    event.preventDefault();

    const password = document.getElementById('nova_password').value;
    const confirmar = document.getElementById('confirmar_password').value;
    const token = document.getElementById('token').value;

    if (password !== confirmar) {

        alert('As passwords não coincidem!');
        return;

    }

    try {

        const response = await fetch(`/api/auth/reset-password/${token}`, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })

        });

        const result = await response.json();

        if (response.ok) {

            alert(result.message);
            window.location.href = 'index.html';

        } else {

            alert(result.message || 'Erro ao redefinir password');

        }

    } catch (error) {

        console.error(error);
        alert('Erro de ligação ao servidor.');

    }
}
