const sgMail = require('@sendgrid/mail');
const axios = require('axios');

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
      dynamic_template_data: dynamicTemplateData
    };

    await sgMail.send(msg);
    console.log('Email sent');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

exports.sendEmailWithTemplate = async (to, subject, text, templateId, dynamicTemplateData) => {
  try {
    const apiKey = apiKeySendGrid;

    // Configura el cuerpo de la petición
    const emailData = {
      personalizations: [
        {
          to : [
            {
              email: to,
              name: ""
            },
          ],
          subject: subject,
          dynamic_template_data: dynamicTemplateData
        }
      ],
      from: {
        email: fromEmail,
      },
      template_id: templateId, // ID del template en SendGrid
    };

    // Realiza la solicitud POST a la API de SendGrid
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      emailData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`, // Enviar el API Key en el encabezado
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Email sent successfully:', response.status);
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
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
