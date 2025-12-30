async function recuperarPassword(event) {

    event.preventDefault();

    const email = document.getElementById('email').value;

    try {
        
        const response = await fetch('/api/auth/recuperar', {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })

        });

        const result = await response.json();
        alert(result.message || 'Se existir uma conta, foi enviado um email com instruções.');

    } catch (error) {

        console.error(error);
        alert('Erro ao enviar pedido de recuperação.');

    }
}
