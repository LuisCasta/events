const sgMail = require('@sendgrid/mail');

exports.sendMessage = async (to, subject, text) => {
  try {

    // process.env.SENDGRID_API_KEY
    const apiKey = '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'; 
    sgMail.setApiKey(apiKey);
    
    const from = 'julio.ferrer@hellomexico.mx';
    const msg = {
      to, // 'test@example.com', // Change to your recipient
      from, // 'test@example.com', // Change to your verified sender
      subject, // 'Sending with SendGrid is Fun',
      text: `${text} Haz quedado registrado en nuestro sitio web "Creando oportunidades 2025.`,
    };

    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

exports.sendMessagePassword = async (to, subject, text) => {
    try {
        console.log('PRUEBAAAAAA ',to);
      // process.env.SENDGRID_API_KEY
      const apiKey = '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'; 
      sgMail.setApiKey(apiKey);
      
      const from = 'julio.ferrer@hellomexico.mx';
      const msg = {
        to, // 'test@example.com', // Change to your recipient
        from, // 'test@example.com', // Change to your verified sender
        subject, // 'Sending with SendGrid is Fun',
        text: `Para recuperar tu contraseña, debes acceder al siguiente enlace: ${text}.`,
      };
  
      await sgMail.send(msg);
      console.log('Email sent');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };
