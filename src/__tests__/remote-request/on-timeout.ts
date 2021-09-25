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

describe("onTimeout() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const timeoutCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onTimeout(timeoutCallback);
    remoteRequest.send();

    expect(timeoutCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const timeoutCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onTimeout(timeoutCallback);
    remoteRequest.send();

    expect(timeoutCallback).not.toHaveBeenCalled();
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
