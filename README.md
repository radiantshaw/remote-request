# Remote Request

When making a request to the server, we don't usually care about the internal workings of the request. We just want to send a request, and when the response is received, work with it. Rails makes this task easy because of its [UJS](https://github.com/rails/rails-ujs) driver. The problem is that the driver is tightly bound to the DOM. Which means unless you're working with HTML elements, you won't be able to use the sweet features it provides.

The `@unobtrusive/remote-request` package is an effort to remove the DOM dependency so that all the goodies can be used without the need to be bound to any HTML element.

## Installation

### Via NPM

```sh
$ npm install @unobtrusive/remote-request
```

### Or via Yarn

```sh
$ yarn add @unobtrusive/remote-request
```

## Working

To make a simple request, you create a `RemoteRequest` object with the given URL and method:

```sh
import RemoteRequest from "@unobtrusive/remote-request";

const remoteRequest = new RemoteRequest("https://example.com", "GET");
```

attach the necessary event handlers:

```sh
remoteRequest.onSuccess(function({ body }) {
  /* ... */
});

remoteRequest.onComplete(function({ status }) {
  /* ... */
});
```

and call the `send()` method on it:

```sh
remoteRequest();
```

When the request gets completed, the callback methods will get called at the appropriate time.

### `constructor(url: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET")`

- Returns a new `RemoteRequest` object
- Accepts the `url` to which and the `method` using which the request should be made

### `send(body?: RemoteBody, responseType?: ResponseType)`

- Sends the actual request and starts the callback process
- Optionally accepts a `body` (which can be `string | FormData`) to send
- Optionally accepts a `responseType` (which is the enum `ResponseType`) to expect from the server
- `ResponseType` has the following values:
  - `All`: Accepts all type of responses; specifically, sets the header `Accept: */*`
  - `Text`: Accepts plain text; specifically, sets the header `Accept: text/plain`
  - `HTML`: Accepts HTML document; specifically, sets the header `Accept: text/html`
  - `XML`: Accepts XML document; specifically, sets the header `Accept: application/xml, text/xml`
  - `Script`: Accepts JSON structure; specifically, sets the header `Accept: text/javascript, application/javascript, application/ecmascript, application/x-ecmascript`
  - `JSON`: Accepts JavaScript code; specifically, sets the header `Accept: application/json, text/javascript`
