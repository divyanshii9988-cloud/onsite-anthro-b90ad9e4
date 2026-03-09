import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Medicine {
  name: string;
  dosage?: string;
  duration?: string;
  instructions?: string;
}

interface RequestBody {
  patientEmail: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  medicines: Medicine[];
  advice?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const body: RequestBody = await req.json();
    const { patientEmail, patientName, doctorName, diagnosis, medicines, advice } = body;

    // Generate HTML email content
    const medicinesHtml = medicines
      .map(
        (med) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${med.name}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${med.dosage || "-"}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${med.duration || "-"}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${med.instructions || "-"}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Medical Prescription</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${patientName},</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0; font-size: 18px;">Diagnosis</h2>
              <p style="margin: 0;">${diagnosis}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0; font-size: 18px;">Prescribed Medicines</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Medicine</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Dosage</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Duration</th>
                    <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${medicinesHtml}
                </tbody>
              </table>
            </div>
            
            ${
              advice
                ? `
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h2 style="color: #667eea; margin-top: 0; font-size: 18px;">Medical Advice</h2>
              <p style="margin: 0; white-space: pre-line;">${advice}</p>
            </div>
            `
                : ""
            }
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <p style="margin: 5px 0;"><strong>Prescribed by:</strong> Dr. ${doctorName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Important:</strong> Please follow the prescribed dosage and instructions carefully. Consult your doctor if you experience any side effects.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated prescription email. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Onsite Medical <onboarding@resend.dev>",
        to: [patientEmail],
        subject: `Medical Prescription - ${diagnosis}`,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await resendResponse.json();

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending prescription email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
