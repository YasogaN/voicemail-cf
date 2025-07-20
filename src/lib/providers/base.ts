import { ProviderConfigType } from "../../types";

export abstract class BaseProvider {
  protected config: ProviderConfigType;

  constructor(config: ProviderConfigType) {
    this.config = config;
  }

  abstract createIncomingCallResponse(fromNumber: string): string;
  abstract createHangupResponse(): string;
  abstract createRecordingResponse(): string;
  abstract fetchRecordingMetadata(recordingUrl: string): Promise<any>;
  abstract fetchCallDetails(accountSid: string, callSid: string): Promise<any>;
  abstract fetchRecordingFile(recordingUrl: string): Promise<ArrayBuffer>;
  abstract deleteRecording(recordingUrl: string): Promise<void>;
}

export interface RecordingMetadata {
  recordingSid: string;
  callSid: string;
  start_time: string;
  duration: string;
  from: string;
  timestamp: string;
  mediaFile: string;
}
