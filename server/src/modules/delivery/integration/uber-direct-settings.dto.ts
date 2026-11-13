import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const noSpaces = { message: 'Must not contain spaces' };

/** The four values from the restaurant's own Uber Direct dashboard (Developer tab and its webhook). */
export class SaveUberDirectDto {
  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/^\S+$/, noSpaces)
  clientId: string;

  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^\S+$/, noSpaces)
  clientSecret: string;

  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(/^\S+$/, noSpaces)
  customerId: string;

  @Transform(trimmed)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Matches(/^\S+$/, noSpaces)
  signingKey: string;
}
