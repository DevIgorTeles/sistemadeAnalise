/**
 * Política de senhas forte
 * Define regras mínimas e validação de força
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Valida senha conforme política de segurança
 * Regras:
 * - Mínimo 8 caracteres
 * - Máximo 128 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (!password) {
    errors.push('Senha é obrigatória');
    return { isValid: false, errors, strength };
  }

  // Validação de comprimento
  if (password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres');
  }

  // Validação de caracteres
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 letra maiúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 número');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Senha deve conter pelo menos 1 caractere especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  // Validação de padrões fracos comuns
  const weakPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /000000/,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push('Senha contém padrões fracos comuns');
      break;
    }
  }

  // Calcular força da senha
  if (password.length >= 12 && errors.length === 0) {
    strength = 'strong';
  } else if (password.length >= 10 && errors.filter(e => !e.includes('deve ter no mínimo')).length === 0) {
    strength = 'medium';
  }

  // Se todas as validações passarem e tiver pelo menos 8 caracteres, é válida
  const isValid = errors.length === 0;

  return { isValid, errors, strength };
}

/**
 * Gera senha aleatória forte
 * Útil para reset de senha ou criação de usuários
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Embaralhar
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

