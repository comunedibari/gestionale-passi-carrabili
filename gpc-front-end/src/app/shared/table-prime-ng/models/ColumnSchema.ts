const sanitizeHtml = require('sanitize-html');

export class ColumnSchema {
  field: string;
  header: string;
  type: string;
  pipe: string;
  show: Function;
  inactive: boolean;

  constructor(field: string, header: string, type: string, pipe: string, show: Function, inactive: boolean = false) {
    this.field = field;
    this.header = header;
    this.type = type;
    this.pipe = pipe;
    this.show = (data) => {
      const fields = this.field.split(".");
      const value = fields.reduce((prev, next) => {
        return prev[next];
      }, data);
      if (show instanceof Function || typeof show === 'function')
        return sanitizeHtml(show(value, data));
      else
        return sanitizeHtml(value || "--");
    };
    this.inactive = inactive;
  }
}