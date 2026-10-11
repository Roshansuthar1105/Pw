import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ItemsComponent } from './components/items/items.component';
import { ComponentsComponent } from './components/admin/components/components.component';
import { RolesComponent } from './components/admin/roles/roles.component';
import { GroupsComponent } from './components/admin/groups/groups.component';
import { UsersComponent } from './components/admin/users/users.component';
import { AuditLogsComponent } from './components/admin/audit-logs/audit-logs.component';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'items', component: ItemsComponent, canActivate: [permissionGuard] },
  { path: 'admin/components', component: ComponentsComponent, canActivate: [permissionGuard] },
  { path: 'admin/roles', component: RolesComponent, canActivate: [permissionGuard] },
  { path: 'admin/groups', component: GroupsComponent, canActivate: [permissionGuard] },
  { path: 'admin/users', component: UsersComponent, canActivate: [permissionGuard] },
  { path: 'admin/audit-logs', component: AuditLogsComponent, canActivate: [permissionGuard] },
  { path: '**', redirectTo: '' }
];
