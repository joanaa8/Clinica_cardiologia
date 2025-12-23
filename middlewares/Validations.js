//RN1
const validatePassword = (req, res, next) => {

    const { new_password } = req.body;

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{13,}$/;

    if (!regex.test(new_password)) {
        return res.status(400).json({ 
            message: "A password deve ter 13 caracteres, incluindo maiúscula, minúscula, número e símbolo." 
        });
    }
    next();
};
module.exports = { validatePassword };