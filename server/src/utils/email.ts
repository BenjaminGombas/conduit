import nodemailer, { Transporter } from 'nodemailer';
import templates from './emailTemplates';

let transporter: Transporter | null = null;

const getTransporter = () => {
    if (!transporter) {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email credentials not found in environment variables');
        }

        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    return transporter;
};

// Initialize email transporter
export const initializeEmailService = async () => {
    try {
        console.log('Email environment variables:', {
            user: process.env.EMAIL_USER?.substring(0, 3) + '...' || 'Not set',
            pass: process.env.EMAIL_PASS ? '[Present]' : 'Not set'
        });

        await getTransporter().verify();
        console.log('Email service is ready to send emails');
        return true;
    } catch (error) {
        console.error('Failed to initialize email service:', error);
        throw error;
    }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
    const info = await getTransporter().sendMail({
        from: `"Conduit Chat" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });
    return info;
};

export const sendEmailWithTemplate = async (
    to: string,
    templateName: keyof typeof templates,
    context: { username?: string; actionUrl: string; actionText?: string }
) => {
    const { subject, html } = templates[templateName](context);
    console.log(context)
    const info = await getTransporter().sendMail({
        from: `"Conduit Chat" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });

    return info;
};