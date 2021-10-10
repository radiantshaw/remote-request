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

### Callbacks

#### `onStart(callback: () => void | boolean)`

- The first callback that gets called as soon as `send()` is called but before the request is even made
- Accepts a `callback` method which can either return nothing, or return `true` or `false`
- If the callback returns `false`, the subsequent callbacks are not called; if the callback returns `true` or nothing, the subsequent callbacks are called

#### `onSending(callback: () => void | boolean)`

- Gets called after the callback registered with `onStart()` is finished executing
- Currently, works the same as `onStart()` but that will change when the package is fully released

#### `onStop(callback: () => void)`

- Gets called after either the callback registered with `onStart()`, or the callback registered with `onSending()` is finished executing, but only when the callback chain is _prematurely cancelled_, or _normally cancelled_
- _Premature cancellation_ is when the callback registered with `onStart()` returns `false`; in that case, the `onStop()` callback will get called immediately after the `onStart()` callback
- _Normal cancellation_ is when the callback registered with `onSending()` returns `false`; in that case, the `onStop()` callback will get called immediately after the `onSending()` callback

#### `onSend(callback: () => void)`

- Gets called after the callback via `onSending()` is done executing, and the request has been sent to the URL

#### `onSuccess(callback: (remoteResponse: RemoteResponse) => void)`

- Gets called after the callback via `onSend()` is done executing; the response have been received, and the URL responded with a `2xx` status
- The registered callback gets yielded the `RemoteResponse` object which has the following properties:
  - `status: number`: The status code returned by the URL. For _e.g._: `201`
  - `reason: string`: The reason returned by the URL. For _e.g._: `Created`
  - `headers: (name: string) => string`: A function which will return the value of the header, given the header name. For _e.g._: `headers("Content-Type")` might return `text/html`
  - `body: string | HTMLDocument | Document`: The body returned by the URL, parsed accordingly. For _e.g._:
    - When body is HTML (`Content-Type: text/html`): Returns the `HTMLDocument` object
    - When body is XML (`Content-Type: application/xml, text/xml`): Returns the `Document` object, or in some browsers, the `XMLDocument` object
    - When the body is anything else: Returns the body as a `string`

#### `onFailure(callback: (remoteResponse: RemoteResponse) => void)`

- When the response status is not `2xx`, the callback registered via `onFailure()` get called instead of `onSuccess()`
- Rest of the working is the same as `onSuccess()`

#### `onComplete(callback: (remoteResponse: RemoteResponse) => void)`

- Callback registered via `onComplete()` are called either after callback registered via `onSuccess()` (in case of response `2xx`), or after callback registered via `onFailure()` (in case of response not `2xx`)
- Rest of the working is the same as `onSuccess()` or `onFailure()`

#### `onError(callback: () => void)`

- Gets called after the callback via `onSend()` is done executing, but some network failure happened

#### `onTimeout(callback: () => void)`

- Gets called after the callback via `onSend()` is done executing, but the URL took too long to respond and the request timed out

#### `onFinish(callback: () => void)`

- The very last callback which will get called after the callbacks registered via `onComplete()`, `onError()`, or `onTimeout()`
