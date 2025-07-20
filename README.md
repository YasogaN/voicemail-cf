# Voicemail Service for Cloudflare Workers

A scalable, cloud-native voicemail service built on Cloudflare Workers that provides automated voice recording, storage, and management capabilities. The service offers multi-provider support with robust error handling and comprehensive logging.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YasogaN/voicemail-cf)

## Features

- 🚀 **Serverless Architecture**: Built on Cloudflare Workers for global edge deployment
- 📞 **Multi-Provider Support**: Currently supports Twilio with extensible architecture for additional providers
- 🔊 **Flexible Recording Options**: Support for both URL-based audio prompts and text-to-speech
- 💾 **Cloud Storage**: Automatic recording storage using Cloudflare R2
- 📋 **Comprehensive Logging**: Detailed call metadata and recording indexing
- 🔧 **Configuration-Driven**: Environment-based configuration for easy deployment
- 📖 **OpenAPI Documentation**: Auto-generated API documentation with interactive interface using Chanfana
- 🛡️ **Type Safety**: Full TypeScript implementation with Zod validation
- ✅ **Comprehensive Testing**: Unit and integration tests with Vitest

## Architecture

The service is built using modern web technologies:

- **Runtime**: Cloudflare Workers
- **Framework**: Hono with Chanfana for OpenAPI support
- **Storage**: Cloudflare R2 for recording files and metadata
- **Validation**: Zod for runtime type checking
- **Voice Processing**: Provider-specific SDKs (Twilio)
- **Testing**: Vitest with comprehensive test coverage
- **Type Safety**: TypeScript with strict configuration

## Quick Start

### Prerequisites

