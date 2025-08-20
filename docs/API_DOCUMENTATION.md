# API Documentation

> Complete reference for OgaJobs Supabase Edge Functions and Database APIs

## Overview

OgaJobs uses Supabase Edge Functions for backend logic, providing secure, scalable serverless endpoints. All functions are deployed automatically and include comprehensive error handling, logging, and security measures.

## Authentication

Most endpoints require authentication via Supabase JWT tokens:

```javascript
// Include in headers
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

## Base URL

```
https://vclzkuzexsuhaaliweey.supabase.co/functions/v1/
```

## Edge Functions

### 🔐 Authentication Functions

#### `create-admin-user`
Creates a new admin user in the system.

**Endpoint**: `POST /create-admin-user`
**Auth Required**: Yes (Admin only)

```javascript
// Request
{
  "email": "admin@ogajobs.ng",
  "password": "SecurePassword123!",
  "full_name": "Admin User",
  "role": "admin" // or "super_admin"
}

// Response
{
  "success": true,
  "user_id": "uuid",
  "message": "Admin user created successfully"
}
```

### 💳 Payment Functions

#### `create-payment`
Initiates a payment transaction with escrow protection.

**Endpoint**: `POST /create-payment`
**Auth Required**: Yes

```javascript
// Request
{
  "booking_id": "uuid",
  "amount": 15000,
  "currency": "NGN",
  "payment_method": "card"
}

// Response
{
  "success": true,
  "payment_id": "uuid",
  "authorization_url": "https://checkout.paystack.com/...",
  "access_code": "access_code",
  "reference": "payment_reference"
}
```

#### `verify-payment`
Verifies payment status and updates booking.

**Endpoint**: `POST /verify-payment`
**Auth Required**: Yes

```javascript
// Request
{
  "reference": "payment_reference",
  "booking_id": "uuid"
}

// Response
{
  "success": true,
  "status": "success",
  "amount": 15000,
  "gateway_response": "Successful"
}
```

#### `release-escrow`
Releases escrowed funds to artisan upon job completion.

**Endpoint**: `POST /release-escrow`
**Auth Required**: Yes (Client or Admin)

```javascript
// Request
{
  "booking_id": "uuid",
  "release_reason": "job_completed"
}

// Response
{
  "success": true,
  "amount_released": 13500,
  "platform_fee": 1500,
  "transaction_id": "uuid"
}
```

### 🤖 AI Functions

#### `ai-chat-response`
Generates AI responses for customer support chat.

**Endpoint**: `POST /ai-chat-response`
**Auth Required**: No

```javascript
// Request
{
  "message": "I need help with my booking",
  "session_id": "uuid",
  "context": {
    "user_type": "client",
    "previous_messages": []
  }
}

// Response
{
  "success": true,
  "response": "I'd be happy to help with your booking. Can you provide more details?",
  "should_escalate": false,
  "confidence": 0.85
}
```

#### `get-artisan-recommendations`
AI-powered artisan matching based on client requirements.

**Endpoint**: `POST /get-artisan-recommendations`
**Auth Required**: Yes

```javascript
// Request
{
  "service_category": "plumbing",
  "location": "Lagos",
  "budget": 25000,
  "urgency": "normal",
  "client_preferences": {}
}

// Response
{
  "success": true,
  "recommendations": [
    {
      "artisan_id": "uuid",
      "match_score": 0.92,
      "rating": 4.8,
      "distance_km": 2.5,
      "price_estimate": 22000
    }
  ]
}
```

### 📊 Analytics Functions

#### `analyze-market-trends`
Analyzes market trends and demand patterns.

**Endpoint**: `POST /analyze-market-trends`
**Auth Required**: Yes (Admin only)

```javascript
// Request
{
  "city": "Lagos",
  "service_category": "all",
  "period": "last_30_days"
}

// Response
{
  "success": true,
  "trends": {
    "demand_growth": 15.2,
    "supply_growth": 8.7,
    "average_price_change": 5.3,
    "top_categories": ["plumbing", "electrical", "carpentry"]
  }
}
```

#### `generate-demand-predictions`
Predicts future service demand using ML models.

**Endpoint**: `POST /generate-demand-predictions`
**Auth Required**: Yes (Admin only)

```javascript
// Request
{
  "prediction_days": 7,
  "city": "Lagos",
  "categories": ["plumbing", "electrical"]
}

