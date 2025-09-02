import React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Img,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  verificationCode: string;
  userEmail: string;
  appUrl: string;
}

export const ReauthenticationEmail = ({
  verificationCode,
  userEmail,
  appUrl,
}: ReauthenticationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your security verification code for OgaJobs</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src={`${appUrl}/lovable-uploads/74a2fa1b-09a7-4b4d-a017-2e43655ecc11.png`}
            width="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Section style={content}>
          <Heading style={h1}>Confirm Reauthentication</Heading>
          
          <Text style={text}>
            For your security, please enter this verification code to confirm your identity:
          </Text>

          <Section style={codeContainer}>
            <Text style={codeLabel}>VERIFICATION CODE</Text>
            <div style={codeBox}>
              {verificationCode}
            </div>
          </Section>

          <Section style={instructionsContainer}>
            <Text style={instructionsTitle}>
              <strong>How to use this code:</strong>
            </Text>
            <ol style={instructionsList}>
              <li>Return to the OgaJobs application</li>
              <li>Enter the verification code above</li>
              <li>Complete your reauthentication</li>
            </ol>
          </Section>

          <Hr style={hr} />

          <Text style={securityNote}>
            🔐 <strong>Security Notice:</strong> This code will expire in 15 minutes. Do not share this code with anyone.
          </Text>

          <Text style={warningText}>
            If you didn't request this verification, someone may be trying to access your account. 
            Please secure your account immediately and contact our support team.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} OgaJobs. All rights reserved.<br />
            Helping you connect with trusted artisans and clients.<br />
            <span style={brandTag}>🇳🇬 Nigeria's Trust Infrastructure</span>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#f4f6f8',
  fontFamily: 'Arial, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#28a745',
  padding: '20px',
  textAlign: 'center' as const,
}

const logo = {
  display: 'block',
  margin: '0 auto',
}

const content = {
  padding: '40px',
  color: '#333333',
}

const h1 = {
  color: '#28a745',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
}

const text = {
  fontSize: '16px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '0 0 30px 0',
}

const codeContainer = {
  backgroundColor: '#f8f9fa',
  padding: '30px',
  borderRadius: '8px',
  margin: '30px 0',
  border: '2px solid #28a745',
  textAlign: 'center' as const,
}

const codeLabel = {
  margin: '0 0 10px 0',
  fontSize: '14px',
  color: '#666',
  fontWeight: 'bold',
}

const codeBox = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#28a745',
  letterSpacing: '6px',
  fontFamily: "'Courier New', monospace",
  padding: '10px',
  backgroundColor: '#ffffff',
  borderRadius: '4px',
  display: 'inline-block',
  border: '1px solid #dee2e6',
}

const instructionsContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const instructionsTitle = {
  fontSize: '14px',
  color: '#666',
  margin: '10px 0',
}

const instructionsList = {
  display: 'inline-block',
  textAlign: 'left' as const,
  fontSize: '14px',
  color: '#666',
}

const hr = {
  borderColor: '#e0e0e0',
  margin: '30px 0',
}

const securityNote = {
  backgroundColor: '#fff3cd',
  padding: '20px',
  borderRadius: '6px',
  borderLeft: '4px solid #ffc107',
  color: '#856404',
  fontSize: '14px',
  margin: '30px 0',
  textAlign: 'center' as const,
}

const warningText = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '30px 0 0 0',
}

const footer = {
  backgroundColor: '#f4f6f8',
  padding: '20px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}

const brandTag = {
  color: '#28a745',
}

export default ReauthenticationEmail;