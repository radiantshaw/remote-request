export default class RemoteRequest {
  private xhr: XMLHttpRequest;

  constructor(url: string, method = "GET") {
    if (this.isMethodUnsupported(method)) {
      throw new Error(
        "`method` unsupported. " +
          "Supported methods: GET|POST|PUT|PATCH|DELETE (case insensitively)."
      );
    }

    this.xhr = new XMLHttpRequest();
    this.xhr.open(method, url);
  }

  send() {
    this.xhr.send();
  }

  private isMethodUnsupported(method: string) {
    return ![
      "get", "GET", "post", "POST",
      "put", "PUT", "patch", "PATCH", "delete", "DELETE"
    ].includes(method);
  }
}
