const pool = require('../config/db.js');

const ValidarUtente = async( healthNumber, phoneNumber) =>{
    const query = `
    SELECT id, name, health_number, phone
    from Person
    Where health_number = $1 AND phone =$2; `;

    try {
        const { rows } = await pool.query(query, [healthNumber, phoneNumber]);
        return rows[0]; // Retorna o utente se os dois dados coincidirem, se não indefinido 
    } catch (err) {
        console.error("Erro na base de dados:", err);
        throw err;
    }    
}


module.exports = {
    ValidarUtente,
};
