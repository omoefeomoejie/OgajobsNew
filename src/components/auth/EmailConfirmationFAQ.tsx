import React from 'react';
import { ChevronDown, Mail, AlertTriangle, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmailConfirmationFAQProps {
  email: string;
  onClose: () => void;
}

export function EmailConfirmationFAQ({ email, onClose }: EmailConfirmationFAQProps) {
  const [openSections, setOpenSections] = React.useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const faqItems = [
    {
      id: 'not-received',
      question: "I haven't received the confirmation email",
      answer: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Try these steps in order:</p>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">1</span>
              <span>Check your spam/junk folder - confirmation emails sometimes end up there</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">2</span>
              <span>Wait a few more minutes - emails can take up to 10 minutes to arrive</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">3</span>
              <span>Use the "Resend Email" button above to send another confirmation</span>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'wrong-email',
      question: "I used the wrong email address",
      answer: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you entered the wrong email address, you'll need to sign up again with the correct one.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="w-full"
          >
            Back to Sign Up
          </Button>
        </div>
      )
    },
    {
      id: 'already-confirmed',
      question: "I clicked the link but nothing happened",
      answer: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            If you've already clicked the confirmation link but this page didn't update:
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.location.reload()}
            >
              Refresh This Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => window.location.href = '/dashboard'}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'email-provider',
      question: "Email provider-specific issues",
      answer: (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2"><strong>Gmail users:</strong> Check the "Promotions" or "Updates" tabs</p>
            <p className="mb-2"><strong>Outlook users:</strong> Check the "Junk Email" folder</p>
            <p className="mb-2"><strong>Yahoo users:</strong> Check the "Spam" folder</p>
            <p><strong>Corporate email:</strong> Your IT department may be filtering emails</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Troubleshooting Help
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-xs px-2"
        >
          Hide
        </Button>
      </div>

      <Alert className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/30">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Still having trouble?</strong> Most email issues are resolved by checking your spam folder or waiting a few more minutes.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        {faqItems.map((item) => (
          <Collapsible key={item.id}>
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
              onClick={() => toggleSection(item.id)}
            >
              <span className="text-sm font-medium text-foreground">{item.question}</span>
              <ChevronDown 
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  openSections.includes(item.id) ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3">
              {item.answer}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Direct Email Access</span>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open(`https://gmail.com`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Open Gmail
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open(`https://outlook.com`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Open Outlook
          </Button>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30">
        <HelpCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Need personal help?</strong> Contact our support team and we'll help you get signed in.
          <Button
            variant="link"
            size="sm"
            className="ml-2 p-0 h-auto text-blue-600 dark:text-blue-400"
            onClick={() => window.location.href = 'mailto:support@ogajobs.com?subject=Email Confirmation Help&body=I\'m having trouble confirming my email address: ' + email}
          >
            support@ogajobs.com
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}