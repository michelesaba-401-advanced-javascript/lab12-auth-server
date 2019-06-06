"use strict";

const supergoose = require("../../supergoose.js");
const auth = require("../../../src/auth/middleware.js");
const Users = require("../../../src/auth/users-model.js");

let users = {
  admin: { username: "admin", password: "password", role: "admin" },
  editor: { username: "editor", password: "password", role: "editor" },
  user: { username: "user", password: "password", role: "user" }
};

beforeAll(async () => {
  await supergoose.startDB();
  await new Users(users.admin).save();
  await new Users(users.editor).save();
  await new Users(users.user).save();
});

afterAll(supergoose.stopDB);

describe("Auth Middleware", () => {
  // admin:password: YWRtaW46cGFzc3dvcmQ=
  // admin:foo: YWRtaW46Zm9v

  let errorObject = {
    message: "Invalid Username/Password",
    status: 401,
    statusMessage: "Unauthorized"
  };

  describe("user authentication", () => {
    let cachedToken;

    it("fails a login for a user (admin) with the incorrect basic credentials", () => {
      let req = {
        headers: {
          authorization: "Basic YWRtaW46Zm9v"
        }
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth;

      return middleware(req, res, next).then(() => {
        expect(next).toHaveBeenCalledWith(errorObject);
        expect(req.user).not.toBeDefined();
      });
    }); // it()

    it("logs in an admin user with the right credentials", () => {
      let req = {
        headers: {
          authorization: "Basic YWRtaW46cGFzc3dvcmQ="
        }
      };
      let res = {};
      let next = jest.fn();
      let middleware = auth;

      return middleware(req, res, next).then(() => {
        cachedToken = req.token;
        expect(next).toHaveBeenCalledWith();
        expect(req.user).toBeDefined();
      });
    }); // it()

    describe("Bearer Auth", () => {
      it("returns 401 for invalid Bearer token", async () => {
        //  Arrange
        let req = {
          headers: {
            authorization: "Bearer oops"
          }
        };
        let res = {};
        let next = jest.fn();
        let middleware = auth;

        // Act
        await middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledWith(errorObject);
        expect(req.user).not.toBeDefined();
      });

      it("returns 200 with token for valid Bearer token", async () => {
        //  Arrange
        let req = {
          headers: {
            authorization: `Bearer ${cachedToken}`
          }
        };
        let res = {};
        let next = jest.fn();
        let middleware = auth;

        // Act
        await middleware(req, res, next);

        // Assert
        expect(next).toHaveBeenCalledWith();
        expect(req.user).toBeDefined();
      });
    });
  });
});
