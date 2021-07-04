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

  constructor(url: string, method = "GET") {
    this.method = method.toUpperCase();
    if (this.isMethodUnsupported()) {
      throw new Error(
        "`method` unsupported. " +
          "Supported methods: GET|POST|PUT|PATCH|DELETE (case insensitively)."
      );
    }

    this.url = url;
  }

  send(body?: string | FormData, responseType = ResponseType.JSON) {
    if (this.method == "GET" && body instanceof FormData) {
      throw new Error(
        "`body` can only be an application/x-www-form-urlencoded " +
          "string with a GET request."
      );
    }

    const xhr = new XMLHttpRequest();
    xhr.open(this.method, this.url);

    if (body && !this.isMethodGet()) {
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    }

    xhr.setRequestHeader("Accept", responseType);

    xhr.send(body);
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
