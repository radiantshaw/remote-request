import mock from "xhr-mock";

import RemoteRequest, { RemoteResponse } from "../../remote-request";

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

  it("yields the status to the callback", async function() {
    const successCallback = jest.fn();

    mock.get("/", { status: 200 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(successCallback.mock.calls[0][0]).toHaveProperty('status', 200);
  });

  it("yields the reason to the callback", async function() {
    const successCallback = jest.fn();

    mock.get("/", { status: 200, reason: "OK" });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(successCallback.mock.calls[0][0]).toHaveProperty('reason', 'OK');
  });

  it("yields the HTML body to the callback as HTMLDocument", async function() {
    const successCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Testing</title>
          </head>
          <body>
            <div id="app">App</div>
          </body>
        </html>
      `
    });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(successCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(successCallback.mock.calls[0][0].body).toBeInstanceOf(HTMLDocument);
  });

  it("yields the XML body to the callback as Document", async function() {
    const successCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
      body: `
        <?xml version="1.0" encoding="UTF-8"?>
        <bookstore>
          <book category="comics">
            <title>Uncanny X-Men, Issue 1</title>
            <author>Stan Lee</author>
          </book>

          <book category="novel">
            <title>Goosebumps, Issue 7</title>
            <author>R. L. Stine</author>
          </book>
        </bookstore>
      `
    });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(successCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(successCallback.mock.calls[0][0].body).toBeInstanceOf(Document);
  });

  it("yields the JSON body to the callback as Document", async function() {
    const successCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: `
        {
          "superheroes": [
            "batman",
            "superman",
            "captain-america",
            "iron-man"
          ]
        }
      `
    });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onSuccess(successCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(successCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(successCallback.mock.calls[0][0].body).toBeInstanceOf(Object);
  });
});
