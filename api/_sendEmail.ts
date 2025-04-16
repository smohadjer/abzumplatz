import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
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
      }
      options.callback();
  });
};
