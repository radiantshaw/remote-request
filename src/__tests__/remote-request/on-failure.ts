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

describe("onFailure() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const failureCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onFailure(failureCallback);
    remoteRequest.send();

    expect(failureCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const failureCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onFailure(failureCallback);
    remoteRequest.send();

    expect(failureCallback).not.toHaveBeenCalled();
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
