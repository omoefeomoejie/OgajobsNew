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

interface MagicLinkEmailProps {
  magicLink: string;
  userEmail: string;
  appUrl: string;
}

export const MagicLinkEmail = ({
  magicLink,
  userEmail,
  appUrl,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your secure login link for OgaJobs</Preview>
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
          <Heading style={h1}>Secure Login Link</Heading>
          
          <Text style={text}>
            Hello! Click the button below to securely log in to your OgaJobs account.
          </Text>

          <Section style={buttonContainer}>
            <Link href={magicLink} style={button}>
              Log in to OgaJobs
            </Link>
          </Section>

          <Text style={linkText}>
            Or copy and paste this link in your browser:
          </Text>
          
          <Text style={linkUrl}>
            {magicLink}
          </Text>

          <Hr style={hr} />

          <Text style={securityNote}>
            🔐 <strong>Security Notice:</strong> This link will expire in 1 hour and can only be used once. 
            If you didn't request this login link, you can safely ignore this email.
          </Text>

          <Text style={helpText}>
            Having trouble? Contact our support team at{' '}
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
  margin: '0 0 30px 0',
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
  backgroundColor: '#fff3cd',
  padding: '15px',
  borderRadius: '6px',
  borderLeft: '4px solid #ffc107',
  color: '#856404',
  fontSize: '14px',
  margin: '20px 0',
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

export default MagicLinkEmail;