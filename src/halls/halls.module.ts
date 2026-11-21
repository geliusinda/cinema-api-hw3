import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Hall, HallSchema } from './hall.schema.js';
import { Showing, ShowingSchema } from '../showings/showing.schema.js';
import { HallsController } from './halls.controller.js';
import { HallsService } from './halls.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hall.name, schema: HallSchema },
      { name: Showing.name, schema: ShowingSchema },
    ]),
  ],
  controllers: [HallsController],
  providers: [HallsService],
  exports: [HallsService, MongooseModule],
})
export class HallsModule {}
