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

  it("yields the status to the callback", async function() {
    const failureCallback = jest.fn();

    mock.get("/", { status: 400 });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('status', 400);
  });

  it("yields the reason to the callback", async function() {
    const failureCallback = jest.fn();

    mock.get("/", { status: 400, reason: "Bad Request" });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('reason', 'Bad Request');
  });

  it("yields the headers to the callback", async function() {
    const failureCallback = jest.fn();

    mock.get("/", {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('headers');
    expect(typeof failureCallback.mock.calls[0][0].headers).toEqual('function');
    expect(failureCallback.mock.calls[0][0].headers('Content-Type')).toEqual('text/plain');
    expect(failureCallback.mock.calls[0][0].headers('Access-Control-Allow-Origin')).toEqual('*');
  });

  it("yields the HTML body to the callback as HTMLDocument", async function() {
    const failureCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 400,
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
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(failureCallback.mock.calls[0][0].body).toBeInstanceOf(HTMLDocument);
  });

  it("yields the XML body to the callback as Document", async function() {
    const failureCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 400,
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
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(failureCallback.mock.calls[0][0].body).toBeInstanceOf(Document);
  });

  it("yields the JSON body to the callback as Document", async function() {
    const failureCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 400,
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
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(failureCallback.mock.calls[0][0].body).toBeInstanceOf(Object);
  });

  it("yields the raw body to the callback upon absence of Content-Type", async function() {
    const failureCallback = jest.fn((remoteResponse: RemoteResponse) => {});

    mock.get("/", {
      status: 400,
      body: 'Lorem ipsum.'
    });

    await new Promise(function(resolve) {
      const remoteRequest = new RemoteRequest("/");
      remoteRequest.onFailure(failureCallback);
      remoteRequest.onFinish(() => resolve(true));
      remoteRequest.send();
    });

    expect(failureCallback.mock.calls[0][0]).toHaveProperty('body')
    expect(typeof failureCallback.mock.calls[0][0].body).toBe('string');
  });
});
