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

    const path = "/get";

    mock.get(path, function(req, res) {
      expect(req.method()).toEqual("GET");

      return res.status(200);
    });

    new RemoteRequest(path).send();
  });

  it.each([
    ["get", "GET"], ["post", "POST"],
    ["put", "PUT"], ["patch", "PATCH"],
    ["delete", "DELETE"]
  ])("can setup a %s|%s request", function(lowercased, uppercased) {
    expect.assertions(2);

    const path = `/${lowercased}`;

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
      new RemoteRequest("/unsupported", "UNSUPPORTED")
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
      const path = "/no-body";

      mock.use(method, path, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path, method).send();
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["GET"], ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't set Content-Type for %s request", function(method) {
      expect.assertions(1)

      const path = "/unset-content-type";

      mock.use(method, path, function(req, res) {
        expect(req.header("Content-Type")).toBeNull();

        return res.status(200);
      });

      new RemoteRequest(path, method).send();
    });
  });

  describe("when body is a string", function() {
    it("doesn't throw an error for GET request", function() {
      const body = "first_name=Bruce&last_name=Wayne";
      const path = "/string-body";

      mock.get(`${path}?${body}`, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path).send(body);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't throw an error for %s request", function(method) {
      const body = "first_name=Bruce&last_name=Wayne";
      const path = "/string-body";

      mock.use(method, path, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path, method).send(body);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it("doesn't set Content-Type for GET request", function() {
      expect.assertions(1)

      const body = "first_name=Diana&last_name=Prince";
      const path = "/unset-content-type";

      mock.get(`${path}?${body}`, function(req, res) {
        expect(req.header("Content-Type")).toBeNull();

        return res.status(200);
      });

      new RemoteRequest(path, "GET").send(body);
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sets Content-Type: application/x-www-form-urlencoded for %s request", function(method) {
      expect.assertions(1)

      const body = "first_name=Diana&last_name=Prince";
      const path = "/urlencoded-content-type";

      mock.use(method, path, function(req, res) {
        expect(req.header("Content-Type")).toEqual("application/x-www-form-urlencoded");

        return res.status(200);
      });

      new RemoteRequest(path, method).send(body);
    });

    describe("when no existing query params are present", function() {
      it("sends the body through URL query params for GET request by prepending ?", function() {
        expect.assertions(1);

        const body = "first_name=Bruce&last_name=Wayne";
        const path = "/query-params";

        mock.get(`${path}?${body}`, function(req, res) {
          expect(req.url().query).toEqual({ first_name: "Bruce", last_name: "Wayne" });

          return res.status(200);
        });

        new RemoteRequest(path).send(body);
      });

      it("sends the body through URL query params for GET request by prepending &", function() {
        expect.assertions(1);

        const body = "first_name=Bruce&last_name=Wayne";
        const path = "/query-params?address=Gotham";

        mock.get(`${path}&${body}`, function(req, res) {
          expect(req.url().query).toEqual({ address: "Gotham", first_name: "Bruce", last_name: "Wayne" });

          return res.status(200);
        });

        new RemoteRequest(path).send(body);
      });
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sends the body as a request body for %s request", function(method) {
      expect.assertions(1);

      const body = "first_name=Bruce&last_name=Wayne";
      const path = "/request-body";

      mock.use(method, path, function(req, res) {
        expect(req.body()).toEqual(body);

        return res.status(200);
      });

      new RemoteRequest(path, method).send(body);
    });
  });

  describe("when body is a FormData", function() {
    it("throws an error for GET request", function() {
      const path = "/form-data";
      const body = new FormData();
      body.append("first_name", "Clark");
      body.append("last_name", "Kent");

      mock.get(path, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path, "GET").send(body);
      }).toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("doesn't throw an error for %s request", function(method) {
      const path = "/form-data";
      const body = new FormData();
      body.append("first_name", "Clark");
      body.append("last_name", "Kent");

      mock.use(method, path, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path, method).send(body);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sets Content-Type: multipart/form-data for %s request", function(method) {
      const path = "/content-type-form-data";
      const body = new FormData();
      body.append("first_name", "Clark");
      body.append("last_name", "Kent");

      mock.use(method, path, function(req, res) {
        return res.status(200);
      });

      expect(function() {
        new RemoteRequest(path, method).send(body);
      }).not.toThrow(new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      ));
    });

    it.each([
      ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
    ])("sends the body as a request body for %s request", function(method) {
      expect.assertions(1);

      const path = "/request-body";
      const body = new FormData();
      body.append("first_name", "Clark");
      body.append("last_name", "Kent");

      mock.use(method, path, function(req, res) {
        expect(req.body()).toEqual(body);

        return res.status(200);
      });

      new RemoteRequest(path, method).send(body);
    });
  });

  describe("when responseType is not passed", function() {
    it("sets Accept: application/json, text/javascript by default", function() {
      expect.assertions(1);

      const path = "/default-response-type";

      mock.get(path, function(req, res) {
        expect(req.header("Accept")).toEqual("application/json, text/javascript");

        return res.status(200);
      });

      new RemoteRequest(path).send();
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

      const path = "/custom-response-type";

      mock.get(path, function(req, res) {
        expect(req.header("Accept")).toEqual(accept);

        return res.status(200);
      });

      new RemoteRequest(path).send(null, responseType);
    });
  });
});

