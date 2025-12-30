const argon2 = require('argon2');

async function gerarHash() {

  const password = process.argv[2];

  if (!password) {

    console.error("Uso: node gerar_hash.js <password>");// aviso de utilização no caso de uso incorreto
    process.exit(1);
  
  }

  try {

    const hash = await argon2.hash(password);
    console.log("Hash gerado:");
    console.log(hash);

  } catch (err) {

    console.error("Erro ao gerar hash:", err);
  }
}

gerarHash();