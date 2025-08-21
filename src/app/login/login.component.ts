import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AuthService } from '../auth/auth.service';
import { Login } from '../models/Login';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class LoginComponent {
  loginData: Login = new Login();
  errorMessage: string = '';
  positions = ['shift-left', 'shift-top', 'shift-right', 'shift-bottom'];
  currentPosIndex = 0;
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  async mostrarMensaje(
    mensaje: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    await Swal.fire({
      text: mensaje,
      icon: icon,
      confirmButtonText: 'OK',
      confirmButtonColor: '#3085d6',
    });
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.loginData).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.token);
          localStorage.setItem('rol', res.rol);

          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.mostrarMensaje(
            'Credenciales inválidas o acceso denegado',
            'error'
          );
        },
      });
    } else {
      this.mostrarMensaje('Formulario inválido', 'warning');
    }
  }

  shiftButton(event: Event, form: NgForm) {
    if (form.valid) return;

    const btn = event.target as HTMLElement;
    btn.classList.remove(this.positions[this.currentPosIndex]);
    this.currentPosIndex = (this.currentPosIndex + 1) % this.positions.length;
    btn.classList.add(this.positions[this.currentPosIndex]);
  }
}
