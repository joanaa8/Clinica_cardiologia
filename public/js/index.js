 const SPLASH_DURATION = 3000; // 3 segundos

        document.addEventListener('DOMContentLoaded', () => {
            const splashScreen = document.getElementById('splash-screen');
            const loginScreen = document.getElementById('login-screen');

            setTimeout(() => {
                
                splashScreen.style.opacity = 0;

                setTimeout(() => {
                    splashScreen.style.display = 'none';

                    
                    loginScreen.style.display = 'flex';
                    setTimeout(() => {
                        loginScreen.style.opacity = 1;
                    }, 50);

                }, 1000); 

            }, SPLASH_DURATION);
        });

        document.addEventListener('DOMContentLoaded', () => {
    const recoveryLink = document.getElementById('recoveryLink');

    if (recoveryLink) {
        recoveryLink.addEventListener('click', function(event) {
            event.preventDefault(); 
       
            console.log('A ser redirecionado para a página de recuperação...');
            alert('Redirecionar para a página de recuperação...');

          
        });
    }
});