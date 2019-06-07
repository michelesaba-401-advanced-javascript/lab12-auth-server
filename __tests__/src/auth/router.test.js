'use strict';

process.env.STORAGE = 'mongo';

const jwt = require('jsonwebtoken');

const { server } = require('../../../src/app.js');
const supergoose = require('../../supergoose.js');

const mockRequest = supergoose.server(server);

let users = [
  {username: 'user-admin', password: 'password1', role: 'admin'},
  {username: 'user-editor', password: 'password2', role: 'editor'},
  {username: 'user-user', password: 'password3', role: 'user'},
];

beforeAll(supergoose.startDB);
afterAll(supergoose.stopDB);

describe('Auth Router', () => {
  // For admin, editor, user, etc
  describe.each(users.map(u => [u.username, u.role, u]))(
    `User '%s' with role '%s'`,
    (username, role, user) => {
      // console.log({username, role, user});
      let id;

      it('can POST JSON to create one', () => {
        return mockRequest
          .post('/signup')
          .send(user)
          .expect(200)
          .then(({ text }) => {
            var token = jwt.verify(text, process.env.SECRET || 'changeit');
            id = token.id;

            expect(token.id).toBeDefined();
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest.post('/signin')
          .auth(username, user.password)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET || 'changeit');
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });
    }
  )
});