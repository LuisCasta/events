const sgMail = require('@sendgrid/mail');
require('dotenv').config();


const fromEmail = 'info@acelerandooportunidades2025.com';
const apiKeySendGrid = process.env.API_KEY;

exports.sendMessage = async (to, subject, text, templateId, dynamicTemplateData) => {
  try {

    // process.env.SENDGRID_API_KEY
    const apiKey = apiKeySendGrid; 
    sgMail.setApiKey(apiKey);
    
    const from = fromEmail;
    const msg = {
      to, // 'test@example.com', // Change to your recipient
      from, // 'test@example.com', // Change to your verified sender
      subject, // 'Sending with SendGrid is Fun',
      text,
      templateId,
      dynamicTemplateData: dynamicTemplateData
    };

    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

exports.sendMessagePassword = async (to, subject, text) => {
    try {
      // process.env.SENDGRID_API_KEY
      const apiKey = apiKeySendGrid; 
      sgMail.setApiKey(apiKey);
      
      const from = fromEmail;
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
