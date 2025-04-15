const sendMail = require('./sendEmail');

const sendTestEmail = async () => {
  await sendMail({
    email: "saurabh639544@gmail.com",
    subject: "Test Email",
    message: "This is a test email from Nodemailer!",
  });
};

sendTestEmail();
