import { NextRequest } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'İsim zorunludur'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  subject: z.string().min(1, 'Konu seçiniz'),
  message: z.string().min(1, 'Mesaj zorunludur'),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Get email configuration from environment variables
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
    const TO_EMAIL = process.env.TO_EMAIL; // IT guys email

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !TO_EMAIL) {
      console.error('Missing email configuration');
      return Response.json(
        { error: 'Email servisi yapılandırılmamış. Lütfen daha sonra tekrar deneyiniz.' },
        { status: 500 }
      );
    }

    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');

    // Create transporter
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Subject labels
    const subjectLabels: Record<string, string> = {
      bug: 'Hata/Sorun Bildirimi',
      feedback: 'Görüş/Öneri',
      data: 'Veri Güncelleme Talebi',
      other: 'Diğer',
    };

    const subjectLabel = subjectLabels[validatedData.subject] || validatedData.subject;

    // Send email
    await transporter.sendMail({
      from: `"TUS Tercih Rehberi" <${FROM_EMAIL}>`,
      to: TO_EMAIL,
      replyTo: validatedData.email,
      subject: `[TUS İletişim] ${subjectLabel} - ${validatedData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            TUS Tercih Rehberi - İletişim Formu
          </h2>
          
          <div style="margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Ad Soyad:</strong> ${validatedData.name}</p>
            <p style="margin: 5px 0;"><strong>E-posta:</strong> ${validatedData.email}</p>
            <p style="margin: 5px 0;"><strong>Konu:</strong> ${subjectLabel}</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Mesaj:</h3>
            <p style="white-space: pre-wrap; color: #1f2937;">${validatedData.message}</p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Bu mesaj TUS Tercih Rehberi iletişim formundan gönderilmiştir.
          </p>
        </div>
      `,
    });

    console.log('Contact email sent successfully to:', TO_EMAIL);

    return Response.json(
      { success: true, message: 'Mesajınız başarıyla iletildi.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors && error.errors.length > 0 
        ? error.errors[0].message 
        : 'Lütfen form alanlarını kontrol ediniz.';
      return Response.json(
        { error: firstError },
        { status: 400 }
      );
    }

    return Response.json(
      { error: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyiniz.' },
      { status: 500 }
    );
  }
}

