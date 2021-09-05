export enum ResponseType {
  All = "*/*",
  Text = "text/plain",
  HTML = "text/html",
  XML = "application/xml, text/xml",
  Script = "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
  JSON = "application/json, text/javascript"
}

export default class RemoteRequest {
  private method: string;
  private url: string;
  private xhr: XMLHttpRequest;
  private username?: string;
  private password?: string;

  private callbacks: object;

  withCredentials = false;

  constructor(url: string, method = "GET") {
    this.method = method.toUpperCase();
    if (this.isMethodUnsupported()) {
      throw new Error(
        "`method` unsupported. " +
          "Supported methods: GET|POST|PUT|PATCH|DELETE (case insensitively)."
      );
    }

    this.url = url;
    this.xhr = new XMLHttpRequest();
    this.callbacks = {};
  }

  authorizeWith(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  send(body?: RemoteBody, responseType?: ResponseType) {
    if (this.isBodyIncompatibleWithMethod(body)) {
      throw new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      );
    }

    if (this.shouldCancelPrematurely()) { return }

    if (this.username && this.password) {
      this.xhr.open(this.method, this.processedUrl(body), true, this.username, this.password);
    } else {
      this.xhr.open(this.method, this.processedUrl(body));
    }

    this.xhr.withCredentials = this.withCredentials;

    this.setRequestHeaders(body, responseType);
    this.xhr.send(body);
  }

  onStart(callback: () => void | boolean) {
    this.callbacks["start"] = callback;
  }

  private processedUrl(body: RemoteBody): string {
    if (body && typeof body == "string" && this.isMethodGet()) {
      let separator = "&";
      if (this.url.indexOf("?") < 0) {
        separator = "?";
      }

      return this.url + separator + body;
    }

    return this.url;
  }

  private setRequestHeaders(body: RemoteBody, responseType = ResponseType.JSON) {
    if (body && !this.isMethodGet()) {
      this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }

    this.xhr.setRequestHeader("Accept", responseType);
  }

  private shouldCancelPrematurely() {
    const returnValue = this.safelyCallback("start");
    return returnValue === false;
  }

  private isBodyIncompatibleWithMethod(body?: RemoteBody) {
    return this.isMethodGet() && body instanceof FormData;
  }

  private isMethodUnsupported() {
    return ![
      "GET", "POST", "PUT", "PATCH", "DELETE"
    ].includes(this.method);
  }

  private isMethodGet() {
    return this.method == "GET";
  }

  private safelyCallback(name: string): void | boolean {
    return this.callbacks[name] && this.callbacks[name]();
  }
}

type RemoteBody = string | FormData;
