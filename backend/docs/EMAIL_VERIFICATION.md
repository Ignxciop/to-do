# Sistema de Verificación de Correo Electrónico

## Descripción

Este sistema implementa verificación de correo electrónico para nuevas cuentas de usuario con las siguientes características:

- ✅ Validación de dominios de correo confiables (Gmail, Hotmail, Outlook, Yahoo, iCloud, etc.)
- 🚫 Bloqueo de correos temporales/desechables
- ⏱️ Código de verificación de 6 dígitos con expiración de 5 minutos
- 📧 Envío automático de correo con código
- 🔄 Reenvío de código si expira
- 🔒 Cuentas bloqueadas hasta verificación

## Flujo de Registro

1. **Registro**: Usuario se registra con email de dominio confiable
2. **Código enviado**: Sistema genera código de 6 dígitos y lo envía por correo
3. **Verificación**: Usuario ingresa el código dentro de 5 minutos
4. **Acceso**: Usuario puede iniciar sesión una vez verificado

Si el código expira, el usuario debe solicitar uno nuevo.

## Endpoints

### POST /api/auth/register

Registra un nuevo usuario y envía código de verificación.

**Request:**
\`\`\`json
{
"name": "Juan",
"lastname": "Pérez",
"email": "juan@gmail.com",
"password": "mipassword123"
}
\`\`\`

**Response (201):**
\`\`\`json
{
"message": "Cuenta creada exitosamente. Por favor verifica tu correo electrónico.",
"user": {
"id": "uuid",
"name": "Juan",
"lastname": "Pérez",
"email": "juan@gmail.com",
"emailVerified": false
}
}
\`\`\`

**Errores:**

- 400: Email ya registrado
- 400: Dominio no confiable
- 400: Correo temporal no permitido

---

### POST /api/auth/verify-email

Verifica el código y activa la cuenta.

**Request:**
\`\`\`json
{
"email": "juan@gmail.com",
"code": "123456"
}
\`\`\`

**Response (200):**
\`\`\`json
{
"message": "Correo verificado exitosamente",
"user": {
"id": "uuid",
"name": "Juan",
"lastname": "Pérez",
"email": "juan@gmail.com",
"emailVerified": true
},
"accessToken": "jwt_token_here"
}
\`\`\`

**Errores:**

- 400: Usuario no encontrado
- 400: Cuenta ya verificada
- 400: Código expirado
- 400: Código inválido

---

### POST /api/auth/resend-verification

Reenvía el código de verificación.

**Request:**
\`\`\`json
{
"email": "juan@gmail.com"
}
\`\`\`

**Response (200):**
\`\`\`json
{
"message": "Código de verificación enviado exitosamente",
"email": "juan@gmail.com"
}
\`\`\`

**Errores:**

- 400: Usuario no encontrado
- 400: Cuenta ya verificada
- 400: Error al enviar correo

---

### POST /api/auth/login

Inicia sesión (solo para cuentas verificadas).

**Request:**
\`\`\`json
{
"email": "juan@gmail.com",
"password": "mipassword123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
"user": {
"id": "uuid",
"name": "Juan",
"lastname": "Pérez",
"email": "juan@gmail.com"
},
"accessToken": "jwt_token_here"
}
\`\`\`

**Errores:**

- 401: Credenciales inválidas
- 401: Cuenta no verificada

## Dominios Confiables

### ✅ Permitidos:

- Gmail (gmail.com, googlemail.com)
- Microsoft (hotmail.com, outlook.com, live.com)
- Yahoo (yahoo.com, yahoo.es)
- Apple (icloud.com, me.com, mac.com)
- ProtonMail (protonmail.com, proton.me)
- Otros: AOL, Zoho, Yandex, GMX, Mail.com

### 🚫 Bloqueados (Temporales):

- tempmail.com
- 10minutemail.com
- guerrillamail.com
- mailinator.com
- maildrop.cc
- yopmail.com
- Y más...

## Configuración SMTP

### Para Desarrollo

En modo desarrollo (`NODE_ENV=test` o sin configurar SMTP), los correos se simulan y se imprime el código en consola:

\`\`\`
📧 [TEST MODE] Código de verificación para usuario@gmail.com: 123456
\`\`\`

### Para Producción

Agrega estas variables en tu archivo \`.env\`:

\`\`\`dotenv
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
\`\`\`

#### Configurar Gmail:

1. Ve a tu cuenta de Google
2. Activa "Verificación en 2 pasos"
3. Genera una "Contraseña de aplicación"
4. Usa esa contraseña en `SMTP_PASS`

#### Otros proveedores SMTP:

- **SendGrid**: smtp.sendgrid.net:587
- **Mailgun**: smtp.mailgun.org:587
- **AWS SES**: email-smtp.[region].amazonaws.com:587

## Estructura de Código

\`\`\`
backend/
├── src/
│ ├── services/
│ │ ├── auth.js # Lógica de autenticación y verificación
│ │ └── emailService.js # Envío de correos con nodemailer
│ ├── utils/
│ │ └── emailValidator.js # Validación de dominios y generación de códigos
│ ├── controllers/
│ │ └── auth.js # Controladores de endpoints
│ ├── validators/
│ │ └── auth.js # Validadores de express-validator
│ └── routes/
│ └── auth.js # Rutas de autenticación
└── prisma/
└── schema.prisma # Modelo User con campos de verificación
\`\`\`

## Base de Datos

### Campos agregados al modelo User:

\`\`\`prisma
model User {
// ... campos existentes
emailVerified Boolean @default(false)
verificationCode String?
verificationCodeExpiry DateTime?
}
\`\`\`

## Testing

Todos los tests (59 unitarios + 58 e2e) pasan exitosamente.

Para ejecutar:
\`\`\`bash
pnpm test # Todos los tests
pnpm test:unit # Solo unitarios
pnpm test:e2e # Solo e2e
\`\`\`

## Seguridad

- ✅ Códigos de 6 dígitos numéricos
- ✅ Expiración de 5 minutos
- ✅ Validación de dominio antes de crear cuenta
- ✅ Limpieza de códigos después de verificación
- ✅ Eliminación de cuentas no verificadas si el código expira (al reintentar registro)
- ✅ Bloqueo de login sin verificación

## Ejemplo de Correo

El usuario recibe un correo HTML estilizado con:

- Bienvenida personalizada con su nombre
- Código de verificación grande y visible
- Advertencia de expiración de 5 minutos
- Instrucciones claras

## Notas Importantes

1. **Reintento de registro**: Si una cuenta no se verifica y el código expira, al reintentar el registro con el mismo email, la cuenta anterior se elimina y se crea una nueva.

2. **Login bloqueado**: Los usuarios no pueden iniciar sesión hasta que verifiquen su correo.

3. **Códigos de prueba**: En modo test/desarrollo, el código se imprime en consola para facilitar el testing.

4. **Producción**: Asegúrate de configurar correctamente las variables SMTP antes de desplegar a producción.
