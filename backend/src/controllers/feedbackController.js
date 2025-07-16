import nodemailer from 'nodemailer';

export const sendFeedback = async (req, res) => {
  const { email, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Configure transporter
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.FEEDBACK_EMAIL_USER,
        pass: process.env.FEEDBACK_EMAIL_PASS,
      },
    });

    // Compose email
    const mailOptions = {
      from: email || process.env.FEEDBACK_EMAIL_USER,
      to: process.env.FEEDBACK_EMAIL_TO,
      subject: 'MindGarden App Feedback',
      text: `Feedback from: ${email || 'Anonymous'}\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback email error:', err);
    res.status(500).json({ error: 'Failed to send feedback.' });
  }
}; 