import { ApiProperty } from '@nestjs/swagger';
import { objectIdSchema } from '../database/object-id.pipe.js';
import type { Film } from '../films/film.schema.js';
import type { Hall } from '../halls/hall.schema.js';
import type { Showing } from './showing.schema.js';

type ShowingWithNames = Pick<Showing, '_id' | 'startsAt' | 'price'> & {
  film: Pick<Film, 'title'> | null;
  hall: Pick<Hall, 'name'> | null;
};

export class ShowingItemDto {
  @ApiProperty(objectIdSchema) id!: string;
  @ApiProperty({ type: String, nullable: true }) filmTitle!: string | null;
  @ApiProperty({ type: String, nullable: true }) hallName!: string | null;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty({ description: 'Price in kopecks' }) price!: number;

  static from(
    this: void,
    { _id, film, hall, startsAt, price }: ShowingWithNames,
  ): ShowingItemDto {
    return {
      id: _id.toHexString(),
      filmTitle: film?.title ?? null,
      hallName: hall?.name ?? null,
      startsAt: startsAt.toISOString(),
      price,
    };
  }
}

export class ShowingPageDto {
  @ApiProperty({ type: [ShowingItemDto] }) items!: ShowingItemDto[];
  @ApiProperty({ minimum: 0 }) total!: number;
  @ApiProperty({ minimum: 1 }) page!: number;
  @ApiProperty({ minimum: 1, maximum: 100 }) limit!: number;
}
