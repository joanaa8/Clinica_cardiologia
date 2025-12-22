 const SPLASH_DURATION = 3000; // 3 segundos

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');

    const loginForm = document.getElementById('loginForm');

        setTimeout(() => {

            if (splashScreen) {
                 splashScreen.style.opacity = 0;
                 setTimeout(() => {
                    splashScreen.style.display = 'none';

                    if (loginScreen) {
                        loginScreen.style.display = 'flex';
                        setTimeout(() => {
                            loginScreen.style.opacity = 1;
                        }, 50);
                    }   
                }, 1000); 
            }

        }, SPLASH_DURATION);

        if(loginForm) {
            loginForm.addEventListener('submit', async (event) => {
                event.preventDefault();

                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
               
                await realizarLogin({ username, password });
            });
        }

        const recoveryLink = document.getElementById('recoveryLink');
        if (recoveryLink) {
            recoveryLink.addEventListener('click', function(event) {
                event.preventDefault();
                window.location.href = 'recuperarpass.html'; // Corrigido de .herf para .href
            });
        }
           

});


async function realizarLogin(dados) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(dados),
            headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
            
            localStorage.setItem('medico_token', result.data.token);
            window.location.href = result.data.redirect;
        } else {
           
            alert(result.message || "Erro ao realizar login");
        }

    } catch (error) {
        console.error('Erro durante o login:', error);
        alert('Ocorreu um erro de conexão com o servidor.');
    }
}