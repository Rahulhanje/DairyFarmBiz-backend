# Meta Cloud API (WhatsApp Business) Setup Guide

## 🎯 Overview

Meta Cloud API provides **1000 FREE messages per month** for production use, no sandbox required! This is the recommended approach for production WhatsApp integration.

## 📋 Prerequisites

- Meta (Facebook) Developer Account
- Business phone number for WhatsApp Business
- Business verification (required for production)

## 🚀 Step-by-Step Setup

### 1. Create Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"Get Started"** or **"My Apps"**
3. Log in with your Facebook account
4. Complete the developer registration

### 2. Create a New App

1. Click **"Create App"** in the dashboard
2. Select **"Business"** as the app type
3. Fill in app details:
   - **App Name**: Dairy Farm Management (or your preferred name)
   - **Contact Email**: Your email address
4. Click **"Create App"**

### 3. Add WhatsApp Product

1. In your app dashboard, find **"Add Product"**
2. Locate **"WhatsApp"** and click **"Set up"**
3. This will add WhatsApp to your app

### 4. Get API Credentials

#### Option A: Temporary Token (Testing - 24 hours)

1. Go to **WhatsApp > API Setup** in the left sidebar
2. Find the **"Temporary access token"** section
3. Click **"Generate Token"**
4. Copy the token (valid for 24 hours)
5. Copy the **Phone Number ID** (NOT your actual phone number)

#### Option B: Permanent Token (Production - Recommended)

1. Go to **Settings > Business Settings**
2. Under **"Users"**, click **"System Users"**
3. Click **"Add"** to create a new system user
4. Name it (e.g., "WhatsApp API User")
5. Assign **"Admin"** role
6. Click on the system user you created
7. Click **"Generate New Token"**
8. Select your app
9. Choose permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
10. Click **"Generate Token"**
11. **IMPORTANT**: Copy and save the token immediately (shown only once)

### 5. Register Phone Number

1. In **WhatsApp > API Setup**, click **"Add Phone Number"**
2. Options:
   - **Option A**: Use Meta's test number (limited functionality)
   - **Option B**: Add your own business number (recommended)

#### Adding Your Own Number:

1. Click **"Add Phone Number"**
2. Select your business account
3. Enter your phone number with country code (e.g., +919876543210)
4. Select verification method:
   - **Voice Call**: Receive verification code via call
   - **SMS**: Receive verification code via text
5. Enter the verification code
6. Your number is now registered!

### 6. Get Phone Number ID

1. Go to **WhatsApp > API Setup**
2. Under **"From"** section, find your phone number
3. Copy the **Phone Number ID** (looks like: `123456789012345`)
4. This is NOT your actual phone number - it's the API identifier

### 7. Configure Your Application

Add the following to your `backend/.env` file:

```env
# Meta Cloud API Configuration
META_PHONE_NUMBER_ID=123456789012345
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace with your actual values:**
- `META_PHONE_NUMBER_ID`: The Phone Number ID from step 6
- `META_ACCESS_TOKEN`: The access token from step 4

### 8. Test Your Setup

1. Restart your backend server:
```bash
cd backend
npm run dev
```

2. Look for this message in the logs:
```
WhatsApp service initialized successfully (Meta Cloud API)
```

3. Create a test breeding record through your app
4. Two notifications should be created (email + WhatsApp)
5. Wait for the scheduled time or trigger manually
6. You should receive a WhatsApp message on your phone!

## 📱 Message Format

The system automatically formats phone numbers:
- **Your format**: +919876543210 (with +)
- **API expects**: 919876543210 (without +)
- **Conversion**: Handled automatically by the service

## 💰 Pricing & Limits

### Free Tier
- **1000 free messages per month**
- Conversation-based pricing applies
- Perfect for small to medium farms

### Conversation-Based Pricing
Meta uses "conversations" instead of individual messages:
- **Business-Initiated**: You send the first message (24-hour window)
- **User-Initiated**: User sends first message (free response window)
- Multiple messages within 24 hours = 1 conversation

### After Free Tier
- India: ~₹0.50 - ₹1.00 per conversation
- Varies by country
- [Check current pricing](https://developers.facebook.com/docs/whatsapp/pricing)

## 🔧 Troubleshooting

### Issue: "WhatsApp service not configured"

**Solution**: Check your `.env` file has both:
```env
META_PHONE_NUMBER_ID=your_id_here
META_ACCESS_TOKEN=your_token_here
```

### Issue: "Invalid phone number"

**Solution**: Ensure recipient numbers are formatted correctly:
- ✅ Correct: `919876543210` (without +)
- ❌ Wrong: `+919876543210` (with +)
- ❌ Wrong: `9876543210` (missing country code)

### Issue: "Access token expired"

**Solution**: 
- Temporary tokens expire after 24 hours
- Create a permanent System User token (see step 4, Option B)

### Issue: "(#131009) Parameter value is not valid"

**Solutions**:
1. Verify Phone Number ID is correct (not your phone number)
2. Check access token has proper permissions
3. Ensure phone number is registered with Meta

### Issue: "Message failed to send"

**Solutions**:
1. Check recipient has WhatsApp installed
2. Verify recipient's phone number is correct
3. Check your message template doesn't violate policies
4. Review Meta API error in backend logs

## 🔐 Security Best Practices

1. **Never commit tokens to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use permanent tokens for production**
   - More secure than temporary tokens
   - Create dedicated System User for API

3. **Rotate tokens periodically**
   - Generate new tokens every 3-6 months
   - Revoke old tokens after rotation

4. **Monitor usage**
   - Check Meta Business Suite for usage stats
   - Set up alerts for quota limits

## 📊 Monitoring & Analytics

### View Message Stats
1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Select your WhatsApp Business Account
3. Click **Insights** to view:
   - Messages sent
   - Messages delivered
   - Failure reasons
   - Remaining free tier quota

### API Testing Tools
- **Postman**: Test API calls directly
- **Meta Graph API Explorer**: Built-in testing tool
- **Backend Logs**: Check `console.log` output

## 📚 Additional Resources

- [Official Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Getting Started Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Message Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
- [Webhooks Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Business Verification](https://developers.facebook.com/docs/development/release/business-verification)

## 🎯 Production Checklist

Before going live, ensure:

- [ ] Permanent access token generated
- [ ] Phone number verified and registered
- [ ] Business verification completed (required for production)
- [ ] Tested with real phone numbers
- [ ] Message templates approved (if using templates)
- [ ] Monitoring and logging set up
- [ ] Error handling tested
- [ ] Rate limiting configured (if needed)
- [ ] Backup notification method ready (email)
- [ ] `.env` file secured (not in Git)

## 🆚 Comparison: Twilio vs Meta Cloud API

| Feature | Twilio Sandbox | Meta Cloud API |
|---------|----------------|----------------|
| **Free Tier** | Trial credits | 1000 msg/month |
| **Setup** | Easy (5 min) | Moderate (15 min) |
| **Sandbox** | Required | Not required |
| **Production Ready** | No | Yes |
| **User Opt-in** | Must join sandbox | No opt-in needed |
| **Number Format** | whatsapp:+919876543210 | 919876543210 |
| **Best For** | Quick testing | Production use |

## ✅ Next Steps

1. Complete the setup steps above
2. Test with your phone number
3. Create breeding records to trigger notifications
4. Monitor WhatsApp delivery in Meta Business Suite
5. Adjust cron schedule back to hourly: `'0 * * * *'` (in `cronJobs.ts`)

---

Need help? Check the troubleshooting section or refer to [Meta's support](https://developers.facebook.com/support/).
