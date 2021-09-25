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

describe("onStop() callback", function() {
  it("gets called immediately after onStart() for premature cancellation", async function() {
    expect.assertions(2);

    const startCallback = jest.fn(function() {
      expect(stopCallback).not.toHaveBeenCalled();

      return false;
    });
    const stopCallback = jest.fn();

    await new Promise(function(resolve) {
      stopCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStart(startCallback);
      remoteRequest.onStop(stopCallback);
      remoteRequest.send();
    });

    expect(stopCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onSending() for normal cancellation", async function() {
    expect.assertions(2);

    const sendingCallback = jest.fn(function() {
      expect(stopCallback).not.toHaveBeenCalled();

      return false;
    });
    const stopCallback = jest.fn();

    await new Promise(function(resolve) {
      stopCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStop(stopCallback);
      remoteRequest.onSending(sendingCallback);
      remoteRequest.send();
    });

    expect(stopCallback).toHaveBeenCalled();
  });

  it("does not get called for success", async function() {
    const stopCallback = jest.fn();

    mock.get("/", { status: 200 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStop(stopCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(stopCallback).not.toHaveBeenCalled();
  });

  it("does not get called for failure", async function() {
    const stopCallback = jest.fn();

    mock.get("/", { status: 400 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStop(stopCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(stopCallback).not.toHaveBeenCalled();
  });

  it("does not get called for timeout", async function() {
    const stopCallback = jest.fn();

    mock.get("/", () => new Promise(() => {}));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStop(stopCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(stopCallback).not.toHaveBeenCalled();
  });

  it("does not get called for error", async function() {
    const stopCallback = jest.fn();

    mock.get("/", () => Promise.reject(new Error()));

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onStop(stopCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(stopCallback).not.toHaveBeenCalled();
  });
});
