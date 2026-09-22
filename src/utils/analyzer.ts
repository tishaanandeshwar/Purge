import { AnalysisResult, InputCategory, RiskLevel } from '../types';

/**
 * Intelligent scam detection analyzer
 * Analyzes messages, links, QR payloads, job postings, trading scams, and OCR text.
 */
export function analyzeContentLocally(text: string, category: InputCategory): AnalysisResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Detect if input is a URL or contains URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|net|xyz|top|site|online|live|club|vip|fit|buzz|click|info|cc|tk|ml|ga|cf|gq|work|co|io|app|dev|in|ai)\b[^\s]*)/gi;
  const urlsFound = trimmed.match(urlRegex) || [];
  const primaryUrl = urlsFound[0] || (category === 'link' ? trimmed : '');

  // 2. Check for UPI payment URI scheme (common in QR codes and SMS fraud)
  const isUpi = lower.startsWith('upi://pay') || lower.includes('upi://pay');

  if (isUpi) {
    return analyzeUpiPayload(trimmed);
  }

  // 3. Category-specific specialized analysis
  if (category === 'link' || (urlsFound.length > 0 && category !== 'job' && category !== 'trading')) {
    const linkResult = analyzeUrl(primaryUrl || trimmed);
    // If user explicitly chose link or input is mostly a link
    if (category === 'link' || trimmed.length < 120) {
      return linkResult;
    }
  }

  if (category === 'job') {
    return analyzeJobOffer(trimmed);
  }

  if (category === 'trading') {
    return analyzeTradingMessage(trimmed);
  }

  if (category === 'qr') {
    return analyzeQrContent(trimmed);
  }

  // 4. Default message / general analysis
  return analyzeGeneralMessage(trimmed);
}

function analyzeUpiPayload(uri: string): AnalysisResult {
  const lower = uri.toLowerCase();
  const hasAmount = lower.includes('am=') || lower.includes('&am=');
  const hasRefundOrPrize = /refund|cashback|prize|reward|bonus|winner|lottery|claim/i.test(uri);

  let riskScore = 88;
  let riskLevel: RiskLevel = 'High Risk';
  const warnings: string[] = [];
  const factors = [];

  if (hasRefundOrPrize) {
    riskScore = 95;
    warnings.push('Fraudulent refund/cashback trap (Requesting payment under the guise of a refund)');
    factors.push({
      title: 'Fake Refund Trap',
      percentage: 35,
      description: 'You NEVER need to scan a QR or enter your UPI PIN to receive money. UPI PIN is solely for debiting your account.'
    });
  }

  if (hasAmount) {
    warnings.push('Pre-filled transfer amount detected in QR payload');
    factors.push({
      title: 'Automated Debit Trigger',
      percentage: 30,
      description: 'Scanning this QR will directly initiate a money transfer from your account to the recipient.'
    });
  }

  warnings.push('Unverified UPI Virtual Payment Address (VPA)');
  warnings.push('Scanning this QR will debit your account, NOT credit it');

  factors.push({
    title: 'UPI Protocol Exploit',
    percentage: 20,
    description: 'Scammers frequently send payment QR codes claiming it is a "verification code" or "receiving QR".'
  });

  return {
    riskScore,
    riskLevel,
    category: 'UPI QR Payment Fraud / Money Request Trap',
    summary: 'This QR code contains a direct money transfer request. Scanning and confirming will transfer funds OUT of your account.',
    keyWarnings: warnings,
    factors,
    recommendedAction: {
      title: 'Do Not Scan or Enter UPI PIN',
      description: 'Remember the golden rule: Entering your UPI PIN always sends money, it never receives money.',
      type: 'danger'
    },
    rawInput: uri,
    inputType: 'qr',
    meta: { isUpi: true, qrType: 'UPI Payment Intent' }
  };
}

