import nodemailer from 'nodemailer';

type SendEmailOptions = {
  email: string | string[];
  subject: string;
  html?: string;
  text?: string;
  callback?: () => void;
}

const fastmailTransporter = nodemailer.createTransport({
    host: 'smtp.fastmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.email_username,
        pass: process.env.email_password,
    }
});

// Keep as a reference in case we switch back to Gmail SMTP later.
// const gmailTransporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.email_username,
//         pass: process.env.email_password,
//     }
// });

export default async (options: SendEmailOptions) => {
  const mailData = {
      from: process.env.email_from,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text
  };

  const info = await fastmailTransporter.sendMail(mailData);
  options.callback?.();

  return info;
};
