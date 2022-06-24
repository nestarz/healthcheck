import net from "net";

const SMTP_AUTH_KEY = process.env.SMTP_AUTH_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

const noopLog = (v) => console.log(v) ?? v;
const sendMail = ({ from = FROM_EMAIL, to, subject, content }) =>
  new Promise((res, rej) => {
    const commands = [
      "EHLO localhost\r\n",
      `AUTH PLAIN ${SMTP_AUTH_KEY}\r\n`,
      `MAIL FROM: <${from}>\r\n`,
      `RCPT TO: <${to}>\r\n`,
      "DATA\r\n",
      `FROM: <${from}>\r\nTO: <${to}>\r\nSUBJECT: ${subject}\r\n${content}\r\n.\r\n`,
      "QUIT\r\n",
    ];

    let i = 0;
    console.log(i);
    const socket = net
      .createConnection(587, "ssl0.ovh.net")
      .on("data", (b) =>
        /^221/.test(noopLog(b.toString()))
          ? res(socket.destroy())
          : /(Error: )|(rejected: )/.test(b.toString())
          ? rej((socket.destroy(), b.toString()))
          : i >= commands.length
          ? rej((socket.destroy(), "i>=commands"))
          : socket.write(commands[i++])
      )
      .on("close", (v) => res(v))
      .on("error", (v) => rej(v));
    socket.write(commands[i]);
  });

export default async (req, res) => {
  const { email: to, subject, content } = JSON.parse(req.body);

  return sendMail({ to, subject, content })
    .then(() => ({ success: true }))
    .catch((error) => ({ error }))
    .then((v) => JSON.stringify(v))
    .then((v) => res.end(v));
};
