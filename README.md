# Voicemail Service for Cloudflare Workers

A scalable, cloud-native voicemail service built on Cloudflare Workers that provides automated voice recording, storage, and management capabilities. The service offers multi-provider support with robust error handling and comprehensive logging.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YasogaN/voicemail-cf)

## Features

- 🚀 **Serverless Architecture**: Built on Cloudflare Workers for global edge deployment
- 📞 **Multi-Provider Support**: Currently supports Twilio with planned support for additional providers
- 🔊 **Flexible Recording Options**: Support for both URL-based audio prompts and text-to-speech
- 💾 **Cloud Storage**: Automatic recording storage using Cloudflare R2
- 📋 **Comprehensive Logging**: Detailed call metadata and recording indexing
- 🔧 **Configuration-Driven**: Environment-based configuration for easy deployment
- 📖 **OpenAPI Documentation**: Auto-generated API documentation with interactive interface
- 🛡️ **Type Safety**: Full TypeScript implementation with Zod validation

## Architecture

The service is built using modern web technologies:

- **Runtime**: Cloudflare Workers
- **Framework**: Hono with chanfana for OpenAPI support
- **Storage**: Cloudflare R2 for recording files and metadata
- **Validation**: Zod for runtime type checking
- **Voice Processing**: Provider-specific SDKs (Twilio, etc.)

## Quick Start

### Prerequisites

