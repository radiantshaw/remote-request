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

describe("onSend() callback", function() {
  it("does not get called for premature cancellation", function() {
    const startCallback = jest.fn(function() {
      return false;
    });
    const sendCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onStart(startCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.send();

    expect(sendCallback).not.toHaveBeenCalled();
  });

  it("does not get called for normal cancellation", function() {
    const sendingCallback = jest.fn(function() {
      return false;
    });
    const sendCallback = jest.fn();

    const remoteRequest = new RemoteRequest("/");
    remoteRequest.onSending(sendingCallback);
    remoteRequest.onSend(sendCallback);
    remoteRequest.send();

    expect(sendCallback).not.toHaveBeenCalled();
  });

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
