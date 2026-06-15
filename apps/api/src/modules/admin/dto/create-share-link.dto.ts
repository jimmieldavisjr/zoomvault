import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateShareLinkDto {
  /**
   * Optional override for the link lifetime. Falls back to
   * DEFAULT_LINK_EXPIRATION_DAYS when omitted.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expirationDays?: number;
}