- [Cloudflare Workers account](https://workers.dev) (free tier sufficient)
- [Node.js 18+](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YasogaN/voicemail-cf.git
   cd voicemail-cf
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Authenticate with Cloudflare**

   ```bash
   wrangler login
   ```

4. **Setup Providers**

   Choose and configure your voice service provider:

   <details>
   <summary><strong>Twilio</strong></summary>

   #### Step 1: Create Twilio API Key

   Create a Twilio API key with restricted scopes for security:

   1. Log in to your [Twilio Console](https://console.twilio.com/)
   2. Navigate to [API keys & tokens](https://console.twilio.com/us1/account/keys-credentials/api-keys)
   3. Click **Create API key**
   4. Set the key type to **Restricted**
   5. Configure the following scopes:
      - `voice.calls:read`
      - `voice.recordings:read`
      - `voice.recordings:delete`
   6. Save the API Key SID and Secret (you won't be able to see the secret again)

   #### Step 2: Configure Twilio Phone Number

   1. Purchase a phone number in your [Twilio Console](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
   2. Configure the webhook URL for your phone number:
      - Voice webhook: `https://your-worker.workers.dev/incoming`
      - HTTP method: `GET`

   #### Step 3: Set Twilio Environment Variables

   Configure the following Twilio-specific environment variables:

   ```bash
   # Twilio API credentials
   wrangler secret put twilio_api_key    # Your Twilio API Key SID
   wrangler secret put twilio_api_secret # Your Twilio API Key Secret
   ```

   </details>

5. **Configure General Environment Variables**

   Set the following general environment variables that apply to all providers:

   ```bash
   # Provider configuration
   wrangler secret put provider          # Your chosen provider (e.g., twilio)
   wrangler secret put endpoint          # Your deployed worker URL

   # Phone numbers (comma-separated for multiple numbers)
   wrangler secret put numbers           # +1234567890,+0987654321

   # Recording configuration
   wrangler secret put recording_type    # url or text
   wrangler secret put recording_url     # URL to audio file (if type=url)
   wrangler secret put recording_text    # Text to speak (if type=text)
   wrangler secret put recording_max_length  # Maximum recording duration in seconds
   ```

6. **Create Cloudflare R2 bucket**

   Create an R2 bucket to store voicemail recordings:

   ```bash
   # Create the R2 bucket (replace 'recordings' with your preferred name)
   wrangler r2 bucket create recordings
   ```

   Alternatively, you can create the bucket through the Cloudflare dashboard:

   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to R2 Object Storage
   - Click "Create bucket"
   - Enter a unique bucket name (e.g., `recordings`)
   - Choose your preferred location
   - Click "Create bucket"

   **Note**: Make sure to update your `wrangler.jsonc` file to reference the bucket name you created.

7. **Deploy to Cloudflare Workers**
   ```bash
   wrangler deploy
   ```

### Development

1. **Start local development server**

   ```bash
   npm run dev
   ```

2. **Access the API documentation**

   Open `http://localhost:8787/` to view the interactive OpenAPI documentation.

3. **Test endpoints**

   The Swagger interface allows you to test all endpoints directly from the browser.

## Configuration

### Environment Variables

| Variable               | Description                                | Required    | Example                                     |
| ---------------------- | ------------------------------------------ | ----------- | ------------------------------------------- |
| `provider`             | Voice service provider                     | Yes         | `twilio`                                    |
| `endpoint`             | Base URL of your deployed worker           | Yes         | `https://voicemail.your-domain.workers.dev` |
| `twilio_api_key`       | Twilio API Key SID (restricted)            | Yes         | `SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`        |
| `twilio_api_secret`    | Twilio API Key Secret                      | Yes         | `your-api-key-secret`                       |
| `numbers`              | Comma-separated list of authorized numbers | Yes         | `+1234567890,+0987654321`                   |
| `recording_type`       | Type of recording prompt                   | Yes         | `url` or `text`                             |
| `recording_url`        | URL to audio prompt (if type=url)          | Conditional | `https://example.com/prompt.mp3`            |
| `recording_text`       | Text-to-speech prompt (if type=text)       | Conditional | `"Please leave a message after the beep"`   |
| `recording_max_length` | Maximum recording duration in seconds      | No          | `30`                                        |

## API Endpoints

### Voice API

| Endpoint    | Method | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| `/incoming` | GET    | Handles incoming calls and routing          |
| `/record`   | GET    | Provides recording instructions and prompts |
| `/hangup`   | GET    | Terminates calls after recording            |
| `/store`    | POST   | Processes and stores completed recordings   |
| `/health`   | GET    | Health check endpoint                       |

### Call Flow

1. **Incoming Call** → `/incoming`

   - Checks if caller is in authorized numbers list
   - Routes to recording or menu based on authorization

2. **Recording** → `/record`

   - Plays configured prompt (audio file or text-to-speech)
   - Initiates voice recording with specified parameters

3. **Completion** → `/hangup`

   - Terminates call after recording completion

4. **Storage** → `/store`
   - Receives recording callback from provider
   - Downloads and stores recording in R2
   - Updates central index with metadata

## Storage Structure

### R2 Bucket Organization

```
recordings/
├── index.json                 # Central metadata index
└── recordings/
    ├── RE1234567890.mp3      # Individual recording files
    ├── RE0987654321.mp3
    └── ...
```

### Metadata Format

```json
{
  "recordingSid": "RE1234567890",
  "callSid": "CA0987654321",
  "start_time": "2025-01-15T10:30:00Z",
  "duration": "45",
  "from": "+1234567890",
  "timestamp": "2025-01-15T10:31:00Z",
  "mediaFile": "recordings/RE1234567890.mp3"
}
```

## Project Structure

```
src/
├── index.ts              # Main application router
├── types.ts              # TypeScript type definitions
├── endpoint/             # API endpoint handlers
│   ├── health.ts         # Health check endpoint
│   ├── incoming.ts       # Incoming call handler
│   ├── record.ts         # Recording endpoint
│   ├── hangup.ts         # Call termination
│   └── store.ts          # Recording storage handler
└── lib/
    └── config.ts         # Configuration management
```

## Development Guidelines

### Adding New Endpoints

1. Create a new file in `src/endpoint/`
2. Implement the `OpenAPIRoute` class
3. Define the OpenAPI schema
4. Register the route in `src/index.ts`

### Error Handling

All endpoints implement comprehensive error handling:

- Input validation using Zod schemas
- Provider-specific error handling
- Graceful degradation for service failures
- Detailed error logging

### Testing

```bash
# Run development server
npm run dev

# Generate TypeScript types
npm run cf-typegen

# Deploy to production
npm run deploy
```

## Roadmap

### Q3 2025: Complete Feature Development

#### Multi-Provider Support

##### Plivo Integration

- [ ] Implement Plivo SDK integration
- [ ] Add Plivo-specific webhook handlers
- [ ] Create Plivo configuration schema
- [ ] Add Plivo recording callback processing
- [ ] Implement Plivo TwiML equivalent (XML response format)
- [ ] Add comprehensive testing for Plivo integration

##### Telnyx Integration

- [ ] Implement Telnyx SDK integration
- [ ] Add Telnyx webhook endpoint handlers
- [ ] Create Telnyx configuration schema
- [ ] Add Telnyx recording storage workflow
- [ ] Implement Telnyx Call Control API integration
- [ ] Add error handling for Telnyx-specific scenarios

##### SignalWire Integration

- [ ] Implement SignalWire SDK integration
- [ ] Add SignalWire webhook handlers
- [ ] Create SignalWire configuration schema
- [ ] Add SignalWire recording callback processing
- [ ] Implement SignalWire LaML response format
- [ ] Add support for SignalWire advanced features

##### Bandwidth Integration

- [ ] Implement Bandwidth Voice API integration
- [ ] Add Bandwidth webhook endpoint handlers
- [ ] Create Bandwidth configuration schema
- [ ] Add Bandwidth recording storage workflow
- [ ] Implement Bandwidth BXML response format
- [ ] Add comprehensive error handling

#### Enhanced Voicemail Menu System

##### Interactive Voice Menu Framework

- [ ] Design flexible menu configuration schema
- [ ] Implement menu state management
- [ ] Add DTMF (touch-tone) input handling
- [ ] Create menu navigation logic
- [ ] Add support for nested menu structures
- [ ] Implement timeout and error handling for menus

##### Core Menu Features

- [ ] **Main Menu Options**:
  - Listen to new messages
  - Listen to saved messages
  - Change personal greeting
  - Change password/PIN
  - Mailbox settings
- [ ] **Message Management**:
  - Play messages with navigation (previous/next/replay)
  - Save important messages
  - Delete messages
  - Forward messages to email
- [ ] **Greeting Management**:
  - Record personal greeting
  - Use default greeting
  - Temporary greeting (out of office)

##### Advanced Menu Capabilities

- [ ] Multi-language support for menu prompts
- [ ] Custom menu configurations per phone number
- [ ] Voice-activated commands (speech recognition)
- [ ] Integration with external calendar systems
- [ ] Conditional menu flows based on time/date
- [ ] Admin menu for system management

##### Authentication & Security

- [ ] PIN-based authentication system
- [ ] Configurable PIN requirements
- [ ] Account lockout protection
- [ ] Session management for menu navigation
- [ ] Audit logging for menu actions
- [ ] Integration with external authentication systems

#### Enhanced Features

##### Advanced Recording Features

- [ ] Voicemail transcription using Cloudflare AI
- [ ] Email notifications with recording attachments
- [ ] SMS notifications for new voicemails
- [ ] Recording quality enhancement
- [ ] Automatic noise reduction
- [ ] Recording compression and optimization

##### Analytics & Reporting

- [ ] Call volume analytics dashboard
- [ ] Recording duration statistics
- [ ] Caller demographics reporting
- [ ] Usage pattern analysis
- [ ] Export capabilities for reports
- [ ] Real-time monitoring dashboard

##### Integration Capabilities

- [ ] Webhook support for external systems
- [ ] REST API for recording management
- [ ] Calendar integration for greeting automation
- [ ] CRM system integrations
- [ ] Third-party notification services
- [ ] Custom plugin architecture

##### Administrative Features

- [ ] Web-based administration interface
- [ ] Bulk configuration management
- [ ] Multi-tenant support
- [ ] Advanced security policies
- [ ] Compliance reporting (GDPR, CCPA)
- [ ] Backup and disaster recovery

#### Enterprise Features

##### Scalability Enhancements

- [ ] Auto-scaling based on call volume
- [ ] Global edge deployment optimization
- [ ] Advanced caching strategies
- [ ] Database clustering for metadata
- [ ] Load balancing improvements
- [ ] Performance monitoring and optimization

##### Enterprise Integration

- [ ] Active Directory/LDAP integration
- [ ] Single Sign-On (SSO) support
- [ ] Enterprise security compliance
- [ ] Advanced audit logging
- [ ] Custom branding capabilities
- [ ] White-label deployment options

## Provider-Specific Implementation Checklist

### For Each New Provider Integration:

#### Core Requirements

- [ ] SDK integration and authentication
- [ ] Webhook endpoint handlers
- [ ] Configuration schema updates
- [ ] Recording callback processing
- [ ] Provider-specific response format (TwiML, BXML, etc.)
- [ ] Error handling and retry logic

#### Testing Requirements

- [ ] Unit tests for provider-specific logic
- [ ] Integration tests with provider sandbox
- [ ] End-to-end call flow testing
- [ ] Load testing for high-volume scenarios
- [ ] Error scenario testing
- [ ] Documentation and examples

#### Configuration Requirements

- [ ] Environment variable schema
- [ ] Provider-specific credential management
- [ ] Webhook URL configuration
- [ ] Feature capability mapping
- [ ] Rate limiting and quota management
- [ ] Monitoring and alerting setup

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Security

For security concerns, please email security@yasogan.dev instead of using the issue tracker.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Issue Tracker](https://github.com/YasogaN/voicemail-cf/issues)

---

**Built with ❤️ using Cloudflare Workers, Hono, and TypeScript**
