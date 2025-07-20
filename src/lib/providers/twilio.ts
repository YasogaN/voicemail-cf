import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { BaseProvider } from "@/lib/providers/base";
import { ProviderConfigType } from "@/types";

interface TwilioConfig extends ProviderConfigType {
  provider: "twilio";
  apiKey: string;
  apiSecret: string;
  numbers: [string, ...string[]];
  recording: {
    type: "url" | "text";
    url?: string;
    text?: string;
    maxLength: number;
  };
  endpoint: string;
}

export class TwilioProvider extends BaseProvider {
  declare protected config: TwilioConfig;

  constructor(config: ProviderConfigType) {
    super(config);
    this.config = config as TwilioConfig;
  }

  createIncomingCallResponse(fromNumber: string): string {
    const twiml = new VoiceResponse();

    if (this.config.numbers.includes(fromNumber)) {
      twiml.redirect({ method: "GET" }, `${this.config.endpoint}/menu`);
    } else {
      twiml.redirect({ method: "GET" }, `${this.config.endpoint}/record`);
    }

    return twiml.toString();
  }

  createHangupResponse(): string {
    const twiml = new VoiceResponse();
    twiml.hangup();
    return twiml.toString();
  }

  createRecordingResponse(): string {
    const twiml = new VoiceResponse();

    if (this.config.recording.type === 'url') {
      twiml.play(this.config.recording.url!);
    } else if (this.config.recording.type === 'text') {
      twiml.say(this.config.recording.text!);
    }

    twiml.record({
      action: `${this.config.endpoint}/hangup`,
      method: 'GET',
      maxLength: this.config.recording.maxLength,
      playBeep: true,
      recordingStatusCallback: `${this.config.endpoint}/store`,
      recordingStatusCallbackEvent: ["completed"],
      recordingStatusCallbackMethod: 'POST',
    });

    return twiml.toString();
  }

  async fetchRecordingMetadata(recordingUrl: string): Promise<any> {
    const authHeader = 'Basic ' + btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
    const metadataUrl = recordingUrl + ".json";

    const response = await fetch(metadataUrl, {
      headers: {
        Authorization: authHeader
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recording metadata");
    }

    return await response.json();
  }

  async fetchCallDetails(accountSid: string, callSid: string): Promise<any> {
    const authHeader = 'Basic ' + btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
    const callApiUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callSid}.json`;

    const response = await fetch(callApiUrl, {
      headers: {
        Authorization: authHeader
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch call details");
    }

    return await response.json();
  }

  async fetchRecordingFile(recordingUrl: string): Promise<ArrayBuffer> {
    const authHeader = 'Basic ' + btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
    const mediaUrl = recordingUrl + ".mp3";

    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: authHeader
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recording file");
    }

    return await response.arrayBuffer();
  }

  async deleteRecording(recordingUrl: string): Promise<void> {
    const authHeader = 'Basic ' + btoa(`${this.config.apiKey}:${this.config.apiSecret}`);
    const metadataUrl = recordingUrl + ".json";

    const response = await fetch(metadataUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader
      }
    });

    if (!response.ok) {
      throw new Error("Failed to delete recording from Twilio");
    }
  }
}
