// public/js/utentes.js

let utentes = []; // Lista local para filtro

document.addEventListener("DOMContentLoaded", async function() {
    console.log("Script de Utentes iniciado...");
    
    // 1. Verificar Token
    const token = localStorage.getItem("medico_token");
    if (!token) {
        console.warn("Sem token, a redirecionar...");
        window.location.href = "index.html";
        return;
    }

    // 2. Carregar Lista
    await carregarUtentes(token);
    
    // 3. Configurar Pesquisa
    const input = document.getElementById("inputPesquisa");
    if (input) {
        input.addEventListener("input", (e) => filtrarUtentes(e.target.value));
    }
});

// --- FUNÇÃO DE CARREGAMENTO ---
async function carregarUtentes(token) {
    const container = document.getElementById("utentesList");
    
    try {
        console.log("A pedir utentes à API...");
        const response = await fetch("/api/utentes", {
            method: "GET",
            headers: { 
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Erro API: " + response.status);
        }

        utentes = await response.json();
        console.log("Utentes recebidos:", utentes.length);
        
        renderizarUtentes(utentes);

    } catch (err) {
        console.error("Erro fatal:", err);
        container.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar dados: ${err.message}</p>`;
    }
}

// --- FUNÇÃO DE RENDERIZAÇÃO (Desenha os cartões) ---
function renderizarUtentes(lista) {
    const container = document.getElementById("utentesList");
    container.innerHTML = ""; 

    if (!lista || lista.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#666;'>Não foram encontrados utentes.</p>";
        return;
    }

    lista.forEach(u => {
        const card = document.createElement("div");
        card.className = "utente-card";

        const dataNasc = u.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString("pt-PT") : "--/--/----";

        // AQUI ESTÁ A ALTERAÇÃO NO LINK (href):
        card.innerHTML = `
            <div class="card-info">
                <h3>${u.name}</h3>
                <p><strong>SNS:</strong> ${u.health_number || "--"}</p>
                <p><strong>Nasc:</strong> ${dataNasc}</p>
            </div>
            
            <div class="card-actions">
                <button class="btn-detalhes" onclick="abrirModalUtente(${u.id})">
                    <i class="fa-solid fa-eye"></i> Detalhes
                </button>
                
                <a href="prescricoes.html?id=${u.id}" class="btn-prescrever">
                    <i class="fa-solid fa-file-prescription"></i> Prescrever
                </a>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// --- FILTRO DE PESQUISA ---
function filtrarUtentes(termo) {
    const termoLower = termo.toLowerCase();
    const filtrados = utentes.filter(u => {
        const nome = u.name ? u.name.toLowerCase() : "";
        const sns = String(u.health_number || "");
        return nome.includes(termoLower) || sns.includes(termoLower);
    });
    renderizarUtentes(filtrados);
}

// --- MODAL ---
async function abrirModalUtente(id) {
    const token = localStorage.getItem("medico_token");
    const modal = document.getElementById("modalUtente");
    
    try {
        // Buscar detalhes completos
        const res = await fetch(`/api/utentes/${id}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const u = await res.json();
        
        // Buscar Alergias (Exemplo de chamada extra)
        const resAlergias = await fetch(`/api/utentes/${id}/alergies`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const alergias = await resAlergias.json();

        // Preencher Modal
        document.getElementById("m-nome").textContent = u.name;
        document.getElementById("m-sns").textContent = u.health_number || "--";
        document.getElementById("m-dataNasc").textContent = u.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString("pt-PT") : "--";
        document.getElementById("m-sexo").textContent = u.sex || "--";
        document.getElementById("m-telemovel").textContent = u.phone || "--";

        // Preencher Avatar
        if(u.name) {
            document.getElementById("m-avatar").textContent = u.name.substring(0,2).toUpperCase();
        }

        // Preencher Alergias
        const obsAlergias = document.getElementById("m-obsAlergias");
        if(alergias && alergias.length > 0) {
            obsAlergias.textContent = alergias.map(a => a.allergy).join(", ");
        } else {
            obsAlergias.textContent = "Sem alergias registadas.";
        }

        // Abrir
        modal.classList.add("open");

    } catch (e) {
        console.error("Erro modal:", e);
        alert("Erro ao abrir detalhes.");
    }
}

function fecharModal() {
    document.getElementById("modalUtente").classList.remove("open");
}