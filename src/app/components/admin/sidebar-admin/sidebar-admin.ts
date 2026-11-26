import { LogoXchangoComponent } from '../../logo-xchango/logo-xchango';
import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminsAdminService } from '../../../services/admin/admins-admin.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-sidebar-admin',
  imports: [LogoXchangoComponent, CommonModule, RouterLink, RouterLinkActive, Icon],
  templateUrl: './sidebar-admin.html',
  styleUrl: './sidebar-admin.css',
})
export class SidebarAdmin {
  private admins = inject(AdminsAdminService);

  // el moderador no puede crear usuarios, por eso no ve ese enlace
  get esAdministrador(): boolean {
    return this.admins.esAdministrador();
  }

  navegar = output<void>();
  salir = output<void>();
}
