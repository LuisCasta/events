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
      text: `${text} Has completa exitosamente tu registro, pronto recibirás información para cotinuar con el evento.`,
    };

    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
