import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, ValidateIf } from 'class-validator';

export const EMAIL_SUBJECT_MAX = 120;
export const EMAIL_BODY_MAX = 5000;

export class SendCustomerEmailDto {
  @IsIn(['ALL', 'ONE'])
  audience: 'ALL' | 'ONE';

  @ValidateIf((o) => o.audience === 'ONE')
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'subject must not be blank' })
  @MaxLength(EMAIL_SUBJECT_MAX)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'body must not be blank' })
  @MaxLength(EMAIL_BODY_MAX)
  body: string;
}