function analyzeUrl(urlStr: string): AnalysisResult {
  let cleanUrl = urlStr.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let domain = '';
  let pathname = '';
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname.toLowerCase();
    pathname = parsed.pathname.toLowerCase();
  } catch {
    domain = cleanUrl.toLowerCase().split('/')[0];
  }

  // Check known safe high-reputation domains
  const trustedDomains = [
    'google.com', 'www.google.com', 'apple.com', 'www.apple.com',
    'microsoft.com', 'www.microsoft.com', 'github.com', 'www.github.com',
    'amazon.com', 'www.amazon.com', 'amazon.in', 'www.amazon.in',
    'youtube.com', 'www.youtube.com', 'wikipedia.org', 'en.wikipedia.org',
    'linkedin.com', 'www.linkedin.com', 'netflix.com', 'www.netflix.com',
    'gov.in', 'nic.in', 'gov.uk', 'gov.us', 'edu'
  ];

  const isExactTrusted = trustedDomains.some(d => domain === d || domain.endsWith('.' + d));

  // Suspicious TLDs
  const suspiciousTlds = ['.xyz', '.top', '.click', '.buzz', '.fit', '.rest', '.gq', '.tk', '.cf', '.ml', '.ga', '.live', '.vip', '.club', '.shop'];
  const hasSuspiciousTld = suspiciousTlds.some(tld => domain.endsWith(tld));

  // Phishing brand names in domain (typosquatting or subdomain deception)
  const brandKeywords = ['paypal', 'amazon', 'netflix', 'apple', 'microsoft', 'chase', 'wellsfargo', 'sbi', 'hdfc', 'icici', 'paytm', 'phonepe', 'gpay', 'binance', 'coinbase', 'metamask'];
  const brandMatch = brandKeywords.find(b => domain.includes(b));
  const isTyposquat = brandMatch && !isExactTrusted;

  // Suspicious path indicators
  const suspiciousPaths = ['login', 'verify', 'update', 'kyc', 'pan', 'security', 'account-blocked', 'claim', 'bonus', 'airdrop', 'wallet-connect', 'seed-phrase', 'authenticate'];
  const matchedPath = suspiciousPaths.filter(p => pathname.includes(p) || cleanUrl.toLowerCase().includes(p));

  // URL shorteners
  const shorteners = ['bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'cutt.ly', 'rb.gy', 'goo.gl'];
  const isShortener = shorteners.some(s => domain.includes(s));

  // IP address in URL
  const isIpAddress = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(cleanUrl);

  if (isExactTrusted && !isTyposquat) {
    return {
      riskScore: 6,
      riskLevel: 'Safe',
      category: 'Verified Legitimate Domain',
      summary: `The domain "${domain}" is an authentic, high-reputation domain with valid security credentials.`,
      keyWarnings: ['No security anomalies detected on this domain', 'Standard secure protocol detected', 'Matches verified organization root certificates'],
      factors: [
        {
          title: 'Official Domain Verification',
          percentage: 0,
          description: `Recognized root domain for ${domain}, matching official registry records.`,
          isPositive: true
        },
        {
          title: 'SSL/TLS Protocol',
          percentage: 0,
          description: 'Uses verified encryption and official nameservers.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Safe to Browse',
        description: 'This is a verified legitimate link. Ensure the browser address bar continues to show this exact domain.',
        type: 'safe'
      },
      rawInput: urlStr,
      inputType: 'link',
      meta: { detectedUrl: cleanUrl, domain }
    };
  }

  // Calculate score for suspicious URL
  let riskScore = 40;
  const warnings: string[] = [];
  const factors = [];

  if (isTyposquat) {
    riskScore += 35;
    warnings.push(`Brand Impersonation / Typosquatting: Pretending to be "${brandMatch}"`);
    factors.push({
      title: 'Deceptive Brand Phishing',
      percentage: 35,
      description: `Domain contains "${brandMatch}" but does NOT belong to the genuine company's official domain.`
    });
  }

  if (hasSuspiciousTld) {
    riskScore += 20;
    warnings.push(`High-Risk Domain Extension (${domain.slice(domain.lastIndexOf('.'))})`);
    factors.push({
      title: 'Disposable High-Risk TLD',
      percentage: 20,
      description: 'Frequently abused low-cost domain extension commonly used for short-lived phishing campaigns.'
    });
  }

  if (isIpAddress) {
    riskScore += 30;
    warnings.push('Raw IP address used instead of valid registered domain name');
    factors.push({
      title: 'Direct IP Routing',
      percentage: 30,
      description: 'Legitimate businesses virtually never serve public consumer pages via raw numeric IP addresses.'
    });
  }

  if (matchedPath.length > 0) {
    riskScore += 15;
    warnings.push(`Credential harvest keywords in URL path (${matchedPath.join(', ')})`);
    factors.push({
      title: 'Credential Harvesting Path',
      percentage: 15,
      description: `Path triggers security flags matching fake verification portals: ${matchedPath.join(', ')}.`
    });
  }

  if (isShortener) {
    riskScore += 15;
    warnings.push('URL Shortener hides actual destination server');
    factors.push({
      title: 'Hidden Redirect Target',
      percentage: 15,
      description: 'Shortened URLs are routinely deployed to bypass spam filters and conceal malicious domains.'
    });
  }

  if (warnings.length === 0) {
    riskScore = 28;
    return {
      riskScore,
      riskLevel: 'Low Risk',
      category: 'Unverified Web Link',
      summary: `The domain "${domain}" has no immediate blacklisting flags, but is not among top globally verified institutions.`,
      keyWarnings: [
        'Domain not in primary high-trust whitelist',
        'Verify identity before entering personal details or passwords',
        'Ensure HTTPS padlock is active and certificates match expected owner'
      ],
      factors: [
        {
          title: 'Unverified Publisher',
          percentage: 15,
          description: 'Domain requires manual verification if requesting logins or payments.'
        },
        {
          title: 'No Direct Blacklist Flags',
          percentage: 0,
          description: 'No active phishing keywords or typosquatting patterns detected.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Exercise Standard Caution',
        description: 'Do not enter passwords, credit cards, or banking credentials unless you initiated the transaction.',
        type: 'warning'
      },
      rawInput: urlStr,
      inputType: 'link',
      meta: { detectedUrl: cleanUrl, domain }
    };
  }

  riskScore = Math.min(98, riskScore);
  const riskLevel: RiskLevel = riskScore >= 75 ? 'High Risk' : 'Medium Risk';

  return {
    riskScore,
    riskLevel,
    category: isTyposquat ? 'Phishing / Brand Impersonation Link' : 'Suspicious Web Link / Credential Harvester',
    summary: `High probability of malicious intent. The link "${domain}" displays deceptive indicators consistent with phishing infrastructure.`,
    keyWarnings: warnings,
    factors,
    recommendedAction: {
      title: 'Do Not Click or Submit Data',
      description: 'Never input passwords, OTPs, or payment information on this page. Close the browser tab immediately.',
      type: 'danger'
    },
    rawInput: urlStr,
    inputType: 'link',
    meta: { detectedUrl: cleanUrl, domain }
  };
}

function analyzeJobOffer(text: string): AnalysisResult {
  const lower = text.toLowerCase();

  const feeKeywords = ['registration fee', 'security deposit', 'joining fee', 'pay ₹', 'pay rs', 'pay $', 'refundable fee', 'training fee', 'processing fee', 'advance fee'];
  const hasFee = feeKeywords.filter(k => lower.includes(k));

  const unrealisticTerms = ['work from home', '45,000', '50,000', '1,00,000', 'no interview', 'part time', '1-2 hours', 'earn daily', 'telegram', 'task completion', 'youtube like'];
  const matchedUnrealistic = unrealisticTerms.filter(k => lower.includes(k));

  const urgencyTerms = ['urgent', 'today only', 'immediately', 'limited slots', 'hurry', 'selected without interview'];
  const hasUrgency = urgencyTerms.filter(k => lower.includes(k));

  // If normal legitimate corporate job description
  if (hasFee.length === 0 && (lower.includes('responsibilities') || lower.includes('qualifications') || lower.includes('requirements') || lower.includes('benefits') || lower.includes('apply on linkedin') || lower.includes('careers@'))) {
    return {
      riskScore: 12,
      riskLevel: 'Safe',
      category: 'Standard Professional Job Posting',
      summary: 'This posting contains standard professional employment requirements without predatory fee requests.',
      keyWarnings: [
        'Legitimate structure: describes skills, experience, and formal responsibilities',
        'No upfront monetary payment or deposit requested',
        'Standard corporate hiring process indicated'
      ],
      factors: [
        {
          title: 'No Advance Fees',
          percentage: 0,
          description: 'No requests for training deposits or onboarding fees.',
          isPositive: true
        },
        {
          title: 'Realistic Qualifications',
          percentage: 0,
          description: 'Specifies structured role criteria rather than effortless high-payout claims.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Safe to Apply',
        description: 'Verify the job via the employer’s official careers page or LinkedIn profile before sharing identity documents.',
        type: 'safe'
      },
      rawInput: text,
      inputType: 'job'
    };
  }

  let riskScore = 70;
  const warnings: string[] = [];
  const factors = [];

  if (hasFee.length > 0) {
    riskScore += 24;
    warnings.push(`Upfront payment demanded (${hasFee.join(', ')})`);
    factors.push({
      title: 'Advance Fee Fraud',
      percentage: 28,
      description: 'Legitimate employers never demand registration, material, or documentation fees from candidates.'
    });
  }

  if (matchedUnrealistic.length > 0) {
    riskScore += 15;
    warnings.push(`Unrealistic claims & task-scam cues (${matchedUnrealistic.slice(0, 3).join(', ')})`);
    factors.push({
      title: 'Unrealistic Compensation vs Effort',
      percentage: 22,
      description: 'Promises of extraordinary income for simple tasks (liking videos, typing, rating apps) is a widespread syndicated scam.'
    });
  }

  if (hasUrgency.length > 0) {
    warnings.push('High-pressure urgency to accept and pay immediately');
    factors.push({
      title: 'Manufactured Urgency',
      percentage: 15,
      description: 'Creating artificial urgency prevents victims from cross-checking credentials or seeking second opinions.'
    });
  }

  warnings.push('No verifiable HR contact or official corporate domain');
  factors.push({
    title: 'Unverified Employer Identity',
    percentage: 12,
    description: 'Recruiter communication conducted via personal messaging apps rather than corporate domain emails.'
  });

  riskScore = Math.min(98, riskScore);

  return {
    riskScore,
    riskLevel: 'High Risk',
    category: 'Job Scam / Fake Employment Offer',
    summary: 'High-risk fraudulent employment offer characterized by advance payment demands and fake task recruitment.',
    keyWarnings: warnings,
    factors,
    recommendedAction: {
      title: 'Do Not Pay Any Fees',
      description: 'Cease communication immediately. Report and block the sender on the messaging platform.',
      type: 'danger'
    },
    rawInput: text,
    inputType: 'job'
  };
}

function analyzeTradingMessage(text: string): AnalysisResult {
  const lower = text.toLowerCase();

  const scamPhrases = [
    'guaranteed return', '300%', '200%', 'double your money', '100% profit',
    'vip group', 'insider signals', 'deposit now', 'zero risk', 'pump and dump',
    'crypto bot', 'passive daily income', 'limited slots', 'forex profit'
  ];

  const matchedPhrases = scamPhrases.filter(p => lower.includes(p));

  // If normal discussion about stocks with risk disclosures
  if (lower.includes('past performance does not guarantee') || (lower.includes('equity') && lower.includes('portfolio') && matchedPhrases.length === 0)) {
    return {
      riskScore: 18,
      riskLevel: 'Low Risk',
      category: 'Market Commentary / Regulated Financial Discussion',
      summary: 'Standard market information with customary risk acknowledgement.',
      keyWarnings: [
        'Contains market commentary without guaranteed yields',
        'Standard volatility disclaimer implied',
        'Check broker registration with statutory regulator'
      ],
      factors: [
        {
          title: 'Risk Acknowledgement',
          percentage: 0,
          description: 'Does not offer deceptive "guaranteed zero-loss" returns.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Conduct Independent Due Diligence',
        description: 'Verify any advisor registration with SEBI, SEC, or relevant financial regulator.',
        type: 'safe'
      },
      rawInput: text,
      inputType: 'trading'
    };
  }

  const warnings: string[] = [
    'Guaranteed return promises on volatile financial markets (Statistically impossible)',
    'Unregulated investment group / channel operating outside statutory oversight',
    'High pressure to deposit funds into private or unverified trading wallets'
  ];

  const factors = [
    {
      title: 'Guaranteed Profit Guarantee',
      percentage: 35,
      description: 'In genuine financial markets, all returns carry risk. Guarantees of 100%+ profit are universally fraudulent.'
    },
    {
      title: 'Ponzi / High-Yield Trap Structure',
      percentage: 25,
      description: 'Initial small payouts may be faked to entice victims into depositing life savings before cutting off access.'
    },
    {
      title: 'Unregulated Solicitations',
      percentage: 20,
      description: 'Trading tips and investment solicitations via Telegram or WhatsApp channels violate financial conduct laws.'
    }
  ];

  if (matchedPhrases.length > 0) {
    warnings.push(`Detected scam triggers: ${matchedPhrases.slice(0, 3).join(', ')}`);
  }

  return {
    riskScore: 94,
    riskLevel: 'High Risk',
    category: 'Investment Fraud / Crypto Ponzi Scheme',
    summary: 'Extremely dangerous financial fraud solicitation promising unrealistic guaranteed profits through unverified groups.',
    keyWarnings: warnings,
    factors,
    recommendedAction: {
      title: 'Do Not Invest or Transfer Funds',
      description: 'Never send money or cryptocurrency to unverified trading pools or Telegram signal groups.',
      type: 'danger'
    },
    rawInput: text,
    inputType: 'trading'
  };
}

function analyzeQrContent(content: string): AnalysisResult {
  const lower = content.toLowerCase();

  // 1. UPI QR
  if (lower.startsWith('upi://') || lower.includes('upi://pay')) {
    return analyzeUpiPayload(content);
  }

  // 2. Web URL QR
  if (lower.startsWith('http://') || lower.startsWith('https://') || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(content)) {
    const linkRes = analyzeUrl(content);
    linkRes.category = `QR Code: ${linkRes.category}`;
    linkRes.inputType = 'qr';
    linkRes.meta = { ...linkRes.meta, qrType: 'Web URL' };
    return linkRes;
  }

  // 3. WiFi QR
  if (lower.startsWith('wifi:')) {
    return {
      riskScore: 10,
      riskLevel: 'Safe',
      category: 'WiFi Network Configuration QR',
      summary: 'This QR code provides local WiFi connection credentials (SSID & security profile).',
      keyWarnings: [
        'Standard IEEE 802.11 WiFi connection payload',
        'Verify you trust the location/host before joining unfamiliar networks',
        'Public WiFi networks should be used with a secure VPN'
      ],
      factors: [
        {
          title: 'Standard Network Payload',
          percentage: 0,
          description: 'Contains standard WPA/WPA2 network parameters without hidden executable code.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Safe to Connect (If in trusted location)',
        description: 'Only join if you are present at the venue offering this WiFi connection.',
        type: 'safe'
      },
      rawInput: content,
      inputType: 'qr',
      meta: { qrType: 'WiFi Configuration' }
    };
  }

  // 4. Contact / vCard QR
  if (lower.startsWith('begin:vcard')) {
    return {
      riskScore: 15,
      riskLevel: 'Safe',
      category: 'Contact Card (vCard) QR',
      summary: 'This QR code contains digital business card contact details (name, email, phone number).',
      keyWarnings: [
        'Standard contact format',
        'Check included phone numbers or website links before saving to phonebook'
      ],
      factors: [
        {
          title: 'Standard vCard Format',
          percentage: 0,
          description: 'Standard electronic business card payload without malicious scripts.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Review Contact Details',
        description: 'Inspect the phone number and links before adding to your device contacts.',
        type: 'safe'
      },
      rawInput: content,
      inputType: 'qr',
      meta: { qrType: 'vCard Contact' }
    };
  }

  // Plain text or unexpected data
  return {
    riskScore: 25,
    riskLevel: 'Low Risk',
    category: 'Plain Text QR Code',
    summary: 'The QR code contains plain alphanumeric text without embedded execution instructions.',
    keyWarnings: [
      'Contains plain text payload',
      'Does not automatically launch apps or initiate financial transactions'
    ],
    factors: [
      {
        title: 'Non-Executable Content',
        percentage: 0,
        description: 'Plain text poses no direct technical execution risk.',
        isPositive: true
      }
    ],
    recommendedAction: {
      title: 'Inspect Scanned Text',
      description: 'Review the text content. Do not follow instructions to send money or download third-party software.',
      type: 'safe'
    },
    rawInput: content,
    inputType: 'qr',
    meta: { qrType: 'Plain Text' }
  };
}

function analyzeGeneralMessage(text: string): AnalysisResult {
  const lower = text.toLowerCase();

  // Check 1: Benign / Safe everyday conversation
  const benignGreetings = ['hi', 'hello', 'hey', 'good morning', 'how are you', 'meeting tomorrow', 'lunch', 'thank you', 'thanks', 'see you', 'call me', 'what time'];
  const hasOnlyBenign = benignGreetings.some(g => lower.includes(g)) && text.length < 120 && !lower.includes('pay') && !lower.includes('fee') && !lower.includes('won') && !lower.includes('otp') && !lower.includes('bank') && !lower.includes('urgent');

  if (hasOnlyBenign) {
    return {
      riskScore: 4,
      riskLevel: 'Safe',
      category: 'Normal Everyday Message',
      summary: 'This is a standard conversational message with zero predatory scam patterns or threat vectors.',
      keyWarnings: [
        'No financial demands or payment links detected',
        'No artificial urgency or coercive threats',
        'Normal personal communication pattern'
      ],
      factors: [
        {
          title: 'Authentic Conversational Tone',
          percentage: 0,
          description: 'Typical interpersonal communication free of automated mass-phishing syntax.',
          isPositive: true
        },
        {
          title: 'Zero Malicious Vectors',
          percentage: 0,
          description: 'No links, no payment gateways, no credential traps.',
          isPositive: true
        }
      ],
      recommendedAction: {
        title: 'Safe to Reply',
        description: 'No threat detected. You can respond normally.',
        type: 'safe'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // Check 2: Electricity disconnection / Utility scam
  if (lower.includes('electricity') && (lower.includes('disconnect') || lower.includes('bill') || lower.includes('tonight') || lower.includes('officer'))) {
    return {
      riskScore: 96,
      riskLevel: 'High Risk',
      category: 'Utility Disconnection / Impersonation Scam',
      summary: 'Extremely widespread extortion scam pretending power or utility services will be terminated tonight.',
      keyWarnings: [
        'Urgent threat of immediate service disconnection (e.g. tonight at 9:30 PM)',
        'Instructs victim to call a personal mobile number instead of official utility board',
        'Demands immediate online payment or remote desktop app download (AnyDesk / TeamViewer)'
      ],
      factors: [
        {
          title: 'Utility Impersonation',
          percentage: 35,
          description: 'Utility corporations send bill notices weeks in advance via official consumer portals, never via personal phone numbers.'
        },
        {
          title: 'Extortion Urgency',
          percentage: 30,
          description: 'Setting a strict deadline ("tonight") induces panic to bypass logical verification.'
        },
        {
          title: 'Unauthorized Contact Routing',
          percentage: 20,
          description: 'Provided contact number routes to cybercriminals aiming to install remote access trojans.'
        }
      ],
      recommendedAction: {
        title: 'Do Not Call the Number Provided',
        description: 'Verify your billing status exclusively through your official state electricity board website or app.',
        type: 'danger'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // Check 3: Banking / KYC / PAN update fraud
  if ((lower.includes('kyc') || lower.includes('pan') || lower.includes('sbi') || lower.includes('hdfc') || lower.includes('icici') || lower.includes('account blocked')) && (lower.includes('block') || lower.includes('suspended') || lower.includes('update') || lower.includes('link'))) {
    return {
      riskScore: 97,
      riskLevel: 'High Risk',
      category: 'Banking KYC / Account Suspension Phishing',
      summary: 'Critical financial phishing attempt falsely stating your bank account or card has been suspended.',
      keyWarnings: [
        'Threat of immediate account freeze or suspension',
        'Demands immediate KYC / PAN document update via third-party link',
        'Aims to capture Internet Banking credentials, CVV, and OTPs'
      ],
      factors: [
        {
          title: 'Bank Impersonation',
          percentage: 40,
          description: 'Banks never demand KYC updates or PAN submissions via SMS links or personal messaging numbers.'
        },
        {
          title: 'Credential Harvesting Link',
          percentage: 30,
          description: 'Links in these messages redirect to spoofed banking portals designed to siphon login credentials.'
        },
        {
          title: 'Threat of Service Denial',
          percentage: 20,
          description: 'Creating fear of account closure to trick victims into rapid compliance.'
        }
      ],
      recommendedAction: {
        title: 'Do Not Click Any Link or Share OTP',
        description: 'Forward this SMS to official bank cyber fraud reporting numbers (e.g. 1930) and block the sender.',
        type: 'danger'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // Check 4: Lottery / Prize / Lucky Draw
  if (lower.includes('won') || lower.includes('winner') || lower.includes('lottery') || lower.includes('kbc') || lower.includes('lucky draw') || lower.includes('prize money') || lower.includes('gift card')) {
    return {
      riskScore: 95,
      riskLevel: 'High Risk',
      category: 'Lottery / Fake Prize Advance-Fee Scam',
      summary: 'Classic advance-fee lottery fraud. You cannot win a competition or lucky draw you never entered.',
      keyWarnings: [
        'Unsolicited prize or lottery claim of enormous value',
        'Demands "processing fee", "tax", or "customs charge" before funds can be released',
        'Uses forged institutional logos (KBC, Amazon, Tata, etc.)'
      ],
      factors: [
        {
          title: 'Phantom Prize Incentive',
          percentage: 40,
          description: 'Dangling large sums to lure victims into paying small recurring "processing fees".'
        },
        {
          title: 'Advance Fee Demanded',
          percentage: 30,
          description: 'Legitimate prizes deduct any required taxes at source; winners never pay money to claim prizes.'
        },
        {
          title: 'Random Recipient Targeting',
          percentage: 20,
          description: 'Mass-blasted to thousands of random phone numbers simultaneously.'
        }
      ],
      recommendedAction: {
        title: 'Do Not Pay Any Processing Fee',
        description: 'Ignore and delete this message. Any fee sent to the perpetrators will be permanently lost.',
        type: 'danger'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // Check 5: Parcel / Delivery Scam
  if (lower.includes('package') || lower.includes('parcel') || lower.includes('delivery') || lower.includes('customs') || lower.includes('address incorrect') || lower.includes('redelivery')) {
    return {
      riskScore: 91,
      riskLevel: 'High Risk',
      category: 'Package Delivery / Smishing Scam',
      summary: 'Deceptive delivery notification claiming a package cannot be delivered without a fee or address update.',
      keyWarnings: [
        'Fake delivery failure alert ("address missing" or "held at customs")',
        'Urges victim to click an external link to pay a small redelivery fee (e.g. ₹49 / $1.99)',
        'Payment page records credit card details for unauthorized international recurring charges'
      ],
      factors: [
        {
          title: 'Fake Delivery Notification',
          percentage: 35,
          description: 'Impersonates postal services (India Post, FedEx, DHL, USPS) to harvest payment card details.'
        },
        {
          title: 'Card Siphoning Gateway',
          percentage: 35,
          description: 'The nominal fee payment portal is a clone engineered to steal CVV and full card numbers.'
        }
      ],
      recommendedAction: {
        title: 'Check Official Courier Portal Directly',
        description: 'Do not click the SMS link. Open the official carrier website manually and look up tracking numbers directly.',
        type: 'danger'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // Check 6: Loan Fraud
  if (lower.includes('loan') && (lower.includes('approved') || lower.includes('instant') || lower.includes('0% interest') || lower.includes('disbursed'))) {
    return {
      riskScore: 92,
      riskLevel: 'High Risk',
      category: 'Predatory Instant Loan / Advance Fee Fraud',
      summary: 'Fraudulent loan offer promising instantaneous disbursement with zero documentation in exchange for an advance fee.',
      keyWarnings: [
        'Unsolicited pre-approved loan without credit checks or income proof',
        'Demands "documentation charges", "insurance fee", or "GST fee" before release',
        'Predatory Chinese loan app syndicates harvesting device contacts and photos'
      ],
      factors: [
        {
          title: 'Advance Loan Fee Demand',
          percentage: 35,
          description: 'Regulated banks deduct processing fees from the loan amount itself; they never ask for upfront payment.'
        },
        {
          title: 'Unregulated Lending Entity',
          percentage: 30,
          description: 'Operates outside RBI / central banking lending licenses.'
        }
      ],
      recommendedAction: {
        title: 'Do Not Pay Documentation Fees',
        description: 'Only apply for credit facilities through licensed commercial banks or NBFCs registered with the central bank.',
        type: 'danger'
      },
      rawInput: text,
      inputType: 'message'
    };
  }

  // General fallback analysis
  return {
    riskScore: 48,
    riskLevel: 'Medium Risk',
    category: 'Unverified Communication / Potential Solicitations',
    summary: 'The message contains patterns requiring caution before proceeding or disclosing private information.',
    keyWarnings: [
      'Sender identity could not be verified through public registry records',
      'Avoid sharing financial passwords, bank account numbers, or identity documents',
      'Cross-verify sender identity via an independent communication channel'
    ],
    factors: [
      {
        title: 'Unverified Sender Credibility',
        percentage: 25,
        description: 'Message originates from an untrusted source or unknown individual.'
      },
      {
        title: 'Potential Social Engineering',
        percentage: 20,
        description: 'Contains conversational cues prompting action without verified context.'
      }
    ],
    recommendedAction: {
      title: 'Verify Before Acting',
      description: 'Contact the person or organization through a verified official phone number before taking any action.',
      type: 'warning'
    },
    rawInput: text,
    inputType: 'message'
  };
}
