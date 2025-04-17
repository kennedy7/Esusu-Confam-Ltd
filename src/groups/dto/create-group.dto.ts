import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['public', 'private'])
  visibility: 'public' | 'private';

  @IsNumber()
  @Min(1)
  maxCapacity: number;
}
