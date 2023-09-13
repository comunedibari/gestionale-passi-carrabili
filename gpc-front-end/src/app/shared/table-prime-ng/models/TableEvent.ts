export class TableEvent {
    event: any;
    data: any;
    actionKey: string;
    constructor(event: any, data: any, actionKey: string) {
        this.event = event;
        this.data = data;
        this.actionKey = actionKey;
    }
}