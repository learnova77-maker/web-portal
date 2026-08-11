import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ref, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { uid, reason, email, fullName, username } = body;

        if (!uid) {
            return NextResponse.json({ success: false, message: "Teacher UID is required" }, { status: 400 });
        }

        // 1. Send Decline Email via Resend on Node.js Server (Bypasses CORS restrictions)
        let emailSent = false;
        if (email) {
            try {
                const { data, error } = await resend.emails.send({
                    from: "Matloverse Support <info@matloverse.com>",
                    to: email,
                    subject: "Application Status Update - Matloverse Instructor Program ❌",
                    html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 0; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Matloverse</h1>
                            <p style="color: #fecaca; margin: 6px 0 0 0; font-size: 14px; font-weight: 600;">Instructor Application Update</p>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 32px 24px;">
                            <h2 style="color: #1e293b; font-size: 20px; margin-top: 0;">Hello ${fullName || "Applicant"},</h2>
                            <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                                Thank you for your interest in becoming an instructor on <strong>Matloverse</strong>. After reviewing your submitted details and verification documents, we regret to inform you that your instructor application has not been approved at this time.
                            </p>
                            
                            <!-- Reason Box -->
                            <div style="margin: 24px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                                <h3 style="color: #991b1b; margin: 0 0 8px 0; font-size: 15px; font-weight: 700;">📝 Reason for Decision:</h3>
                                <p style="color: #7f1d1d; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                                    ${reason || "Your verification documents did not meet our platform requirements."}
                                </p>
                            </div>

                            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                                If you believe this was an error or if you wish to re-apply with updated documents, please feel free to register again with valid information.
                            </p>

                            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
                                <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                                    Thank you for your time and understanding.
                                </p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Matloverse. All rights reserved.</p>
                        </div>
                    </div>
                    `
                });

                if (error) {
                    console.error("Resend API Email Error:", error);
                } else {
                    console.log("Resend Email Sent Successfully:", data?.id);
                    emailSent = true;
                }
            } catch (emailErr) {
                console.error("Failed sending email via Resend:", emailErr);
            }
        }

        // 2. Delete User Profile Node & Sessions from Realtime Database (Triggers immediate auto-logout on user device)
        if (rtdb && uid) {
            await set(ref(rtdb, `users/${uid}`), null);
            if (username) {
                await set(ref(rtdb, `usernames/${username.toLowerCase()}`), null);
            }
            await set(ref(rtdb, `approval_chats/${uid}`), null);
            await set(ref(rtdb, `support_chats/${uid}`), null);
        }

        return NextResponse.json({
            success: true,
            emailSent,
            message: "Teacher application declined and profile deleted successfully."
        });
    } catch (err: any) {
        console.error("Error in decline-teacher route:", err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
