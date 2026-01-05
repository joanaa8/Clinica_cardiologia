//RN1
const validatePassword = (req, res, next) => {

    const { password } = req.body;

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{13,}$/;

    if (!regex.test(password)) {

        return res.status(400).json({ 

            message: "A password deve ter pelo menos 13 caracteres, incluindo maiúscula, minúscula, número e símbolo." 
        
        });
    }
    next();
};

module.exports = { validatePassword };