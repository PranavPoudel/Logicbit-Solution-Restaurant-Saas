import {
  ArrayMaxSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Stateless "general" chat (not tied to one restaurant): nothing is stored.
export class GeneralChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  // Recent turns from the widget so the model has context. Untrusted input:
  // the service re-validates each entry and caps the length.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  history?: { from: string; text: string }[];

  // Visitor's browser geolocation, sent only when granted. Used only for
  // "closest kitchen to me" style questions.
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
