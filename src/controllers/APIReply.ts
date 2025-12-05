export enum Status {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}

export class ApiReply {
  statusCode: Status;
  message: string;
  data?: unknown;

  constructor(statusCode: Status, message: string, data?: unknown) {
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) this.data = data;
  }
}
