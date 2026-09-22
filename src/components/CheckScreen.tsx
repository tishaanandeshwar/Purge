import React, { useEffect, useState } from 'react';
import { InputCategory } from '../types';
import { QrScannerSection } from './QrScannerSection';

interface CheckScreenProps {
  category: InputCategory;
  onBack: () => void;
  onAnalyze: (text: string, category: InputCategory, imageBase64?: string) => Promise<void>;
  isAnalyzing: boolean;
}

export const CheckScreen: React.FC<CheckScreenProps> = ({
  category,
  onBack,
  onAnalyze,
  isAnalyzing,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  // Category-specific configurations
  const categoryConfig: Record<
    InputCategory,
    {
      title: string;
      sub: string;
      defaultText: string;
      placeholder: string;
      examples: Array<{ label: string; text: string }>;
    }
  > = {
    message: {
      title: 'Check Message',
      sub: 'Paste the suspicious message below and our AI will analyze it instantly.',
      defaultText:
        'Congratulations! You have been selected for a work-from-home job. Pay ₹2,999 registration fee today to receive your offer letter.',
      placeholder: 'Paste SMS, WhatsApp text, Telegram message, or email here...',
      examples: [
        {
          label: 'Job offer scam',
          text: 'URGENT: You are selected for a work-from-home job with ₹45,000/month salary. Pay ₹2,999 registration fee today to receive your offer letter.',
        },
        {
          label: 'Trading message',
          text: 'Guaranteed 300% returns! Our expert trading group will double your money in 7 days. Deposit now — slots are limited.',
        },
        {
          label: 'Prize scam',
          text: 'CONGRATULATIONS! You won ₹5,00,000 in a lucky draw. Pay ₹1,500 processing fee to claim your prize now!',
        },
        {
          label: 'Loan fraud',
          text: 'Instant loan approved! Get ₹2,00,000 at 0% interest. Just pay ₹999 advance documentation fee to receive the amount today.',
        },
        {
          label: 'Electricity bill scam',
          text: 'Dear Customer, your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately contact Electricity Officer at 9876543210.',
        },
        {
          label: 'Bank KYC alert',
          text: 'SBI ALERT: Your account has been blocked due to pending PAN/KYC update. Click http://sbi-kyc-verify-portal.xyz to restore immediately.',
        },
        {
          label: 'Safe message',
          text: 'Hey Tisha, are we still meeting for lunch at 1:00 PM tomorrow? Let me know!',
        },
      ],
    },
    link: {
      title: 'Analyze Link',
      sub: 'Paste the suspicious URL or website link to inspect domain safety and phishing flags.',
      defaultText: 'https://secure-sbi-card-kyc-update.xyz/login.php',
      placeholder: 'Paste website URL e.g. https://domain.com...',
      examples: [
        {
          label: 'Phishing bank login',
          text: 'https://secure-sbi-card-kyc-update.xyz/login.php',
        },
        {
          label: 'Fake Amazon deal',
          text: 'https://amaz0n-mega-discount-spin-win.top/claim-iphone',
        },
        {
          label: 'PayPal typosquatting',
          text: 'http://paypa1-security-verification.click/account/restore',
        },
        {
          label: 'Shortened suspicious link',
          text: 'https://bit.ly/claim-crypto-airdrop-2026',
        },
        {
          label: 'Safe Google link',
          text: 'https://www.google.com',
        },
      ],
    },
    qr: {
      title: 'Scan QR Code',
      sub: 'Scan with your camera, upload a QR image/screenshot, or test sample payloads.',
      defaultText:
        'upi://pay?pa=refund_desk9281@okaxis&pn=Electricity_Refund_Office&am=4999&cu=INR&tn=RefundProcessing',
      placeholder: 'Point camera at QR or upload an image above...',
      examples: [
        {
          label: 'UPI "Refund" scam QR',
          text: 'upi://pay?pa=refund_desk9281@okaxis&pn=Electricity_Refund_Office&am=4999&cu=INR&tn=RefundProcessing',
        },
        {
          label: 'Phishing portal QR',
          text: 'https://secure-hdfc-kyc-update.xyz/login/verify-pan.php',
        },
        {
          label: 'Crypto VIP group QR',
          text: 'https://vip-signals-crypto-double.top/register?ref=guaranteed300pct',
        },
        {
          label: 'Safe website QR',
          text: 'https://www.google.com',
        },
        {
          label: 'Safe WiFi pairing QR',
          text: 'WIFI:T:WPA;S:Office_Guest_WiFi;P:SafePass2026;;',
        },
      ],
    },
    job: {
      title: 'Check Job Offer',
      sub: 'Paste employment messages, recruitment letters, or task-based job offers.',
      defaultText:
        'URGENT: Selected for Part-time Work From Home. Earn ₹3,000 daily by simply rating YouTube videos. Pay ₹1,500 security deposit to begin tasks.',
      placeholder: 'Paste job description, recruitment WhatsApp text, or email...',
      examples: [
        {
          label: 'Upfront fee scam',
          text: 'URGENT: You are selected for a work-from-home job with ₹45,000/month salary. Pay ₹2,999 registration fee today to receive your offer letter.',
        },
        {
          label: 'YouTube rating task',
          text: 'Part-time job: Earn ₹2,000 - ₹5,000 daily by liking YouTube videos and subscribing to channels. Contact Telegram manager @hr_recruiter_task.',
        },
        {
          label: 'Real corporate job posting',
          text: 'Senior Frontend Engineer at TechCorp. Requirements: 4+ years experience with React, TypeScript. Apply via our official careers page at techcorp.com/careers.',
        },
      ],
    },
    trading: {
      title: 'Check Trading Message',
      sub: 'Inspect crypto signals, guaranteed profit promises, or forex trading groups.',
      defaultText:
        'Guaranteed 300% returns in 7 days! Join our VIP crypto signals channel. 100% accuracy, zero loss risk. Minimum deposit ₹10,000.',
      placeholder: 'Paste trading group invitation, profit claim, or investment pitch...',
      examples: [
        {
          label: 'Guaranteed 300% return',
          text: 'Guaranteed 300% returns in 7 days! Join our VIP crypto signals channel. 100% accuracy, zero loss risk. Minimum deposit ₹10,000.',
        },
        {
          label: 'Forex doubling bot',
          text: 'Our AI Automated Forex Trading Bot generates 15% daily compound interest. Deposit to private wallet to activate immediate passive income.',
        },
        {
          label: 'Regulated market commentary',
          text: 'Nifty 50 closed 0.4% higher today. Mutual funds and equity investments are subject to market risks. Please read all scheme documents carefully.',
        },
      ],
    },
    image: {
      title: 'Scan Screenshot / Image',
      sub: 'Upload a screenshot of a suspicious message, fake payment receipt, or letter.',
      defaultText: 'Screenshot of message: "Congratulations you have won ₹5,00,000. Pay ₹2,500 delivery tax."',
      placeholder: 'Upload screenshot or describe image content...',
      examples: [
        {
          label: 'Fake payment receipt',
          text: 'Screenshot showing fake UPI payment successful screenshot of ₹15,000 with fake transaction ID.',
        },
        {
          label: 'Lottery award certificate',
          text: 'Certificate claiming ₹25 Lakhs won in Kaun Banega Crorepati with fake Reserve Bank of India stamp.',
        },
        {
          label: 'Police extortion notice',
          text: 'Fake cyber crime notice alleging illegal activity and demanding immediate penalty settlement.',
        },
      ],
    },
  };

  const currentConfig = categoryConfig[category];

  // Set default text when category changes
  useEffect(() => {
    setInputText(currentConfig.defaultText);
    setUploadedImageBase64(null);
  }, [category]);

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setUploadedImageBase64(base64);
        setInputText(`[Screenshot uploaded: ${file.name}]`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const textToAnalyze = inputText.trim() || currentConfig.defaultText;
    onAnalyze(textToAnalyze, category, uploadedImageBase64 || undefined);
  };

  return (
    <section className="page active" id="page-check">
      <button className="backbtn" id="check-back-btn" onClick={onBack}>
        ← Back
      </button>
      <div style={{ height: '18px' }} />

      <p className="h1">{currentConfig.title}</p>
      <p className="sub" style={{ margin: '4px 0 18px' }}>
        {currentConfig.sub}
      </p>

      {/* Render QR Scanner if QR category */}
      {category === 'qr' ? (
        <div style={{ marginBottom: '18px' }}>
          <QrScannerSection
            initialValue={inputText}
            onQrDetected={(detected) => {
              setInputText(detected);
            }}
          />
        </div>
      ) : category === 'image' ? (
        <div style={{ marginBottom: '18px' }}>
          <div
            className="qr-upload-zone"
            onClick={() => document.getElementById('screenshot-file-input')?.click()}
          >
            <input
              type="file"
              id="screenshot-file-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageSelected}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-d)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
            <div>
              <b style={{ fontSize: '14.5px' }}>Click to upload screenshot or image</b>
              <p className="sub" style={{ marginTop: '2px', fontSize: '12.5px' }}>
                Upload chats, receipts, SMS screenshots, or award letters
              </p>
            </div>
          </div>

          {uploadedImageBase64 && (
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                borderRadius: '14px',
                background: '#fff',
                border: '1px solid var(--line)',
              }}
            >
              <img
                src={uploadedImageBase64}
                alt="Screenshot Preview"
                style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Image Ready for AI Analysis</div>
                <div style={{ fontSize: '12px', color: 'var(--ink2)' }}>Our vision AI will inspect text, logos & payment prompts</div>
              </div>
            </div>
          )}

          <div style={{ height: '14px' }} />
          <div className="input-card">
            <textarea
              id="msgInput"
              maxLength={1000}
              placeholder="Add optional notes or OCR text about this image..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="counter" id="counter">
              {inputText.length}/1000
            </div>
          </div>
        </div>
      ) : (
        /* Regular Input Card */
        <div className="input-card" id="check-input-card">
          <textarea
            id="msgInput"
            maxLength={1000}
            placeholder={currentConfig.placeholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="counter" id="counter">
            {inputText.length}/1000
          </div>
        </div>
      )}

      <div style={{ height: '16px' }} />

      <button
        className="btn block"
        id="analyzeBtn"
        disabled={isAnalyzing || (!inputText.trim() && !uploadedImageBase64)}
        onClick={handleSubmit}
      >
        {isAnalyzing ? (
          <span className="analyzing">
            <span className="spin" />
            Analyzing with AI…
          </span>
        ) : (
          <>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" />
            </svg>
            {category === 'qr' ? 'Analyze Scanned QR' : 'Analyze'}
          </>
        )}
      </button>

      <div className="sec">Quick examples</div>
      <div className="chips" id="quick-examples-chips">
        {currentConfig.examples.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            className="chip"
            id={`chip-example-${idx}`}
            onClick={() => setInputText(ex.text)}
          >
            {ex.label}
          </button>
        ))}
      </div>
    </section>
  );
};
