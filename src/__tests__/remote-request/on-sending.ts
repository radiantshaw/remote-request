import mock from "xhr-mock";

import RemoteRequest from "../../remote-request";

beforeAll(function() {
  mock.setup()
});

afterEach(function() {
  mock.reset()
});

afterAll(function() {
  mock.teardown()
});

describe("onSending() callback", function() {
  it("doesn't cancel the request upon returning nothing", async function() {
    const mockRequest = jest.fn((_, res) => res.status(200));
    mock.get("/", mockRequest);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSending(jest.fn());
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(mockRequest).toHaveBeenCalled();
  });

  it("doesn't cancel the request upon returning true", async function() {
    const mockRequest = jest.fn((_, res) => res.status(200));
    mock.get("/", mockRequest);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSending(jest.fn().mockReturnValue(true));
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(mockRequest).toHaveBeenCalled();
  });

  it("cancels the request upon returning false", async function() {
    const mockRequest = jest.fn((_, res) => res.status(200));
    mock.get("/", mockRequest);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSending(jest.fn().mockReturnValue(false));
      remoteRequest.onStop(() => resolve(true));
      remoteRequest.send();
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("does not get called for premature cancellation", async function() {
    const sendingCallback = jest.fn();

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(jest.fn().mockReturnValue(false));
      remoteRequest.onStop(() => resolve(true));
      remoteRequest.onSending(sendingCallback);
      remoteRequest.send();
    });

    expect(sendingCallback).not.toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for normal cancellation", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", { status: 200 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for success", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", { status: 200 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for failure", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", { status: 400 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for timeout", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", () => new Promise(() => {}));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onStart() for error", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(sendingCallback).not.toHaveBeenCalled();
    });
    const sendingCallback = jest.fn();

    mock.get("/", () => Promise.reject(new Error()));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(sendingCallback).toHaveBeenCalled();
  });
});
