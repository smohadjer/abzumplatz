import nodemailer from 'nodemailer';

type SendEmailOptions = {
  email: string | string[];
  subject: string;
  html: string;
  callback?: () => void;
}

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

export default async (options: SendEmailOptions) => {
  const mailData = {
      from: process.env.email_username,
      to: options.email,
      subject: options.subject,
      html: options.html
  };

  const info = await transporter.sendMail(mailData);
  options.callback?.();

  return info;
};
