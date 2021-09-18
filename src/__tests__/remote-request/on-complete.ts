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

describe("onComplete() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const completeCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onComplete(completeCallback);
    remoteRequest.send();

    expect(completeCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const completeCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onComplete(completeCallback);
    remoteRequest.send();

    expect(completeCallback).not.toHaveBeenCalled();
  });

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