// Response
{
  "success": true,
  "predictions": [
    {
      "date": "2024-01-15",
      "category": "plumbing",
      "predicted_demand": 45,
      "confidence": 0.87
    }
  ]
}
```

### 🔒 Security Functions

#### `security-logger`
Logs security events and potential threats.

**Endpoint**: `POST /security-logger`
**Auth Required**: System only

```javascript
// Request
{
  "event_type": "suspicious_login",
  "user_id": "uuid",
  "ip_address": "192.168.1.1",
  "details": {
    "login_attempts": 5,
    "time_window": "5_minutes"
  }
}

// Response
{
  "success": true,
  "event_id": "uuid",
  "risk_level": "medium"
}
```

#### `detect-fraud-patterns`
AI-powered fraud detection and prevention.

**Endpoint**: `POST /detect-fraud-patterns`
**Auth Required**: Yes (System)

```javascript
// Request
{
  "transaction_data": {
    "user_id": "uuid",
    "amount": 50000,
    "frequency": "multiple_rapid",
    "device_info": {}
  }
}

// Response
{
  "success": true,
  "fraud_probability": 0.23,
  "risk_factors": ["high_amount", "rapid_frequency"],
  "action_required": "additional_verification"
}
```

### 💰 Withdrawal Functions

#### `process-withdrawal`
Processes artisan earnings withdrawals.

**Endpoint**: `POST /process-withdrawal`
**Auth Required**: Yes (Artisan)

```javascript
// Request
{
  "amount": 25000,
  "payment_method": {
    "type": "bank_transfer",
    "account_number": "1234567890",
    "bank_code": "044"
  }
}

// Response
{
  "success": true,
  "withdrawal_id": "uuid",
  "processing_time": "1-3 business days",
  "fees": 500
}
```

### 📱 Notification Functions

#### `send-notification`
Sends various types of notifications to users.

**Endpoint**: `POST /send-notification`
**Auth Required**: Yes (System)

```javascript
// Request
{
  "user_id": "uuid",
  "type": "booking_update",
  "title": "Booking Confirmed",
  "message": "Your plumbing service has been confirmed",
  "data": {
    "booking_id": "uuid",
    "artisan_name": "John Doe"
  }
}

// Response
{
  "success": true,
  "notification_id": "uuid",
  "delivery_status": "sent"
}
```

#### `send-push-notification`
Sends push notifications to mobile devices.

**Endpoint**: `POST /send-push-notification`
**Auth Required**: Yes (System)

```javascript
// Request
{
  "user_ids": ["uuid1", "uuid2"],
  "title": "New Job Available",
  "body": "A plumbing job near you is available",
  "data": {
    "type": "job_alert",
    "job_id": "uuid"
  }
}

// Response
{
  "success": true,
  "sent_count": 2,
  "failed_count": 0
}
```

## Database Tables & RLS Policies

### Key Tables

#### `bookings`
Central table for service bookings.

**RLS Policy**: Users can only access their own bookings (client or assigned artisan).

```sql
-- Example query (handled by Supabase client)
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('client_email', user.email);
```

#### `artisans`
Artisan profiles and information.

**RLS Policy**: Public read for basic info, artisans can manage their own data.

#### `payments`
Payment transactions and escrow records.

**RLS Policy**: Users can only see their own payment records.

## Error Handling

All API endpoints return consistent error formats:

```javascript
// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - JWT token missing or invalid
- `AUTHORIZATION_DENIED` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid input data
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server-side error

## Rate Limits

- **Default**: 100 requests per minute per user
- **Payment endpoints**: 10 requests per minute
- **AI functions**: 50 requests per minute
- **Admin functions**: 200 requests per minute

## Webhooks

### Payment Webhooks
Receive real-time payment status updates:

```javascript
// Webhook payload
{
  "event": "payment.success",
  "data": {
    "reference": "payment_ref",
    "amount": 15000,
    "booking_id": "uuid",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## SDK Usage Examples

### JavaScript/TypeScript

```javascript
import { supabase } from '@/integrations/supabase/client';

// Call edge function
const { data, error } = await supabase.functions.invoke('create-payment', {
  body: {
    booking_id: 'uuid',
    amount: 15000,
    currency: 'NGN'
  }
});

// Database query with RLS
const { data: bookings } = await supabase
  .from('bookings')
  .select('*')
  .eq('status', 'pending');
```

## Testing

Use the test environment for development:

```javascript
// Test configuration
const testSupabase = createClient(
  'https://test-project.supabase.co',
  'test-anon-key'
);
```

## Support

- **API Issues**: Create GitHub issue with `api` label
- **Documentation**: Submit PR for improvements
- **Feature Requests**: Use GitHub Discussions

---

*Last updated: January 2024*