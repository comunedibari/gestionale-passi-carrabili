export class ActionColumnSchema {
    key: string;
    name: string;
    icon: string;
    tooltip: string;
    hidden: Function;
    disabled: Function;
  
    constructor(key: string, name: string, icon: string, tooltip: string, hidden: Function, disabled: Function) {
      this.key = key;
      this.name = name
      this.icon = icon;
      this.tooltip = tooltip;
      this.hidden = (data) => {
        if (hidden instanceof Function || typeof hidden === 'function')
          return hidden(data);
        else
          return false;
      };
      this.disabled = (data) => {
        if (disabled instanceof Function || typeof disabled === 'function')
          return disabled(data);
        else
          return false;
      };
    }
  }