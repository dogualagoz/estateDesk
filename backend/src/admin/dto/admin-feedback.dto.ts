import { IsBoolean, IsString, Length } from 'class-validator';

export class AdminFeedbackReplyDto {
  @IsString()
  @Length(1, 4000)
  body!: string;
}

export class AdminOfficeFeedbackToggleDto {
  @IsBoolean()
  enabled!: boolean;
}
