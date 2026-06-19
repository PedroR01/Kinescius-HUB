import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class GenerarTokenDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  claseId!: number;
}
