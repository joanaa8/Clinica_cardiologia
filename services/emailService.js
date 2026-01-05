const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({

  service: 'gmail',

  auth: {

    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS//app password criada no gmail

  },

  tls: {

    rejectUnauthorized: false// permite tls sem certificado válido

  }

});

const enviarEmail = async (para, assunto, texto) => {

  const mailOptions = {

    from: process.env.EMAIL_USER,
    to: para,
    subject: assunto,
    text: texto

  };

  await transporter.sendMail(mailOptions); //envio do email

};

module.exports = { enviarEmail };
