import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Film, FilmSchema } from './film.schema.js';
import { Showing, ShowingSchema } from '../showings/showing.schema.js';
import { FilmsController } from './films.controller.js';
import { FilmsService } from './films.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Film.name, schema: FilmSchema },
      { name: Showing.name, schema: ShowingSchema },
    ]),
  ],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService, MongooseModule],
})
export class FilmsModule {}
