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

interface WelcomeClientEmailProps {
  fullName: string;
  appUrl: string;
}

export const WelcomeClientEmail = ({
  fullName,
  appUrl = 'https://ogajobs.com',
}: WelcomeClientEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to OgaJobs - Your trusted marketplace for skilled artisans</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${appUrl}/icon-512.png`}
            width="120"
            height="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Heading style={h1}>Welcome to OgaJobs, {fullName}! 🎉</Heading>
        
        <Text style={text}>
          Thank you for joining Nigeria's most trusted infrastructure for connecting clients with skilled artisans. 
          You're now part of a community that values quality, trust, and reliability.
        </Text>

        <Section style={benefitsSection}>
          <Text style={benefitsTitle}>What you can do as a Client:</Text>
          <Text style={benefitItem}>✓ Find verified skilled artisans in your area</Text>
          <Text style={benefitItem}>✓ View portfolios and ratings before booking</Text>
          <Text style={benefitItem}>✓ Secure payment with escrow protection</Text>
          <Text style={benefitItem}>✓ Real-time tracking of your service requests</Text>
          <Text style={benefitItem}>✓ 24/7 customer support and dispute resolution</Text>
        </Section>

        <Section style={ctaSection}>
          <Button
            style={button}
            href={`${appUrl}/services`}
          >
            Find Artisans Near You
          </Button>
        </Section>

        <Text style={text}>
          Need help getting started? Our support team is here to assist you every step of the way.
        </Text>

        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The OgaJobs Team
          </Text>
          <Text style={footerSubtext}>
            Nigeria's Trust Infrastructure
          </Text>
          <Text style={footerLinks}>
            <Link href={`${appUrl}/help-center`} style={link}>Help Center</Link> | 
            <Link href={`${appUrl}/privacy-policy`} style={link}> Privacy Policy</Link> | 
            <Link href={`${appUrl}/terms-of-service`} style={link}> Terms of Service</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeClientEmail

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

const benefitsSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
}

const benefitsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const benefitItem = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
  paddingLeft: '8px',
}

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#007cba',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  fontWeight: 'bold',
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