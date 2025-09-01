import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface EmailConfirmationProps {
  confirmUrl: string;
  userEmail: string;
  appUrl: string;
  fullName?: string;
}

export const EmailConfirmationEmail = ({
  confirmUrl,
  userEmail,
  appUrl,
  fullName = 'Valued User'
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Welcome to OgaJobs! Please confirm your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src={`${appUrl}/ogajobs-logo-new.png`}
            width="120"
            height="40"
            alt="OgaJobs"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Welcome to OgaJobs!</Heading>
        
        <Text style={text}>
          Hello {fullName},
        </Text>
        
        <Text style={text}>
          Thank you for joining OgaJobs - Nigeria's trusted marketplace connecting clients with skilled artisans. 
          We're excited to have you on board!
        </Text>
        
        <Text style={text}>
          To get started and secure your account, please confirm your email address by clicking the button below:
        </Text>
        
        <Section style={buttonSection}>
          <Button style={button} href={confirmUrl}>
            Confirm Email Address
          </Button>
        </Section>
        
        <Text style={text}>
          Or copy and paste this link in your browser:
        </Text>
        
        <Link href={confirmUrl} style={link}>
          {confirmUrl}
        </Link>
        
        <Text style={text}>
          Once confirmed, you'll receive a personalized welcome email with information about how to make the most of OgaJobs.
        </Text>
        
        <Section style={benefitsSection}>
          <Text style={benefitsTitle}>What's next?</Text>
          <Text style={benefitsList}>
            ✓ Browse thousands of verified artisans<br/>
            ✓ Get instant quotes for your projects<br/>
            ✓ Secure payment protection<br/>
            ✓ 24/7 customer support<br/>
            ✓ Rate and review services
          </Text>
        </Section>
        
        <Text style={footerText}>
          If you didn't create an account with OgaJobs, please ignore this email.
        </Text>
        
        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The OgaJobs Team
          </Text>
          
          <Text style={footerLinks}>
            <Link href={`${appUrl}/help`} style={footerLink}>
              Help Center
            </Link>
            {' • '}
            <Link href={`${appUrl}/contact`} style={footerLink}>
              Contact Us
            </Link>
            {' • '}
            <Link href={`${appUrl}/terms`} style={footerLink}>
              Terms of Service
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 30px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const link = {
  color: '#2563eb',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const benefitsSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
};

const benefitsTitle = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const benefitsList = {
  color: '#374151',
  fontSize: '16',
  lineHeight: '26px',
  margin: '0',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
  paddingTop: '24px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const footerLinks = {
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const footerLink = {
  color: '#6b7280',
  fontSize: '12px',
  textDecoration: 'underline',
};

export default EmailConfirmationEmail;