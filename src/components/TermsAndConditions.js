import React from 'react';

const TermsAndConditions = () => {
    return (
        <div style={{ fontFamily: 'Inter, Arial, sans-serif', color: '#d4d4d8', fontSize: '14px', lineHeight: '1.7' }}>
            <h1 style={{ fontSize: '18px', color: '#fafafa', fontWeight: 'bold', marginBottom: '24px' }}>
                ADMINISTRATIVE PORTAL TERMS OF SERVICE AND CONFIDENTIALITY AGREEMENT
            </h1>

            <p style={{ marginBottom: '16px' }}>
                This Administrative Portal Terms of Service and Confidentiality Agreement (the "Agreement") is a legally binding contract entered into by and between <strong>UrbanShield</strong> ("Company," "we," "us," or "our") and you, the authorized System Administrator ("Administrator," "you," or "your").
            </p>
            <p style={{ marginBottom: '16px' }}>
                By accessing, authenticating, or utilizing the UrbanShield Administrative Portal (the "Portal"), you explicitly acknowledge that you have read, understood, and agreed to be bound by the terms and conditions set forth herein.
                <strong style={{ color: '#dc2626' }}> IF YOU DO NOT CATEGORICALLY AGREE TO THESE TERMS in their entirety, YOU ARE STRICTLY PROHIBITED FROM ACCESSING OR USING THE PORTAL AND MUST IMMEDIATELY DISCONTINUE ANY ATTEMPTED USE.</strong>
            </p>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 1: CONFIDENTIALITY AND DATA PRIVACY
            </h2>
            <p style={{ marginBottom: '12px' }}>
                <strong>1.1. Scope of Confidential Information.</strong> During your tenure as an Administrator, you will be granted privileged access to highly sensitive proprietary data, including but not limited to: Personally Identifiable Information (PII) of constituents, precise geolocation records, real-time emergency incident reports, proprietary system architecture, and internal communication logs (collectively, "Confidential Information").
            </p>
            <p style={{ marginBottom: '12px' }}>
                <strong>1.2. Non-Disclosure Obligations.</strong> You rigidly agree to maintain the absolute confidentiality of all Confidential Information. You shall not disclose, disseminate, reproduce, or transmit such data to any unauthorized third party, internal unauthorized personnel, or the general public via any medium (electronic, verbal, or physical).
            </p>
            <p style={{ marginBottom: '16px' }}>
                <strong>1.3. Acceptable Processing.</strong> Processing, viewing, or analyzing Confidential Information is strictly localized and permitted solely for the explicit purpose of managing public safety incidents, coordinating emergency responses, and moderating community affairs within the specified jurisdiction.
            </p>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 2: PROHIBITED CONDUCT AND RESTRICTIONS
            </h2>
            <p style={{ marginBottom: '12px' }}>
                As a condition of your access to the Portal, you categorically agree not to engage in any of the following unauthorized activities:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px', listStyleType: 'disc' }}>
                <li style={{ marginBottom: '6px' }}><strong>Data Exfiltration:</strong> Systematically extracting, scraping, or archiving data from the Portal to compile external databases without express written authorization.</li>
                <li style={{ marginBottom: '6px' }}><strong>Credential Compromise:</strong> Sharing, transferring, or delegating your assigned authentication credentials (e.g., username, password, biometrics) to any other individual or entity.</li>
                <li style={{ marginBottom: '6px' }}><strong>System Sabotage:</strong> Attempting to circumvent, disable, or exploit security vulnerabilities within the Portal's infrastructure.</li>
                <li style={{ marginBottom: '6px' }}><strong>Data Manipulation:</strong> Falsifying, unethically deleting, or corrupting valid emergency incident reports, announcements, or forensic audit logs.</li>
                <li style={{ marginBottom: '6px' }}><strong>Abuse of Power:</strong> Utilizing constituent data obtained through the Portal for personal gain, harassment, stalking, political targeting, or any unsanctioned surveillance.</li>
            </ul>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 3: AUDITING AND ACCOUNTABILITY
            </h2>
            <p style={{ marginBottom: '16px' }}>
                You expressly acknowledge and consent that <strong>all</strong> interactions, data queries, modifications, and access times within the Portal are comprehensively recorded in immutable audit logs. The Company reserves the right to review these forensic logs at any time to ensure compliance with this Agreement and applicable laws. You bear sole personal and legal responsibility for any actions executed under your assigned administrative account.
            </p>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 4: TERMINATION AND REVOCATION OF ACCESS
            </h2>
            <p style={{ marginBottom: '16px' }}>
                The Company reserves the unilateral right to suspend, demote, or permanently revoke your administrative access privileges instantly and without prior notice if we, at our sole discretion, suspect or determine a violation of this Agreement, unauthorized access patterns, or malicious conduct. Upon termination of access, your obligations concerning Confidentiality (Article 1) shall survive in perpetuity.
            </p>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 5: GOVERNING LAW AND LIABILITY
            </h2>
            <p style={{ marginBottom: '16px' }}>
                This Agreement shall be construed and governed in accordance with encompassing local and national laws regarding Data Privacy and Cybersecurity. By accepting these terms, you understand that willful negligence or intentional data breaches may result in internal disciplinary action, immediate termination, and civil or criminal legal prosecution to the fullest extent of the law.
            </p>

            <h2 style={{ fontSize: '15px', color: '#fafafa', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                ARTICLE 6: ACKNOWLEDGEMENT
            </h2>
            <p style={{ marginBottom: '16px' }}>
                By clicking "I Agree" or proceeding to create an administrative profile, you represent and warrant that you possess the legal authority to bind yourself to this Agreement, that you have thoroughly read and comprehended its provisions, and that you voluntarily accept the obligations and liabilities enclosed herein.
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '24px 0' }} />

            <p style={{ fontSize: '12px', color: '#a1a1aa', textAlign: 'center' }}>
                For inquiries, compliance concerns, or to report a suspected breach, please rapidly escalate the matter to the System Operations Directorate via <strong style={{ color: '#fafafa' }}>urbanshield.ad@gmail.com</strong>.
            </p>
        </div>
    );
};

export default TermsAndConditions;
