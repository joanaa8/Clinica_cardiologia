const SPLASH_DURATION = 2500; /*segundos*/

document.addEventListener('DOMContentLoaded', () => {

    const splash = document.getElementById('splash-screen');
    const login = document.getElementById('login-screen');
    const loginForm = document.getElementById('loginForm');

    setTimeout(() => { //spalsh screen
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.style.display = 'none';
          login.style.display= 'flex';
          setTimeout(() => { login.style.opacity = '1'; }, 50);
        }, 800);
    }, SPLASH_DURATION);

   //log in 
 if ( loginForm){

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try { //redireciona na api 
            const response = await fetch('/api/sns/loginSNS', {
                method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
            });

            if(response.ok){
                //login correto 
                const data = await response.json();
                //guardar dados

                window.location.href= '/sns_simulacao.html'; 
                //redireciona para a pagina do ficheiro html 
            }else {
                alert('Credenciais inválidas. Tente de novo.');
            }
        }catch(error){
            console.error('Erro :', error);
            alert('Erro de ligação ao servidor.');
        }
    });
    
  }

});


