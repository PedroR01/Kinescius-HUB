import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from "class-validator";

export class CreateClaseDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "La fecha debe tener el formato YYYY-MM-DD",
  })
  fecha!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: "La hora debe tener el formato HH:mm",
  })
  hora!: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, {
    message: "El DNI del profesor debe tener entre 7 y 8 dígitos",
  })
  profesorDni?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  cupo?: number;
}