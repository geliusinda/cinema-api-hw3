import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsObject,
  IsInt,
  IsIn,
  Max,
  IsISO8601,
  IsString,
  IsMongoId,
  Matches,
  Min,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { objectIdSchema } from './database/object-id.pipe.js';
import { Transform, Type } from 'class-transformer';
export class CreateFilmDto {
  @ApiProperty() @IsString() @Matches(/\S/) title!: string;
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  durationMinutes!: number;
  @ApiProperty({ example: 2026, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  releaseYear!: number;
}
export class UpdateFilmDto extends PartialType(CreateFilmDto, {
  skipNullProperties: false,
}) {}
export class CreateHallDto {
  @ApiProperty() @IsString() @Matches(/\S/) name!: string;
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  rows!: number;
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  seatsPerRow!: number;
}
export class CreateShowingDto {
  @ApiProperty(objectIdSchema)
  @IsMongoId({
    message: '$property must be a 24-character hexadecimal ObjectId',
  })
  filmId!: string;
  @ApiProperty(objectIdSchema)
  @IsMongoId({
    message: '$property must be a 24-character hexadecimal ObjectId',
  })
  hallId!: string;
  @ApiProperty({ example: '2099-06-15T12:00:00Z' })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
  )
  startsAt!: string;
  @ApiProperty({ minimum: 1, example: 12500 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  price!: number;
}
export class ShowingQueryDto {
  @ApiPropertyOptional(objectIdSchema)
  @IsMongoId({
    message: '$property must be a 24-character hexadecimal ObjectId',
  })
  @OptionalUndefined()
  filmId?: string;
  @ApiPropertyOptional({ example: '2099-06-15' })
  @OptionalUndefined()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, default: 1 })
  @OptionalUndefined()
  @QueryInteger()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  page?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @OptionalUndefined()
  @QueryInteger()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @OptionalUndefined()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
function QueryInteger(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && /^[0-9]+$/.test(value) ? Number(value) : value,
  );
}
function OptionalUndefined(): PropertyDecorator {
  return (target, key) => {
    ValidateIf((_o: unknown, value: unknown) => value !== undefined)(
      target,
      key,
    );
  };
}
export class SeatDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  row!: number;
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  seat!: number;
}
export class CreateBookingDto {
  @ApiProperty({ type: [SeatDto], minItems: 1 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((s: SeatDto | null) => (s ? s.row + ':' + s.seat : s), {
    message: 'seats must not contain duplicate places',
  })
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  seats!: SeatDto[];
}
