import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class StartChatDto {
  // The restaurant whose storefront the widget is on. The tenant is looked up
  // from this on the server, never taken from the client.
  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  visitorName?: string;
}
