// Gate do painel de admin.
// ponytail: senha hardcoded client-side e desbloqueio em memória de processo.
// Isso é uma barreira contra toque acidental, NÃO segurança: o app usa a anon key
// com RLS aberta, então qualquer um com o bundle pode escrever no banco de qualquer
// forma. Travar de verdade = Supabase Auth + políticas RLS por role.
const ADMIN_PASSWORD = 'juujlindabundao';

let unlocked = false;

export const isUnlocked = () => unlocked;

export function tryUnlock(password: string): boolean {
  unlocked = password.trim() === ADMIN_PASSWORD;
  return unlocked;
}

export type FieldType = 'text' | 'number' | 'switch';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
}

export interface ValidationResult {
  values: Record<string, any>;
  errors: Record<string, string>;
}

/**
 * Converte os valores crus do form (tudo string, exceto switch) nos tipos do banco
 * e acumula erros por campo. Campo de texto vazio e não obrigatório vira null,
 * que é o que as colunas nullable (description, image_url) esperam.
 */
export function validateFields(
  fields: Field[],
  raw: Record<string, any>
): ValidationResult {
  const values: Record<string, any> = {};
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = raw[field.key];

    if (field.type === 'switch') {
      values[field.key] = !!value;
      continue;
    }

    const text = value == null ? '' : String(value).trim();

    if (!text) {
      if (field.required) errors[field.key] = 'Obrigatório';
      values[field.key] = field.type === 'number' ? 0 : null;
      continue;
    }

    if (field.type === 'number') {
      const num = Number(text.replace(',', '.'));
      if (!Number.isFinite(num)) errors[field.key] = 'Precisa ser um número';
      else if (num < 0) errors[field.key] = 'Não pode ser negativo';
      values[field.key] = Number.isFinite(num) ? num : 0;
    } else {
      values[field.key] = text;
    }
  }

  return { values, errors };
}
