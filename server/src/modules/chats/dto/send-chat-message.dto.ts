import { IsString, MaxLength, MinLength } from 'class-validator';

// Used for the visitor's message and for owner/admin replies. Who sent it
// ("user" / "owner" / "admin") is decided by the server from the caller, so
// there is deliberately no "from" field here.
export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}
