import { IsString, Length } from 'class-validator';

export class SubmitAccessDto {
  /** Attendee's display name, captured before viewing. */
  @IsString()
  @Length(1, 200)
  attendeeName!: string;
}
