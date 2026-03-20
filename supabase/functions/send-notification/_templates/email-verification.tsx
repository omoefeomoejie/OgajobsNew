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

interface EmailVerificationProps {
  confirmUrl: string;
  userEmail: string;
  appUrl: string;
}

export const EmailVerificationEmail = ({
  confirmUrl,
  userEmail,
  appUrl = 'https://ogajobs.com',
}: EmailVerificationProps) => (
  <Html>
    <Head />
    <Preview>Verify your OgaJobs email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${appUrl}/ogajobs-logo.png`}
            width="120"
            height="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Heading style={h1}>Verify Your Email Address</Heading>
        
        <Text style={text}>
          Welcome to OgaJobs! To complete your account setup and start using our platform, 
          please verify your email address: {userEmail}
        </Text>

        <Section style={ctaSection}>
          <Button
            style={button}
            href={confirmUrl}
          >
            Verify Email Address
          </Button>
        </Section>

        <Section style={infoSection}>
          <Text style={infoTitle}>What happens after verification?</Text>
          <Text style={infoText}>
            ✓ Full access to all OgaJobs features
          </Text>
          <Text style={infoText}>
            ✓ Ability to post service requests or offer services
          </Text>
          <Text style={infoText}>
            ✓ Secure messaging and payment features
          </Text>
          <Text style={infoText}>
            ✓ Profile completion and verification badges
          </Text>
        </Section>

        <Text style={text}>
          If you're having trouble clicking the button, you can copy and paste this link into your browser:
        </Text>
        
        <Text style={urlText}>
          {confirmUrl}
        </Text>

        <Section style={supportSection}>
          <Text style={supportText}>
            <strong>Need help?</strong> If you didn't create this account or have any questions, 
            please contact our support team. We're here to help!
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Welcome aboard,<br />
            The OgaJobs Team
          </Text>
          <Text style={footerSubtext}>
            Nigeria's Trust Infrastructure
          </Text>
          <Text style={footerLinks}>
            <Link href={`${appUrl}/help-center`} style={link}>Help Center</Link> | 
            <Link href={`${appUrl}/contact`} style={link}> Contact Support</Link> | 
            <Link href={`${appUrl}/terms-of-service`} style={link}> Terms of Service</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailVerificationEmail

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
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
}

const infoSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  border: '1px solid #bbf7d0',
}

const infoTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
}

const supportSection = {
  margin: '32px 0',
  padding: '20px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
}

const supportText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0',
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