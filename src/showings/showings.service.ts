import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type QueryFilter } from 'mongoose';
import { CreateShowingDto, ShowingQueryDto } from '../dto.js';
import { Film } from '../films/film.schema.js';
import { Hall } from '../halls/hall.schema.js';
import { HallsService } from '../halls/halls.service.js';
import { ShowingCreatedResponse, ShowingSeatResponse } from '../responses.js';
import { ShowingItemDto } from './showing-page.dto.js';
import { Showing } from './showing.schema.js';

type Names = {
  film: Pick<Film, 'title'> | null;
  hall: Pick<Hall, 'name'> | null;
};

@Injectable()
export class ShowingsService {
  constructor(
    @InjectModel(Showing.name) private readonly showings: Model<Showing>,
    @InjectModel(Film.name) private readonly films: Model<Film>,
    @InjectModel(Hall.name) private readonly halls: Model<Hall>,
    private readonly hallLayout: HallsService,
  ) {}

  async create(data: CreateShowingDto) {
    const film = new Types.ObjectId(data.filmId);
    const hall = new Types.ObjectId(data.hallId);
    const startsAt = new Date(data.startsAt);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      startsAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('startsAt must be in the future');
    }
    const [foundFilm, layout] = await Promise.all([
      this.films.exists({ _id: film }),
      this.halls.findById(hall).select('rows seatsPerRow').lean(),
    ]);
    if (!foundFilm) throw new BadRequestException('filmId: film not found');
    if (!layout) throw new BadRequestException('hallId: hall not found');
    if (layout.rows * layout.seatsPerRow > 10_000) {
      throw new BadRequestException('Hall layout exceeds 10000 seats');
    }
    const seats = this.hallLayout
      .seats(layout)
      .map((place) => ({ ...place, bookingId: null }));
    return ShowingCreatedResponse.from(
      await this.showings.create({
        film,
        hall,
        startsAt,
        price: data.price,
        seats,
        bookings: [],
      }),
    );
  }

  async get(id: Types.ObjectId) {
    const showing = await this.showings
      .findById(id)
      .select('film hall startsAt price')
      .populate<Names>([
        { path: 'film', select: 'title' },
        { path: 'hall', select: 'name' },
      ])
      .lean();
    if (!showing) throw new NotFoundException('Showing not found');
    return ShowingItemDto.from(showing);
  }

  async all({
    filmId,
    date,
    page = 1,
    limit = 20,
    sort = 'asc',
  }: ShowingQueryDto) {
    const filter: QueryFilter<Showing> = {};
    if (filmId) filter.film = new Types.ObjectId(filmId);
    if (date) {
      const start = new Date(date + 'T00:00:00Z');
      const end = new Date(start.getTime() + 86_400_000);
      filter.startsAt = { $gte: start, $lt: end };
    }
    const offset = Math.min((page - 1) * limit, Number.MAX_SAFE_INTEGER);
    const [showings, total] = await Promise.all([
      this.showings
        .find(filter)
        .select('film hall startsAt price')
        .sort({ startsAt: sort, _id: 1 })
        .skip(offset)
        .limit(limit)
        .populate<Names>([
          { path: 'film', select: 'title' },
          { path: 'hall', select: 'name' },
        ])
        .lean(),
      this.showings.countDocuments(filter),
    ]);
    return { items: showings.map(ShowingItemDto.from), total, page, limit };
  }

  async seats(id: Types.ObjectId) {
    const showing = await this.showings.findById(id).select('seats').lean();
    if (!showing) throw new NotFoundException('Showing not found');
    return showing.seats.map(ShowingSeatResponse.from);
  }
}
