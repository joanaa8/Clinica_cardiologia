let utentes = []; // Lista global de utentes
let utenteSelecionado = null; // Guarda o utente atualmente selecionado no modal

document.addEventListener("DOMContentLoaded", async function() {
    const token = localStorage.getItem("medico_token");
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    console.log("DOM carregado. Token encontrado.");
    await carregarUtentes(token);
    configurarPesquisa();
});

function configurarPesquisa() {
    const inputPesquisa = document.getElementById("inputPesquisa");
    if (!inputPesquisa) return;

    inputPesquisa.addEventListener("input", function() {// Filtra os utentes à medida que o utilizador escreve
        const termo = inputPesquisa.value.toLowerCase();
        const filtrados = utentes.filter(function(u) {
            const nome = u.name ? u.name.toLowerCase() : "";
            const sns = u.health_number ? u.health_number : "";
            return nome.includes(termo) || sns.includes(termo);
        });
        renderizarUtentes(filtrados);
    });
}

// Função genérica para pedidos GET à API com autenticação
async function apiGet(url, token) {
    console.log("Chamando API: " + url);
    const res = await fetch(url, {
        method: "GET",
        headers: { 
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        }
    });

    if (!res.ok) {
        console.error("Erro na resposta da API (" + url + "): " + res.status);
        throw new Error("Erro ao carregar " + url);
    }
    return res.json();
}

// Carrega todos os utentes da API
async function carregarUtentes(token) {
    try {
        utentes = await apiGet("/api/utentes", token);
        console.log("Utentes carregados:", utentes.length);
        renderizarUtentes(utentes);
    } catch (err) {
        console.error("Erro ao carregarUtentes:", err);
        alert("Não foi possível carregar os utentes.");
    }
}

function renderizarUtentes(lista) {
    const container = document.getElementById("utentesList");
    if (!container) return;
    container.innerHTML = "";// Limpa a lista antes de renderizar novamente

    if (lista.length === 0) {
        container.innerHTML = "<p>Não há utentes registados.</p>";
        return;
    }

    lista.forEach(function(u) {
        const card = document.createElement("div");
        card.className = "utente-card";
         // Formatação da data de nascimento
        const dataNasc = u.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString("pt-PT") : "--/--/----";

        card.innerHTML = `
            <div class="card-info">
                <h3>${u.name}</h3>
                <p>SNS: ${u.health_number || "--"}</p>
                <p>Data de Nascimento: ${dataNasc}</p>
            </div>
            <button class="btn-detalhes" data-id="${u.id}">Ver Detalhes</button>
        `;

        card.querySelector(".btn-detalhes").addEventListener("click", function() {
            abrirModalUtente(u.id);
        });
        container.appendChild(card);
    });
}

async function abrirModalUtente(id) {
    const token = localStorage.getItem("medico_token");
    console.log("Abrindo modal para utente ID: " + id);
    
    try {
        utenteSelecionado = await apiGet("/api/utentes/" + id, token);// Carrega os dados principais do utente
        preencherDadosPessoais(utenteSelecionado);

        console.log("Iniciando Promise.all para dados complementares...");

        // Carrega dados complementares em paralelo
        const [alergias, problemas, medicacao, consultas, prescricoes] = await Promise.all([
            apiGet("/api/utentes/" + id + "/alergies", token).catch(e => { console.warn("Falha alergies"); return []; }),
            apiGet("/api/utentes/" + id + "/problemas", token).catch(e => { console.warn("Falha problemas"); return []; }),
            apiGet("/api/utentes/" + id + "/medicacao", token).catch(e => { console.warn("Falha medicacao"); return []; }),
            apiGet("/api/utentes/" + id + "/consultas", token).catch(e => { console.warn("Falha consultas"); return []; }),
            apiGet("/api/utentes/" + id + "/prescricoes", token).catch(e => { console.warn("Falha prescricoes"); return []; })
        ]);

        console.log("Dados recebidos. Alergias:", alergias);

        // Alergias
        const obsAlergias = document.getElementById("m-obsAlergias");
        const gravidade = document.getElementById("m-gravidade");
        if (alergias && alergias.length > 0) {
            obsAlergias.textContent = alergias.map(a => a.allergy).join(", ");
            gravidade.textContent = alergias.map(a => a.gravity || "--").join(", ");
        } else {
            obsAlergias.textContent = "Sem Observações registadas";
            gravidade.textContent = "--";
        }

        // Problemas
        const pDesc = document.getElementById("m-descricaoProblema");
        const pCid = document.getElementById("m-codigodoenca");
        const pSnomed = document.getElementById("m-snomedct");
        const pTipo = document.getElementById("m-tipoProblema");
        if (problemas && problemas.length > 0) {
            pDesc.textContent = problemas[0].description || "--";
            pCid.textContent = problemas[0].cid_code || "--";
            pSnomed.textContent = problemas[0].snomed_ct || "--";
            pTipo.textContent = problemas[0].problem_type || "--";
        } else {
            pDesc.textContent = "--"; pCid.textContent = "--"; pSnomed.textContent = "--"; pTipo.textContent = "--";
        }

        // Medicação
        const mMed = document.getElementById("m-medicamento");
        const mSrc = document.getElementById("m-Source");
        const mVal = document.getElementById("m-Validade");
        if (medicacao && medicacao.length > 0) {
            mMed.textContent = medicacao[0].medication_name || "--";
            mSrc.textContent = medicacao[0].source || "SNS";
            mVal.textContent = medicacao[0].end_date ? new Date(medicacao[0].end_date).toLocaleDateString("pt-PT") : "--/--/----";
        } else {
            mMed.textContent = "--"; mSrc.textContent = "--"; mVal.textContent = "--/--/----";
        }

        // Consultas e Prescrições
        document.getElementById("m-dataEmissao").textContent = (consultas && consultas.length > 0) ? new Date(consultas[0].appointment_date).toLocaleDateString("pt-PT") : "--/--/----";
        
        const mDoc = document.getElementById("m-médico");
        const mObs = document.getElementById("m-obsPrescricao");
        if (prescricoes && prescricoes.length > 0) {
            mDoc.textContent = prescricoes[0].doctor_name || "--";
            mObs.textContent = prescricoes[0].notes || "--";
        } else {
            mDoc.textContent = "--"; mObs.textContent = "--";
        }

        document.getElementById("modalUtente").classList.add("open");
        console.log("Modal aberto com sucesso.");
    } catch (err) {
        console.error("Erro fatal ao abrir modal:", err);
        alert("Erro ao carregar detalhes do utente.");
    }
}

function fecharModal() {
    document.getElementById("modalUtente").classList.remove("open");
}

function preencherDadosPessoais(u) {
    document.getElementById("m-nome").textContent = u.name || "--";
    document.getElementById("m-dataNasc").textContent = u.date_of_birth ? new Date(u.date_of_birth).toLocaleDateString("pt-PT") : "--/--/----";
    document.getElementById("m-sexo").textContent = u.sex || "--";
    document.getElementById("m-tipoSangu").textContent = u.blood_type || "--";
    document.getElementById("m-telemovel").textContent = u.phone || "--";
    document.getElementById("m-email").textContent = u.email || "--";
    document.getElementById("m-contactoEmergencia").textContent = u.emergency_contact || "--"
    document.getElementById("m-sns").textContent = u.health_number || "--";
 
     // Gera as iniciais do nome para o avatar
    if (u.name) {
        const iniciais = u.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
        document.getElementById("m-avatar").textContent = iniciais;
    }
}