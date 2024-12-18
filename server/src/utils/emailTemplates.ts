interface EmailContext {
    username?: string;
    actionUrl: string;
    actionText?: string;
}

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 20px;
            overflow: hidden;
        }
        .header {
            background-color: #1a1b3b;
            padding: 30px 20px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .content {
            padding: 30px 20px;
            color: #333333;
        }
        .button {
            display: inline-block;
            background-color: #ff3366;
            color: #ffffff;
            padding: 12px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 500;
            margin: 20px 0;
        }
        .footer {
            padding: 20px;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <h1 class="logo">Conduit</h1>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} Conduit. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
`;

const templates = {
    verifyEmail: ({ username, actionUrl }: EmailContext) => ({
        subject: 'Verify your Conduit account',
        html: baseTemplate(`
            <h2>Welcome to Conduit${username ? `, ${username}` : ''}!</h2>
            <p>Thanks for signing up. To get started, please verify your email address by clicking the button below:</p>
            <center><a href="${actionUrl}" class="button">Verify Email Address</a></center>
            <p>If you didn't create a Conduit account, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
        `)
    }),

    passwordReset: ({ username, actionUrl }: EmailContext) => ({
        subject: 'Reset your Conduit password',
        html: baseTemplate(`
            <h2>Password Reset Requested${username ? ` for ${username}` : ''}</h2>
            <p>We received a request to reset your Conduit password. Click the button below to choose a new password:</p>
            <center><a href="${actionUrl}" class="button">Reset Password</a></center>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>This link will expire in 1 hour.</p>
        `)
    }),

    newLogin: ({ username, actionUrl }: EmailContext) => ({
        subject: 'New login to your Conduit account',
        html: baseTemplate(`
            <h2>New Login Detected${username ? ` for ${username}` : ''}</h2>
            <p>We noticed a new login to your Conduit account. Here are the details:</p>
            <div style="background: #f5f5f8; padding: 15px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toUTCString()}</p>
                <p style="margin: 5px 0;"><strong>IP Address:</strong> [IP_ADDRESS]</p>
                <p style="margin: 5px 0;"><strong>Device:</strong> [DEVICE_INFO]</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> [LOCATION]</p>
            </div>
            <p>If this wasn't you:</p>
            <center><a href="${actionUrl}" class="button">Secure Your Account</a></center>
            <p>If this was you, no further action is needed.</p>
        `)
    })
};

export default templates;