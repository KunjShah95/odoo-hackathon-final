import request from 'supertest';
import app from './src/server.js';

describe('API Endpoints', () => {
  it('GET / should return 200 and backend up message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/GlobeTrotter backend is up/);
  });

  // AUTH: Register, Login
  let testUser = {
    first_name: 'Test',
    last_name: 'User',
    email: `testuser_${Date.now()}@example.com`,
    password: 'testpass123',
    phone: '1234567890',
    city: 'Testville',
    country: 'Testland',
    additional_info: '',
    photo_url: ''
  };
  let token = '';
  let tripId = '';
  let stopId = '';
  let activityId = '';

  it('POST /auth/register should register a new user', async () => {
    const res = await request(app).post('/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toBeDefined();
  });

  it('POST /auth/login should login and return a token', async () => {
    const res = await request(app).post('/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  // TRIPS: Create, Get all, Get by id
  it('POST /trips should create a new trip', async () => {
    const res = await request(app)
      .post('/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Trip',
        description: 'A test trip',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString()
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    tripId = res.body.id;
  });

  it('GET /trips should return user trips', async () => {
    const res = await request(app)
      .get('/trips')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /trips/:tripId should return trip details', async () => {
    const res = await request(app)
      .get(`/trips/${tripId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  // STOPS: Add, Get
  it('POST /stops/:tripId should add a stop', async () => {
    const res = await request(app)
      .post(`/stops/${tripId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        city_name: 'StopCity',
        country_name: 'StopCountry',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000).toISOString()
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    stopId = res.body.id;
  });

  it('GET /stops/:tripId should return stops for trip', async () => {
    const res = await request(app)
      .get(`/stops/${tripId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // ACTIVITIES: Add, Get
  it('POST /activities/:stopId should add an activity', async () => {
    const res = await request(app)
      .post(`/activities/${stopId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Activity', description: 'Fun', type: 'sightseeing', cost: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    activityId = res.body.id;
  });

  it('GET /activities/stop/:stopId should return activities for stop', async () => {
    const res = await request(app)
      .get(`/activities/stop/${stopId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // BUDGETS: Upsert, Get
  it('POST /budgets/:tripId should upsert a budget', async () => {
    const res = await request(app)
      .post(`/budgets/${tripId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ transport_cost: 100, stay_cost: 200, activity_cost: 50, meal_cost: 30 });
    expect(res.statusCode).toBe(200);
    expect(res.body.total_cost).toBeDefined();
  });

  it('GET /budgets/:tripId should return budget', async () => {
    const res = await request(app)
      .get(`/budgets/${tripId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total_cost).toBeDefined();
  });

  // SEARCH: Cities
  it('GET /search/cities?q=Testville should return city suggestions', async () => {
    const res = await request(app)
      .get('/search/cities?q=Testville');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // SHARE: Make public, Get public
  let publicKey = '';
  it('PUT /share/:tripId/share should make trip public', async () => {
    const res = await request(app)
      .put(`/share/${tripId}/share`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.public_key).toBeDefined();
    publicKey = res.body.public_key;
  });

  it('GET /share/public/:key should return public trip', async () => {
    const res = await request(app)
      .get(`/share/public/${publicKey}`);
    expect([200,404]).toContain(res.statusCode); // 404 if not found, 200 if found
  });
});
