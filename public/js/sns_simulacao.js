document.addEventListener('DOMContentLoaded', async() =>{
    //ler dados guardados
    const patientId = sessionStorage.getItem ('utenteId');
    const nome = sessionStorage.getItem('utenteNome');
    const n_saude= sessionStorage.getItem('utenteSaude');

    document.getElementById('nome-exigibido').textContent = nome;
    document.getElementById('n_saude-exibido').textContent= n_saude;
    //preescher os campos do html

    try{
        const response = await fetch(`/api/simulacao/receitas/${patientId}`);
        const receitas = await response.json();

        const container = document.getElementById('lista-receitas');

        if (response.ok && Array.isArray(receitas)) {
            container.innerHTML = receitas.map(r => `
                <div class="receita-card">
                    <div class="receita-nome">${r.commercial_name}, ${r.dosage}</div>
                    <span class="status-tag">${r.status}</span>
                    <div class="receita-detalhes">
                        <p>Data: <span>${new Date(r.prescription_date).toLocaleDateString('pt-PT')}</span></p>
                        <p>Prescritor: <span>${r.doctor_name}</span></p>
                    </div>
                </div>
            `).join('');
            } else {
            container.innerHTML = '<p class="msg-vazia">Nenhuma receita encontrada para os últimos 12 meses.</p>';
        }

    } catch (err) {
        console.error("Erro ao carregar receitas", err);
    }
});


