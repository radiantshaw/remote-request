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

  set timeout(milliseconds: number) {
    this.xhr.timeout = milliseconds;
  }

  send(body?: RemoteBody, responseType?: ResponseType) {
    if (this.isBodyIncompatibleWithMethod(body)) {
      throw new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      );
    }

    if (this.shouldCancelPrematurely() || this.shouldCancelNormally()) {
      this.safelyCallback("stop");

      return;
    }

    this.addEventListener("timeout", function() {
      this.safelyCallback("timeout");
      this.safelyCallback("finish");
    });

    this.addEventListener("error", function() {
      this.safelyCallback("error");
      this.safelyCallback("finish");
    });

    this.addEventListener("load", function() {
      if (Math.floor(this.xhr.status / 100) == 2) {
        this.safelyCallback("success", {
          status: this.xhr.status,
          reason: this.xhr.statusText.replace(/\d+\s/, ''),
          headers: this.xhr.getResponseHeader.bind(this.xhr),
          body: this.processedResponse()
        });
      } else {
        this.safelyCallback("failure", {
          status: this.xhr.status,
          reason: this.xhr.statusText.replace(/\d+\s/, ''),
          headers: this.xhr.getResponseHeader.bind(this.xhr),
          body: this.processedResponse()
        });
      }

      this.safelyCallback("complete");
      this.safelyCallback("finish");
    });

    if (this.username && this.password) {
      this.xhr.open(this.method, this.processedUrl(body), true, this.username, this.password);
    } else {
      this.xhr.open(this.method, this.processedUrl(body));
    }

    this.xhr.withCredentials = this.withCredentials;

    this.setRequestHeaders(body, responseType);
    this.xhr.send(body);

    this.safelyCallback("send");
  }

  onStart(callback: () => void | boolean) {
    this.callbacks["start"] = callback;
  }

  onStop(callback: () => void) {
    this.callbacks["stop"] = callback;
  }

  onSending(callback: () => void | boolean) {
    this.callbacks["sending"] = callback;
  }

  onSend(callback: () => void) {
    this.callbacks["send"] = callback;
  }

  onSuccess(callback: (remoteResponse: RemoteResponse) => void) {
    this.callbacks["success"] = callback;
  }

  onFailure(callback: (remoteResponse: RemoteResponse) => void) {
    this.callbacks["failure"] = callback;
  }

  onComplete(callback: () => void) {
    this.callbacks["complete"] = callback;
  }

  onTimeout(callback: () => void) {
    this.callbacks["timeout"] = callback;
  }

  onError(callback: () => void) {
    this.callbacks["error"] = callback;
  }

  onFinish(callback: () => void) {
    this.callbacks["finish"] = callback;
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

  private shouldCancelNormally() {
    const returnValue = this.safelyCallback("sending");
    return returnValue == false;
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

  private safelyCallback(name: string, ...args: any[]): void | boolean {
    return this.callbacks[name] && this.callbacks[name](...args);
  }

  private addEventListener(name: string, callback: () => void): void {
    this.xhr.addEventListener(name, callback.bind(this));
  }

  private processedResponse(): HTMLDocument | string {
    const mediaType = this.xhr.getResponseHeader('Content-Type')?.replace(/;.+/, '');

    if (mediaType) {
      if (mediaType.match(/html|xml/)) {
        return new DOMParser().parseFromString(this.xhr.responseText, <DOMParserSupportedType>mediaType);
      } else if (mediaType.match(/json/)) {
        return JSON.parse(this.xhr.responseText);
      }
    }

    return this.xhr.responseText;
  }
}

type RemoteBody = string | FormData;

export interface RemoteResponse {
  status: number;
  reason: string;
  body: any;
}
