const SPLASH_DURATION = 3000;// 3segundos

document.addEventListener('DOMContentLoaded', () => {

    const splashScreen = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('loginForm');


    setTimeout(() => {

        if (splashScreen) {

            splashScreen.style.opacity = 0;//fade out

            setTimeout(() => {

                splashScreen.style.display = 'none';
                if (loginScreen) {

                    loginScreen.style.display = 'flex';// mostrar o login
                    setTimeout(() => { loginScreen.style.opacity = 1; }, 50); // fade in
                
                }  

            }, 1000); //tempo do fade out

        }
    
    }, SPLASH_DURATION);

    
    if (loginForm) {

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            
            const usernameInput = document.getElementById('username').value;
            const passwordInput = document.getElementById('password').value;

            try {
                
               
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ 
                        username: usernameInput, 
                        password: passwordInput 
                    })
                });

                const data = await response.json();
                    /*
                if (response.ok) {
                    localStorage.setItem('medico_token', data.token); //guardar o token RN1
                    console.log('Login com sucesso:', data);
                    window.location.href = data.is_professional ? '/profissional.html' : '/paciente.html'; //RN3
                */
               if (response.ok) {
                     if (data.is_professional) {
                        localStorage.setItem('medico_token', data.token);
                    } else {
                        localStorage.setItem('paciente_token', data.token);
                    }   
                    
                    console.log('Login com sucesso. Tipo:', data);
            
                    window.location.href = data.is_professional ? 'profissional.html' : 'paciente.html';

                } else {

                    alert(data.message); //mostrar o erro RN2

                }
            } catch (error) {
                console.error('Erro ao conectar ao servidor:', error);
                alert('Erro de ligação ao servidor.');
            }
        });

    }

    const recoveryLink = document.getElementById('recoveryLink');

    if (recoveryLink) {

        recoveryLink.addEventListener('click', function(event) {

            event.preventDefault();
            window.location.href = 'recuperarpass.html'; 

        });
    }
});