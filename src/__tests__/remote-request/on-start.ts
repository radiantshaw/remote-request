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

describe("onStart() callback", function() {
  it("doesn't cancel the request upon returning nothing", async function() {
    const mockRequest = jest.fn((_, res) => res.status(200));
    mock.get("/", mockRequest);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(jest.fn());
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
      remoteRequest.onStart(jest.fn().mockReturnValue(true));
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
      remoteRequest.onStart(jest.fn().mockReturnValue(false));
      remoteRequest.onStop(() => resolve(true));
      remoteRequest.send();
    });

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("gets called at the start for premature cancellation", async function() {
    const startCallback = jest.fn().mockReturnValue(false);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onStop(() => resolve(true));
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });

  it("gets called at the start for normal cancellation", async function() {
    const startCallback = jest.fn();
    const sendingCallback = jest.fn().mockReturnValue(false);

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.onStop(() => resolve(true));
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });

  it("gets called at the start for success", async function() {
    const startCallback = jest.fn();

    mock.get("/", { status: 200 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });

  it("gets called at the start for failure", async function() {
    const startCallback = jest.fn();

    mock.get("/", { status: 400 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });

  it("gets called at the start for timeout", async function() {
    const startCallback = jest.fn();

    mock.get("/", () => new Promise(() => {}));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });

  it("gets called at the start for error", async function() {
    const startCallback = jest.fn();

    mock.get("/", () => Promise.reject(new Error()));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(startCallback).toHaveBeenCalled();
  });
});
