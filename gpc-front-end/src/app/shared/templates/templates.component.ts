import { Component, OnInit } from '@angular/core';
import { MessageService } from 'src/app/shared/service/message.service';
import { UtilityService } from '../service/utility.service';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.css']
})
export class TemplatesComponent implements OnInit {

  constructor(
    private messageService: MessageService,
    private utilityService: UtilityService
  ) { }

  showSpinner: boolean = false;
  dataSource: any[];

  ngOnInit(): void {
    this.showSpinner = true;
    this.utilityService.getTemplateDocumenti().subscribe(
      data => {   
        this.showSpinner = false; 
        this.dataSource = data.data.sort((a, b) => a.label.localeCompare(b.label));   
      },
      err => {
        this.showSpinner = false;
        this.messageService.showMessage('error','Ricerca template documenti', err.error.message); 
      });
  }

  downloadTemplate(template){
    this.utilityService.getTemplateDocumento(template.id).subscribe(async (file) => {
      saveAs(file.blob, `${file.id}.docx`);
    },
    err => {
      this.messageService.showMessage('error', 'Download file', err.error.message);
    });
  }

  async uploadTemplate(event, template){
    let file = event.target.files[0];
    let extensionFile = file.name.substr(file.name.lastIndexOf('.') + 1);
    if(extensionFile != 'docx'){
      this.messageService.showMessage('error', 'Upload file', 'Estensione file non consensita');
    }
    else {
      template.blob = await this.utilityService.convertFileToBase64(file);
      this.utilityService.uploadTemplateDocumento(template).subscribe(res => {
        delete template.blob;
        template.last_modification.data_operazione = res.template.last_modification.data_operazione;
        this.messageService.showMessage('success','Upload File', res.message);        
      },
      err => {
        this.messageService.showMessage('error', 'Upload file', err.error.message);
      });
    }
  }
}
