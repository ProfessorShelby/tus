# Email Configuration for Contact Form

The contact form requires SMTP email configuration to send messages. Add these environment variables to your `.env.local` file:

## Required Environment Variables

```bash
# SMTP Server Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Email Addresses
FROM_EMAIL=your-email@gmail.com
TO_EMAIL=it-team@example.com
```

## Gmail Setup Instructions

If using Gmail:

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Enable 2-factor authentication

2. **Generate App Password**
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Generate password
   - Use this as `SMTP_PASS`

3. **Update .env.local**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=generated-app-password-here
   FROM_EMAIL=your-email@gmail.com
   TO_EMAIL=it-team-email@example.com
   ```

## Other Email Providers

### Outlook/Office 365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
Contact your hosting provider for SMTP settings.

## Email Format

When users submit the contact form, emails will be sent to `TO_EMAIL` with:
- **Subject**: `[TUS İletişim] {Subject Type} - {User Name}`
- **From**: Your configured email (`FROM_EMAIL`)
- **Reply-To**: User's email address
- **Content**: Formatted HTML with user's message

## Testing

1. Start the development server
2. Click "İletişim Formu" button at the top
3. Fill out and submit the form
4. Check the `TO_EMAIL` inbox for the message

## Troubleshooting

- **"Email servisi yapılandırılmamış" error**: Environment variables are missing
- **Authentication failed**: Check SMTP credentials
- **Connection refused**: Verify SMTP_HOST and SMTP_PORT
- **Gmail blocks login**: Use App Password instead of regular password

