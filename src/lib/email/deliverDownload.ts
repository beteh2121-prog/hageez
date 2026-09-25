import { Resend } from 'resend';
import { createServiceClient } from '@/lib/supabase/service';

interface DeliverDownloadParams {
  downloadId: string;
  email: string;
  signedUrl: string;
}

interface DeliverDownloadResult {
  success: boolean;
  error?: string;
}

function buildDeliveryEmailHtml(title: string, signedUrl: string): string {
  return `
  <div style="font-family: Inter, sans-serif; background-color: #FAF4E8; padding: 32px;">
    <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">
      <div style="background-color: #C67D10; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-family: Georgia, serif; color: #3D1F0D; font-size: 20px;">
          Ethiopian Orthodox Heritage
        </h1>
      </div>
      <div style="padding: 32px; color: #1C1410;">
        <p style="font-size: 16px;">Thank you for your purchase!</p>
        <p style="font-size: 16px; font-weight: 600;">${title}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${signedUrl}"
             style="background-color: #C67D10; color: #3D1F0D; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-weight: 600; display: inline-block;">
            Download Now
          </a>
        </div>
        <p style="font-size: 13px; color: #6B3A1F;">This link expires in 72 hours.</p>
        <p style="font-size: 12px; color: #975F0C; margin-top: 24px;">
          Need help? Contact us at support@yourdomain.com
        </p>
      </div>
    </div>
  </div>
  `;
}

export async function deliverDownloadEmail({
  downloadId,
  email,
  signedUrl,
}: DeliverDownloadParams): Promise<DeliverDownloadResult> {
  const supabase = createServiceClient();

  const { data: download, error: downloadError } = await supabase
    .from('downloads')
    .select('title')
    .eq('id', downloadId)
    .single();

  if (downloadError || !download) {
    return { success: false, error: 'Download not found' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const html = buildDeliveryEmailHtml(download.title as string, signedUrl);

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Your download from Ethiopian Orthodox Heritage is ready',
      html,
    });
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Email send failed' };
  }

  const { error: updateError } = await supabase
    .from('download_purchases')
    .update({ delivered_at: new Date().toISOString(), pending_delivery_url: null })
    .eq('delivery_email', email)
    .eq('download_id', downloadId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}