describe("authorizeWith()", function() {
  it.each([
    ["GET"], ["POST"], ["PUT"], ["PATCH"], ["DELETE"]
  ])("is invoked to send HTTP authenticated %s request", function(method) {
    expect.assertions(1);

    mock.use(method, "http://username:password@example.com/", function(req, res) {
      expect(req.method()).toBe(method);

      return res.status(200);
    });

    const remoteRequest = new RemoteRequest("http://example.com", method);
    remoteRequest.authorizeWith("username", "password");
    remoteRequest.send();
  });
});

describe("onStart() callback", function() {
  it("doesn't cancel prematurely upon returning nothing", async function() {
    const startCallback = jest.fn();

    const mockRequest = jest.fn();
    await new Promise(function(resolve) {
      mockRequest.mockImplementation(function(_, res) {
        resolve(true);

        return res.status(200);
      });

      mock.get("/", mockRequest);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalled();
  });

  it("doesn't cancel prematurely upon returning true", async function() {
    const startCallback = jest.fn().mockReturnValue(true);

    const mockRequest = jest.fn();
    await new Promise(function(resolve) {
      mockRequest.mockImplementation(function(_, res) {
        resolve(true);

        return res.status(200);
      });

      mock.get("/", mockRequest);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.send();
    });

    expect(mockRequest).toHaveBeenCalled();
    expect(startCallback).toHaveBeenCalled();
  });

  it("cancels prematurely upon returning false", function() {
    const startCallback = jest.fn().mockReturnValue(false);

    const mockRequest = jest.fn();
    mock.get("/", function(_, res) {
      mockRequest();

      return res.status(200);
    });

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.send();

    expect(startCallback).toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
  });
});

describe("onStop() callback", function() {
  it("gets called immediately after onStart() for premature cancellation", function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(stopCallback).not.toHaveBeenCalled();

      return false;
    });
    const stopCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onStop(stopCallback);
    remoteRequest.send();

    expect(stopCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onSending() for normal cancellation", function() {
    expect.assertions(3);

    const startCallback = jest.fn(function() {
      expect(stopCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn(function() {
      expect(stopCallback).not.toHaveBeenCalled();

      return false;
    });
    const stopCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onStop(stopCallback);
    remoteRequest.onSending(sendingCallback);
    remoteRequest.send();

    expect(stopCallback).toHaveBeenCalled();
  });
});

describe("onSending() callback", function() {
  it("doesn't cancel normally upon returning nothing", async function() {
    const sendingCallback = jest.fn();

    const mockRequest = jest.fn();
    await new Promise(function(resolve) {
      mockRequest.mockImplementation(function(_, res) {
        resolve(true);

        return res.status(200);
      });

      mock.get("/", mockRequest);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSending(sendingCallback);
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
    expect(mockRequest).toHaveBeenCalled();
  });

  it("doesn't cancel normally upon returning true", async function() {
    const sendingCallback = jest.fn().mockReturnValue(true);

    const mockRequest = jest.fn();
    await new Promise(function(resolve) {
      mockRequest.mockImplementation(function(_, res) {
        resolve(true);

        return res.status(200);
      });

      mock.get("/", mockRequest);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSending(sendingCallback);
      remoteRequest.send();
    });

    expect(mockRequest).toHaveBeenCalled();
    expect(sendingCallback).toHaveBeenCalled();
  });

  it("cancels normally upon returning false", function() {
    const sendingCallback = jest.fn().mockReturnValue(false);

    const mockRequest = jest.fn();
    mock.get("/", function(_, res) {
      mockRequest();

      return res.status(200);
    });

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.send();

    expect(sendingCallback).toHaveBeenCalled();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("does not get called for premature cancellation", function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();

      return false;
    });
    const sendingCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onSending(sendingCallback);
    remoteRequest.send();

    expect(sendingCallback).not.toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for normal cancellation", function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", { status: 200 });

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onSending(sendingCallback);
    remoteRequest.send();

    expect(sendingCallback).toHaveBeenCalled();
  });
});

describe("onSend() callback", function() {
  it("gets called immediately after onSending() for success", function() {
    expect.assertions(2);

    const sendingCallback = jest.fn(function() {
      expect(sendCallback).not.toHaveBeenCalled();
    });
    const sendCallback = jest.fn();

    mock.get("/", { status: 200 });

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.send();

    expect(sendCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onSending() for failure", function() {
    expect.assertions(2);

    const sendingCallback = jest.fn(function() {
      expect(sendCallback).not.toHaveBeenCalled();
    });
    const sendCallback = jest.fn();

    mock.get("/", { status: 400 });

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.send();

    expect(sendCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onSending() for timeout", function() {
    expect.assertions(2);

    const sendingCallback = jest.fn(function() {
      expect(sendCallback).not.toHaveBeenCalled();
    });
    const sendCallback = jest.fn();

    mock.get("/", () => new Promise(() => {}));

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.timeout = 100;
    remoteRequest.send();

    expect(sendCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onSending() for error", function() {
    expect.assertions(2);

    const sendingCallback = jest.fn(function() {
      expect(sendCallback).not.toHaveBeenCalled();
    });
    const sendCallback = jest.fn();

    mock.get("/", () => Promise.reject(new Error()));

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.send();

    expect(sendCallback).toHaveBeenCalled();
  });
});

describe("onSuccess() callback", function() {
  it("gets called immediately after onSend() for success", async function() {
    expect.assertions(2);

    mock.get("/", { status: 200 });

    const sendCallback = jest.fn(function() {
      expect(successCallback).not.toHaveBeenCalled();
    });
    const successCallback = jest.fn();
    await new Promise(function(resolve) {
      successCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSend(sendCallback);
      remoteRequest.onSuccess(successCallback);
      remoteRequest.send();
    });

    expect(successCallback).toHaveBeenCalled();
  });

  it("does not get called for failure", async function() {
    mock.get("/", { status: 400 });

    const successCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(successCallback).not.toHaveBeenCalled();
  });

  it("does not get called for timeout", async function() {
    mock.get("/", () => new Promise(() => {}));

    const successCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(successCallback).not.toHaveBeenCalled();
  });

  it("does not get called for error", async function() {
    mock.get("/", () => Promise.reject(new Error()));

    const successCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(successCallback).not.toHaveBeenCalled();
  });
});

describe("onFailure() callback", function() {
  it("gets called immediately after onSend() for failure", async function() {
    expect.assertions(2);

    mock.get("/", { status: 400 });

    const sendCallback = jest.fn(function() {
      expect(failureCallback).not.toHaveBeenCalled();
    });
    const failureCallback = jest.fn();
    await new Promise(function(resolve) {
      failureCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSend(sendCallback);
      remoteRequest.onFailure(failureCallback);
      remoteRequest.send();
    });

    expect(failureCallback).toHaveBeenCalled();
  });

  it("does not get called for success", async function() {
    mock.get("/", { status: 200 });

    const failureCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(failureCallback).not.toHaveBeenCalled();
  });

  it("does not get called for timeout", async function() {
    mock.get("/", () => new Promise(() => {}));

    const failureCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(failureCallback).not.toHaveBeenCalled();
  });

  it("does not get called for error", async function() {
    mock.get("/", () => Promise.reject(new Error()));

    const failureCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(failureCallback).not.toHaveBeenCalled();
  });
});

describe("onComplete() callback", function() {
  it("gets called immediately after onSuccess() for success", async function() {
    expect.assertions(2);

    mock.get("/", { status: 200 });

    const successCallback = jest.fn(function() {
      expect(completeCallback).not.toHaveBeenCalled();
    });
    const completeCallback = jest.fn();
    await new Promise(function(resolve) {
      completeCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onComplete(completeCallback);
      remoteRequest.send();
    });

    expect(completeCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onFailure() for failure", async function() {
    expect.assertions(2);

    mock.get("/", { status: 400 });

    const failureCallback = jest.fn(function() {
      expect(completeCallback).not.toHaveBeenCalled();
    });
    const completeCallback = jest.fn();
    await new Promise(function(resolve) {
      completeCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onComplete(completeCallback);
      remoteRequest.send();
    });

    expect(completeCallback).toHaveBeenCalled();
  });

  it("does not get called for timeout", async function() {
    mock.get("/", () => new Promise(() => {}));

    const completeCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onComplete(completeCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(completeCallback).not.toHaveBeenCalled();
  });

  it("does not get called for error", async function() {
    mock.get("/", () => Promise.reject(new Error()));

    const completeCallback = jest.fn();
    const finishCallback = jest.fn()
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onComplete(completeCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(completeCallback).not.toHaveBeenCalled();
  });
});

describe("onTimeout() callback", function() {
  it("gets called immediately after onSend() for timeout", async function() {
    expect.assertions(2);

    mock.get("/", () => new Promise(() => {}));

    const sendCallback = jest.fn(function() {
      expect(timeoutCallback).not.toHaveBeenCalled();
    });
    const timeoutCallback = jest.fn();
    await new Promise(function(resolve) {
      timeoutCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSend(sendCallback);
      remoteRequest.onTimeout(timeoutCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(timeoutCallback).toHaveBeenCalled();
  });

  it("does not get called for success", async function() {
    mock.get("/", { status: 200 });

    const timeoutCallback = jest.fn();
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onTimeout(timeoutCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(timeoutCallback).not.toHaveBeenCalled();
  });

  it("does not get called for failure", async function() {
    mock.get("/", { status: 400 });

    const timeoutCallback = jest.fn();
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onTimeout(timeoutCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(timeoutCallback).not.toHaveBeenCalled();
  });

  it("does not get called for error", async function() {
    mock.get("/", () => Promise.reject(new Error()));

    const timeoutCallback = jest.fn(function() {
      expect(finishCallback).not.toHaveBeenCalled();
    });
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onTimeout(timeoutCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(timeoutCallback).not.toHaveBeenCalled();
  });
});

describe("onError() callback", function() {
  it("gets called immediately after onSend() for error", async function() {
    expect.assertions(2);

    mock.get("/", () => Promise.reject(new Error()));

    const sendCallback = jest.fn(function() {
      expect(errorCallback).not.toHaveBeenCalled();
    });
    const errorCallback = jest.fn();
    await new Promise(function(resolve) {
      errorCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSend(sendCallback);
      remoteRequest.onError(errorCallback);
      remoteRequest.send();
    });

    expect(errorCallback).toHaveBeenCalled();
  });

  it("does not get called for success", async function() {
    mock.get("/", { status: 200 });

    const errorCallback = jest.fn();
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onError(errorCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(errorCallback).not.toHaveBeenCalled();
  });

  it("does not get called for failure", async function() {
    mock.get("/", { status: 400 });

    const errorCallback = jest.fn();
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onError(errorCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(errorCallback).not.toHaveBeenCalled();
  });

  it("does not get called for timeout", async function() {
    mock.get("/", () => new Promise(() => {}));

    const errorCallback = jest.fn();
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onError(errorCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(errorCallback).not.toHaveBeenCalled();
  });
});
