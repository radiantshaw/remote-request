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
  }

  send(body?: RemoteBody, responseType?: ResponseType) {
    if (this.isBodyIncompatibleWithMethod(body)) {
      throw new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      );
    }

    this.xhr.open(this.method, this.url);

    this.setRequestHeaders(body, responseType);
    this.xhr.send(body);
  }

  private setRequestHeaders(body: RemoteBody, responseType = ResponseType.JSON) {
    if (body && !this.isMethodGet()) {
      this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }

    this.xhr.setRequestHeader("Accept", responseType);
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
}

type RemoteBody = string | FormData;
