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

interface WelcomeArtisanEmailProps {
  fullName: string;
  appUrl: string;
}

export const WelcomeArtisanEmail = ({
  fullName,
  appUrl = 'https://ogajobs.com',
}: WelcomeArtisanEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to OgaJobs - Start earning with your skills today!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Img
            src={`${appUrl}/lovable-uploads/74a2fa1b-09a7-4b4d-a017-2e43655ecc11.png`}
            width="120"
            height="120"
            alt="OgaJobs Logo"
            style={logo}
          />
        </Section>

        <Heading style={h1}>Welcome to OgaJobs, {fullName}! 🚀</Heading>
        
        <Text style={text}>
          Congratulations on joining Nigeria's most trusted platform for skilled artisans! 
          You're now part of an elite community where your skills are valued and your success is our priority.
        </Text>

        <Section style={benefitsSection}>
          <Text style={benefitsTitle}>What you get as an Artisan:</Text>
          <Text style={benefitItem}>✓ Access to verified clients actively seeking your services</Text>
          <Text style={benefitItem}>✓ Secure payments with instant escrow release</Text>
          <Text style={benefitItem}>✓ Build your portfolio and grow your reputation</Text>
          <Text style={benefitItem}>✓ Real-time job matching based on your skills</Text>
          <Text style={benefitItem}>✓ Professional tools to manage your business</Text>
          <Text style={benefitItem}>✓ 24/7 support and dispute protection</Text>
        </Section>

        <Section style={nextStepsSection}>
          <Text style={nextStepsTitle}>Next Steps to Get Started:</Text>
          <Text style={stepItem}>1. Complete your profile verification</Text>
          <Text style={stepItem}>2. Upload samples of your work to your portfolio</Text>
          <Text style={stepItem}>3. Set your availability and service areas</Text>
          <Text style={stepItem}>4. Start receiving job requests from clients</Text>
        </Section>

        <Section style={ctaSection}>
          <Button
            style={button}
            href={`${appUrl}/artisan-dashboard`}
          >
            Complete Your Profile
          </Button>
        </Section>

        <Text style={text}>
          Our success team is here to help you maximize your earnings. Don't hesitate to reach out if you need any assistance!
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

export default WelcomeArtisanEmail

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
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  border: '1px solid #e0f2fe',
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

const nextStepsSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  border: '1px solid #fde68a',
}

const nextStepsTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const stepItem = {
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
  backgroundColor: '#059669',
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