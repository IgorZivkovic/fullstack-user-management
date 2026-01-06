import { Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-confirm-dialog-component',
  standalone: true,
  imports: [ConfirmDialogModule],
  templateUrl: './confirm-dialog-component.html',
})
export class ConfirmDialogComponent {}
