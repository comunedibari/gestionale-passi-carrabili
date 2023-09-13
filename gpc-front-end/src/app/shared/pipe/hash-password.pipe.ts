import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hashPassword'
})
export class HashPasswordPipe implements PipeTransform {

  transform(value: string): string {
    return value ? this.hashPassword(value) : "--";
  }

  hashPassword(password: string){
    return "*".repeat(5);
  }
  
}
