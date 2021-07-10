import mock from "xhr-mock";

import RemoteRequest, { ResponseType } from "../remote-request";

beforeAll(function() {
  mock.setup()
});

afterEach(function() {
  mock.reset()
});

afterAll(function() {
  mock.teardown()
});

describe("constructor()", function() {
  it("sets up a GET request by default", function() {
    expect.assertions(1);

    mock.get("/get", function(req, res) {
      expect(req.method()).toEqual("GET");

      return res.status(200);
    });

    new RemoteRequest("/get").send();
  });

  it.each([
    ["get", "GET"], ["post", "POST"],
    ["put", "PUT"], ["patch", "PATCH"],
    ["delete", "DELETE"]
  ])("can setup a %s|%s request", function(lowercased, uppercased) {
    expect.assertions(2);

    const path = "/" + lowercased;
    mock.use(lowercased, path, function(req, res) {
      expect(req.method()).toEqual(uppercased);

      return res.status(200);
    });

    [lowercased, uppercased].forEach(function(method) {
      new RemoteRequest(path, method).send();
    });
  });

  it("throws an error when the method is unsupported", function() {
    expect(function() {
      new RemoteRequest("/method", "UNSUPPORTED")
    }).toThrow(new Error(
      "`method` unsupported. " +
        "Supported methods: GET|POST|PUT|PATCH|DELETE (case insensitively)."
    ));
  });
});

describe("send()", function() {
  describe("when body is not provided", function() {
    it.each([
      ["GET"], ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't throw an error for %s request", function(method) {
      mock.use(method, "/no-body", function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest("/no-body", method).send();
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["GET"], ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't set Content-Type for %s request", function(method) {
      expect.assertions(1)

      mock.use(method, "/unset-content-type", function(req, res) {
        expect(req.header("Content-Type")).toBeNull();

        return res.status(200);
      });

      new RemoteRequest("/unset-content-type", method).send();
    });
  });

  describe("when body is a string", function() {
    it.each([
      ["GET"], ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't throw an error for %s request", function(method) {
      mock.use(method, "/string-body", function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest("/string-body", method)
          .send("first_name=Bruce&last_name=Wayne");
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it("doesn't set Content-Type for GET request", function() {
      expect.assertions(1)

      mock.get("/unset-content-type", function(req, res) {
        expect(req.header("Content-Type")).toBeNull();

        return res.status(200);
      });

      new RemoteRequest("/unset-content-type", "GET")
        .send("first_name=Diana&last_name=Prince");
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sets Content-Type: application/x-www-form-urlencoded for %s request", function(method) {
      expect.assertions(1)

      mock.use(method, "/urlencoded-content-type", function(req, res) {
        expect(req.header("Content-Type")).toEqual("application/x-www-form-urlencoded");

        return res.status(200);
      });

      new RemoteRequest("/urlencoded-content-type", method)
        .send("first_name=Diana&last_name=Prince");
    });
  });

  describe("when body is a FormData", function() {
    it("throws an error for GET request", function() {
      mock.get("/form-data", function(req, res) {
        return res.status(200);
      });

      const formData = new FormData();
      formData.append("first_name", "Clark");
      formData.append("last_name", "Kent");

      expect(function() {
        new RemoteRequest("/form-data", "GET").send(formData);
      }).toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't throw an error for %s request", function(method) {
      mock.use(method, "/form-data", function(req, res) {
        return res.status(200);
      });

      const formData = new FormData();
      formData.append("first_name", "Clark");
      formData.append("last_name", "Kent");

      expect(function() {
        new RemoteRequest("/form-data", method).send(formData);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sets Content-Type: multipart/form-data for %s request", function(method) {
      mock.use(method, "/content-type-form-data", function(req, res) {
        return res.status(200);
      });

      const formData = new FormData();
      formData.append("first_name", "Clark");
      formData.append("last_name", "Kent");

      expect(function() {
        new RemoteRequest("/content-type-form-data", method).send(formData);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });
  });

  describe("when responseType is not passed", function() {
    it("sets Accept: application/json, text/javascript by default", function() {
      expect.assertions(1);

      mock.get("/default-response-type", function(req, res) {
        expect(req.header("Accept")).toEqual("application/json, text/javascript");

        return res.status(200);
      });

      new RemoteRequest("/default-response-type").send();
    });
  });

  describe.each([
    ["ResponseType.All", ResponseType.All, "*/*"],
    ["ResponseType.Text", ResponseType.Text, "text/plain"],
    ["ResponseType.HTML", ResponseType.HTML, "text/html"],
    ["ResponseType.XML", ResponseType.XML, "application/xml, text/xml"],
    ["ResponseType.JSON", ResponseType.JSON, "application/json, text/javascript"],
    [
      "ResponseType.Script", ResponseType.Script,
      "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
    ]
  ])("when responseType is passed as %s", function(_, responseType, accept) {
    it("sets Accept: " + accept, function() {
      expect.assertions(1);

      mock.get("/custom-response-type", function(req, res) {
        expect(req.header("Accept")).toEqual(accept);

        return res.status(200);
      });

      new RemoteRequest("/custom-response-type").send(null, responseType);
    });
  });
});
