import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { ItemsComponent } from './components/items/items.component';
import { ComponentsComponent } from './components/admin/components/components.component';
import { RolesComponent } from './components/admin/roles/roles.component';
import { GroupsComponent } from './components/admin/groups/groups.component';
import { UsersComponent } from './components/admin/users/users.component';
import { AuditLogsComponent } from './components/admin/audit-logs/audit-logs.component';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'items', component: ItemsComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'admin/components', component: ComponentsComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'admin/roles', component: RolesComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'admin/groups', component: GroupsComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'admin/users', component: UsersComponent, canActivate: [authGuard, permissionGuard] },
  { path: 'admin/audit-logs', component: AuditLogsComponent, canActivate: [authGuard, permissionGuard] },
  { path: '**', redirectTo: '' }
];
