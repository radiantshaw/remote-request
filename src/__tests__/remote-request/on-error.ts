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

describe("onError() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const errorCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onError(errorCallback);
    remoteRequest.send();

    expect(errorCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const errorCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onError(errorCallback);
    remoteRequest.send();

    expect(errorCallback).not.toHaveBeenCalled();
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
});
