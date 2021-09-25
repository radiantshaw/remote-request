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

describe("onSuccess() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const successCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onSuccess(successCallback);
    remoteRequest.send();

    expect(successCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const successCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSuccess(successCallback);
    remoteRequest.send();

    expect(successCallback).not.toHaveBeenCalled();
  });

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
