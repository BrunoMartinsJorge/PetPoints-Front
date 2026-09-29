import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Popover } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { DataViewModule } from 'primeng/dataview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { titlecasePipe } from '../../pipes/texto-format-pipe';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { BagStatusPerfil } from '../../components/bag-status-perfil/bag-status-perfil';
import { BagStatusAtendimento } from '../../components/bag-status-atendimento/bag-status-atendimento';
import { BagFormaPagamento } from '../../components/bag-forma-pagamento/bag-forma-pagamento';

@NgModule({
  providers: [MessageService, ConfirmationService],
  imports: [
    BagStatusPerfil,
    BagStatusAtendimento,
    BagFormaPagamento,
    CommonModule,
    ButtonModule,
    DialogModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    SplitButtonModule,
    ReactiveFormsModule,
    FieldsetModule,
    FormsModule,
    DatePickerModule,
    TextareaModule,
    FileUploadModule,
    ToastModule,
    BadgeModule,
    OverlayBadgeModule,
    TooltipModule,
    TabsModule,
    InputNumberModule,
    CardModule,
    Popover,
    ToggleSwitch,
    SkeletonModule,
    InputGroupModule,
    InputGroupAddonModule,
    ProgressSpinnerModule,
    RadioButtonModule,
    PasswordModule,
    DataViewModule,
    ConfirmDialogModule,
    SelectButtonModule,
    titlecasePipe,
    DividerModule,
    TagModule,
  ],
  exports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    SplitButtonModule,
    ReactiveFormsModule,
    FieldsetModule,
    FormsModule,
    DatePickerModule,
    TextareaModule,
    FileUploadModule,
    ToastModule,
    BadgeModule,
    OverlayBadgeModule,
    TooltipModule,
    TabsModule,
    InputNumberModule,
    CardModule,
    Popover,
    ToggleSwitch,
    SkeletonModule,
    InputGroupModule,
    InputGroupAddonModule,
    ProgressSpinnerModule,
    RadioButtonModule,
    PasswordModule,
    DataViewModule,
    ConfirmDialogModule,
    SelectButtonModule,
    titlecasePipe,
    DividerModule,
    TagModule,
    BagStatusPerfil,
    BagStatusAtendimento,
    BagFormaPagamento,
  ],
  declarations: [],
})
export class PrimeNGModule {}
