import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { sendBetaInvitationEmail } from '../utils/email';
import { sendSMS } from '../services/sms.service';

/**
 * Script to send beta invitation emails and SMS
 * Usage (Single): npm run script:send-beta-invitation -- "Name" "email" "android|ios" "phone" [--sms-only]
 * Usage (Bulk):   npm run script:send-beta-invitation -- --file "beta-invitation.txt" [--sms-only]
 */
const sendInvitation = async () => {
    const args = process.argv.slice(2);
    const isSmsOnly = args.includes('--sms-only');
    const fileIndex = args.indexOf('--file');

    const formatGhanaPhone = (phone: string | undefined): string | undefined => {
        if (!phone) return undefined;
        let formatted = phone.trim().replace(/\+/g, '');
        if (formatted.startsWith('0')) {
            formatted = '233' + formatted.substring(1);
        }
        return formatted;
    };

    if (fileIndex !== -1) {
        const fileName = args[fileIndex + 1] || 'beta-invitation.txt';
        const absolutePath = path.isAbsolute(fileName) ? fileName : path.join(process.cwd(), fileName);

        if (!fs.existsSync(absolutePath)) {
            console.error(`❌ File not found: ${absolutePath}`);
            process.exit(1);
        }

        try {
            const content = fs.readFileSync(absolutePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim() !== '');

            console.log(`🚀 Starting bulk invitation from ${fileName} (${lines.length} entries)...`);
            if (isSmsOnly) console.log('📱 SMS-ONLY mode enabled. Skipping emails.');

            for (const line of lines) {
                const parts = line.split(/\t| {2,}/).map(p => p.trim());

                if (parts.length < 2) {
                    console.warn(`⚠️ Skipping invalid line: ${line.substring(0, 30)}...`);
                    continue;
                }

                const name = parts[0];
                const email = parts.find(p => p.includes('@'));
                const rawPhone = parts.find(p => /^[0-9+]{10,15}$/.test(p));
                const phone = formatGhanaPhone(rawPhone);
                const platformStr = parts.find(p => {
                    const l = p.toLowerCase();
                    return l.includes('android') || l.includes('ios');
                })?.toLowerCase() || 'android';
                const platform = platformStr.includes('ios') ? 'ios' : 'android';

                if (!email) {
                    console.warn(`⚠️ No email found in line: ${line}`);
                    continue;
                }

                if (!isSmsOnly) {
                    console.log(`- Sending Email to ${name} (${email}) for ${platform}...`);
                    await sendBetaInvitationEmail(email, name, platform);
                }

                if (phone) {
                    try {
                        console.log(`  - Sending SMS to ${phone}...`);
                        const smsMessage = `Hi ${name}, we've sent you a beta invitation to SewDigital! Please check your email (${email}) for instructions on how to join. - The SewDigital Team`;
                        await sendSMS([phone], smsMessage);
                        console.log(`  - SMS sent successfully to ${phone}`);
                    } catch (smsError: any) {
                        console.error(`  ❌ Failed to send SMS to ${phone}:`, smsError.message);
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('✅ Bulk process finished!');
        } catch (error: any) {
            console.error('❌ Failed during bulk processing:', error.message);
        } finally {
            process.exit(0);
        }
    } else {
        const name = args[0] || 'Beta Tester';
        const email = args[1];
        const platform = (args[2] || 'android').toLowerCase() as 'android' | 'ios';
        const phone = formatGhanaPhone(args[3]);

        if (!email) {
            console.error('❌ Usage (Single): npm run script:send-beta-invitation -- "Name" "email@example.com" "android|ios" "phone" [--sms-only]');
            console.error('❌ Usage (Bulk):   npm run script:send-beta-invitation -- --file "beta-invitation.txt" [--sms-only]');
            process.exit(1);
        }

        try {
            if (!isSmsOnly) {
                console.log(`🚀 Preparing to send ${platform} Email invitation to ${email}...`);
                await sendBetaInvitationEmail(email, name, platform);
            }

            if (phone) {
                console.log(`🚀 Sending SMS to ${phone}...`);
                const smsMessage = `Hi ${name}, we've sent you a beta invitation to SewDigital! Please check your email (${email}) for instructions on how to join. - The SewDigital Team`;
                await sendSMS([phone], smsMessage);
                console.log(`✅ SMS sent!`);
            }

            console.log('✅ Done!');
        } catch (error: any) {
            console.error('❌ Failed to send invitation:', error.message);
        } finally {
            process.exit(0);
        }
    }
};

sendInvitation();
