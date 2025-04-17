import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  //host: "smtp.fastmail.com",
  //port: 465,
  //secure: true,
  service: 'gmail',
  auth: {
      user: process.env.email_username,
      pass: process.env.email_password,
  }
});

export default async (options) => {
  const mailData = {
      from: process.env.email_username,
      to: options.email,
      subject: options.subject,
      html: options.html
  };

  transporter.sendMail(mailData, (error, info) => {
      if (error) {
          console.error(error);
      } else {
        options.callback();
      }
  });
};
