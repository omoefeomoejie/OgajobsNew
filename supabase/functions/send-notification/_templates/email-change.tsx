import React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Img,
  Hr,
  Section,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  confirmUrl: string;
  userEmail: string;
  oldEmail?: string;
  appUrl: string;
}

export const EmailChangeEmail = ({
  confirmUrl,
  userEmail,
  oldEmail,
  appUrl,
}: EmailChangeEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirm your email change for OgaJobs</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src={`${appUrl}/ogajobs-logo.png`}
            width="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Section style={content}>
          <Heading style={h1}>Confirm Email Change</Heading>
          
          <Text style={text}>
            You've requested to change your email address on OgaJobs.
          </Text>

          {oldEmail && (
            <Section style={emailChangeInfo}>
              <Text style={changeText}>
                <strong>From:</strong> {oldEmail}<br />
                <strong>To:</strong> {userEmail}
              </Text>
            </Section>
          )}

          <Text style={text}>
            To complete this change, please click the button below:
          </Text>

          <Section style={buttonContainer}>
            <Link href={confirmUrl} style={button}>
              Confirm Email Change
            </Link>
          </Section>

          <Text style={linkText}>
            Or copy and paste this link in your browser:
          </Text>
          
          <Text style={linkUrl}>
            {confirmUrl}
          </Text>

          <Hr style={hr} />

          <Text style={securityNote}>
            🔐 <strong>Security Notice:</strong> This confirmation link will expire in 1 hour. 
            If you did not request this email change, please contact our support team immediately.
          </Text>

          <Text style={helpText}>
            Need help? Contact us at{' '}
            <Link href="mailto:support@ogajobs.com" style={link}>
              support@ogajobs.com
            </Link>
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
}

const h1 = {
  color: '#28a745',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  margin: '0 0 20px 0',
}

const emailChangeInfo = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '6px',
  border: '1px solid #dee2e6',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const changeText = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#28a745',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  minWidth: '200px',
}

const linkText = {
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '30px 0 10px 0',
}

const linkUrl = {
  color: '#28a745',
  fontSize: '12px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
  margin: '0 0 30px 0',
  fontFamily: 'monospace',
  backgroundColor: '#f8f9fa',
  padding: '10px',
  borderRadius: '4px',
}

const hr = {
  borderColor: '#e0e0e0',
  margin: '30px 0',
}

const securityNote = {
  backgroundColor: '#f8d7da',
  padding: '15px',
  borderRadius: '6px',
  borderLeft: '4px solid #dc3545',
  color: '#721c24',
  fontSize: '14px',
  margin: '20px 0',
  textAlign: 'center' as const,
}

const helpText = {
  color: '#666666',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '20px 0 0 0',
}

const link = {
  color: '#28a745',
  textDecoration: 'underline',
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

export default EmailChangeEmail;