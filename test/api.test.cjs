const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { randomUUID } = require('node:crypto');
void test('Cinema HTTP lifecycle, validation, filtering and atomic booking', async () => {
  const { NestFactory } = await import('@nestjs/core');
  const { getModelToken } = await import('@nestjs/mongoose');
  const { AppModule } = await import('../dist/app.module.js');
  const { setup } = await import('../dist/setup.js');
  const app = await NestFactory.create(AppModule, { logger: false });
  setup(app);
  await app.init();
  const films = app.get(getModelToken('Film'));
  const halls = app.get(getModelToken('Hall'));
  const showings = app.get(getModelToken('Showing'));
  const fixture = randomUUID();
  const filmIds = [];
  const hallIds = [];
  const api = request(app.getHttpServer());
  const missing = '000000000000000000000000';
  try {
    for (const route of ['/films', '/halls', '/showings', '/bookings']) {
      const method = route === '/bookings' ? 'delete' : 'get';
      await api[method](route + '/invalid').expect(400);
    }
    const f = {
      title: 'Film ' + fixture,
      durationMinutes: 90,
      releaseYear: 2026,
    };
    const h = { name: 'Main ' + fixture, rows: 3, seatsPerRow: 5 };
    for (const body of [
      {},
      { ...f, title: 1 },
      { ...f, durationMinutes: 0 },
      { ...f, releaseYear: '2026' },
    ])
      await api.post('/films').send(body).expect(400);
    const film = (
      await api
        .post('/films')
        .send({ ...f, ignored: 'value' })
        .expect(201)
    ).body;
    filmIds.push(film.id);
    assert.equal(film.ignored, undefined);
    await api.get('/films/' + film.id).expect(200);
    await api
      .patch('/films/' + film.id)
      .send({ title: 'Updated' })
      .expect(200);
    await api
      .patch('/films/' + film.id)
      .send({ title: null })
      .expect(400);
    await api
      .patch('/films/' + film.id)
      .send({ durationMinutes: 1.5 })
      .expect(400);
    for (const method of ['get', 'patch', 'delete'])
      await api[method]('/films/' + missing)
        .send({})
        .expect(404);
    const hall = (await api.post('/halls').send(h).expect(201)).body;
    hallIds.push(hall.id);
    await api.post('/halls').send(h).expect(409);
    for (const body of [
      {},
      { ...h, rows: 0 },
      { ...h, seatsPerRow: 1.5 },
      { ...h, rows: '3' },
    ])
      await api.post('/halls').send(body).expect(400);
    assert.equal(
      (await api.get('/halls/' + hall.id).expect(200)).body.seats.length,
      15,
    );
    await api.get('/halls').expect(200);
    await api.get('/halls/' + missing).expect(404);
    await api.delete('/halls/' + missing).expect(404);
    const s = {
      filmId: film.id,
      hallId: hall.id,
      startsAt: '2099-06-15T12:00:00Z',
      price: 12500,
    };
    for (const body of [
      {},
      { ...s, filmId: missing },
      { ...s, hallId: missing },
      { ...s, startsAt: '2000-01-01T00:00:00Z' },
      { ...s, startsAt: '2099-02-30T12:00:00Z' },
      { ...s, startsAt: 'no' },
      { ...s, price: 0 },
      { ...s, price: 1.5 },
    ])
      await api.post('/showings').send(body).expect(400);
    const showing = (await api.post('/showings').send(s).expect(201)).body;
    const same = (await api.post('/showings').send(s).expect(201)).body;
    const early = (
      await api
        .post('/showings')
        .send({ ...s, startsAt: '2099-06-14T23:00:00Z' })
        .expect(201)
    ).body;
    const list = (await api.get('/showings?filmId=' + film.id).expect(200))
      .body;
    assert.deepEqual(
      list.items.map((x) => x.id),
      [
        early.id,
        ...[showing.id, same.id].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
      ],
    );
    assert.equal(list.items[0].filmTitle, 'Updated');
    assert.equal(list.items[0].hallName, h.name);
    assert.equal(list.items[0].filmId, undefined);
    for (const query of ['?date=2099-06-15&filmId=' + film.id])
      assert.equal(
        (await api.get('/showings' + query).expect(200)).body.items.length,
        2,
      );
    assert.equal(
      (await api.get('/showings?filmId=' + film.id).expect(200)).body.items
        .length,
      3,
    );
    assert.deepEqual(
      (await api.get('/showings?filmId=' + missing).expect(200)).body,
      { items: [], total: 0, page: 1, limit: 20 },
    );
    for (const date of ['2099-02-30', '15-06-2099'])
      await api.get('/showings?date=' + date).expect(400);
    const descending = (
      await api
        .get('/showings?filmId=' + film.id + '&page=2&limit=2&sort=desc')
        .expect(200)
    ).body;
    assert.deepEqual(
      descending.items.map((item) => item.id),
      [early.id],
    );
    assert.equal(descending.total, 3);
    assert.equal(descending.page, 2);
    assert.equal(descending.limit, 2);
    for (const query of [
      'page=0',
      'page=1.5',
      'limit=101',
      'limit=0',
      'sort=newest',
    ]) {
      const path = '/showings?' + query;
      const error = (await api.get(path).expect(400)).body;
      assert.deepEqual(
        Object.keys(error).sort((a, b) => a.localeCompare(b)),
        ['message', 'path', 'statusCode'],
      );
      assert.equal(error.path, path);
    }
    await api.get('/showings/' + showing.id).expect(200);
    await api.get('/showings/' + missing).expect(404);
    await api.delete('/films/' + film.id).expect(409);
    await api.delete('/halls/' + hall.id).expect(409);
    const route = '/showings/' + showing.id;
    for (const suffix of ['/seats', '/bookings'])
      await api.get('/showings/' + missing + suffix).expect(404);
    await api
      .post('/showings/' + missing + '/bookings')
      .send({ seats: [{ row: 1, seat: 1 }] })
      .expect(404);
    for (const seats of [
      [],
      [{ row: 1 }],
      [{ row: 1, seat: '1' }],
      [
        { row: 1, seat: 1 },
        { row: 1, seat: 1 },
      ],
      [{ row: 4, seat: 1 }],
      [{ row: 1, seat: 6 }],
      [{ row: 0, seat: 1 }],
      [{ row: 1, seat: 1.5 }],
      [null],
    ])
      await api
        .post(route + '/bookings')
        .send({ seats })
        .expect(400);
    assert.deepEqual((await api.get(route + '/bookings').expect(200)).body, []);
    const booking = (
      await api
        .post(route + '/bookings')
        .send({
          seats: [
            { row: 1, seat: 1 },
            { row: 1, seat: 2 },
          ],
        })
        .expect(201)
    ).body;
    assert.equal(booking.totalPrice, 25000);
    await api
      .post(route + '/bookings')
      .send({
        seats: [
          { row: 1, seat: 3 },
          { row: 1, seat: 1 },
        ],
      })
      .expect(409);
    const seats = (await api.get(route + '/seats').expect(200)).body;
    assert.equal(seats.length, 15);
    assert.equal(seats.filter((s) => s.isBooked).length, 2);
    assert.equal(seats[2].isBooked, false);
    assert.equal(
      (await api.get(route + '/bookings').expect(200)).body.length,
      1,
    );
    await api
      .post('/showings/' + same.id + '/bookings')
      .send({ seats: [{ row: 1, seat: 1 }] })
      .expect(201);
    const deleted = await api.delete('/bookings/' + booking.id).expect(204);
    assert.equal(deleted.text, '');
    assert.equal(
      (await api.get(route + '/seats').expect(200)).body.filter(
        (s) => s.isBooked,
      ).length,
      0,
    );
    await api
      .post(route + '/bookings')
      .send({ seats: [{ row: 1, seat: 1 }] })
      .expect(201);
    await api.delete('/bookings/' + booking.id).expect(404);
    await api.delete('/bookings/' + missing).expect(404);
    const competing = await Promise.all([
      api.post(route + '/bookings').send({ seats: [{ row: 2, seat: 1 }] }),
      api.post(route + '/bookings').send({ seats: [{ row: 2, seat: 1 }] }),
    ]);
    assert.deepEqual(
      competing.map(({ status }) => status).sort((a, b) => a - b),
      [201, 409],
    );
    const tempFilm = (await api.post('/films').send(f)).body;
    await api.delete('/films/' + tempFilm.id).expect(204);
    const tempHall = (
      await api.post('/halls').send({ ...h, name: 'Temporary' })
    ).body;
    await api.delete('/halls/' + tempHall.id).expect(204);
    const spec = (await api.get('/docs-json').expect(200)).body;
    assert.ok(spec.paths['/showings/{id}/bookings'].post.responses['409']);
    await api.get('/docs').expect(200);
  } finally {
    try {
      await showings.deleteMany({ film: { $in: filmIds } });
      await films.deleteMany({ _id: { $in: filmIds } });
      await halls.deleteMany({ _id: { $in: hallIds } });
    } finally {
      await app.close();
    }
  }
});
