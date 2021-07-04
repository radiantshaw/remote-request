import mock from "xhr-mock";

import RemoteRequest from "../remote-request";

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

  it("can setup a get|GET request", function() {
    expect.assertions(2);

    mock.get("/get", function(req, res) {
      expect(req.method()).toEqual("GET");

      return res.status(200);
    });

    ["get", "GET"].forEach(function(method) {
      new RemoteRequest("/get", method).send();
    });
  });

  it("can setup a post|POST request", function() {
    expect.assertions(2);

    mock.post("/post", function(req, res) {
      expect(req.method()).toEqual("POST");

      return res.status(200);
    });

    ["post", "POST"].forEach(function(method) {
      new RemoteRequest("/post", method).send();
    });
  });

  it("can setup a put|PUT request", function() {
    expect.assertions(2);

    mock.put("/put", function(req, res) {
      expect(req.method()).toEqual("PUT");

      return res.status(200);
    });

    ["put", "PUT"].forEach(function(method) {
      new RemoteRequest("/put", method).send();
    });
  });

  it("can setup a patch|PATCH request", function() {
    expect.assertions(2);

    mock.patch("/patch", function(req, res) {
      expect(req.method()).toEqual("PATCH");

      return res.status(200);
    });

    ["patch", "PATCH"].forEach(function(method) {
      new RemoteRequest("/patch", method).send();
    });
  });

  it("can setup a delete|DELETE request", function() {
    expect.assertions(2);

    mock.delete("/delete", function(req, res) {
      expect(req.method()).toEqual("DELETE");

      return res.status(200);
    });

    ["delete", "DELETE"].forEach(function(method) {
      new RemoteRequest("/delete", method).send();
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
  it("throws an error for GET request when body is FormData", function() {
    mock.get("/not-url-encoded-data", function(req, res) {
      return res.status(200);
    });

    const formData = new FormData();
    formData.append("first_name", "Clark");
    formData.append("last_name", "Kent");

    ["get", "GET"].forEach(function(method) {
      expect(function() {
        new RemoteRequest("/not-url-encoded-data", method).send(formData);
      }).toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });
  });

  it("doesn't throw an error for GET request when body is URL encoded string", function() {
    mock.get("/url-encoded-data", function(req, res) {
      return res.status(200);
    });

    ["get", "GET"].forEach(function(method) {
      expect(function() {
        new RemoteRequest("/url-encoded-data", method)
          .send("first_name=Bruce&last_name=Wayne");
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });
  });

  it("doesn't throw an error for GET request when body is not provided", function() {
    mock.get("/url-encoded-data", function(req, res) {
      return res.status(200);
    });

    ["get", "GET"].forEach(function(method) {
      expect(function() {
        new RemoteRequest("/url-encoded-data", method).send();
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });
  });
});
