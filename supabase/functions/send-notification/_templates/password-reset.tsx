import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface PasswordResetEmailProps {
  resetUrl: string;
  userEmail: string;
  appUrl: string;
  expiresIn?: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  userEmail,
  appUrl = 'https://ogajobs.com',
  expiresIn = '1 hour',
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your OgaJobs password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${appUrl}/logo-transparent.png`}
            width="120"
            height="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          We received a request to reset your password for your OgaJobs account associated with {userEmail}.
        </Text>

        <Section style={ctaSection}>
          <Button
            style={button}
            href={resetUrl}
          >
            Reset Your Password
          </Button>
        </Section>

        <Text style={text}>
          This password reset link will expire in {expiresIn}. If you don't use it within that time, 
          you can request a new password reset.
        </Text>

        <Section style={securitySection}>
          <Text style={securityTitle}>🔒 Security Notice</Text>
          <Text style={securityText}>
            • If you didn't request this password reset, you can safely ignore this email
          </Text>
          <Text style={securityText}>
            • Never share your password or reset links with anyone
          </Text>
          <Text style={securityText}>
            • Always ensure you're on the official OgaJobs website when entering your credentials
          </Text>
        </Section>

        <Text style={text}>
          If you're having trouble clicking the button, you can copy and paste this link into your browser:
        </Text>
        
        <Text style={urlText}>
          {resetUrl}
        </Text>

        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The OgaJobs Security Team
          </Text>
          <Text style={footerSubtext}>
            Nigeria's Trust Infrastructure
          </Text>
          <Text style={footerLinks}>
            <Link href={`${appUrl}/help-center`} style={link}>Help Center</Link> | 
            <Link href={`${appUrl}/safety-guidelines`} style={link}> Safety Guidelines</Link> | 
            <Link href={`${appUrl}/contact`} style={link}> Contact Support</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PasswordResetEmail

// Styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
}

const logoContainer = {
  margin: '0 auto',
  padding: '20px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const securitySection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fef2f2',
  borderRadius: '8px',
  border: '1px solid #fecaca',
}

const securityTitle = {
  color: '#991b1b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const securityText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
}

const urlText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '12px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  wordBreak: 'break-all' as const,
}

const footer = {
  borderTop: '1px solid #eee',
  paddingTop: '24px',
  margin: '40px 0 0',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#333',
  fontSize: '16px',
  margin: '16px 0',
}

const footerSubtext = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '8px 0',
}

const footerLinks = {
  color: '#666',
  fontSize: '12px',
  margin: '16px 0',
}

const link = {
  color: '#007cba',
  textDecoration: 'underline',
}