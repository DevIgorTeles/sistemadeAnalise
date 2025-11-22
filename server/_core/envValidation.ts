/**
 * Validação de variáveis de ambiente críticas
 * Falha no boot se variáveis essenciais não existirem
 */

interface EnvVar {
  name: string;
  required: boolean;
  minLength?: number;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const CRITICAL_ENV_VARS: EnvVar[] = [
  {
    name: 'JWT_SECRET',
    required: true,
    minLength: 32,
    errorMessage: 'JWT_SECRET deve ter pelo menos 32 caracteres',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value: string) => {
      // Valida formato básico de URL de banco de dados
      return value.startsWith('mysql://') || value.startsWith('postgresql://') || value.startsWith('postgres://');
    },
    errorMessage: 'DATABASE_URL deve ser uma URL válida de banco de dados',
  },
];

const OPTIONAL_ENV_VARS: EnvVar[] = [
  {
    name: 'VITE_APP_ID',
    required: false,
  },
  {
    name: 'OAUTH_SERVER_URL',
    required: false,
  },
  {
    name: 'OWNER_OPEN_ID',
    required: false,
  },
  {
    name: 'NODE_ENV',
    required: false,
  },
  {
    name: 'PORT',
    required: false,
    validator: (value: string) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    errorMessage: 'PORT deve ser um número válido entre 1 e 65535',
  },
];

/**
 * Valida todas as variáveis de ambiente críticas
 * Lança erro se alguma variável crítica estiver faltando ou inválida
 */
export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar variáveis críticas
  for (const envVar of CRITICAL_ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        errors.push(
          `Variável de ambiente crítica faltando: ${envVar.name}. ${envVar.errorMessage || 'É obrigatória para o funcionamento do sistema.'}`
        );
      }
      continue;
    }

    // Validar comprimento mínimo
    if (envVar.minLength && value.length < envVar.minLength) {
      errors.push(
        `${envVar.name}: ${envVar.errorMessage || `Deve ter pelo menos ${envVar.minLength} caracteres`}`
      );
    }

    // Validar com função personalizada
    if (envVar.validator && !envVar.validator(value)) {
      errors.push(
        `${envVar.name}: ${envVar.errorMessage || 'Valor inválido'}`
      );
    }
  }

  // Validar variáveis opcionais (apenas warnings)
  for (const envVar of OPTIONAL_ENV_VARS) {
    const value = process.env[envVar.name];

    if (value && envVar.validator && !envVar.validator(value)) {
      warnings.push(
        `${envVar.name}: ${envVar.errorMessage || 'Valor inválido, usando padrão'}`
      );
    }
  }

  // Se houver erros críticos, lançar exceção
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Erros de validação de variáveis de ambiente:',
      ...errors.map(e => `  • ${e}`),
      '',
      'Configure as variáveis de ambiente necessárias no arquivo .env',
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Exibir warnings se houver
  if (warnings.length > 0) {
    console.warn('⚠️  Avisos de variáveis de ambiente:');
    warnings.forEach(w => console.warn(`  • ${w}`));
  }

  // Log de sucesso
  console.log('✅ Todas as variáveis de ambiente críticas estão configuradas corretamente');
}

/**
 * Valida JWT_SECRET especificamente (já usado em auth.ts, mas centralizado aqui também)
 */
export function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET não está definido. Configure a variável de ambiente JWT_SECRET com uma chave forte (mínimo 32 caracteres).'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET deve ter pelo menos 32 caracteres. Atualmente tem ${secret.length} caracteres. Configure uma chave mais forte na variável de ambiente.`
    );
  }

  return secret;
}

