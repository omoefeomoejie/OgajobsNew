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

interface WelcomePOSAgentEmailProps {
  fullName: string;
  agentCode: string;
  appUrl: string;
}

export const WelcomePOSAgentEmail = ({
  fullName,
  agentCode,
  appUrl = 'https://ogajobs.com',
}: WelcomePOSAgentEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to OgaJobs POS Partnership - Start earning commissions today!</Preview>
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

        <Heading style={h1}>Welcome to OgaJobs Partnership, {fullName}! 🤝</Heading>
        
        <Text style={text}>
          Congratulations! You've successfully joined OgaJobs as a POS Agent. 
          You're now part of Nigeria's most trusted infrastructure for connecting skilled artisans with clients.
        </Text>

        <Section style={agentCodeSection}>
          <Text style={agentCodeTitle}>Your Agent Code:</Text>
          <Text style={agentCode}>{agentCode}</Text>
          <Text style={agentCodeNote}>Keep this code safe - you'll need it to track your commissions</Text>
        </Section>

        <Section style={benefitsSection}>
          <Text style={benefitsTitle}>As a POS Agent, you can:</Text>
          <Text style={benefitItem}>💰 Earn up to 10% commission on every successful booking</Text>
          <Text style={benefitItem}>👥 Onboard skilled artisans in your community</Text>
          <Text style={benefitItem}>📊 Track your earnings through your personal dashboard</Text>
          <Text style={benefitItem}>💸 Weekly commission payouts to your account</Text>
          <Text style={benefitItem}>🏆 Performance bonuses and incentives</Text>
          <Text style={benefitItem}>🎯 Dedicated support from our partnership team</Text>
        </Section>

        <Section style={ctaSection}>
          <Button
            style={button}
            href={`${appUrl}/agent-dashboard`}
          >
            Access Your Dashboard
          </Button>
        </Section>

        <Section style={quickStartSection}>
          <Text style={quickStartTitle}>Quick Start Guide:</Text>
          <Text style={quickStartItem}>1. Complete your profile verification</Text>
          <Text style={quickStartItem}>2. Start recruiting artisans in your area</Text>
          <Text style={quickStartItem}>3. Use your agent code when onboarding artisans</Text>
          <Text style={quickStartItem}>4. Watch your commissions grow!</Text>
        </Section>

        <Text style={text}>
          Our partnership team is here to support your success every step of the way. 
          Contact us anytime for training, resources, or assistance.
        </Text>

        <Section style={footer}>
          <Text style={footerText}>
            Best regards,<br />
            The OgaJobs Partnership Team
          </Text>
          <Text style={footerSubtext}>
            Nigeria's Trust Infrastructure
          </Text>
          <Text style={footerLinks}>
            <Link href={`${appUrl}/pos-partnership`} style={link}>Partnership Info</Link> | 
            <Link href={`${appUrl}/help-center`} style={link}> Help Center</Link> | 
            <Link href="mailto:support@ogajobs.com" style={link}> Contact Support</Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomePOSAgentEmail

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

const agentCodeSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#e7f3ff',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const agentCodeTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const agentCode = {
  color: '#007cba',
  fontSize: '24px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  backgroundColor: '#ffffff',
  padding: '12px 24px',
  borderRadius: '4px',
  border: '2px solid #007cba',
  display: 'inline-block',
  margin: '8px 0',
}

const agentCodeNote = {
  color: '#666',
  fontSize: '14px',
  margin: '8px 0 0',
  fontStyle: 'italic',
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

const quickStartSection = {
  margin: '32px 0',
  padding: '24px',
  backgroundColor: '#fff7ed',
  borderRadius: '8px',
  borderLeft: '4px solid #f97316',
}

const quickStartTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const quickStartItem = {
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