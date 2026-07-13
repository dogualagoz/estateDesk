import { IsString, Length } from 'class-validator';

export class SendFeedbackDto {
  @IsString()
  @Length(1, 4000)
  body!: string;
}
