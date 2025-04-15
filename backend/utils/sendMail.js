require('dotenv').config();
const nodemailer = require("nodemailer");

const sendMail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SMPT_SERVICE,
      auth: {
        user: process.env.SMPT_MAIL,
        pass: process.env.SMPT_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Mail options
    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // Verify transporter
    transporter.verify((error, success) => {
      if (error) {
        console.log("Error in transporter verification:", error);
      } else {
        console.log("Server is ready to take messages");
      }
    });

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email: ", error.message);
  }
};

module.exports = sendMail;
