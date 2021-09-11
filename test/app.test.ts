import request from 'supertest';

import app from '../src/app';

describe('Endpoints test', () => {
  test('should test "/"', function (done) {
    request(app)
      .get('/')
      .expect(/Server is running!/i)
      .end(done);
  });
});
