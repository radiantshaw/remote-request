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

describe("onFinish() callback", function() {
  it("doesn't get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const finishCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onFinish(finishCallback);
    remoteRequest.send();

    expect(finishCallback).not.toHaveBeenCalled();
  });

  it("doesn't get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const finishCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(sendingCallback);
    remoteRequest.onFinish(finishCallback);
    remoteRequest.send();

    expect(finishCallback).not.toHaveBeenCalled();
  });

  it("gets called immediately after onComplete() for success", async function() {
    expect.assertions(2);

    mock.get("/", { status: 200 });

    const completeCallback = jest.fn(function() {
      expect(finishCallback).not.toHaveBeenCalled();
    });
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onComplete(completeCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(finishCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onComplete() for failure", async function() {
    expect.assertions(2);

    mock.get("/", { status: 400 });

    const completeCallback = jest.fn(function() {
      expect(finishCallback).not.toHaveBeenCalled();
    });
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onComplete(completeCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(finishCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onTimeout() for timeout", async function() {
    expect.assertions(2);

    mock.get("/", () => new Promise(() => {}));

    const timeoutCallback = jest.fn(function() {
      expect(finishCallback).not.toHaveBeenCalled();
    });
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onTimeout(timeoutCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.timeout = 100;
      remoteRequest.send();
    });

    expect(finishCallback).toHaveBeenCalled();
  });

  it("gets called immediately after onError() for error", async function() {
    expect.assertions(2);

    mock.get("/", () => Promise.reject(new Error()));

    const errorCallback = jest.fn(function() {
      expect(finishCallback).not.toHaveBeenCalled();
    });
    const finishCallback = jest.fn();
    await new Promise(function(resolve) {
      finishCallback.mockImplementation(resolve);

      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onError(errorCallback);
      remoteRequest.onFinish(finishCallback);
      remoteRequest.send();
    });

    expect(finishCallback).toHaveBeenCalled();
  });
});