- [Cloudflare Workers account](https://workers.dev) (free tier sufficient)
- [Node.js 16+](https://nodejs.org/) (specified in package.json engines)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/YasogaN/voicemail-cf.git
   cd voicemail-cf
   ```

2. **Install dependencies**

   ```bash
   yarn install
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

## Testing

The project includes comprehensive testing with Vitest:

### Test Structure

- **Unit Tests**: Individual endpoint and provider logic testing
- **Integration Tests**: End-to-end workflow testing (placeholder directory ready)
- **Configuration Tests**: Environment variable validation testing
- **Mock Support**: R2 bucket mocking with `cloudflare-test-utils`

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage report
yarn run test:coverage

# Run tests in watch mode during development
yarn run test:watch
```

### Test Coverage

The test suite covers:

- All API endpoints (`/health`, `/incoming`, `/record`, `/hangup`, `/store`)
- Provider implementations (Twilio)
- Configuration validation and parsing
- Error handling scenarios
- TwiML response generation

### Development

1. **Start local development server**

   ```bash
   yarn run dev
   ```

   This starts the Wrangler development server with hot reloading.

2. **Access the API documentation**
   Open `http://localhost:8787/` to view the interactive OpenAPI documentation powered by Chanfana.

3. **Test endpoints**
   The Swagger interface allows you to test all endpoints directly from the browser, or use tools like curl/Postman.

4. **Run tests during development**

   ```bash
   yarn run test:watch
   ```

5. **Generate TypeScript types**
   ```bash
   yarn run cf-typegen
   ```
   This generates types based on your Cloudflare Workers environment.

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

The current implementation provides the following call flow:

1. **Incoming Call** → `/incoming`

   - Checks if caller number is in authorized numbers list
   - **Authorized numbers**: Redirected to `/menu` (currently returns 404 - menu system planned)
   - **Unauthorized numbers**: Redirected to `/record` for voicemail recording

2. **Recording** → `/record`

   - Plays configured prompt (audio file or text-to-speech)
   - Initiates voice recording with specified parameters
   - Automatically proceeds to hangup after recording

3. **Completion** → `/hangup`

   - Terminates call after recording completion
   - Returns TwiML hangup instruction

4. **Storage** → `/store`
   - Receives recording callback from provider (currently Twilio)
   - Downloads recording metadata and file
   - Stores recording in Cloudflare R2 bucket
   - Updates central index with call metadata

**Note**: The menu system for authorized callers is planned but not yet implemented. Currently, authorized numbers will receive a 404 response when redirected to `/menu`.

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
├── index.ts              # Main application router with OpenAPI setup
├── types.ts              # TypeScript type definitions and Zod schemas
├── endpoint/             # API endpoint handlers
│   ├── health.ts         # Health check endpoint
│   ├── incoming.ts       # Incoming call handler
│   ├── record.ts         # Recording endpoint with TwiML generation
│   ├── hangup.ts         # Call termination handler
│   └── store.ts          # Recording storage and metadata handler
├── lib/
│   ├── config.ts         # Environment configuration management
│   └── providers/        # Voice service provider implementations
│       ├── base.ts       # Base provider abstract class
│       ├── index.ts      # Provider factory and exports
│       └── twilio.ts     # Twilio provider implementation
└── test/                 # Comprehensive test suite
    ├── setup.ts          # Test environment setup
    ├── types.test.ts     # Type validation tests
    ├── endpoint/         # Endpoint-specific tests
    │   ├── hangup.test.ts
    │   ├── health.test.ts
    │   ├── incoming.test.ts
    │   ├── record.test.ts
    │   └── store.test.ts
    ├── integration/      # Integration test placeholder
    └── lib/
        └── config.test.ts # Configuration validation tests
```

## Development Guidelines

### Adding New Endpoints

1. Create a new file in `src/endpoint/`
2. Implement the `OpenAPIRoute` class from Chanfana
3. Define the OpenAPI schema with proper Zod validation
4. Register the route in `src/index.ts`

### Adding New Providers

1. Create a new provider class in `src/lib/providers/`
2. Extend the `BaseProvider` abstract class
3. Implement all required methods for call handling
4. Add the provider to the factory function in `src/lib/providers/index.ts`
5. Update the `ProviderConfig` discriminated union in `src/types.ts`

### Error Handling

All endpoints implement comprehensive error handling:

- Input validation using Zod schemas
- Provider-specific error handling
- Graceful degradation for service failures
- Detailed error logging

### Testing

The project includes comprehensive testing with Vitest:

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn run test:coverage

# Run tests in watch mode
yarn run test:watch

# Run development server
yarn run dev

# Generate TypeScript types from Wrangler
yarn run cf-typegen

# Deploy to production
yarn run deploy
```

## Roadmap

### Current Status (Q3 2025)

The project currently includes:

- ✅ **Core Voicemail Functionality**: Complete recording, storage, and retrieval system
- ✅ **Twilio Integration**: Full support for Twilio voice services
- ✅ **Cloudflare R2 Storage**: Automatic recording and metadata storage
- ✅ **OpenAPI Documentation**: Interactive API documentation with Chanfana
- ✅ **Comprehensive Testing**: Unit and integration tests with Vitest
- ✅ **Type Safety**: Full TypeScript implementation with Zod validation

### Planned Features

#### Multi-Provider Support

- [ ] **Plivo Integration**: SDK integration and webhook handlers
- [ ] **Telnyx Integration**: Call Control API integration
- [ ] **SignalWire Integration**: LaML response format support
- [ ] **Bandwidth Integration**: Voice API and BXML support

#### Enhanced Voicemail System

- [ ] **Interactive Voice Menu**: DTMF input handling and menu navigation
- [ ] **Message Management**: Play, save, delete, and forward capabilities
- [ ] **Authentication System**: PIN-based access control
- [ ] **Multi-language Support**: Localized prompts and menus

#### Advanced Features

- [ ] **AI-Powered Transcription**: Using Cloudflare AI for speech-to-text
- [ ] **Email Notifications**: Recording attachments via email
- [ ] **SMS Notifications**: Text alerts for new voicemails
- [ ] **Analytics Dashboard**: Call volume and usage statistics
- [ ] **Webhook Integration**: External system notifications

## Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. Fork the repository
2. Clone your fork and navigate to the project directory
3. Install dependencies: `yarn install`
4. Set up your environment variables for testing
5. Run tests to ensure everything works: `yarn test`
6. Start the development server: `yarn dev`

### Making Changes

1. Create a feature branch from main
2. Make your changes with appropriate tests
3. Ensure all tests pass: `yarn test`
4. Verify type safety: `yarn cf-typegen`
5. Test your changes in the development environment
6. Submit a pull request with a clear description

### Code Quality

- Follow TypeScript best practices
- Add comprehensive tests for new functionality
- Use Zod schemas for validation
- Follow the existing code structure and patterns
- Ensure OpenAPI documentation is updated for new endpoints

## Security

For security concerns, please email security@yasogan.dev instead of using the issue tracker.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Issue Tracker](https://github.com/YasogaN/voicemail-cf/issues)
- 📖 [Documentation](https://github.com/YasogaN/voicemail-cf/blob/main/README.md)
- 🚀 [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

---

**Built with ❤️ using Cloudflare Workers, Hono, Chanfana, and TypeScript**
