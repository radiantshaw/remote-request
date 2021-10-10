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

```js
import RemoteRequest from "@unobtrusive/remote-request";

const remoteRequest = new RemoteRequest("https://example.com", "GET");
```

attach the necessary event handlers:

```js
remoteRequest.onSuccess(function({ body }) {
  /* ... */
});

remoteRequest.onComplete(function({ status }) {
  /* ... */
});
```

and call the `send()` method on it:

```js
remoteRequest.send();
```

which will start the callback chain to be executed, if there are any callbacks registered.

### `constructor(url: string, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET")`

- Returns a new `RemoteRequest` object
- Accepts the `url` and the `method` using which the request should be made

### `send(body?: RemoteBody, responseType?: ResponseType)`

- Sends the actual request and starts execution of the callback chain
- Optionally accepts a `body` (which can be a `string | FormData`) to send
- Optionally accepts a `responseType` (which is the enum `ResponseType`) to expect from the server
- `ResponseType` has the following values:
  - `All`: Expects all types of responses; specifically, sets the header `Accept: */*`
  - `Text`: Expects a plain text response; specifically, sets the header `Accept: text/plain`
  - `HTML`: Expects an HTML response; specifically, sets the header `Accept: text/html`
  - `XML`: Expects an XML response; specifically, sets the header `Accept: application/xml, text/xml`
  - `Script`: Expects a JSON response; specifically, sets the header `Accept: text/javascript, application/javascript, application/ecmascript, application/x-ecmascript`
  - `JSON`: Accepts a JavaScript response; specifically, sets the header `Accept: application/json, text/javascript`

### Callbacks

#### `onStart(callback: () => void | boolean)`

- Accepts a `callback` method which can either return nothing, or return `true` or `false`
- The callback registered via `onStart()` is the first to get executed after the `send()` method is called and the request is made
- If the callback returns `false`, the subsequent callbacks are not called; if the callback returns `true` or nothing, the subsequent callbacks are called

#### `onSending(callback: () => void | boolean)`

- The callback registered via `onSending()` gets called after the `onStart()` callback is finished executing but the request is not yet made
- Currently, works the same as `onStart()` but that will change when the package is fully released

#### `onStop(callback: () => void)`

- The callback registered via `onStop()` gets called after either the `onStart()` callback, or the `onSending()` callback is finished executing, but only when the callback chain is _prematurely cancelled_, or _normally cancelled_
  - _Premature cancellation_ is when the `onStart()` callback returns `false`; in that case, the `onStop()` callback will get called immediately after the `onStart()` callback
  - _Normal cancellation_ is when the `onSending()` callback returns `false`; in that case, the `onStop()` callback will get called immediately after the `onSending()` callback

#### `onSend(callback: () => void)`

- The callback registered via `onSend()` gets called after the `onSending()` callback is done executing, and the request has been sent to the server

#### `onSuccess(callback: (remoteResponse: RemoteResponse) => void)`

- The callback registered via `onSuccess` gets called after the `onSend()` callback is done executing; the response have been received, and the server responded with a `2xx` status
- The registered callback receives the `RemoteResponse` object which has the following properties:
  - `status: number`: The status code returned by the server. For _e.g._: `201`
  - `reason: string`: The reason returned by the server. For _e.g._: `Created`
  - `headers: (name: string) => string`: A function which will return the value of the header, given the header name. For _e.g._: `headers("Content-Type")` might return `text/html`
  - `body: string | HTMLDocument | Document`: The body returned by the URL, parsed accordingly. For _e.g._:
    - When body is HTML (`Content-Type: text/html`): Returns the `HTMLDocument` object
    - When body is XML (`Content-Type: application/xml, text/xml`): Returns the `Document` object, or in some browsers, the `XMLDocument` object
    - When the body is anything else: Returns the body as a `string`

#### `onFailure(callback: (remoteResponse: RemoteResponse) => void)`

- When the response status is not `2xx`, the callback registered via `onFailure()` get called instead of `onSuccess()`
- Rest of the working is the same as `onSuccess()`

#### `onComplete(callback: (remoteResponse: RemoteResponse) => void)`

- The callback registered via `onComplete()` are called either after the `onSuccess()` callback (in case of response `2xx`), or after the `onFailure()` callback (in case of response not `2xx`)
- Rest of the working is the same as `onSuccess()` or `onFailure()`

#### `onError(callback: () => void)`

- The callback registered via `onError()` gets called after the `onSend()` callback is done executing, but some network failure happened

#### `onTimeout(callback: () => void)`

- The callback registered via `onTimeout()` gets called after the `onSend()` callback is done executing, but the server took too long to respond and the request timed out

#### `onFinish(callback: () => void)`

- The callback registered via `onFinish()` gets called at the very last after the `onComplete()`, `onError()`, or `onTimeout()` callbacks are executed

### `timeout` setter

By default, there's no timeout, so if the server doesn't respond in time, the request might go on forever. To stop this from happening, before calling the `send()` method, you can set the timeout as such:

```js
remoteRequest.timeout = 200;
```

The value is accepted in milliseconds.

### `authorizeWith(username: string, password: string)`

If the server you're trying to contact requires basic HTTP authentication, call the `authorizeWith()` method before calling `send()` to set the credentials:

```js
remoteRequest.authorizeWith("apokolips", "omegalambda7xl9");
```

### `withCredentials` setter

Cross-origin requests do not send credentials (like cookies) by default. To enable it, set this to `true`.
