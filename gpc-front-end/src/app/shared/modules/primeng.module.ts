import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {CheckboxModule} from 'primeng/checkbox';
import {InputTextModule} from 'primeng/inputtext';
import {PaginatorModule} from 'primeng/paginator';
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';
import {MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {TooltipModule} from 'primeng/tooltip';
import {CalendarModule} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelMenuModule} from 'primeng/panelmenu';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {TieredMenuModule} from 'primeng/tieredmenu';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DialogModule} from 'primeng/dialog';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {SidebarModule} from 'primeng/sidebar';
import {PasswordModule} from 'primeng/password';
import {ConfirmationService} from 'primeng/api';
import {ToolbarModule} from 'primeng/toolbar';
import {DynamicDialogModule} from 'primeng/dynamicdialog';
import {DynamicDialogConfig} from 'primeng/dynamicdialog';
import {DynamicDialogRef} from 'primeng/dynamicdialog';
import { DialogService } from 'primeng/dynamicdialog';
import {FileUploadModule} from 'primeng/fileupload';
import {SelectButtonModule} from 'primeng/selectbutton';
import {InputMaskModule} from 'primeng/inputmask';
import {RadioButtonModule} from 'primeng/radiobutton';
import {KeyFilterModule} from 'primeng/keyfilter';
import {ProgressBarModule} from 'primeng/progressbar';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {ScrollTopModule} from 'primeng/scrolltop';
import {ToggleButtonModule} from 'primeng/togglebutton';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {TabViewModule} from 'primeng/tabview';
import {BadgeModule} from 'primeng/badge';
import {FieldsetModule} from 'primeng/fieldset';
import {InputSwitchModule} from 'primeng/inputswitch';
import {CardModule} from 'primeng/card';

@NgModule({
    imports: [
        TableModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PaginatorModule,
        ToastModule,
        MessagesModule,
        MessageModule,
        TooltipModule,
        CalendarModule,
        DropdownModule,
        MultiSelectModule,
        PanelMenuModule,
        TieredMenuModule,
        BreadcrumbModule,
        DialogModule,
        ConfirmDialogModule,
        ProgressSpinnerModule,
        SidebarModule,
        PasswordModule,
        ToolbarModule,
        DynamicDialogModule,
        FileUploadModule,
        SelectButtonModule,
        InputMaskModule,
        RadioButtonModule,
        KeyFilterModule,  
        ProgressBarModule,
        AutoCompleteModule,
        ScrollTopModule,
        ToggleButtonModule,
        InputTextareaModule,
        TabViewModule,
        BadgeModule,
        FieldsetModule,
        InputSwitchModule,
        CardModule
    ],
    exports: [ 
        TableModule,
        ButtonModule,
        CheckboxModule,
        InputTextModule,
        PaginatorModule,
        ToastModule,
        MessagesModule,
        MessageModule,
        TooltipModule,
        CalendarModule,
        DropdownModule,
        MultiSelectModule,
        PanelMenuModule,
        TieredMenuModule,
        BreadcrumbModule,
        DialogModule,
        ConfirmDialogModule,
        ProgressSpinnerModule,
        SidebarModule,
        PasswordModule,
        ToolbarModule,
        DynamicDialogModule,
        FileUploadModule,
        SelectButtonModule,
        InputMaskModule,
        RadioButtonModule,
        KeyFilterModule,  
        ProgressBarModule,
        AutoCompleteModule,
        ScrollTopModule,
        ToggleButtonModule,
        InputTextareaModule,
        TabViewModule,
        BadgeModule,
        FieldsetModule,
        InputSwitchModule,
        CardModule
    ],
    providers: [
        MessageService,
        ConfirmationService,
        DynamicDialogConfig,
        DynamicDialogRef,
        DialogService,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
  })
  export class PrimeNGModule { }